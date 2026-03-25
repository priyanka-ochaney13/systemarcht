"""Architecture models for multi-service cost calculation"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Any, Dict
from app.models.base import BaseCostBreakdown


# Supported service types (extend as you add more services)
ServiceType = Literal["lambda", "api_gateway", "s3", "dynamodb", "elb"]


class ServiceNode(BaseModel):
    """A service node in the architecture"""
    id: str = Field(..., description="Unique identifier for this node (e.g., 'lambda-1')")
    service_type: ServiceType = Field(..., description="Type of AWS service")
    name: str = Field(..., description="User-friendly name for this service")
    config: Dict[str, Any] = Field(..., description="Service-specific configuration")


class ServiceConnection(BaseModel):
    """Data flow connection between two service nodes"""
    id: str = Field(..., description="Unique identifier for this connection")
    source_id: str = Field(..., description="Source node ID")
    target_id: str = Field(..., description="Target node ID")
    requests_per_month: Optional[int] = Field(
        default=None,
        ge=0,
        description="Number of requests per month (if not provided, inferred from source node)"
    )
    avg_request_size_kb: float = Field(
        default=1.0,
        ge=0,
        description="Average request payload size in KB"
    )
    avg_response_size_kb: float = Field(
        default=1.0,
        ge=0,
        description="Average response payload size in KB"
    )


class ArchitectureRequest(BaseModel):
    """Request to calculate architecture costs"""
    name: str = Field(..., description="Architecture name")
    nodes: List[ServiceNode] = Field(..., min_length=1, description="List of service nodes")
    connections: List[ServiceConnection] = Field(
        default_factory=list, 
        description="List of connections between nodes"
    )
    include_free_tier: bool = Field(
        default=True, 
        description="Whether to apply free tier allowances"
    )


class ServiceCostDetail(BaseModel):
    """Cost details for a single service node"""
    node_id: str = Field(..., description="Node ID")
    name: str = Field(..., description="Service name")
    service_type: str = Field(..., description="Type of service")
    region: str = Field(..., description="AWS region")
    cost: float = Field(..., description="Monthly cost in USD")
    breakdown: Dict[str, Any] = Field(default_factory=dict, description="Detailed cost breakdown")


class ConnectionCostDetail(BaseModel):
    """Cost details for a data transfer connection"""
    connection_id: str = Field(..., description="Connection ID")
    source_name: str = Field(..., description="Source service name")
    target_name: str = Field(..., description="Target service name")
    source_region: str = Field(..., description="Source region")
    target_region: str = Field(..., description="Target region")
    transfer_type: str = Field(..., description="Type of transfer (same_region, cross_region, etc.)")
    requests_per_month: int = Field(..., description="Number of requests")
    avg_request_size_kb: float = Field(..., description="Average request size in KB")
    avg_response_size_kb: float = Field(..., description="Average response size in KB")
    data_transfer_gb: float = Field(..., description="Calculated data transferred in GB")
    rate_per_gb: float = Field(..., description="Rate per GB in USD")
    cost: float = Field(..., description="Total transfer cost in USD")


class ArchitectureBreakdown(BaseCostBreakdown):
    """Cost breakdown by category"""
    services_cost: float = Field(..., description="Total cost of all services")
    data_transfer_cost: float = Field(..., description="Total data transfer cost")


class ArchitectureCostResponse(BaseModel):
    """Response with full architecture cost calculation"""
    architecture_name: str = Field(..., description="Name of the architecture")
    total_cost: float = Field(..., description="Total monthly cost in USD")
    breakdown: ArchitectureBreakdown = Field(..., description="Cost breakdown by category")
    service_details: List[ServiceCostDetail] = Field(..., description="Cost details per service")
    connection_details: List[ConnectionCostDetail] = Field(..., description="Cost details per connection")
    free_tier_applied: bool = Field(..., description="Whether free tier was applied")
    warnings: List[str] = Field(default_factory=list, description="Any warnings or notes")
