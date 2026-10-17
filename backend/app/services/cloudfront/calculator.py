"""CloudFront calculator"""
from typing import Dict, Any
from app.core.base_calculator import BaseCalculator
from app.services.cloudfront.pricing import CloudFrontPricing
from app.models.cloudfront import (
    CloudFrontRequest,
    CloudFrontCostBreakdown,
    CloudFrontResponse,
)
from app.utils.constants import CLOUDFRONT_FREE_TIER, CLOUDFRONT_FALLBACK_PRICING


class CloudFrontCalculator(BaseCalculator):
    """CloudFront cost calculator"""

    def __init__(self):
        super().__init__("cloudfront")
        self.pricing = CloudFrontPricing()
        self._fallback = CLOUDFRONT_FALLBACK_PRICING
        self._free_tier = CLOUDFRONT_FREE_TIER

    def calculate(self, request: CloudFrontRequest) -> CloudFrontResponse:
        geo = request.region  # geographic price group: US/EU/IN/JP/AU/SA/ZA/CA/ME/AP
        include_free_tier = request.include_free_tier
        notes = []

        # Data transfer out — free tier is a flat monthly allowance
        free_transfer_gb = self._free_tier["data_transfer_out_gb"] if include_free_tier else 0
        billable_transfer_gb = max(0, request.data_transfer_out_gb - free_transfer_gb)
        transfer_tiers = self.pricing.get_data_transfer_pricing(geo)
        if transfer_tiers:
            data_transfer_cost = self.apply_tiered_pricing(billable_transfer_gb, transfer_tiers)
        else:
            data_transfer_cost = billable_transfer_gb * self._fallback["data_transfer_per_gb"]
            notes.append(f"No CloudFront data transfer pricing found for '{geo}' — used fallback rate")

        # Requests — flat free-tier allowance on top of per-request pricing
        free_https = self._free_tier["https_requests"] if include_free_tier else 0
        free_http = self._free_tier["http_requests"] if include_free_tier else 0
        billable_https = max(0, request.https_requests - free_https)
        billable_http = max(0, request.http_requests - free_http)

        https_rate = self._get_rate(self.pricing.get_https_requests_pricing(geo), "https_per_request")
        http_rate = self._get_rate(self.pricing.get_http_requests_pricing(geo), "http_per_request")
        requests_cost = (billable_https * https_rate) + (billable_http * http_rate)

        # Invalidations — free first 1000 URLs/month is baked into the tiered pricing
        invalidation_tiers = self.pricing.get_invalidations_pricing()
        if invalidation_tiers:
            invalidation_cost = self.apply_tiered_pricing(request.invalidation_paths, invalidation_tiers)
        else:
            billable_paths = max(0, request.invalidation_paths - 1000)
            invalidation_cost = billable_paths * self._fallback["invalidation_per_path"]

        total_cost = data_transfer_cost + requests_cost + invalidation_cost

        if request.invalidation_paths > 3000:
            notes.append("High invalidation volume — consider versioned object keys instead of invalidating")

        breakdown = CloudFrontCostBreakdown(
            total_cost=round(total_cost, 2),
            data_transfer_cost=round(data_transfer_cost, 2),
            requests_cost=round(requests_cost, 2),
            invalidation_cost=round(invalidation_cost, 2),
        )

        return CloudFrontResponse(
            service="cloudfront",
            breakdown=breakdown,
            details={
                "price_group": geo,
                "data_transfer_out_gb": request.data_transfer_out_gb,
                "https_requests": request.https_requests,
                "http_requests": request.http_requests,
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