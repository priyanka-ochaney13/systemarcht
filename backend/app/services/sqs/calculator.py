"""SQS calculator"""
from typing import Dict, Any
import math
from app.core.base_calculator import BaseCalculator
from app.services.sqs.pricing import SQSPricing
from app.models.sqs import (
    SQSRequest,
    SQSCostBreakdown,
    SQSResponse,
)
from app.utils.constants import SQS_FREE_TIER_REQUESTS, SQS_FALLBACK_PRICING, SQS_REQUEST_CHUNK_KB


class SQSCalculator(BaseCalculator):
    """SQS cost calculator"""

    def __init__(self):
        super().__init__("sqs")
        self.pricing = SQSPricing()
        self._fallback = SQS_FALLBACK_PRICING

    def calculate(self, request: SQSRequest) -> SQSResponse:
        region = request.region
        include_free_tier = request.include_free_tier
        notes = []

        # A "request" over 64KB is billed as multiple requests
        chunks_per_request = math.ceil(request.avg_payload_size_kb / SQS_REQUEST_CHUNK_KB)
        billable_requests = request.requests_per_month * chunks_per_request

        free_requests = SQS_FREE_TIER_REQUESTS if include_free_tier else 0
        net_billable = max(0, billable_requests - free_requests)

        request_tiers = self.pricing.get_requests_pricing(region, request.queue_type)
        if request_tiers:
            requests_cost = self.apply_tiered_pricing(net_billable, request_tiers)
        else:
            key = "fifo_per_million" if request.queue_type == "fifo" else "standard_per_million"
            requests_cost = net_billable * (self._fallback[key] / 1_000_000)
            notes.append(f"No SQS request pricing found for {region} ({request.queue_type}) — used fallback rate")

        # Data transfer out — no SQS-specific SKU exists, always falls back
        transfer_tiers = self.pricing.get_data_transfer_pricing(region)
        if transfer_tiers:
            data_transfer_cost = self.apply_tiered_pricing(request.data_transfer_out_gb, transfer_tiers)
        else:
            data_transfer_cost = request.data_transfer_out_gb * self._fallback["data_transfer_per_gb"]

        total_cost = requests_cost + data_transfer_cost

        if chunks_per_request > 1:
            notes.append(f"Avg payload {request.avg_payload_size_kb}KB spans {chunks_per_request} billable 64KB chunks per message")

        breakdown = SQSCostBreakdown(
            total_cost=round(total_cost, 2),
            requests_cost=round(requests_cost, 2),
            data_transfer_cost=round(data_transfer_cost, 2),
        )

        return SQSResponse(
            service="sqs",
            breakdown=breakdown,
            details={
                "queue_type": request.queue_type,
                "billable_requests": billable_requests,
                "chunks_per_request": chunks_per_request,
            },
            free_tier_applied=include_free_tier,
            notes=notes,
        )