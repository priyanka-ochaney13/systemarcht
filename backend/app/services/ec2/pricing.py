"""EC2 pricing service"""
from app.services.pricing_loader import PricingLoader
from typing import Dict, List, Optional


class EC2Pricing(PricingLoader):
    """EC2 specific pricing loader"""

    def __new__(cls):
        return super().__new__(cls, "ec2")

    def __init__(self):
        super().__init__("ec2")

    def _build_index(self):
        """Build EC2 index

        Index structure:
        {
            "us-east-1": {
                "t3.medium": {"tiers": [...], "vcpu": "2", "memory": "4 GiB", ...},
            }
        }
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        self.index = {}

        for sku, product in products.items():
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            instance_type = attrs.get("instanceType")
            if not region or not instance_type:
                continue

            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue

            existing = self.index.setdefault(region, {}).get(instance_type)
            # If duplicates slip through the filter, keep the cheapest
            if existing is None or tiers[0].price_per_unit < existing["tiers"][0].price_per_unit:
                self.index[region][instance_type] = {
                    "tiers": tiers,
                    "vcpu": attrs.get("vcpu"),
                    "memory": attrs.get("memory"),
                    "storage": attrs.get("storage"),
                    "network": attrs.get("networkPerformance"),
                    "family": attrs.get("instanceFamily"),
                }

    def get_instance(self, region: str, instance_type: str) -> Optional[Dict]:
        return self.index.get(region, {}).get(instance_type)

    def get_instance_types(self, region: str) -> List[str]:
        return sorted(self.index.get(region, {}).keys())