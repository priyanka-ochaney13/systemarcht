"""ElastiCache pricing service"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class ElastiCachePricing(PricingLoader):
    """ElastiCache specific pricing loader"""

    def __new__(cls):
        return super().__new__(cls, "elasticache")

    def __init__(self):
        super().__init__("elasticache")

    def _build_index(self):
        """Build ElastiCache specific index

        Index structure:
        {
            "region_code": {
                "nodes": {
                    "redis": {"cache.t3.micro": [...tiers], ...},
                    "memcached": {"cache.t3.micro": [...tiers], ...},
                    "valkey": {"cache.t3.micro": [...tiers], ...},
                },
                "backup_storage": [...tiers],
            }
        }

        Note: this pricing file has no `productFamily` attribute — node
        pricing is identified by `usagetype` matching plain
        "<PREFIX>-NodeUsage:<instance_type>" (excluding ExtendedSupport/
        Outpost/SyncDurability/Serverless variants), combined with
        `cacheEngine` and `instanceType`.
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})

        for sku, product in products.items():
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            instance_type = attrs.get("instanceType")
            cache_engine = attrs.get("cacheEngine", "").lower()
            usagetype = attrs.get("usagetype", "")

            if not region:
                continue

            if region not in self.index:
                self.index[region] = {
                    "nodes": {"redis": {}, "memcached": {}, "valkey": {}},
                    "backup_storage": None,
                }

            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue

            is_plain_node_usage = (
                instance_type is not None
                and usagetype.endswith(f"NodeUsage:{instance_type}")
                and usagetype.count(":") == 1
                and not any(tag in usagetype for tag in ["ExtendedSupport", "Outpost", "SyncDurability", "Serverless"])
            )

            if is_plain_node_usage:
                if "redis" in cache_engine:
                    self.index[region]["nodes"]["redis"][instance_type] = tiers
                elif "memcached" in cache_engine:
                    self.index[region]["nodes"]["memcached"][instance_type] = tiers
                elif "valkey" in cache_engine:
                    self.index[region]["nodes"]["valkey"][instance_type] = tiers
            elif "BackupUsage" in usagetype and "Serverless" not in usagetype:
                self.index[region]["backup_storage"] = tiers

    def get_node_pricing(self, region: str, engine: str, node_type: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("nodes", {}).get(engine, {}).get(node_type)

    def get_backup_storage_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("backup_storage")