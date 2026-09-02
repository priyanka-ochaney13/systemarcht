"""CloudWatch calculator"""
from typing import Dict, Any
from app.core.base_calculator import BaseCalculator
from app.services.cloudwatch.pricing import CloudWatchPricing
from app.models.cloudwatch import (
    CloudWatchRequest,
    CloudWatchCostBreakdown,
    CloudWatchResponse,
)
from app.utils.constants import CLOUDWATCH_FREE_TIER, CLOUDWATCH_FALLBACK_PRICING


class CloudWatchCalculator(BaseCalculator):
    """CloudWatch cost calculator"""

    def __init__(self):
        super().__init__("cloudwatch")
        self.pricing = CloudWatchPricing()
        self._fallback = CLOUDWATCH_FALLBACK_PRICING
        self._free_tier = CLOUDWATCH_FREE_TIER

    def calculate(self, request: CloudWatchRequest) -> CloudWatchResponse:
        region = request.region
        include_free_tier = request.include_free_tier
        notes = []

        # Custom metrics — apply free allowance, then tiered pricing
        free_metrics = self._free_tier["custom_metrics"] if include_free_tier else 0
        billable_metrics = max(0, request.custom_metrics - free_metrics)
        metric_tiers = self.pricing.get_metrics_pricing(region)
        if metric_tiers:
            metrics_cost = self.apply_tiered_pricing(billable_metrics, metric_tiers)
        else:
            metrics_cost = billable_metrics * self._fallback["metrics_per_metric"]

        # Alarms
        free_alarms = self._free_tier["alarms"] if include_free_tier else 0
        billable_standard = max(0, request.standard_alarms - min(free_alarms, request.standard_alarms))
        remaining_free = max(0, free_alarms - request.standard_alarms)
        billable_high_res = max(0, request.high_res_alarms - remaining_free)

        std_rate = self._get_rate(self.pricing.get_alarms_pricing(region, False), "alarm_standard_per_month")
        hr_rate = self._get_rate(self.pricing.get_alarms_pricing(region, True), "alarm_high_res_per_month")
        alarms_cost = (billable_standard * std_rate) + (billable_high_res * hr_rate)

        # Logs ingestion
        free_ingestion_gb = self._free_tier["logs_ingestion_gb"] if include_free_tier else 0
        billable_ingestion_gb = max(0, request.logs_ingested_gb - free_ingestion_gb)
        ingestion_tiers = self.pricing.get_logs_ingestion_pricing(region)
        if ingestion_tiers:
            logs_ingestion_cost = self.apply_tiered_pricing(billable_ingestion_gb, ingestion_tiers)
        else:
            logs_ingestion_cost = billable_ingestion_gb * self._fallback["logs_ingestion_per_gb"]

        # Logs storage
        storage_rate = self._get_rate(self.pricing.get_logs_storage_pricing(region), "logs_storage_per_gb")
        logs_storage_cost = request.logs_storage_gb * storage_rate

        # Dashboards
        free_dashboards = self._free_tier["dashboards"] if include_free_tier else 0
        billable_dashboards = max(0, request.dashboards - free_dashboards)
        dashboard_rate = self._get_rate(self.pricing.get_dashboards_pricing(region), "dashboard_per_month")
        dashboards_cost = billable_dashboards * dashboard_rate

        # API requests
        free_api_requests = self._free_tier["api_requests"] if include_free_tier else 0
        billable_api_requests = max(0, request.api_requests_per_month - free_api_requests)
        api_rate = self._get_rate(self.pricing.get_api_requests_pricing(region), "api_requests_per_request")
        api_requests_cost = billable_api_requests * api_rate

        total_cost = (
            metrics_cost + alarms_cost + logs_ingestion_cost
            + logs_storage_cost + dashboards_cost + api_requests_cost
        )

        total_alarms = request.standard_alarms + request.high_res_alarms
        if total_alarms > 10:
            notes.append("Large number of alarms — consider composite alarms to reduce count")
        if request.logs_ingested_gb > 100:
            notes.append("High log ingestion volume — consider log filtering or shorter retention")

        breakdown = CloudWatchCostBreakdown(
            total_cost=round(total_cost, 2),
            metrics_cost=round(metrics_cost, 2),
            alarms_cost=round(alarms_cost, 2),
            logs_ingestion_cost=round(logs_ingestion_cost, 2),
            logs_storage_cost=round(logs_storage_cost, 2),
            dashboards_cost=round(dashboards_cost, 2),
            api_requests_cost=round(api_requests_cost, 2),
        )

        return CloudWatchResponse(
            service="cloudwatch",
            breakdown=breakdown,
            details={
                "custom_metrics": request.custom_metrics,
                "standard_alarms": request.standard_alarms,
                "high_res_alarms": request.high_res_alarms,
            },
            free_tier_applied=include_free_tier,
            notes=notes,
        )

    def _get_rate(self, tiers, fallback_key: str) -> float:
        if tiers:
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit
        return self._fallback[fallback_key]