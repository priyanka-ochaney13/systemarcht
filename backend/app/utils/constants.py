"""Billing constants for AWS services"""

# HTTP API billing rules
HTTP_API_REQUEST_CHUNK_KB = 512
HTTP_API_RESPONSE_CHUNK_KB = 512

# WebSocket billing rules
WEBSOCKET_MESSAGE_CHUNK_KB = 32

# Cache billing
HOURS_PER_MONTH = 730

# API Type to AWS Operation mapping
API_TYPE_OPERATION_MAP = {
    "HTTP": "ApiGatewayHttpApi",
    "REST": "ApiGatewayRequest",
    "WEBSOCKET_MESSAGE": "ApiGatewayMessage",
    "WEBSOCKET_MINUTE": "ApiGatewayMinute"
}

# Product families in pricing data
PRODUCT_FAMILY = {
    "API_CALLS": "API Calls",
    "WEBSOCKET": "WebSocket",
    "CACHE": "Amazon API Gateway Cache",
    "PORTALS": "Amazon API Gateway Portals"
}

# Available cache sizes (GB)
CACHE_SIZES = ["0.5", "1.6", "6.1", "13.5", "28.4", "58.2", "118", "237"]