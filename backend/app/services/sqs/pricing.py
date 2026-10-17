"""SQS pricing service"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class SQSPricing(PricingLoader):
    """SQS specific pricing loader"""

    def __new__(cls):
        return super().__new__(cls, "sqs")

    def __init__(self):
        super().__init__("sqs")

    def _build_index(self):
        """Build SQS specific index

        Index structure:
        {
            "region_code": {
                "requests": {"standard": [...tiers], "fifo": [...tiers]},
                "data_transfer": [...tiers],
            }
        }

        Note: this pricing file has no SQS-specific data transfer SKUs
        (AWS bills SQS data transfer under general EC2 data transfer
        pricing), so data_transfer stays None and the calculator falls
        back to a constant rate.
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})

        for sku, product in products.items():
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            usagetype = attrs.get("usagetype", "")

            if not region:
                continue

            if region not in self.index:
                self.index[region] = {
                    "requests": {"standard": None, "fifo": None},
                    "data_transfer": None,
                }

            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue

            if usagetype.endswith("Requests-FIFO-Tier1"):
                self.index[region]["requests"]["fifo"] = tiers
            elif usagetype.endswith("Requests-Tier1"):
                self.index[region]["requests"]["standard"] = tiers
            elif "DataTransfer-Out-Bytes" in usagetype:
                self.index[region]["data_transfer"] = tiers

    def get_requests_pricing(self, region: str, queue_type: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("requests", {}).get(queue_type)

    def get_data_transfer_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("data_transfer")