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

def get_service_config(service: str) -> Dict[str, Any]:
    """Get configuration for a specific service"""
    return _CONFIG.get(service, {})

def reload_config():
    """Reload configuration from file (useful for testing)"""
    global _CONFIG
    _CONFIG = _load_service_config()