"""Secure AWS role connection and one-time Terraform deployment endpoints."""

from __future__ import annotations

import logging
import re
import secrets
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.core.mongo import get_aws_connections_collection, get_deployments_collection
from app.models.aws_deployment import (
    AwsConnectionRequest,
    DeploymentOut,
    TerraformApprovalRequest,
    TerraformPreviewRequest,
)
from app.services.firebase_auth import get_current_user
from app.services.terraform_runner import _normalize_terraform_source, run_deployment

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["AWS deployments"])
ROLE_ARN_PATTERN = re.compile(r"^arn:aws:iam::\d{12}:role/[A-Za-z0-9+=,.@_:/-]{1,512}$")
RESOURCE_PATTERN = re.compile(r'(?m)^\s*resource\s+"([^"]+)"\s+"([^"]+)"')
SUPPORTED_REGIONS = {"ap-south-1", "us-east-1", "us-west-2", "eu-west-1"}
ALLOWED_RESOURCES = {
    "aws_vpc",
    "aws_subnet",
    "aws_security_group",
    "aws_instance",
    "aws_s3_bucket",
    "aws_dynamodb_table",
    "aws_sqs_queue",
    "aws_cloudwatch_log_group",
    "aws_lambda_function",
    "aws_api_gateway_rest_api",
    "aws_api_gateway_resource",
    "aws_api_gateway_method",
    "aws_api_gateway_integration",
    "aws_cloudfront_distribution",
    "aws_db_instance",
}
BLOCKED_CONFIGURATION_PATTERNS = (
    (r'(?m)^\s*module\s+"', "Terraform modules are not supported."),
    (r'(?m)^\s*data\s+"', "Terraform data sources are not supported."),
    (r'(?m)^\s*provisioner\s+"', "Terraform provisioners are not supported."),
    (r'(?m)^\s*resource\s+"null_resource"\s+', "null_resource is not supported."),
    (r'(?m)^\s*backend\s+"', "Custom Terraform backends are not supported."),
    (r'(?i)\b(local-exec|remote-exec)\b', "Command execution provisioners are not supported."),
)


def _required_collection(getter):
    collection = getter()
    if collection is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB user storage is not configured. Set MONGODB_USER_URI and MONGODB_USER_DB.",
        )
    return collection


def _resource_preview(terraform_code: str) -> tuple[list[dict], list[str]]:
    terraform_code = _normalize_terraform_source(terraform_code)
    resources = [
        {"type": resource_type, "name": name}
        for resource_type, name in RESOURCE_PATTERN.findall(terraform_code)
    ]
    warnings = [
        f"Unsupported Terraform resource: {item['type']}"
        for item in resources
        if item["type"] not in ALLOWED_RESOURCES
    ]
    for pattern, warning in BLOCKED_CONFIGURATION_PATTERNS:
        if re.search(pattern, terraform_code):
            warnings.append(warning)
    if re.search(r"(?i)\b(terraform\s+destroy|destroy\s*=|force_destroy\s*=\s*true)\b", terraform_code):
        warnings.append("Destructive Terraform operations are not allowed.")
    if not resources:
        warnings.append("No supported Terraform resources were found.")
    return resources, warnings


@router.get("/aws-connection")
def get_connection(user: dict = Depends(get_current_user)):
    collection = _required_collection(get_aws_connections_collection)
    connection = collection.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not connection:
        return {"configured": False, "region": "ap-south-1"}
    connection["configured"] = True
    for key in ("created_at", "verified_at"):
        if isinstance(connection.get(key), datetime):
            connection[key] = connection[key].isoformat()
    return connection


