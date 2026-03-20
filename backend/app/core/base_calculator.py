"""Base calculator class for all AWS services"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class PricingTier:
    """Represents a pricing tier"""
    def __init__(self, begin_range: int, end_range: float, price_per_unit: float, unit: str):
        self.begin_range = begin_range
        self.end_range = end_range if end_range != float('inf') else float('inf')
        self.price_per_unit = price_per_unit
        self.unit = unit
    
    def __repr__(self):
        return f"PricingTier({self.begin_range}-{self.end_range}, ${self.price_per_unit}, {self.unit})"

class BaseCalculator(ABC):
    """Abstract base class for service calculators"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
    
    @abstractmethod
    def calculate(self, **kwargs) -> Dict[str, Any]:
        """Calculate cost for the service"""
        pass
    
    def apply_tiered_pricing(self, quantity: int, tiers: List[PricingTier]) -> float:
        """Apply tiered pricing calculation"""
        total_cost = 0.0
        remaining = quantity
        
        for tier in tiers:
            if remaining <= 0:
                break
            
            if tier.end_range == float('inf'):
                tier_size = remaining
            else:
                tier_size = tier.end_range - tier.begin_range
            
            quantity_in_tier = min(remaining, tier_size)
            cost_in_tier = quantity_in_tier * tier.price_per_unit
            
            total_cost += cost_in_tier
            remaining -= quantity_in_tier
        
        return round(total_cost, 2)