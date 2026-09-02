"""Billing constants for AWS services - loaded from service_config.json"""
import json
from pathlib import Path
from typing import Dict, Any

def _load_service_config() -> Dict[str, Any]:
    """Load service configuration from JSON file"""
    config_file = Path(__file__).parent.parent.parent / "pricing_data" / "service_config.json"
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)

_CONFIG = _load_service_config()

# Common constants
HOURS_PER_MONTH = _CONFIG["common"]["hours_per_month"]
SECONDS_PER_MONTH = HOURS_PER_MONTH * 3600

# API Gateway billing rules (from config)
_api_gw_billing = _CONFIG["api_gateway"]["billing_rules"]
HTTP_API_REQUEST_CHUNK_KB = _api_gw_billing["http_request_chunk_kb"]
HTTP_API_RESPONSE_CHUNK_KB = _api_gw_billing["http_response_chunk_kb"]
WEBSOCKET_MESSAGE_CHUNK_KB = _api_gw_billing["websocket_message_chunk_kb"]

# API Gateway cache sizes
CACHE_SIZES = _CONFIG["api_gateway"]["cache_sizes_gb"]

# API Type to AWS Operation mapping (static - maps to pricing data keys)
API_TYPE_OPERATION_MAP = {
    "HTTP": "ApiGatewayHttpApi",
    "REST": "ApiGatewayRequest",
    "WEBSOCKET_MESSAGE": "ApiGatewayMessage",
    "WEBSOCKET_MINUTE": "ApiGatewayMinute"
}

# Product families in pricing data (static - maps to pricing data keys)
PRODUCT_FAMILY = {
    "API_CALLS": "API Calls",
    "WEBSOCKET": "WebSocket",
    "CACHE": "Amazon API Gateway Cache",
    "PORTALS": "Amazon API Gateway Portals"
}

# Lambda configuration (from config)
_lambda_config = _CONFIG["lambda"]
_lambda_free_tier = _lambda_config["free_tier"]

LAMBDA_FREE_TIER_REQUESTS = _lambda_free_tier["requests_per_month"]
LAMBDA_FREE_TIER_GB_SECONDS = _lambda_free_tier["gb_seconds_per_month"]
LAMBDA_STORAGE_FREE_MB = _lambda_free_tier["storage_free_mb"]

LAMBDA_MEMORY_OPTIONS = _lambda_config["memory_options_mb"]
LAMBDA_STORAGE_OPTIONS = _lambda_config["storage_options_mb"]
LAMBDA_LIMITS = _lambda_config["limits"]
LAMBDA_ARCHITECTURES = _lambda_config["architectures"]
LAMBDA_FALLBACK_PRICING = _lambda_config["fallback_pricing"]

# S3 configuration (from config)
_s3_config = _CONFIG.get("s3", {})
S3_STORAGE_CLASSES = _s3_config.get("storage_classes", ["standard", "intelligent_tiering", "glacier", "deep_archive"])
S3_FALLBACK_PRICING = _s3_config.get("fallback_pricing", {})

# ELB fallback pricing (us-east-1 rates from pricing file, Nov 2025)
ELB_FALLBACK_PRICING = {
    # Application Load Balancer
    "alb_hourly":       0.0225,   # per LB-hour
    "alb_lcu_used":     0.0080,   # per used LCU-hour
    "alb_lcu_reserved": 0.0080,   # per reserved LCU-hour
    "alb_trust_store":  0.0050,   # per Trust Store association-hour
    # Network Load Balancer
    "nlb_hourly":       0.0225,   # per LB-hour
    "nlb_lcu_used":     0.0060,   # per used LCU-hour
    "nlb_lcu_reserved": 0.0060,   # per reserved LCU-hour
    # Gateway Load Balancer
    "gwlb_hourly":      0.0125,   # per LB-hour
    "gwlb_lcu_used":    0.0040,   # per used LCU-hour
    "gwlb_lcu_reserved":0.0040,   # per reserved LCU-hour
    # Classic Load Balancer
    "clb_hourly":       0.0250,   # per LB-hour
    "clb_data_processed":0.0080,  # per GB processed
}

