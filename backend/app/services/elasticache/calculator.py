"""ElastiCache calculator"""
from typing import Dict, Any
from app.core.base_calculator import BaseCalculator
from app.services.elasticache.pricing import ElastiCachePricing
from app.models.elasticache import (
    ElastiCacheRequest,
    ElastiCacheCostBreakdown,
    ElastiCacheResponse,
)
from app.utils.constants import ELASTICACHE_FALLBACK_PRICING


class ElastiCacheCalculator(BaseCalculator):
    """ElastiCache cost calculator"""

    def __init__(self):
        super().__init__("elasticache")
        self.pricing = ElastiCachePricing()
        self._fallback = ELASTICACHE_FALLBACK_PRICING

    def calculate(self, request: ElastiCacheRequest) -> ElastiCacheResponse:
        region = request.region
        notes = []

        node_tiers = self.pricing.get_node_pricing(region, request.engine, request.node_type)
        hourly_rate = self._get_hourly_rate(node_tiers, request.node_type)
        node_cost = hourly_rate * request.hours_per_month * request.number_of_nodes

        backup_cost = 0.0
        if request.engine == "memcached" and request.backup_storage_gb > 0:
            notes.append("Memcached does not support snapshots/backups — backup_storage_gb ignored")
        elif request.backup_storage_gb > 0:
            backup_rate = self._get_rate(self.pricing.get_backup_storage_pricing(region), "backup_per_gb")
            backup_cost = request.backup_storage_gb * backup_rate

        total_cost = node_cost + backup_cost

        if not node_tiers:
            notes.append(f"No pricing data found for {request.node_type} ({request.engine}) in {region} — used fallback rate")

        breakdown = ElastiCacheCostBreakdown(
            total_cost=round(total_cost, 2),
            node_cost=round(node_cost, 2),
            backup_storage_cost=round(backup_cost, 2),
        )

        return ElastiCacheResponse(
            service="elasticache",
            breakdown=breakdown,
            details={
                "engine": request.engine,
                "node_type": request.node_type,
                "number_of_nodes": request.number_of_nodes,
                "hourly_rate": hourly_rate,
            },
            free_tier_applied=request.include_free_tier,
            notes=notes,
        )

    def _get_hourly_rate(self, tiers, node_type: str) -> float:
        if tiers:
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit
        return self._fallback["node_hourly"].get(node_type, self._fallback["node_hourly"]["default"])

    def _get_rate(self, tiers, fallback_key: str) -> float:
        if tiers:
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit
        return self._fallback[fallback_key]