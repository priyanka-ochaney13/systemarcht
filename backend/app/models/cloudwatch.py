"""CloudWatch specific models"""
from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse


class CloudWatchRequest(BaseCalculateRequest):
    """CloudWatch calculation request"""

    custom_metrics: int = Field(default=0, ge=0, description="Number of custom metrics")

    standard_alarms: int = Field(default=0, ge=0, description="Number of standard resolution alarms")
    high_res_alarms: int = Field(default=0, ge=0, description="Number of high resolution alarms")

    logs_ingested_gb: float = Field(default=0.0, ge=0, description="Log data ingested per month (GB)")
    logs_storage_gb: float = Field(default=0.0, ge=0, description="Log data stored (GB, archival)")

    dashboards: int = Field(default=0, ge=0, description="Number of dashboards")

    api_requests_per_month: int = Field(default=0, ge=0, description="CloudWatch API requests per month")

    include_free_tier: bool = Field(default=True, description="Whether to apply free tier allowances")


class CloudWatchCostBreakdown(BaseCostBreakdown):
    """CloudWatch cost breakdown by category"""
    metrics_cost: float = Field(default=0.0, description="Cost for custom metrics")
    alarms_cost: float = Field(default=0.0, description="Cost for alarms")
    logs_ingestion_cost: float = Field(default=0.0, description="Cost for log ingestion")
    logs_storage_cost: float = Field(default=0.0, description="Cost for log storage")
    dashboards_cost: float = Field(default=0.0, description="Cost for dashboards")
    api_requests_cost: float = Field(default=0.0, description="Cost for API requests")


class CloudWatchResponse(BaseCalculateResponse):
    """CloudWatch calculation response"""
    breakdown: CloudWatchCostBreakdown
    free_tier_applied: bool = Field(..., description="Whether free tier was applied")
    notes: List[str] = Field(default_factory=list, description="Additional notes or warnings")