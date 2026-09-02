"""SQS specific models"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse


class SQSRequest(BaseCalculateRequest):
    """SQS calculation request"""

    queue_type: Literal["standard", "fifo"] = Field(default="standard", description="Queue type")
    requests_per_month: int = Field(..., ge=0, description="Requests per month (Send/Receive/Delete etc.)")
    avg_payload_size_kb: float = Field(default=1.0, gt=0, description="Average payload size in KB (billed per 64KB chunk)")

    data_transfer_out_gb: float = Field(default=0.0, ge=0, description="Data transferred out per month (GB)")

    include_free_tier: bool = Field(default=True, description="Whether to apply free tier allowances")


class SQSCostBreakdown(BaseCostBreakdown):
    """SQS cost breakdown by category"""
    requests_cost: float = Field(default=0.0, description="Cost for requests")
    data_transfer_cost: float = Field(default=0.0, description="Cost for data transfer out")


class SQSResponse(BaseCalculateResponse):
    """SQS calculation response"""
    breakdown: SQSCostBreakdown
    free_tier_applied: bool = Field(..., description="Whether free tier was applied")
    notes: List[str] = Field(default_factory=list, description="Additional notes or warnings")