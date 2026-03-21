"""AWS S3 specific models"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse


class S3StorageBreakdown(BaseModel):
    """Storage cost breakdown"""
    standard_storage_cost: float = Field(0.0, description="Cost for standard storage")
    intelligent_tiering_cost: float = Field(0.0, description="Cost for intelligent tiering")
    glacier_storage_cost: float = Field(0.0, description="Cost for glacier storage")
    deep_archive_storage_cost: float = Field(0.0, description="Cost for deep archive storage")


class S3RequestBreakdown(BaseModel):
    """Request cost breakdown"""
    put_request_cost: float = Field(0.0, description="Cost for PUT requests")
    get_request_cost: float = Field(0.0, description="Cost for GET requests")
    delete_request_cost: float = Field(0.0, description="Cost for DELETE requests")


class S3TransferBreakdown(BaseModel):
    """Data transfer cost breakdown"""
    outbound_transfer_cost: float = Field(0.0, description="Cost for outbound data transfer")
    intra_region_transfer_cost: float = Field(0.0, description="Cost for intra-region transfer")


class S3CostBreakdown(BaseCostBreakdown):
    """S3 cost breakdown"""
    storage_cost: float = Field(0.0, description="Total storage cost")
    request_cost: float = Field(0.0, description="Total request cost")
    transfer_cost: float = Field(0.0, description="Total data transfer cost")
    storage_breakdown: Optional[S3StorageBreakdown] = None
    request_breakdown: Optional[S3RequestBreakdown] = None
    transfer_breakdown: Optional[S3TransferBreakdown] = None


class S3Request(BaseCalculateRequest):
    """S3 calculation request"""
    
    # Storage configuration
    storage_gb: float = Field(
        ...,
        ge=0,
        description="Total data stored in GB per month"
    )
    
    storage_class: Literal[
        "standard",
        "intelligent_tiering",
        "glacier",
        "deep_archive"
    ] = Field(
        default="standard",
        description="S3 storage class"
    )
    
    # Request configuration
    put_requests_per_month: int = Field(
        default=0,
        ge=0,
        description="Number of PUT/COPY requests per month"
    )
    
    get_requests_per_month: int = Field(
        default=0,
        ge=0,
        description="Number of GET and other requests per month"
    )
    
    delete_requests_per_month: int = Field(
        default=0,
        ge=0,
        description="Number of DELETE requests per month"
    )
    
    # Data transfer configuration
    outbound_transfer_gb: float = Field(
        default=0,
        ge=0,
        description="Outbound data transfer in GB per month (to internet)"
    )
    
    intra_region_transfer_gb: float = Field(
        default=0,
        ge=0,
        description="Intra-region data transfer in GB per month"
    )
    
    # Advanced options
    include_free_tier: bool = Field(
        default=True,
        description="Whether to apply free tier allowances"
    )


class S3Response(BaseCalculateResponse):
    """S3 calculation response"""
    breakdown: S3CostBreakdown
