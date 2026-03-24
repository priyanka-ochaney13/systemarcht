"""ELB calculator"""
from app.core.base_calculator import BaseCalculator
from app.services.elb.pricing import ELBPricing
from app.models.elb import (
    ELBRequest,
    ELBCostBreakdown,
    ELBResponse,
    ELBUsageDetails,
    ELBHourlyUsage,
    ELBLCUUsage,
    ELBTrustStoreUsage,
    ELBClassicDataUsage,
)
from app.utils.constants import ELB_FALLBACK_PRICING


class ELBCalculator(BaseCalculator):
    """ELB cost calculator"""

    def __init__(self):
        super().__init__("elb")
        self.pricing = ELBPricing()
        self._fallback = ELB_FALLBACK_PRICING

    def calculate(self, request: ELBRequest) -> ELBResponse:
        """Main calculation method"""

        region = request.region
        lb_type = request.lb_type
        hours = request.hours_per_month

        if lb_type == "application":
            return self._calculate_alb(request, region, hours)
        elif lb_type == "network":
            return self._calculate_nlb(request, region, hours)
        elif lb_type == "gateway":
            return self._calculate_gwlb(request, region, hours)
        elif lb_type == "classic":
            return self._calculate_clb(request, region, hours)
        else:
            raise ValueError(f"Unknown lb_type: {lb_type}")

    # ── ALB ──────────────────────────────────────────────────────────────────

    def _calculate_alb(self, request: ELBRequest, region: str, hours: float) -> ELBResponse:
        hourly_rate = self._get_rate(self.pricing.get_alb_hourly_pricing(region),
                                     self._fallback["alb_hourly"])
        lcu_used_rate = self._get_rate(self.pricing.get_alb_lcu_used_pricing(region),
                                       self._fallback["alb_lcu_used"])
        lcu_reserved_rate = self._get_rate(self.pricing.get_alb_lcu_reserved_pricing(region),
                                           self._fallback["alb_lcu_reserved"])
        ts_rate = self._get_rate(self.pricing.get_alb_trust_store_pricing(region),
                                 self._fallback["alb_trust_store"])

        hourly_cost = hours * hourly_rate
        lcu_used_hours = request.lcu_count * hours
        lcu_reserved_hours = request.reserved_lcu_count * hours
        lcu_cost = lcu_used_hours * lcu_used_rate
        reserved_lcu_cost = lcu_reserved_hours * lcu_reserved_rate
        trust_store_cost = request.trust_store_hours * ts_rate
        total_cost = hourly_cost + lcu_cost + reserved_lcu_cost + trust_store_cost

        notes = []
        if request.reserved_lcu_count > 0:
            notes.append("Reserved LCUs are billed 24/7 regardless of actual traffic.")
        if request.trust_store_hours > 0:
            notes.append("Trust Store hours are charged per ALB associated with a Trust Store.")

        return ELBResponse(
            service="elb",
            region=region,
            lb_type="application",
            breakdown=ELBCostBreakdown(
                total_cost=round(total_cost, 2),
                hourly_cost=round(hourly_cost, 2),
                lcu_cost=round(lcu_cost, 2),
                reserved_lcu_cost=round(reserved_lcu_cost, 2),
                trust_store_cost=round(trust_store_cost, 2),
            ),
            usage=ELBUsageDetails(
                hourly=ELBHourlyUsage(hours=hours, rate_per_hour=hourly_rate),
                lcu=ELBLCUUsage(
                    used_lcu_hours=round(lcu_used_hours, 4),
                    reserved_lcu_hours=round(lcu_reserved_hours, 4),
                    rate_per_lcu_hour=lcu_used_rate,
                    rate_per_reserved_lcu_hour=lcu_reserved_rate,
                ),
                trust_store=ELBTrustStoreUsage(
                    hours=request.trust_store_hours,
                    rate_per_hour=ts_rate,
                ) if request.trust_store_hours > 0 else None,
            ),
            details={
                "lcu_per_hour": request.lcu_count,
                "reserved_lcu_per_hour": request.reserved_lcu_count,
                "trust_store_hours": request.trust_store_hours,
            },
            notes=notes,
        )

    # ── NLB ──────────────────────────────────────────────────────────────────

    def _calculate_nlb(self, request: ELBRequest, region: str, hours: float) -> ELBResponse:
        hourly_rate = self._get_rate(self.pricing.get_nlb_hourly_pricing(region),
                                     self._fallback["nlb_hourly"])
        lcu_used_rate = self._get_rate(self.pricing.get_nlb_lcu_used_pricing(region),
                                       self._fallback["nlb_lcu_used"])
        lcu_reserved_rate = self._get_rate(self.pricing.get_nlb_lcu_reserved_pricing(region),
                                           self._fallback["nlb_lcu_reserved"])

        hourly_cost = hours * hourly_rate
        lcu_used_hours = request.lcu_count * hours
        lcu_reserved_hours = request.reserved_lcu_count * hours
        lcu_cost = lcu_used_hours * lcu_used_rate
        reserved_lcu_cost = lcu_reserved_hours * lcu_reserved_rate
        total_cost = hourly_cost + lcu_cost + reserved_lcu_cost

        notes = []
        if request.reserved_lcu_count > 0:
            notes.append("Reserved LCUs are billed 24/7 regardless of actual traffic.")

        return ELBResponse(
            service="elb",
            region=region,
            lb_type="network",
            breakdown=ELBCostBreakdown(
                total_cost=round(total_cost, 2),
                hourly_cost=round(hourly_cost, 2),
                lcu_cost=round(lcu_cost, 2),
                reserved_lcu_cost=round(reserved_lcu_cost, 2),
            ),
            usage=ELBUsageDetails(
                hourly=ELBHourlyUsage(hours=hours, rate_per_hour=hourly_rate),
                lcu=ELBLCUUsage(
                    used_lcu_hours=round(lcu_used_hours, 4),
                    reserved_lcu_hours=round(lcu_reserved_hours, 4),
                    rate_per_lcu_hour=lcu_used_rate,
                    rate_per_reserved_lcu_hour=lcu_reserved_rate,
                ),
            ),
            details={
                "lcu_per_hour": request.lcu_count,
                "reserved_lcu_per_hour": request.reserved_lcu_count,
            },
            notes=notes,
        )

    # ── GWLB ─────────────────────────────────────────────────────────────────

    def _calculate_gwlb(self, request: ELBRequest, region: str, hours: float) -> ELBResponse:
        hourly_rate = self._get_rate(self.pricing.get_gwlb_hourly_pricing(region),
                                     self._fallback["gwlb_hourly"])
        lcu_used_rate = self._get_rate(self.pricing.get_gwlb_lcu_used_pricing(region),
                                       self._fallback["gwlb_lcu_used"])
        lcu_reserved_rate = self._get_rate(self.pricing.get_gwlb_lcu_reserved_pricing(region),
                                           self._fallback["gwlb_lcu_reserved"])

        hourly_cost = hours * hourly_rate
        lcu_used_hours = request.lcu_count * hours
        lcu_reserved_hours = request.reserved_lcu_count * hours
        lcu_cost = lcu_used_hours * lcu_used_rate
        reserved_lcu_cost = lcu_reserved_hours * lcu_reserved_rate
        total_cost = hourly_cost + lcu_cost + reserved_lcu_cost

        notes = ["Gateway Load Balancer is typically used for inline network appliances (firewalls, IDS/IPS)."]
        if request.reserved_lcu_count > 0:
            notes.append("Reserved LCUs are billed 24/7 regardless of actual traffic.")

        return ELBResponse(
            service="elb",
            region=region,
            lb_type="gateway",
            breakdown=ELBCostBreakdown(
                total_cost=round(total_cost, 2),
                hourly_cost=round(hourly_cost, 2),
                lcu_cost=round(lcu_cost, 2),
                reserved_lcu_cost=round(reserved_lcu_cost, 2),
            ),
            usage=ELBUsageDetails(
                hourly=ELBHourlyUsage(hours=hours, rate_per_hour=hourly_rate),
                lcu=ELBLCUUsage(
                    used_lcu_hours=round(lcu_used_hours, 4),
                    reserved_lcu_hours=round(lcu_reserved_hours, 4),
                    rate_per_lcu_hour=lcu_used_rate,
                    rate_per_reserved_lcu_hour=lcu_reserved_rate,
                ),
            ),
            details={
                "lcu_per_hour": request.lcu_count,
                "reserved_lcu_per_hour": request.reserved_lcu_count,
            },
            notes=notes,
        )

    # ── CLB ──────────────────────────────────────────────────────────────────

    def _calculate_clb(self, request: ELBRequest, region: str, hours: float) -> ELBResponse:
        hourly_rate = self._get_rate(self.pricing.get_clb_hourly_pricing(region),
                                     self._fallback["clb_hourly"])
        data_rate = self._get_rate(self.pricing.get_clb_data_pricing(region),
                                   self._fallback["clb_data_processed"])

        hourly_cost = hours * hourly_rate
        data_cost = request.data_processed_gb * data_rate
        total_cost = hourly_cost + data_cost

        notes = ["AWS recommends migrating Classic Load Balancers to Application or Network Load Balancers."]

        return ELBResponse(
            service="elb",
            region=region,
            lb_type="classic",
            breakdown=ELBCostBreakdown(
                total_cost=round(total_cost, 2),
                hourly_cost=round(hourly_cost, 2),
                data_processing_cost=round(data_cost, 2),
            ),
            usage=ELBUsageDetails(
                hourly=ELBHourlyUsage(hours=hours, rate_per_hour=hourly_rate),
                classic_data=ELBClassicDataUsage(
                    data_processed_gb=request.data_processed_gb,
                    rate_per_gb=data_rate,
                ) if request.data_processed_gb > 0 else None,
            ),
            details={
                "data_processed_gb": request.data_processed_gb,
            },
            notes=notes,
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _get_rate(self, tiers, fallback: float) -> float:
        """Extract the first non-zero rate from tiers, or return fallback"""
        if tiers:
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit
        return fallback