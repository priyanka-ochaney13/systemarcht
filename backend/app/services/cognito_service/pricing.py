"""Cognito pricing module"""
from app.core.base_calculator import BaseCalculator


class CognitoPricing:
    """Cognito pricing information"""
    
    # Regional pricing (most regions have same pricing)
    PRICING_RATES = {
        "default": {
            "mau_rate": 0.004,  # Per MAU per month
            "sms_mfa_rate": 0.00248,  # Per SMS
            "advanced_security_rate": 0.01,  # Per risk evaluation
            "custom_domain": 0.50,  # Flat rate per month
            "email_rate": 0.00003,  # Per email
        }
    }
    
    # Free tier limits
    FREE_TIER = {
        "mau": 50000,  # Free MAU per month
        "advanced_security_evaluations": 1000000,  # Free evaluations per month
    }
    
    # Regions where Cognito is available
    AVAILABLE_REGIONS = {
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
    
    def __init__(self):
        self.rates = self.PRICING_RATES["default"]
        self.free_tier = self.FREE_TIER
    
    def get_available_regions(self):
        """Get list of available regions"""
        return list(self.AVAILABLE_REGIONS.keys())
    
    def get_region_name(self, region_code):
        """Get display name for region"""
        return self.AVAILABLE_REGIONS.get(region_code, region_code)
    
    def get_pricing_for_region(self, region):
        """Get pricing for specific region (all regions currently have same pricing)"""
        return self.rates
    
    def calculate_mau_cost(self, mau):
        """Calculate MAU cost after free tier"""
        billable_mau = max(0, mau - self.free_tier["mau"])
        return billable_mau * self.rates["mau_rate"], billable_mau
    
    def calculate_sms_mfa_cost(self, mau, mfa_percentage):
        """Calculate SMS MFA cost"""
        if mfa_percentage <= 0:
            return 0, 0
        
        mfa_users = mau * (mfa_percentage / 100)
        # Assume 1 SMS per MFA user per month on average
        sms_count = mfa_users
        cost = sms_count * self.rates["sms_mfa_rate"]
        return cost, int(sms_count)
    
    def calculate_advanced_security_cost(self, risk_evaluated_logins):
        """Calculate advanced security cost after free tier"""
        billable_evaluations = max(0, risk_evaluated_logins - self.free_tier["advanced_security_evaluations"])
        cost = billable_evaluations * self.rates["advanced_security_rate"]
        return cost, billable_evaluations
    
    def calculate_custom_domain_cost(self, enabled):
        """Calculate custom domain cost (flat rate)"""
        return self.rates["custom_domain"] if enabled else 0
    
    def calculate_email_customization_cost(self, monthly_emails):
        """Calculate email customization cost"""
        if monthly_emails <= 0:
            return 0
        cost = monthly_emails * self.rates["email_rate"]
        return cost
