"""ELB pricing service"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class ELBPricing(PricingLoader):
    """ELB specific pricing loader"""

    def __new__(cls):
        return super().__new__(cls, "elb")

    def __init__(self):
        super().__init__("elb")

    def _build_index(self):
        """Build ELB specific pricing index

        Index structure:
        {
            "region_code": {
                "alb": {
                    "hourly": [...tiers],
                    "lcu_used": [...tiers],
                    "lcu_reserved": [...tiers],
                    "trust_store": [...tiers],
                },
                "nlb": {
                    "hourly": [...tiers],
                    "lcu_used": [...tiers],
                    "lcu_reserved": [...tiers],
                },
                "gwlb": {
                    "hourly": [...tiers],
                    "lcu_used": [...tiers],
                    "lcu_reserved": [...tiers],
                },
                "clb": {
                    "hourly": [...tiers],
                    "data_processed": [...tiers],
                },
            }
        }
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})

        for sku, product in products.items():
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            family = product.get("productFamily", "")
            operation = attrs.get("operation", "")
            group_desc = attrs.get("groupDescription", "")
            usagetype = attrs.get("usagetype", "")

            if not region:
                continue

            # Skip Outposts entries — they are separate deployments
            if "Outposts" in usagetype or "Outposts" in group_desc:
                continue

            # Initialise region
            if region not in self.index:
                self.index[region] = {
                    "alb": {"hourly": None, "lcu_used": None, "lcu_reserved": None, "trust_store": None},
                    "nlb": {"hourly": None, "lcu_used": None, "lcu_reserved": None},
                    "gwlb": {"hourly": None, "lcu_used": None, "lcu_reserved": None},
                    "clb": {"hourly": None, "data_processed": None},
                }

            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue

            # ── Application Load Balancer ────────────────────────────────────
            if family == "Load Balancer-Application" and operation == "LoadBalancing:Application":
                if "LoadBalancer hourly usage by Application Load Balancer" == group_desc:
                    self.index[region]["alb"]["hourly"] = tiers
                elif group_desc == "Used Application Load Balancer capacity units-hr":
                    self.index[region]["alb"]["lcu_used"] = tiers
                elif group_desc == "Reserved Application Load Balancer capacity units-hr":
                    self.index[region]["alb"]["lcu_reserved"] = tiers
                elif group_desc == "TS hourly usage by Application Load Balancer":
                    self.index[region]["alb"]["trust_store"] = tiers

            # ── Network Load Balancer ────────────────────────────────────────
            elif family == "Load Balancer-Network" and operation == "LoadBalancing:Network":
                if group_desc == "LoadBalancer hourly usage by Network Load Balancer":
                    self.index[region]["nlb"]["hourly"] = tiers
                elif group_desc == "Used Network Load Balancer capacity units-hr":
                    self.index[region]["nlb"]["lcu_used"] = tiers
                elif group_desc == "Reserved Network Load Balancer capacity units-hr":
                    self.index[region]["nlb"]["lcu_reserved"] = tiers

            # ── Gateway Load Balancer ────────────────────────────────────────
            elif family == "Load Balancer-Gateway" and operation == "LoadBalancing:Gateway":
                if group_desc == "LoadBalancer hourly usage by Gateway Load Balancer":
                    self.index[region]["gwlb"]["hourly"] = tiers
                elif group_desc == "Used Gateway Load Balancer capacity units-hr":
                    self.index[region]["gwlb"]["lcu_used"] = tiers
                elif group_desc == "Reserved Gateway Load Balancer capacity units-hr":
                    self.index[region]["gwlb"]["lcu_reserved"] = tiers

            # ── Classic Load Balancer ────────────────────────────────────────
            elif family == "Load Balancer" and operation == "LoadBalancing":
                if group_desc == "LoadBalancer hourly usage by Classic Load Balancer":
                    self.index[region]["clb"]["hourly"] = tiers
                elif group_desc == "Data processed by Classic Load Balancer":
                    self.index[region]["clb"]["data_processed"] = tiers

    # ── Public accessors ─────────────────────────────────────────────────────

    def get_alb_hourly_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("alb", {}).get("hourly")

    def get_alb_lcu_used_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("alb", {}).get("lcu_used")

    def get_alb_lcu_reserved_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("alb", {}).get("lcu_reserved")

    def get_alb_trust_store_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("alb", {}).get("trust_store")

    def get_nlb_hourly_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("nlb", {}).get("hourly")

    def get_nlb_lcu_used_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("nlb", {}).get("lcu_used")

    def get_nlb_lcu_reserved_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("nlb", {}).get("lcu_reserved")

    def get_gwlb_hourly_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("gwlb", {}).get("hourly")

    def get_gwlb_lcu_used_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("gwlb", {}).get("lcu_used")

    def get_gwlb_lcu_reserved_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("gwlb", {}).get("lcu_reserved")

    def get_clb_hourly_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("clb", {}).get("hourly")

    def get_clb_data_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("clb", {}).get("data_processed")