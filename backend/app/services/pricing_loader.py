"""Generic pricing data loader for all AWS services"""
import json
from pathlib import Path
from typing import Dict, List, Optional
import logging
from app.core.base_calculator import PricingTier

logger = logging.getLogger(__name__)

class PricingLoader:
    """Singleton loader for pricing data across all services"""
    _instances: Dict[str, 'PricingLoader'] = {}
    
    def __new__(cls, service_name: str):
        if service_name not in cls._instances:
            instance = super().__new__(cls)
            cls._instances[service_name] = instance
            instance._initialized = False
        return cls._instances[service_name]
    
    def __init__(self, service_name: str):
        if self._initialized:
            return
        
        self.service_name = service_name
        self.pricing_data = None
        self.index = {}
        self._initialized = True
        self._load_pricing_data()
    
    def _load_pricing_data(self):
        """Load pricing JSON file for this service"""
        pricing_file = Path(__file__).parent.parent.parent / "pricing_data" / f"{self.service_name}.json"
        
        if not pricing_file.exists():
            raise FileNotFoundError(f"Pricing file not found: {pricing_file}")
        
        logger.info(f"Loading {self.service_name} pricing data from {pricing_file}")
        
        with open(pricing_file, 'r', encoding='utf-8') as f:
            self.pricing_data = json.load(f)
        
        logger.info(f"Building {self.service_name} pricing index...")
        self._build_index()
        logger.info(f"{self.service_name} pricing index built")
    
    def _build_index(self):
        """Build pricing index - to be implemented by service-specific logic"""
        pass
    
    def _extract_tiers(self, sku: str, terms: dict) -> List[PricingTier]:
        """Extract pricing tiers from terms"""
        if sku not in terms:
            return []
        
        tiers = []
        sku_terms = terms[sku]
        
        for term_data in sku_terms.values():
            price_dimensions = term_data.get("priceDimensions", {})
            
            for dimension in price_dimensions.values():
                begin_range = dimension.get("beginRange", "0")
                end_range = dimension.get("endRange", "Inf")
                price_per_unit = dimension.get("pricePerUnit", {}).get("USD", "0")
                unit = dimension.get("unit", "")
                
                begin = int(begin_range) if begin_range != "0" else 0
                end = float('inf') if end_range == "Inf" else int(end_range)
                price = float(price_per_unit)
                
                tiers.append(PricingTier(begin, end, price, unit))
        
        tiers.sort(key=lambda t: t.begin_range)
        return tiers
    
    def get_available_regions(self) -> List[str]:
        """Get list of available regions"""
        return list(self.index.keys())