# Human-readable metadata for /lb-types endpoint
ELB_LB_TYPES = {
    "application": {
        "name": "Application Load Balancer (ALB)",
        "description": "Layer 7, HTTP/HTTPS routing. Supports path/host-based routing, WebSockets, and HTTP/2.",
        "pricing_dimensions": ["hourly", "lcu_used", "lcu_reserved", "trust_store"],
        "lcu_definition": "1 LCU = max(25 new connections/s, 3000 active connections/min, 1 GB/hr processed, 1000 rule evaluations/s)",
    },
    "network": {
        "name": "Network Load Balancer (NLB)",
        "description": "Layer 4, TCP/UDP/TLS. Ultra-low latency, handles millions of requests per second.",
        "pricing_dimensions": ["hourly", "lcu_used", "lcu_reserved"],
        "lcu_definition": "1 LCU = max(800 new connections/s, 100000 active connections, 1 GB/hr processed)",
    },
    "gateway": {
        "name": "Gateway Load Balancer (GWLB)",
        "description": "Layer 3, for deploying and scaling third-party virtual network appliances.",
        "pricing_dimensions": ["hourly", "lcu_used", "lcu_reserved"],
        "lcu_definition": "1 LCU = max(600 new connections/s, 60000 active connections, 1 GB/hr processed)",
    },
    "classic": {
        "name": "Classic Load Balancer (CLB)",
        "description": "Previous generation. AWS recommends migrating to ALB or NLB.",
        "pricing_dimensions": ["hourly", "data_processed"],
    },
}

# CloudWatch configuration
CLOUDWATCH_FREE_TIER = {
    "custom_metrics": 10,
    "alarms": 10,
    "logs_ingestion_gb": 5,
    "dashboards": 3,
    "api_requests": 1_000_000,
}
CLOUDWATCH_FALLBACK_PRICING = {
    "metrics_per_metric": 0.30,
    "alarm_standard_per_month": 0.10,
    "alarm_high_res_per_month": 0.30,
    "logs_ingestion_per_gb": 0.50,
    "logs_storage_per_gb": 0.03,
    "dashboard_per_month": 3.00,
    "api_requests_per_request": 0.00001,
}

# CloudFront configuration (rates here are per-request, matching the
# pricing file's pricePerUnit, not per-10k)
CLOUDFRONT_FREE_TIER = {
    "data_transfer_out_gb": 1024,   # 1 TB/month, first 12 months
    "https_requests": 10_000_000,
    "http_requests": 10_000_000,
}
CLOUDFRONT_FALLBACK_PRICING = {
    "data_transfer_per_gb": 0.109,   # India tier-1 rate; adjust per geo if needed
    "https_per_request": 0.0000012,
    "http_per_request": 0.0000009,
    "invalidation_per_path": 0.005,
}

# ElastiCache configuration
ELASTICACHE_FALLBACK_PRICING = {
    "node_hourly": {
        "cache.t3.micro": 0.017,
        "cache.t3.small": 0.034,
        "cache.t3.medium": 0.068,
        "cache.m6g.large": 0.156,
        "cache.r6g.large": 0.226,
        "default": 0.034,
    },
    "backup_per_gb": 0.085,
}

# SQS configuration
SQS_FREE_TIER_REQUESTS = 1_000_000
SQS_REQUEST_CHUNK_KB = 64
SQS_FALLBACK_PRICING = {
    "standard_per_million": 0.40,
    "fifo_per_million": 0.50,
    "data_transfer_per_gb": 0.09,
}

def get_service_config(service: str) -> Dict[str, Any]:
    """Get configuration for a specific service"""
    return _CONFIG.get(service, {})

def reload_config():
    """Reload configuration from file (useful for testing)"""
    global _CONFIG
    _CONFIG = _load_service_config()

