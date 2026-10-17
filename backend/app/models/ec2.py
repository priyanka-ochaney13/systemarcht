"""EC2 specific models"""
from pydantic import Field
from typing import List
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse


class EC2Request(BaseCalculateRequest):
    """EC2 calculation request (Linux, shared tenancy, on-demand)"""
    instance_type: str = Field(..., description="EC2 instance type, e.g. t3.medium")
    instance_count: int = Field(default=1, ge=1, description="Number of instances")
    hours_per_month: float = Field(default=730.0, gt=0, le=744, description="Hours each instance runs per month")
    include_free_tier: bool = Field(default=True, description="Accepted for architecture compatibility; no EC2 free tier is applied")


class EC2CostBreakdown(BaseCostBreakdown):
    """EC2 cost breakdown"""
    compute_cost: float = Field(default=0.0, description="Instance compute cost")


class EC2Response(BaseCalculateResponse):
    """EC2 calculation response"""
    breakdown: EC2CostBreakdown
    notes: List[str] = Field(default_factory=list, description="Additional notes or warnings")