"""API Gateway specific models"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse

class APIGatewayRequest(BaseCalculateRequest):
    """API Gateway calculation request"""
    api_type: Literal["HTTP", "REST", "WEBSOCKET"] = Field(..., description="API type")
    requests_per_month: int = Field(..., gt=0, description="Requests/month")
    
    # HTTP API
    request_size_kb: Optional[float] = Field(None, gt=0, description="Avg request size in KB")
    response_size_kb: Optional[float] = Field(None, gt=0, description="Avg response size in KB")
    
    # WebSocket
    message_size_kb: Optional[float] = Field(None, gt=0, description="Avg message size in KB")
    connection_minutes: Optional[int] = Field(None, gt=0, description="Connection minutes/month")
    
    # Cache (REST only)
    enable_caching: bool = Field(False, description="Enable caching")
    cache_size_gb: Optional[str] = Field(None, description="Cache size in GB")

class APIGatewayCostBreakdown(BaseCostBreakdown):
    """API Gateway cost breakdown"""
    api_requests_cost: float = 0.0
    cache_cost: float = 0.0
    websocket_connection_cost: float = 0.0

class APIGatewayResponse(BaseCalculateResponse):
    """API Gateway calculation response"""
    breakdown: APIGatewayCostBreakdown