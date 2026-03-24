"""S3 pricing service"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class S3Pricing(PricingLoader):
    """S3 specific pricing loader"""
    
    def __new__(cls):
        return super().__new__(cls, "s3")
    
    def __init__(self):
        super().__init__("s3")
    
    def _build_index(self):
        """Build S3 specific pricing index
        
        Index structure:
        {
            "region_code": {
                "standard_storage": [...tiers],
                "intelligent_tiering": [...tiers],
                "glacier_storage": [...tiers],
                "deep_archive_storage": [...tiers],
                "put_requests": [...tiers],
                "get_requests": [...tiers],
                "delete_requests": [...tiers],
                "outbound_transfer": [...tiers],
                "intra_region_transfer": [...tiers]
            }
        }
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        
        for sku, product in products.items():
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            
            if not region:
                continue
            
            # Initialize region in index
            if region not in self.index:
                self.index[region] = {
                    "standard_storage": None,
                    "intelligent_tiering_storage": None,
                    "standard_ia_storage": None,
                    "one_zone_ia_storage": None,
                    "glacier_instant_storage": None,
                    "glacier_flexible_storage": None,
                    "deep_archive_storage": None,
                    "put_requests": None,
                    "get_requests": None,
                    "delete_requests": None,
                    "outbound_transfer": None,
                    "intra_region_transfer": None
                }
            
            # Extract pricing based on usage type and storage class
            usagetype = attrs.get("usagetype", "")
            
            # Storage pricing
            if "TimedStorage-Standard" in usagetype:
                self.index[region]["standard_storage"] = self._extract_tiers(sku, terms)
            elif "TimedStorage-IntelligentTiering" in usagetype:
                self.index[region]["intelligent_tiering_storage"] = self._extract_tiers(sku, terms)
            elif "TimedStorage-SIA" in usagetype:
                self.index[region]["standard_ia_storage"] = self._extract_tiers(sku, terms)
            elif "TimedStorage-ZIA" in usagetype:
                self.index[region]["one_zone_ia_storage"] = self._extract_tiers(sku, terms)
            elif "TimedStorage-GlacierInstantRetrieval" in usagetype:
                self.index[region]["glacier_instant_storage"] = self._extract_tiers(sku, terms)
            elif "TimedStorage-GlacierStaging" in usagetype or "TimedStorage-Glacier" in usagetype:
                self.index[region]["glacier_flexible_storage"] = self._extract_tiers(sku, terms)
            elif "TimedStorage-DeepArchive" in usagetype:
                self.index[region]["deep_archive_storage"] = self._extract_tiers(sku, terms)
            
            # Request pricing
            elif "Requests-Tier1" in usagetype:
                if "PUT" in usagetype:
                    self.index[region]["put_requests"] = self._extract_tiers(sku, terms)
                elif "GET" in usagetype or "SELECT" in usagetype:
                    self.index[region]["get_requests"] = self._extract_tiers(sku, terms)
            elif "DeleteRequest" in usagetype:
                self.index[region]["delete_requests"] = self._extract_tiers(sku, terms)
            
            # Data transfer pricing
            elif "DataTransfer-Out" in usagetype:
                self.index[region]["outbound_transfer"] = self._extract_tiers(sku, terms)
            elif "DataTransfer-Regional" in usagetype:
                self.index[region]["intra_region_transfer"] = self._extract_tiers(sku, terms)
    
    def get_storage_price(self, region: str, storage_class: str) -> Optional[PricingTier]:
        """Get storage pricing for a specific region and storage class"""
        if region not in self.index:
            return None
        
        return self.index[region].get(f"{storage_class}_storage")
    
    def get_request_price(self, region: str, request_type: str) -> Optional[PricingTier]:
        """Get request pricing for a specific region and request type"""
        if region not in self.index:
            return None
        
        return self.index[region].get(f"{request_type}_requests")
    
    def get_transfer_price(self, region: str, transfer_type: str) -> Optional[PricingTier]:
        """Get data transfer pricing for a specific region and transfer type"""
        if region not in self.index:
            return None
        
        return self.index[region].get(f"{transfer_type}_transfer")
