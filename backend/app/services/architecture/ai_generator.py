"""AI Architecture Generation Service.

Uses fast API-based models (Groq / Grok / OpenAI-compatible) to design
AWS architectures with visual nodes, Mermaid diagrams, Python AWS SDK code,
Terraform HCL, and technical explanations.
Includes an intelligent offline synthesis engine if API keys are not yet configured.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are the Principal AWS Cloud Architect for SystemArcht.
When given a user problem statement or infrastructure requirement (e.g. 'infra to deploy a static img upload site with million request per hour'):

1. Analyze scale, workload characteristics, traffic volume, latency, security, and cost.
2. Formulate an optimal AWS architecture using supported services:
   - s3 (Storage)
   - cloudfront (CDN / Edge distribution)
   - api_gateway (REST / HTTP APIs)
   - lambda (Serverless Compute)
   - dynamodb (NoSQL Database)
   - sqs (Asynchronous Queues)
   - elb (Load Balancers)
   - elasticache (Redis / In-memory Cache)
   - cloudwatch (Monitoring & Alarms)
   - elastic_beanstalk (Managed compute)
   - cognito (Authentication & User Pools)

3. Return ONLY valid, raw JSON (no conversational preamble) matching this schema:
{
  "title": "Short descriptive architecture title",
  "summary": "1-2 sentence overview of how the architecture addresses the requirement",
  "services": ["s3", "cloudfront", "api_gateway", "lambda", "dynamodb"],
  "nodes": [
    {
      "id": "s3-upload-1",
      "serviceType": "s3",
      "name": "Raw Images Bucket",
      "config": {"storage_gb": 500, "region": "us-east-1"},
      "position": {"x": 450, "y": 100}
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "source": "cf-dist-1",
      "target": "s3-upload-1",
      "avg_request_size_kb": 10,
      "avg_response_size_kb": 250
    }
  ],
  "mermaid": "flowchart TD\\n  Client[\\"Clients / Users\\"] --> CF[\\"CloudFront Edge\\"]\\n  CF --> S3[\\"S3 Storage\\"]",
  "explanation": "### Architectural Design\\nDetailed explanation...",
  "sdk_code": "# Python Boto3 SDK implementation\\nimport boto3...",
  "terraform_code": "# Terraform HCL configuration\\nprovider \\"aws\\" {\\n  region = \\"us-east-1\\"\\n}\\n..."
}
"""


def _sanitize_json_response(raw_text: str) -> Optional[Dict[str, Any]]:
    """Clean markdown code fences and extract valid JSON object."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        data = json.loads(text)
        if isinstance(data, dict) and "nodes" in data:
            return data
    except Exception:
        pass

    # Regex search for outermost brackets
    match = re.search(r"(\{[\s\S]*\})", raw_text)
    if match:
        try:
            data = json.loads(match.group(1))
            if isinstance(data, dict):
                return data
        except Exception:
            pass

    return None


def _call_groq(prompt: str) -> Optional[Dict[str, Any]]:
    """Call Groq API using Groq SDK."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from groq import Groq

        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        client = Groq(api_key=api_key, timeout=25.0)

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": f"Problem Statement: {prompt}\n\nGenerate AWS Architecture JSON:"},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )

        content = response.choices[0].message.content
        if content:
            return _sanitize_json_response(content)
    except Exception as exc:
        logger.warning("Groq API call failed or timed out: %s", exc)
    return None


def _call_grok_xai(prompt: str) -> Optional[Dict[str, Any]]:
    """Call Grok (xAI) API via HTTP request."""
    api_key = os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY")
    if not api_key:
        return None

    try:
        import urllib.request

        url = "https://api.x.ai/v1/chat/completions"
        model = os.getenv("GROK_MODEL", "grok-2-mini")
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": f"Problem Statement: {prompt}\n\nGenerate AWS Architecture JSON:"},
            ],
            "temperature": 0.2,
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            return _sanitize_json_response(content)
    except Exception as exc:
        logger.warning("Grok (xAI) API call failed: %s", exc)
    return None


