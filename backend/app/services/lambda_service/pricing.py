"""Lambda pricing service"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class LambdaPricing(PricingLoader):
    """Lambda specific pricing loader"""
    
    def __new__(cls):
        return super().__new__(cls, "lambda")
    
    def __init__(self):
        super().__init__("lambda")
    
    def _build_index(self):
        """Build Lambda specific pricing index
        
        Index structure:
        {
            "region_code": {
                "requests": {"x86_64": [...tiers], "arm64": [...tiers]},
                "duration": {"x86_64": [...tiers], "arm64": [...tiers]},
                "provisioned": {"x86_64": [...tiers], "arm64": [...tiers]},
                "storage": [...tiers]
            }
        }
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        
        for sku, product in products.items():
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            group = attrs.get("group", "")
            usagetype = attrs.get("usagetype", "")
            
            if not region:
                continue
            
            # Initialize region in index
            if region not in self.index:
                self.index[region] = {
                    "requests": {"x86_64": None, "arm64": None},
                    "duration": {"x86_64": None, "arm64": None},
                    "provisioned": {"x86_64": None, "arm64": None},
                    "provisioned_duration": {"x86_64": None, "arm64": None},
                    "storage": None
                }
            
            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue
            
            # Categorize by usage type
            # Requests (x86)
            if group == "AWS-Lambda-Requests" and "ARM" not in usagetype:
                self.index[region]["requests"]["x86_64"] = tiers
            
            # Requests (ARM)
            elif group == "AWS-Lambda-Requests-ARM":
                self.index[region]["requests"]["arm64"] = tiers
            
            # Duration/Compute (x86)
            elif group == "AWS-Lambda-Duration" and "ARM" not in usagetype:
                self.index[region]["duration"]["x86_64"] = tiers
            
            # Duration/Compute (ARM)
            elif group == "AWS-Lambda-Duration-ARM":
                self.index[region]["duration"]["arm64"] = tiers
            
            # Provisioned Concurrency (x86)
            elif "Provisioned-Concurrency" in usagetype and "ARM" not in usagetype:
                self.index[region]["provisioned"]["x86_64"] = tiers
            
            # Provisioned Concurrency (ARM)
            elif "Provisioned-Concurrency" in usagetype and "ARM" in usagetype:
                self.index[region]["provisioned"]["arm64"] = tiers
            
            # Provisioned Duration (x86)
            elif "Provisioned-Duration" in usagetype and "ARM" not in usagetype:
                self.index[region]["provisioned_duration"]["x86_64"] = tiers
            
            # Provisioned Duration (ARM)
            elif "Provisioned-Duration" in usagetype and "ARM" in usagetype:
                self.index[region]["provisioned_duration"]["arm64"] = tiers
            
            # Ephemeral Storage
            elif "Lambda-GB-Second" in usagetype and "Ephemeral" in group:
                self.index[region]["storage"] = tiers
    
    def get_request_pricing(self, region: str, architecture: str = "x86_64") -> Optional[List[PricingTier]]:
        """Get request pricing for region and architecture"""
        return self.index.get(region, {}).get("requests", {}).get(architecture)
    
    def get_duration_pricing(self, region: str, architecture: str = "x86_64") -> Optional[List[PricingTier]]:
        """Get compute/duration pricing for region and architecture"""
        return self.index.get(region, {}).get("duration", {}).get(architecture)
    
    def get_provisioned_pricing(self, region: str, architecture: str = "x86_64") -> Optional[List[PricingTier]]:
        """Get provisioned concurrency pricing"""
        return self.index.get(region, {}).get("provisioned", {}).get(architecture)
    
    def get_provisioned_duration_pricing(self, region: str, architecture: str = "x86_64") -> Optional[List[PricingTier]]:
        """Get provisioned duration pricing (when invoked)"""
        return self.index.get(region, {}).get("provisioned_duration", {}).get(architecture)
    
    def get_storage_pricing(self, region: str) -> Optional[List[PricingTier]]:
        """Get ephemeral storage pricing"""
        return self.index.get(region, {}).get("storage")