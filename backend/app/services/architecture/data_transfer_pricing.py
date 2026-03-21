"""Data Transfer pricing loader"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class DataTransferPricing(PricingLoader):
    """Data Transfer specific pricing loader"""
    
    def __new__(cls):
        return super().__new__(cls, "data_transfer")
    
    def __init__(self):
        super().__init__("data_transfer")
    
    def _build_index(self):
        """Build Data Transfer pricing index
        
        Index structure:
        {
            "inter_region": {
                "us-east-1": {
                    "us-west-2": [...tiers],
                    "eu-west-1": [...tiers],
                }
            },
            "intra_region": {
                "us-east-1": [...tiers],
            },
            "internet_out": {
                "us-east-1": [...tiers],
            }
        }
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        
        self.index = {
            "inter_region": {},
            "intra_region": {},
            "internet_out": {}
        }
        
        for sku, product in products.items():
            attrs = product.get("attributes", {})
            transfer_type = attrs.get("transferType", "")
            from_region = attrs.get("fromRegionCode", "")
            to_region = attrs.get("toRegionCode", "")
            to_location = attrs.get("toLocation", "")
            from_location_type = attrs.get("fromLocationType", "")
            to_location_type = attrs.get("toLocationType", "")
            
            # Skip if not a standard AWS Region transfer
            if from_location_type != "AWS Region":
                continue
            
            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue
            
            # Inter-region outbound (region to region)
            if transfer_type == "InterRegion Outbound" and to_location_type == "AWS Region":
                if from_region and to_region:
                    if from_region not in self.index["inter_region"]:
                        self.index["inter_region"][from_region] = {}
                    self.index["inter_region"][from_region][to_region] = tiers
            
            # Intra-region (same region transfer)
            elif transfer_type == "IntraRegion Outbound" or transfer_type == "IntraRegion":
                if from_region:
                    self.index["intra_region"][from_region] = tiers
            
            # Internet outbound (to external)
            elif transfer_type == "AWS Outbound" and to_location == "External":
                if from_region:
                    self.index["internet_out"][from_region] = tiers
    
    def get_inter_region_rate(self, from_region: str, to_region: str) -> Tuple[float, List[PricingTier]]:
        """Get inter-region transfer rate per GB
        
        Returns:
            Tuple of (rate_per_gb, tiers)
        """
        tiers = self.index.get("inter_region", {}).get(from_region, {}).get(to_region)
        
        if tiers:
            # Get the first non-zero rate
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit, tiers
        
        # Fallback: try reverse direction
        tiers = self.index.get("inter_region", {}).get(to_region, {}).get(from_region)
        if tiers:
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit, tiers
        
        # Default fallback rate for inter-region
        return 0.02, []
    
    def get_intra_region_rate(self, region: str) -> Tuple[float, List[PricingTier]]:
        """Get intra-region (same region, cross-AZ) transfer rate per GB
        
        Returns:
            Tuple of (rate_per_gb, tiers)
        """
        tiers = self.index.get("intra_region", {}).get(region)
        
        if tiers:
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit, tiers
        
        # Default: cross-AZ is typically $0.01/GB
        return 0.01, []
    
    def get_internet_egress_rate(self, region: str) -> Tuple[float, List[PricingTier]]:
        """Get internet egress (outbound to internet) rate per GB
        
        Returns:
            Tuple of (first_tier_rate, tiers) - use tiers for tiered calculation
        """
        tiers = self.index.get("internet_out", {}).get(region)
        
        if tiers:
            # Return first non-free tier rate
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit, tiers
        
        # Default fallback
        return 0.09, []
    
    def get_transfer_rate(self, from_region: str, to_region: str) -> Tuple[str, float, List[PricingTier]]:
        """Get transfer rate based on regions
        
        Returns:
            Tuple of (transfer_type, rate_per_gb, tiers)
        """
        # Same region = intra-region (cross-AZ) pricing
        if from_region == to_region:
            rate, tiers = self.get_intra_region_rate(from_region)
            return "same_region", rate, tiers
        
        # Different regions = inter-region pricing
        rate, tiers = self.get_inter_region_rate(from_region, to_region)
        return "cross_region", rate, tiers
    
    def get_available_regions(self) -> List[str]:
        """Get list of regions with pricing data"""
        regions = set()
        regions.update(self.index.get("inter_region", {}).keys())
        regions.update(self.index.get("intra_region", {}).keys())
        regions.update(self.index.get("internet_out", {}).keys())
        return sorted(list(regions))