def _synthesize_fallback_architecture(prompt: str) -> Dict[str, Any]:
    """Smart architectural synthesizer tailored to the user's prompt.
    
    Provides rich, production-grade AWS architecture even when external API keys
    are not yet set.
    """
    p = prompt.lower()

    if any(k in p for k in ["image", "img", "upload", "photo", "media", "video"]):
        title = "High-Throughput Media Ingestion & Static Hosting Architecture"
        summary = (
            "Architected for 1M+ requests/hour using CloudFront edge caching, direct S3 uploads "
            "via pre-signed URLs, asynchronous Lambda image processing, and DynamoDB metadata indexing."
        )
        services = ["cloudfront", "s3", "api_gateway", "lambda", "dynamodb", "sqs", "cloudwatch"]
        nodes = [
            {
                "id": "cloudfront-1",
                "serviceType": "cloudfront",
                "name": "CloudFront Global CDN",
                "config": {"data_transfer_out_gb": 1200, "https_requests": 3600000, "region": "GLOBAL"},
                "position": {"x": 100, "y": 150},
            },
            {
                "id": "api-gateway-1",
                "serviceType": "api_gateway",
                "name": "Upload API Gateway (REST)",
                "config": {"api_type": "REST", "requests_per_month": 3600000, "region": "us-east-1"},
                "position": {"x": 350, "y": 100},
            },
            {
                "id": "lambda-auth-1",
                "serviceType": "lambda",
                "name": "Pre-signed URL Generator",
                "config": {"requests_per_month": 3600000, "average_duration_ms": 100, "allocated_memory_mb": 256, "region": "us-east-1"},
                "position": {"x": 600, "y": 100},
            },
            {
                "id": "s3-storage-1",
                "serviceType": "s3",
                "name": "S3 Media Storage Bucket",
                "config": {"storage_gb": 800, "put_requests": 1000000, "get_requests": 25000000, "region": "us-east-1"},
                "position": {"x": 850, "y": 150},
            },
            {
                "id": "sqs-processing-1",
                "serviceType": "sqs",
                "name": "Image Optimization Queue",
                "config": {"queue_type": "standard", "requests_per_month": 3600000, "region": "us-east-1"},
                "position": {"x": 850, "y": 320},
            },
            {
                "id": "lambda-optimizer-1",
                "serviceType": "lambda",
                "name": "Image Resizer & Thumbnailer",
                "config": {"requests_per_month": 3600000, "average_duration_ms": 450, "allocated_memory_mb": 1024, "region": "us-east-1"},
                "position": {"x": 600, "y": 320},
            },
            {
                "id": "dynamodb-metadata-1",
                "serviceType": "dynamodb",
                "name": "Image Metadata DynamoDB",
                "config": {"storage_gb": 50, "on_demand_enabled": True, "on_demand_writes_per_month": 3600000, "region": "us-east-1"},
                "position": {"x": 350, "y": 320},
            },
        ]
        connections = [
            {"id": "c1", "source": "cloudfront-1", "target": "s3-storage-1", "avg_request_size_kb": 1, "avg_response_size_kb": 250},
            {"id": "c2", "source": "cloudfront-1", "target": "api-gateway-1", "avg_request_size_kb": 2, "avg_response_size_kb": 4},
            {"id": "c3", "source": "api-gateway-1", "target": "lambda-auth-1", "avg_request_size_kb": 2, "avg_response_size_kb": 4},
            {"id": "c4", "source": "s3-storage-1", "target": "sqs-processing-1", "avg_request_size_kb": 1, "avg_response_size_kb": 1},
            {"id": "c5", "source": "sqs-processing-1", "target": "lambda-optimizer-1", "avg_request_size_kb": 1, "avg_response_size_kb": 1},
            {"id": "c6", "source": "lambda-optimizer-1", "target": "dynamodb-metadata-1", "avg_request_size_kb": 2, "avg_response_size_kb": 1},
        ]
        mermaid = (
            "flowchart LR\n"
            '  Client["Users / Clients"] -->|Get Cached Media| CF["Amazon CloudFront CDN"]\n'
            '  Client -->|Request Upload URL| APIGW["API Gateway (HTTP/REST)"]\n'
            '  APIGW -->|Trigger| AuthLambda["Lambda (Pre-signed URL)"]\n'
            '  Client -->|Direct Binary Upload| S3["Amazon S3 Media Bucket"]\n'
            '  CF -->|Origin Cache Miss| S3\n'
            '  S3 -->|Upload Event| SQS["Amazon SQS Event Queue"]\n'
            '  SQS -->|Process Batch| Worker["Lambda Image Optimizer"]\n'
            '  Worker -->|Store Metadata| DDB[("DynamoDB Table")]\n'
            '  Worker -->|Write Thumbnails| S3\n'
        )
        explanation = (
            "### Architecture Rationale & Workload Handling\n\n"
            "#### 1. High Volume Ingestion (1M+ req/hour)\n"
            "- **Direct S3 Uploads via Pre-signed URLs**: Uploading large binaries directly to Amazon S3 bypasses server bottlenecks and avoids costly API Gateway/Lambda payload limits (10MB/6MB).\n"
            "- **CloudFront Edge Caching**: Offloads up to 90%+ of read traffic from the S3 origin, reducing latency and data transfer egress costs.\n\n"
            "#### 2. Decoupled Asynchronous Processing\n"
            "- **SQS Buffer**: S3 event notifications trigger SQS, decoupling heavy image transformation (WebP conversion, thumbnails) from user upload latency and absorbing traffic spikes.\n"
            "- **Worker Lambda**: Pulls jobs in configurable batches, automatically autoscaling based on queue depth.\n\n"
            "#### 3. Storage & Metadata Strategy\n"
            "- **Amazon S3**: High-durability (99.999999999%) storage with S3 Intelligent-Tiering to minimize cold storage costs.\n"
            "- **DynamoDB On-Demand**: Single-digit millisecond latency for image metadata queries with automatic scaling without capacity planning."
        )
        sdk_code = (
            "# AWS Python SDK (Boto3) Implementation\n"
            "import boto3\n"
            "from botocore.exceptions import ClientError\n\n"
            "s3_client = boto3.client('s3', region_name='us-east-1')\n"
            "dynamo_client = boto3.resource('dynamodb', region_name='us-east-1')\n"
            "table = dynamo_client.Table('ImageMetadata')\n\n"
            "def generate_presigned_upload_url(bucket_name: str, object_key: str, expiration: int = 3600) -> str:\n"
            '    """Generate pre-signed S3 URL for client direct upload."""\n'
            "    try:\n"
            "        response = s3_client.generate_presigned_url(\n"
            "            'put_object',\n"
            "            Params={'Bucket': bucket_name, 'Key': object_key, 'ContentType': 'image/jpeg'},\n"
            "            ExpiresIn=expiration\n"
            "        )\n"
            "        return response\n"
            "    except ClientError as e:\n"
            "        print(f'Error generating URL: {e}')\n"
            "        raise\n\n"
            "def save_metadata(image_id: str, uploader: str, s3_key: str):\n"
            '    """Record image upload metadata in DynamoDB."""\n'
            "    table.put_item(Item={\n"
            "        'image_id': image_id,\n"
            "        'uploader': uploader,\n"
            "        's3_key': s3_key,\n"
            "        'status': 'UPLOADED'\n"
            "    })\n"
        )
        terraform_code = (
            "# Terraform Configuration (main.tf)\n"
            "terraform {\n"
            "  required_providers {\n"
            "    aws = { source = \"hashicorp/aws\", version = \"~> 5.0\" }\n"
            "  }\n"
            "}\n\n"
            "provider \"aws\" {\n"
            "  region = \"us-east-1\"\n"
            "}\n\n"
            "# 1. S3 Storage Bucket\n"
            "resource \"aws_s3_bucket\" \"media_bucket\" {\n"
            "  bucket = \"systemarcht-media-storage-prod\"\n"
            "}\n\n"
            "# 2. DynamoDB Metadata Table\n"
            "resource \"aws_dynamodb_table\" \"metadata\" {\n"
            "  name         = \"ImageMetadata\"\n"
            "  billing_mode = \"PAY_PER_REQUEST\"\n"
            "  hash_key     = \"image_id\"\n\n"
            "  attribute {\n"
            "    name = \"image_id\"\n"
            "    type = \"S\"\n"
            "  }\n"
            "}\n\n"
            "# 3. SQS Image Processing Queue\n"
            "resource \"aws_sqs_queue\" \"image_queue\" {\n"
            "  name                      = \"image-processing-queue\"\n"
            "  message_retention_seconds = 86400\n"
            "}\n"
        )
    else:
        # Generic Serverless Microservice
        title = "Resilient Serverless Microservices Architecture"
        summary = (
            "Scalable cloud architecture leveraging API Gateway routing, Lambda business compute, "
            "DynamoDB persistence, and S3 asset storage."
        )
        services = ["api_gateway", "lambda", "dynamodb", "s3", "cloudwatch"]
        nodes = [
            {
                "id": "api-gateway-1",
                "serviceType": "api_gateway",
                "name": "Public API Gateway",
                "config": {"api_type": "HTTP", "requests_per_month": 5000000, "region": "us-east-1"},
                "position": {"x": 150, "y": 150},
            },
            {
                "id": "lambda-1",
                "serviceType": "lambda",
                "name": "Core Service Lambda",
                "config": {"requests_per_month": 5000000, "average_duration_ms": 250, "allocated_memory_mb": 512, "region": "us-east-1"},
                "position": {"x": 450, "y": 150},
            },
            {
                "id": "dynamodb-1",
                "serviceType": "dynamodb",
                "name": "Application State Store",
                "config": {"storage_gb": 80, "on_demand_enabled": True, "region": "us-east-1"},
                "position": {"x": 750, "y": 100},
            },
            {
                "id": "s3-1",
                "serviceType": "s3",
                "name": "Static Assets Bucket",
                "config": {"storage_gb": 200, "region": "us-east-1"},
                "position": {"x": 750, "y": 250},
            },
        ]
        connections = [
            {"id": "c1", "source": "api-gateway-1", "target": "lambda-1", "avg_request_size_kb": 2, "avg_response_size_kb": 8},
            {"id": "c2", "source": "lambda-1", "target": "dynamodb-1", "avg_request_size_kb": 2, "avg_response_size_kb": 2},
            {"id": "c3", "source": "lambda-1", "target": "s3-1", "avg_request_size_kb": 5, "avg_response_size_kb": 50},
        ]
        mermaid = (
            "flowchart LR\n"
            '  Client["Web / Mobile App"] --> APIGW["API Gateway (HTTP API)"]\n'
            '  APIGW --> Lambda["Core Backend Lambda"]\n'
            '  Lambda --> DDB[("DynamoDB Data Store")]\n'
            '  Lambda --> S3["Amazon S3 Bucket"]\n'
        )
        explanation = (
            "### Architecture Overview\n\n"
            "This architecture employs a serverless-first pattern to maximize availability, eliminate "
            "idle server management, and automatically scale from zero to millions of requests seamlessly.\n\n"
            "#### Components:\n"
            "- **API Gateway (HTTP API)**: High-speed, low-cost HTTP request routing with built-in CORS and JWT authorizer support.\n"
            "- **AWS Lambda**: Stateless execution environment scaling automatically with concurrency limits.\n"
            "- **DynamoDB**: Low-latency NoSQL database configured for on-demand capacity to handle variable spikes.\n"
            "- **Amazon S3**: Secure object storage for backups, static files, and media."
        )
        sdk_code = (
            "# Python Boto3 Client Initialization\n"
            "import boto3\n\n"
            "dynamodb = boto3.resource('dynamodb', region_name='us-east-1')\n"
            "s3 = boto3.client('s3', region_name='us-east-1')\n\n"
            "def handle_request(event, context):\n"
            "    # Sample Lambda entrypoint\n"
            "    return {\n"
            "        'statusCode': 200,\n"
            "        'body': 'Architecture active'\n"
            "    }\n"
        )
        terraform_code = (
            "# Terraform Configuration (main.tf)\n"
            "provider \"aws\" {\n"
            "  region = \"us-east-1\"\n"
            "}\n\n"
            "resource \"aws_apigatewayv2_api\" \"http_api\" {\n"
            "  name          = \"systemarcht-api\"\n"
            "  protocol_type = \"HTTP\"\n"
            "}\n\n"
            "resource \"aws_dynamodb_table\" \"table\" {\n"
            "  name         = \"SystemArchtData\"\n"
            "  billing_mode = \"PAY_PER_REQUEST\"\n"
            "  hash_key     = \"id\"\n"
            "  attribute {\n"
            "    name = \"id\"\n"
            "    type = \"S\"\n"
            "  }\n"
            "}\n"
        )

    return {
        "title": title,
        "summary": summary,
        "services": services,
        "nodes": nodes,
        "connections": connections,
        "mermaid": mermaid,
        "explanation": explanation,
        "sdk_code": sdk_code,
        "terraform_code": terraform_code,
    }


def generate_aws_architecture(prompt: str) -> Dict[str, Any]:
    """Top-level generation handler.
    
    Tries Groq first (fastest), then Grok (xAI), then graceful heuristic fallback.
    """
    if not prompt or len(prompt.strip()) < 3:
        raise ValueError("Prompt must be at least 3 characters.")

    # 1. Try Groq API
    groq_result = _call_groq(prompt)
    if groq_result:
        logger.info("Generated architecture successfully via Groq API")
        return groq_result

    # 2. Try Grok (xAI) API
    grok_result = _call_grok_xai(prompt)
    if grok_result:
        logger.info("Generated architecture successfully via Grok API")
        return grok_result

    # 3. Use architectural synthesizer
    logger.info("Using smart architectural synthesizer for prompt: %s", prompt)
    return _synthesize_fallback_architecture(prompt)

