"""AWS Elastic Load Balancing specific models"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse


class ELBRequest(BaseCalculateRequest):
    """ELB calculation request"""

    # Load balancer type
    lb_type: Literal["application", "network", "gateway", "classic"] = Field(
        ...,
        description="Type of load balancer: application (ALB), network (NLB), gateway (GWLB), or classic (CLB)"
    )

    # Hours
    hours_per_month: float = Field(
        default=730.0,
        ge=0,
        le=744,
        description="Number of hours the load balancer runs per month (default: 730 = full month)"
    )

    # --- ALB / NLB / GWLB: LCU inputs ---
    lcu_count: float = Field(
        default=0.0,
        ge=0,
        description=(
            "Used LCU-hours per hour. "
            "For ALB: 1 LCU = max(25 new connections/s, 3000 active connections/min, 1 GB/hr, 1000 rule evals/s). "
            "For NLB: 1 LCU = max(800 new connections/s, 100000 active connections, 1 GB/hr). "
            "For GWLB: 1 LCU = max(600 new connections/s, 60000 active connections, 1 GB/hr)."
        )
    )

    reserved_lcu_count: float = Field(
        default=0.0,
        ge=0,
        description="Pre-provisioned (reserved) LCU-hours per hour. Billed even when idle."
    )

    # --- ALB only: Trust Store ---
    trust_store_hours: float = Field(
        default=0.0,
        ge=0,
        description="[ALB only] Hours of Trust Store association per month"
    )

    # --- CLB only ---
    data_processed_gb: float = Field(
        default=0.0,
        ge=0,
        description="[CLB only] GB of data processed per month by the Classic Load Balancer"
    )


# ── Usage detail models ───────────────────────────────────────────────────────

class ELBHourlyUsage(BaseModel):
    """Hourly (fixed) charge breakdown"""
    hours: float = Field(..., description="Hours billed")
    rate_per_hour: float = Field(..., description="Price per load-balancer-hour")


class ELBLCUUsage(BaseModel):
    """LCU charge breakdown (ALB / NLB / GWLB)"""
    used_lcu_hours: float = Field(..., description="Used LCU-hours billed")
    reserved_lcu_hours: float = Field(..., description="Reserved LCU-hours billed")
    rate_per_lcu_hour: float = Field(..., description="Price per LCU-hour")
    rate_per_reserved_lcu_hour: float = Field(..., description="Price per reserved LCU-hour")


class ELBTrustStoreUsage(BaseModel):
    """Trust Store usage (ALB only)"""
    hours: float = Field(..., description="Trust Store association hours billed")
    rate_per_hour: float = Field(..., description="Price per Trust Store hour")


class ELBClassicDataUsage(BaseModel):
    """Classic LB data processing breakdown"""
    data_processed_gb: float = Field(..., description="GB of data processed")
    rate_per_gb: float = Field(..., description="Price per GB processed")


class ELBUsageDetails(BaseModel):
    """Complete usage details"""
    hourly: ELBHourlyUsage
    lcu: Optional[ELBLCUUsage] = None
    trust_store: Optional[ELBTrustStoreUsage] = None
    classic_data: Optional[ELBClassicDataUsage] = None


# ── Cost breakdown & response ─────────────────────────────────────────────────

class ELBCostBreakdown(BaseCostBreakdown):
    """ELB cost breakdown by category"""
    hourly_cost: float = Field(default=0.0, description="Fixed per-hour cost for the load balancer")
    lcu_cost: float = Field(default=0.0, description="Used LCU-hour cost (ALB / NLB / GWLB)")
    reserved_lcu_cost: float = Field(default=0.0, description="Reserved LCU-hour cost (ALB / NLB / GWLB)")
    trust_store_cost: float = Field(default=0.0, description="Trust Store association cost (ALB only)")
    data_processing_cost: float = Field(default=0.0, description="Data processing cost (CLB only)")


class ELBResponse(BaseCalculateResponse):
    """ELB calculation response"""
    region: str = Field(..., description="AWS region")
    lb_type: str = Field(..., description="Load balancer type")
    breakdown: ELBCostBreakdown
    usage: ELBUsageDetails
    notes: List[str] = Field(default_factory=list, description="Additional notes or warnings")