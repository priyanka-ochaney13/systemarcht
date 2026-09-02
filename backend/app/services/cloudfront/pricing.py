"""CloudFront pricing service"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# CloudFront usagetype strings are prefixed by geographic group, e.g.
# "IN-DataTransfer-Out-Bytes", "US-Requests-Tier1". Invalidations have no prefix.
GEO_PREFIXES = ["US", "EU", "IN", "JP", "AU", "SA", "ZA", "CA", "ME", "AP"]


class CloudFrontPricing(PricingLoader):
    """CloudFront specific pricing loader, indexed by geographic price group"""

    def __new__(cls):
        return super().__new__(cls, "cloudfront")

    def __init__(self):
        super().__init__("cloudfront")

    def _build_index(self):
        """Build CloudFront specific index

        Index structure:
        {
            "IN": {
                "data_transfer": [...tiers],
                "https_requests": [...tiers],   # Tier2-HTTPS
                "http_requests": [...tiers],    # Tier1
            },
            ...
            "_global": {
                "invalidations": [...tiers],
            }
        }
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})

        self.index = {geo: {"data_transfer": None, "https_requests": None, "http_requests": None} for geo in GEO_PREFIXES}
        self.index["_global"] = {"invalidations": None}

        for sku, product in products.items():
            attrs = product.get("attributes", {})
            usagetype = attrs.get("usagetype", "")
            if not usagetype:
                continue

            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue

            if usagetype == "Invalidations":
                self.index["_global"]["invalidations"] = tiers
                continue

            geo = next((g for g in GEO_PREFIXES if usagetype.startswith(f"{g}-")), None)
            if not geo:
                continue

            # Skip proxy/origin-shield/real-time-log variants — only want
            # plain data transfer + Tier1 (HTTP) + Tier2-HTTPS request pricing.
            if "Proxy" in usagetype or "OriginShield" in usagetype:
                continue

            if usagetype.endswith("DataTransfer-Out-Bytes"):
                self.index[geo]["data_transfer"] = tiers
            elif usagetype.endswith("Requests-Tier1"):
                self.index[geo]["http_requests"] = tiers
            elif usagetype.endswith("Requests-Tier2-HTTPS"):
                self.index[geo]["https_requests"] = tiers

    def get_data_transfer_pricing(self, geo: str) -> Optional[List[PricingTier]]:
        return self.index.get(geo, {}).get("data_transfer")

    def get_https_requests_pricing(self, geo: str) -> Optional[List[PricingTier]]:
        return self.index.get(geo, {}).get("https_requests")

    def get_http_requests_pricing(self, geo: str) -> Optional[List[PricingTier]]:
        return self.index.get(geo, {}).get("http_requests")

    def get_invalidations_pricing(self) -> Optional[List[PricingTier]]:
        return self.index.get("_global", {}).get("invalidations")

    def get_available_regions(self) -> List[str]:
        """Geographic price groups (not AWS regions) for CloudFront"""
        return [g for g in self.index.keys() if g != "_global"]