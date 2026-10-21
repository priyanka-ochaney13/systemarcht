"""Bounded, create-only Terraform execution using temporary AWS credentials."""

from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path
import re
import logging

from app.core.mongo import get_deployments_collection, get_aws_connections_collection

logger = logging.getLogger(__name__)


def _normalize_terraform_source(source: str) -> str:
    """Convert serialized newline escapes into actual Terraform line breaks."""
    return source.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\r", "\n")

try:
    from botocore.exceptions import BotoCoreError, ClientError
except ImportError:
    BotoCoreError = ClientError = OSError


def _ensure_s3_backend(source: str) -> str:
    match = re.search(r"(?m)^\s*terraform\s*\{", source)
    if not match:
        return (
            'terraform {\n'
            '  required_providers {\n'
            '    aws = { source = "hashicorp/aws" }\n'
            '  }\n'
            '  backend "s3" {}\n'
            '}\n\n'
            + source
        )

    depth = 0
    closing_index = None
    for index in range(match.end() - 1, len(source)):
        if source[index] == "{":
            depth += 1
        elif source[index] == "}":
            depth -= 1
            if depth == 0:
                closing_index = index
                break
    if closing_index is None:
        raise ValueError("Terraform block is not balanced.")
    block = source[match.end():closing_index]
    if re.search(r'(?m)^\s*backend\s+"', block):
        return source
    return f'{source[:closing_index]}\n  backend "s3" {{}}\n{source[closing_index:]}'


def _safe_error(output: str) -> str:
    redacted = re.sub(
        r"(?i)(AWS_(?:ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN)=)[^\s]+",
        r"\1[redacted]",
        output,
    )
    redacted = re.sub(r"(?i)(secret|token|password)\s*[:=]\s*[^\s]+", r"\1=[redacted]", redacted)
    lines = [line.strip() for line in redacted.splitlines() if line.strip()]
    return "\n".join(lines[-8:])[-2000:] or "Terraform returned no diagnostic output."


def run_deployment(deployment_id: str, user_id: str) -> None:
    deployments = get_deployments_collection()
    connections = get_aws_connections_collection()
    deployment = deployments.find_one({"id": deployment_id, "user_id": user_id})
    connection = connections.find_one({"user_id": user_id, "status": "connected"})
    if not deployment or not connection:
        return

    deployments.update_one({"id": deployment_id}, {"$set": {"status": "validating"}})
    state_bucket = os.getenv("TERRAFORM_STATE_BUCKET")
    if not state_bucket:
        deployments.update_one(
            {"id": deployment_id},
            {"$set": {"status": "failed", "error": "TERRAFORM_STATE_BUCKET is not configured."}},
        )
        return

    try:
        import boto3

        sts = boto3.client("sts")
        assumed = sts.assume_role(
            RoleArn=connection["role_arn"],
            RoleSessionName=f"systemarcht-{user_id[:16]}",
            ExternalId=connection["external_id"],
            DurationSeconds=900,
        )
        credentials = assumed["Credentials"]
        environment = {
            **os.environ,
            "AWS_ACCESS_KEY_ID": credentials["AccessKeyId"],
            "AWS_SECRET_ACCESS_KEY": credentials["SecretAccessKey"],
            "AWS_SESSION_TOKEN": credentials["SessionToken"],
            "AWS_DEFAULT_REGION": deployment["region"],
        }
        with tempfile.TemporaryDirectory(prefix="systemarcht-tf-") as workspace:
            path = Path(workspace)
            source = _normalize_terraform_source(deployment["terraform_code"])
            source = _ensure_s3_backend(source)
            if not re.search(r'(?m)^\s*provider\s+"aws"\s*\{', source):
                source = f'provider "aws" {{ region = "{deployment["region"]}" }}\n\n{source}'
            (path / "main.tf").write_text(source, encoding="utf-8")
            commands = [
                [
                    "terraform",
                    "init",
                    "-input=false",
                    "-no-color",
                    f"-backend-config=bucket={state_bucket}",
                    f"-backend-config=key=systemarcht/{user_id}/{deployment_id}/terraform.tfstate",
                    "-backend-config=encrypt=true",
                ],
                ["terraform", "validate", "-no-color"],
                ["terraform", "plan", "-input=false", "-no-color", "-out=plan.tfplan"],
                ["terraform", "apply", "-input=false", "-no-color", "plan.tfplan"],
            ]
            for command in commands:
                if command[1] == "plan":
                    deployments.update_one({"id": deployment_id}, {"$set": {"status": "planning"}})
                elif command[1] == "apply":
                    deployments.update_one({"id": deployment_id}, {"$set": {"status": "applying"}})
                result = subprocess.run(
                    command,
                    cwd=workspace,
                    env=environment,
                    capture_output=True,
                    text=True,
                    timeout=600,
                    check=False,
                )
                if result.returncode:
                    diagnostic = _safe_error(result.stderr or result.stdout)
                    logger.error(
                        "Terraform deployment %s failed during %s: %s",
                        deployment_id,
                        command[1],
                        diagnostic,
                    )
                    deployments.update_one(
                        {"id": deployment_id},
                        {
                            "$set": {
                                "status": "failed",
                                "error": f"Terraform {command[1]} failed: {diagnostic}",
                            }
                        },
                    )
                    return
        deployments.update_one({"id": deployment_id}, {"$set": {"status": "succeeded"}})
    except (
        ImportError,
        BotoCoreError,
        ClientError,
        subprocess.TimeoutExpired,
        FileNotFoundError,
        OSError,
        ValueError,
    ) as exc:
        diagnostic = _safe_error(str(exc))
        logger.exception("Terraform deployment %s failed: %s", deployment_id, diagnostic)
        deployments.update_one(
            {"id": deployment_id},
            {"$set": {"status": "failed", "error": f"Terraform execution failed: {diagnostic}"}},
        )
