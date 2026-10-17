"""RDS pricing service"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional


class RDSPricing(PricingLoader):
    """RDS specific pricing loader"""

    def __new__(cls):
        return super().__new__(cls, "rds")

    def __init__(self):
        super().__init__("rds")

    def _build_index(self):
        """Build RDS index

        self.index (instances):
        { "us-east-1": { "MySQL": { "Single-AZ": { "db.t3.medium": {"tiers": [...], "vcpu": "2", "memory": "4 GiB"} } } } }

        self.storage_index (storage):
        { "us-east-1": { "Single-AZ": { "General Purpose-GP3": [...tiers] } } }
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        self.index = {}
        self.storage_index = {}

        for sku, product in products.items():
            attrs = product.get("attributes", {})
            family = product.get("productFamily")
            region = attrs.get("regionCode")
            deployment = attrs.get("deploymentOption")
            if not region or not deployment:
                continue

            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue

            if family == "Database Instance":
                engine = attrs.get("databaseEngine")
                instance_type = attrs.get("instanceType")
                if not engine or not instance_type:
                    continue
                bucket = (self.index.setdefault(region, {})
                          .setdefault(engine, {})
                          .setdefault(deployment, {}))
                existing = bucket.get(instance_type)
                if existing is None or tiers[0].price_per_unit < existing["tiers"][0].price_per_unit:
                    bucket[instance_type] = {
                        "tiers": tiers,
                        "vcpu": attrs.get("vcpu"),
                        "memory": attrs.get("memory"),
                    }

            elif family == "Database Storage":
                volume_type = attrs.get("volumeType")
                if not volume_type:
                    continue
                (self.storage_index.setdefault(region, {})
                 .setdefault(deployment, {}))[volume_type] = tiers

    def get_instance(self, region: str, engine: str, deployment: str,
                     instance_type: str) -> Optional[Dict]:
        return (self.index.get(region, {}).get(engine, {})
                .get(deployment, {}).get(instance_type))

    def get_instance_types(self, region: str, engine: str, deployment: str) -> List[str]:
        return sorted(self.index.get(region, {}).get(engine, {}).get(deployment, {}).keys())

    def get_storage_rate(self, region: str, deployment: str) -> Optional[float]:
        """Per GB-month rate for general purpose storage, preferring gp3"""
        volumes = self.storage_index.get(region, {}).get(deployment, {})
        if not volumes:
            return None
        chosen = next((v for v in volumes if "GP3" in v.upper()), None) or sorted(volumes)[0]
        tiers: List[PricingTier] = volumes[chosen]
        return tiers[0].price_per_unit