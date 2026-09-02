"""ElastiCache specific models"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse


class ElastiCacheRequest(BaseCalculateRequest):
    """ElastiCache calculation request"""

    engine: Literal["redis", "memcached", "valkey"] = Field(default="redis", description="Cache engine")
    node_type: str = Field(..., description="Instance/node type, e.g. cache.t3.micro")
    number_of_nodes: int = Field(default=1, ge=1, description="Number of cache nodes")
    hours_per_month: float = Field(default=730.0, gt=0, description="Hours running per month")

    backup_storage_gb: float = Field(default=0.0, ge=0, description="Snapshot backup storage (GB)")

    include_free_tier: bool = Field(default=True, description="Whether to apply free tier allowances")


class ElastiCacheCostBreakdown(BaseCostBreakdown):
    """ElastiCache cost breakdown by category"""
    node_cost: float = Field(default=0.0, description="Cost for running nodes")
    backup_storage_cost: float = Field(default=0.0, description="Cost for backup storage")


class ElastiCacheResponse(BaseCalculateResponse):
    """ElastiCache calculation response"""
    breakdown: ElastiCacheCostBreakdown
    free_tier_applied: bool = Field(..., description="Whether free tier was applied")
    notes: List[str] = Field(default_factory=list, description="Additional notes or warnings")