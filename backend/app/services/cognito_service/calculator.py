"""Cognito calculator"""
from app.core.base_calculator import BaseCalculator
from app.services.cognito_service.pricing import CognitoPricing
from app.models.cognito import (
    CognitoRequest,
    CognitoCostBreakdown,
    CognitoResponse,
    CognitoUsageDetails,
)


class CognitoCalculator(BaseCalculator):
    """Cognito cost calculator"""
    
    def __init__(self):
        super().__init__("cognito")
        self.pricing = CognitoPricing()
    
    def calculate(self, request: CognitoRequest) -> CognitoResponse:
        """Main calculation method"""
        mau = request.mau
        region = request.region
        
        # Calculate MAU cost
        mau_cost, billable_mau = self.pricing.calculate_mau_cost(mau, region)
        
        # Calculate MFA cost using the selected region's catalog rate.
        sms_mfa_cost = 0
        totp_mfa_cost = 0
        mfa_users = 0
        if request.mfa_enabled:
            if request.mfa_type == "sms":
                sms_mfa_cost, mfa_users = self.pricing.calculate_sms_mfa_cost(
                    mau, request.mfa_percentage, region
                )
            elif request.mfa_type == "totp":
                totp_mfa_cost, mfa_users = self.pricing.calculate_totp_mfa_cost(
                    mau, request.mfa_percentage, region
                )
            else:
                raise ValueError(
                    "Email MFA pricing is not present in the Cognito pricing catalog."
                )
        
        # Calculate advanced security cost
        advanced_security_cost = 0
        billable_advanced_security_mau = 0
        if request.advanced_security_enabled:
            if request.advanced_security_mau > mau:
                raise ValueError(
                    "Advanced Security MAU cannot exceed the total Cognito MAU."
                )
            advanced_security_cost, billable_advanced_security_mau = (
                self.pricing.calculate_advanced_security_cost(
                    request.advanced_security_mau, region
                )
            )
        
        # Calculate custom domain cost
        custom_domain_cost = self.pricing.calculate_custom_domain_cost(
            request.custom_domain_enabled
        )
        
        # Calculate email customization cost
        email_customization_cost = 0
        if request.email_customization_enabled:
            email_customization_cost = self.pricing.calculate_email_customization_cost(
                request.monthly_emails
            )
        
        # Calculate total cost
        total_cost = (
            mau_cost
            + sms_mfa_cost
            + totp_mfa_cost
            + advanced_security_cost
            + custom_domain_cost
            + email_customization_cost
        )
        
        # Calculate free tier savings (for informational purposes)
        rates = self.pricing.get_rates_for_region(region)
        free_tier_savings = self.pricing.free_tier["mau"] * rates["mau_rate"]
        
        # Build response
        breakdown = CognitoCostBreakdown(
            total_cost=total_cost,
            mau_charge=mau_cost,
            sms_mfa_charge=sms_mfa_cost,
            totp_mfa_charge=totp_mfa_cost,
            advanced_security_charge=advanced_security_cost,
            custom_domain_charge=custom_domain_cost,
            email_customization_charge=email_customization_cost,
            free_tier_savings=free_tier_savings,
        )
        
        details = CognitoUsageDetails(
            mau=mau,
            billable_mau=billable_mau,
            mfa_users=int(mfa_users) if request.mfa_enabled else 0,
            advanced_security_mau=(
                request.advanced_security_mau if request.advanced_security_enabled else 0
            ),
            billable_advanced_security_mau=billable_advanced_security_mau,
            monthly_emails=request.monthly_emails if request.email_customization_enabled else 0,
        )
        
        return CognitoResponse(
            service="cognito",
            breakdown=breakdown,
            details=details,
        )
