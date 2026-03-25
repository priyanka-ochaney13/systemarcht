"""Cognito pricing module - loads from pricing_data/cognito.json"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class CognitoPricing(PricingLoader):
    """Cognito pricing loader - extends PricingLoader for AWS catalog format parsing"""
    
    def __new__(cls):
        """Use singleton pattern from PricingLoader"""
        return super().__new__(cls, "cognito")
    
    def __init__(self):
        """Initialize Cognito pricing from AWS catalog JSON"""
        # Initialize attributes BEFORE calling super().__init__() because super().__init__() calls _build_index()
        # Free tier constants (from AWS documentation)
        self.free_tier = {
            "mau": 50000,  # First 50,000 MAU free
            "advanced_security_evaluations": 1000000,  # 1M free advanced security evaluations
        }
        
        # Call parent __init__ which will call _build_index()
        super().__init__("cognito")
        
        # Extract pricing data organized by feature
        self.pricing_index = self.index
    
    def _build_index(self):
        """Build Cognito pricing index from AWS catalog
        
        Index structure:
        {
            "region_code": {
                "mau_tiers": [PricingTier, ...],  # Tiered pricing for different MAU ranges
                "sms_mfa": PricingTier,
                "totp_mfa": PricingTier,
                "advanced_security": PricingTier,
                "admin_api": PricingTier,
                "user_api": PricingTier,
            }
        }
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        
        region_map = {}
        
        for sku, product in products.items():
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            group = attrs.get("group", "")
            
            if not region:
                continue
            
            # Initialize region dict if needed
            if region not in region_map:
                region_map[region] = {
                    "mau_tiers": [],
                    "sms_mfa": None,
                    "totp_mfa": None,
                    "advanced_security": None,
                    "admin_api": None,
                    "user_api": None,
                }
            
            # Extract price from terms - custom extraction for our JSON format
            price = self._extract_price(sku, terms)
            
            # Create a simple tier object for storing the price
            tier = PricingTier(0, float('inf'), price, "")
            
            # Categorize by feature
            if "MAU - Free Tier" in group or "MAU - Paid Tier" in group:
                # MAU is tiered pricing, store the tier
                region_map[region]["mau_tiers"].append(tier)
            
            elif "MFA SMS" in group:
                region_map[region]["sms_mfa"] = tier
            
            elif "MFA TOTP" in group or "TOTP" in group:
                region_map[region]["totp_mfa"] = tier
            
            elif "Advanced Security" in group:
                region_map[region]["advanced_security"] = tier
            
            elif "Admin API" in group or "AdminAPI" in group:
                region_map[region]["admin_api"] = tier
            
            elif "User API" in group or "UserAPI" in group:
                region_map[region]["user_api"] = tier
        
        self.index = region_map
    
    def _extract_price(self, sku: str, terms: dict) -> float:
        """Extract price from terms - handles our JSON format"""
        if sku not in terms:
            return 0.0
        
        sku_terms = terms[sku]
        for term_data in sku_terms.values():
            price_dimensions = term_data.get("priceDimensions", {})
            for dimension in price_dimensions.values():
                # Try our custom format first ("price" key)
                if "price" in dimension:
                    return float(dimension.get("price", 0))
                # Fall back to AWS standard format
                price_per_unit = dimension.get("pricePerUnit", {}).get("USD", "0")
                return float(price_per_unit)
        
        return 0.0
    
    def get_available_regions(self) -> List[str]:
        """Get list of available regions"""
        return list(self.index.keys()) if self.index else [
            "us-east-1", "us-east-2", "us-west-1", "us-west-2",
            "ap-south-1", "ap-southeast-1", "ap-southeast-2",
            "eu-west-1", "eu-central-1", "ca-central-1", "ap-northeast-1"
        ]
    
    def get_region_name(self, region_code: str) -> str:
        """Get display name for region"""
        region_names = {
            "us-east-1": "US East (N. Virginia)",
            "us-east-2": "US East (Ohio)",
            "us-west-1": "US West (N. California)",
            "us-west-2": "US West (Oregon)",
            "ap-south-1": "Asia Pacific (Mumbai)",
            "ap-southeast-1": "Asia Pacific (Singapore)",
            "ap-southeast-2": "Asia Pacific (Sydney)",
            "eu-west-1": "EU (Ireland)",
            "eu-central-1": "EU (Frankfurt)",
            "ca-central-1": "Canada (Central)",
            "ap-northeast-1": "Asia Pacific (Tokyo)",
        }
        return region_names.get(region_code, region_code)
    
    def _get_region_pricing(self, region: str) -> dict:
        """Get pricing details for a region"""
        if region not in self.index:
            region = "us-east-1"  # Default fallback
        return self.index.get(region, {})
    
    def calculate_mau_cost(self, mau: int) -> Tuple[float, int]:
        """Calculate MAU cost after free tier
        
        AWS Cognito MAU pricing (tiered):
        - First 50,000 MAU: FREE
        - 50k-100k: $0.000003 per user/month
        - 100k-500k: $0.0000025 per user/month
        - 500k+: $0.0000015 per user/month
        """
        if mau <= self.free_tier["mau"]:
            return 0.0, 0
        
        # AWS pricing tiers
        tier_brackets = [
            (50000, 0),  # First 50k free
            (50000, 0.000003),  # 50k-100k
            (400000, 0.0000025),  # 100k-500k
            (float('inf'), 0.0000015),  # 500k+
        ]
        
        cost = 0.0
        remaining_mau = mau
        current_tier = 0
        
        for tier_size, tier_price in tier_brackets:
            if remaining_mau <= 0:
                break
            
            tier_mau = min(remaining_mau, tier_size)
            cost += tier_mau * tier_price
            remaining_mau -= tier_mau
        
        billable_mau = max(0, mau - self.free_tier["mau"])
        return cost, billable_mau
    
    def calculate_sms_mfa_cost(self, mau: int, mfa_percentage: float) -> Tuple[float, int]:
        """Calculate SMS MFA cost
        
        AWS SMS pricing: $0.0057 per SMS message
        Assume 1 SMS per MFA user per month
        """
        if mfa_percentage <= 0:
            return 0.0, 0
        
        mfa_users = int(mau * (mfa_percentage / 100))
        sms_count = mfa_users
        sms_price = 0.0057
        cost = sms_count * sms_price
        return cost, sms_count
    
    def calculate_advanced_security_cost(self, risk_evaluated_logins: int) -> Tuple[float, int]:
        """Calculate advanced security cost after free tier
        
        AWS Advanced Security pricing: $0.02 per MAU per month
        Free tier: 1 million evaluations per month
        """
        billable_evaluations = max(0, risk_evaluated_logins - self.free_tier["advanced_security_evaluations"])
        security_price = 0.02 / 1000000  # $0.02 per MAU, convert to per evaluation
        cost = billable_evaluations * security_price
        return cost, billable_evaluations
    
    def calculate_custom_domain_cost(self, enabled: bool) -> float:
        """Calculate custom domain cost
        
        AWS Cognito custom domain: $0.50 per month (based on documentation)
        """
        return 0.50 if enabled else 0.0
    
    def calculate_email_customization_cost(self, monthly_emails: int) -> float:
        """Calculate email customization cost
        
        Free: Email is handled by Amazon SES but included in some tiers
        For custom email sending, assume minimal cost
        """
        return 0.0  # Email delivery is typically free with Cognito
