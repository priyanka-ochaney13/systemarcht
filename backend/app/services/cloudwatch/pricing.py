"""CloudWatch pricing service"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class CloudWatchPricing(PricingLoader):
    """CloudWatch specific pricing loader"""

    def __new__(cls):
        return super().__new__(cls, "cloudwatch")

    def __init__(self):
        super().__init__("cloudwatch")

    def _build_index(self):
        """Build CloudWatch specific index

        Index structure:
        {
            "region_code": {
                "metrics": [...tiers],
                "alarms_standard": [...tiers],
                "alarms_high_res": [...tiers],
                "logs_ingestion": [...tiers],
                "logs_storage": [...tiers],
                "dashboards": [...tiers],
                "api_requests": [...tiers],
            }
        }
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
                    "metrics": None,
                    "alarms_standard": None,
                    "alarms_high_res": None,
                    "logs_ingestion": None,
                    "logs_storage": None,
                    "dashboards": None,
                    "api_requests": None,
                }

            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue

            if "CW:MetricMonitorUsage" in usagetype:
                self.index[region]["metrics"] = tiers
            elif "CW:HighResAlarmMonitorUsage" in usagetype:
                self.index[region]["alarms_high_res"] = tiers
            elif "CW:AlarmMonitorUsage" in usagetype:
                self.index[region]["alarms_standard"] = tiers
            elif usagetype.endswith("DataProcessing-Bytes"):
                self.index[region]["logs_ingestion"] = tiers
            elif usagetype.endswith("TimedStorage-ByteHrs"):
                self.index[region]["logs_storage"] = tiers
            elif "DashboardsUsageHour" in usagetype and "Global" not in usagetype:
                self.index[region]["dashboards"] = tiers
            elif "CW:Requests" in usagetype:
                self.index[region]["api_requests"] = tiers

    def get_metrics_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("metrics")

    def get_alarms_pricing(self, region: str, high_res: bool = False) -> Optional[List[PricingTier]]:
        key = "alarms_high_res" if high_res else "alarms_standard"
        return self.index.get(region, {}).get(key)

    def get_logs_ingestion_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("logs_ingestion")

    def get_logs_storage_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("logs_storage")

    def get_dashboards_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("dashboards")

    def get_api_requests_pricing(self, region: str) -> Optional[List[PricingTier]]:
        return self.index.get(region, {}).get("api_requests")