@router.post("/aws-connection/setup")
def setup_connection(
    request: AwsConnectionRequest, user: dict = Depends(get_current_user)
):
    if not ROLE_ARN_PATTERN.fullmatch(request.role_arn):
        raise HTTPException(status_code=422, detail="Enter a valid IAM role ARN.")
    if request.region not in SUPPORTED_REGIONS:
        raise HTTPException(status_code=422, detail="That AWS region is not supported.")
    collection = _required_collection(get_aws_connections_collection)
    external_id = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    collection.update_one(
        {"user_id": user["_id"]},
        {
            "$set": {
                "role_arn": request.role_arn,
                "region": request.region,
                "external_id": external_id,
                "status": "pending_verification",
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    return {
        "role_arn": request.role_arn,
        "region": request.region,
        "external_id": external_id,
        "status": "pending_verification",
    }


@router.post("/aws-connection/verify")
def verify_connection(user: dict = Depends(get_current_user)):
    collection = _required_collection(get_aws_connections_collection)
    connection = collection.find_one({"user_id": user["_id"]})
    if not connection:
        raise HTTPException(status_code=404, detail="AWS connection setup not found.")
    try:
        import boto3

        sts = boto3.client("sts")
        assumed = sts.assume_role(
            RoleArn=connection["role_arn"],
            RoleSessionName=f"systemarcht-{user['_id'][:16]}",
            ExternalId=connection["external_id"],
            DurationSeconds=900,
        )
        credentials = assumed["Credentials"]
        identity = boto3.client(
            "sts",
            aws_access_key_id=credentials["AccessKeyId"],
            aws_secret_access_key=credentials["SecretAccessKey"],
            aws_session_token=credentials["SessionToken"],
        ).get_caller_identity()
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="Install boto3 to verify AWS connections.") from exc
    except Exception as exc:
        logger.warning("AWS role verification failed: %s", exc)
        collection.update_one(
            {"user_id": user["_id"]},
            {"$set": {"status": "verification_failed", "updated_at": datetime.now(timezone.utc)}},
        )
        raise HTTPException(status_code=400, detail="AWS role verification failed. Check the trust policy and external ID.") from exc
    collection.update_one(
        {"user_id": user["_id"]},
        {
            "$set": {
                "status": "connected",
                "account_id": identity["Account"],
                "verified_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return {"status": "connected", "account_id": identity["Account"], "region": connection["region"]}


@router.delete("/aws-connection", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(user: dict = Depends(get_current_user)):
    _required_collection(get_aws_connections_collection).delete_one({"user_id": user["_id"]})


@router.post("/deployments/preview", response_model=DeploymentOut)
def preview_deployment(
    request: TerraformPreviewRequest, user: dict = Depends(get_current_user)
):
    if request.region not in SUPPORTED_REGIONS:
        raise HTTPException(status_code=422, detail="That AWS region is not supported.")
    connection = _required_collection(get_aws_connections_collection).find_one(
        {"user_id": user["_id"], "status": "connected"}
    )
    if not connection:
        raise HTTPException(status_code=409, detail="Connect and verify an AWS account first.")
    if request.region != connection.get("region", "ap-south-1"):
        raise HTTPException(
            status_code=409,
            detail="The deployment region must match the connected AWS profile region.",
        )
    resources, warnings = _resource_preview(request.terraform_code)
    deployment_id = str(uuid4())
    document = {
        "id": deployment_id,
        "user_id": user["_id"],
        "status": "awaiting_approval" if not warnings else "blocked",
        "region": request.region,
        "resources": resources,
        "warnings": warnings,
        "terraform_code": request.terraform_code,
        "architecture_id": request.architecture_id,
        "created_at": datetime.now(timezone.utc),
    }
    _required_collection(get_deployments_collection).insert_one(document)
    return DeploymentOut(
        id=deployment_id,
        status=document["status"],
        region=request.region,
        resources=resources,
        warnings=warnings,
    )


@router.post("/deployments/{deployment_id}/approve", response_model=DeploymentOut)
def approve_deployment(
    deployment_id: str,
    request: TerraformApprovalRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    if request.confirmation != "LAUNCH":
        raise HTTPException(status_code=422, detail='Type "LAUNCH" to approve deployment.')
    deployments = _required_collection(get_deployments_collection)
    deployment = deployments.find_one({"id": deployment_id, "user_id": user["_id"]})
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment preview not found.")
    if deployment["status"] != "awaiting_approval":
        raise HTTPException(status_code=409, detail="This deployment is not available for approval.")
    transition = deployments.update_one(
        {"id": deployment_id, "user_id": user["_id"], "status": "awaiting_approval"},
        {"$set": {"status": "queued", "started_at": datetime.now(timezone.utc)}},
    )
    if transition.modified_count != 1:
        raise HTTPException(status_code=409, detail="This deployment is no longer available for approval.")
    background_tasks.add_task(run_deployment, deployment_id, user["_id"])
    return DeploymentOut(
        id=deployment_id,
        status="queued",
        region=deployment["region"],
        resources=deployment["resources"],
        warnings=deployment["warnings"],
    )


@router.get("/deployments/{deployment_id}", response_model=DeploymentOut)
def deployment_status(deployment_id: str, user: dict = Depends(get_current_user)):
    deployment = _required_collection(get_deployments_collection).find_one(
        {"id": deployment_id, "user_id": user["_id"]}, {"terraform_code": 0, "_id": 0}
    )
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found.")
    return DeploymentOut(**deployment)


@router.get("/deployments", response_model=list[DeploymentOut])
def list_deployments(user: dict = Depends(get_current_user)):
    deployments = _required_collection(get_deployments_collection)
    records = deployments.find(
        {"user_id": user["_id"]},
        {"terraform_code": 0, "_id": 0},
    ).sort("created_at", -1).limit(50)
    return [DeploymentOut(**deployment) for deployment in records]
