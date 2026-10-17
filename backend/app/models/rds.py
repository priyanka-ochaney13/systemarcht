"""RDS specific models"""
from pydantic import Field
from typing import List, Literal
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse


class RDSRequest(BaseCalculateRequest):
    """RDS calculation request (on-demand, no license required engines)"""
    db_engine: Literal["MySQL", "PostgreSQL", "MariaDB"] = Field(..., description="Database engine")
    instance_type: str = Field(..., description="RDS instance class, e.g. db.t3.medium")
    deployment: Literal["Single-AZ", "Multi-AZ"] = Field(default="Single-AZ", description="Deployment option")
    instance_count: int = Field(default=1, ge=1, description="Number of DB instances")
    hours_per_month: float = Field(default=730.0, gt=0, le=744, description="Hours each instance runs per month")
    storage_gb: float = Field(default=20.0, ge=0, description="Allocated storage per instance in GB")
    include_free_tier: bool = Field(default=True, description="Accepted for architecture compatibility; no RDS free tier is applied")


class RDSCostBreakdown(BaseCostBreakdown):
    """RDS cost breakdown"""
    instance_cost: float = Field(default=0.0, description="DB instance cost")
    storage_cost: float = Field(default=0.0, description="Allocated storage cost")


class RDSResponse(BaseCalculateResponse):
    """RDS calculation response"""
    breakdown: RDSCostBreakdown
    notes: List[str] = Field(default_factory=list, description="Additional notes or warnings")