"""CloudFront specific models"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse

# CloudFront prices by geographic edge-location group, not AWS region.
CloudFrontPriceGroup = Literal["US", "EU", "IN", "JP", "AU", "SA", "ZA", "CA", "ME", "AP"]


class CloudFrontRequest(BaseCalculateRequest):
    """CloudFront calculation request

    'region' is repurposed here to hold the CloudFront geographic price
    group (US/EU/IN/JP/AU/SA/ZA/CA/ME/AP) — CloudFront's edge pricing is
    keyed by destination geography, not by a single AWS region.
    """

    data_transfer_out_gb: float = Field(default=0.0, ge=0, description="Data transferred out to internet (GB/month)")
    https_requests: int = Field(default=0, ge=0, description="HTTPS requests per month")
    http_requests: int = Field(default=0, ge=0, description="HTTP requests per month")
    invalidation_paths: int = Field(default=0, ge=0, description="Invalidation paths requested per month")

    include_free_tier: bool = Field(default=True, description="Whether to apply free tier allowances")


class CloudFrontCostBreakdown(BaseCostBreakdown):
    """CloudFront cost breakdown by category"""
    data_transfer_cost: float = Field(default=0.0, description="Cost for data transfer out")
    requests_cost: float = Field(default=0.0, description="Cost for HTTP/HTTPS requests")
    invalidation_cost: float = Field(default=0.0, description="Cost for path invalidations")


class CloudFrontResponse(BaseCalculateResponse):
    """CloudFront calculation response"""
    breakdown: CloudFrontCostBreakdown
    free_tier_applied: bool = Field(..., description="Whether free tier was applied")
    notes: List[str] = Field(default_factory=list, description="Additional notes or warnings")