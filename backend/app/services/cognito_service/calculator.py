"""Cognito calculator"""
from typing import Dict, Any
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
        
        # Extract parameters
        mau = request.mau
        signups = request.signups_per_month
        signins = request.signins_per_month
        token_refreshes = request.token_refreshes_per_month
        
        # Calculate MAU cost
        mau_cost, billable_mau = self.pricing.calculate_mau_cost(mau)
        
        # Calculate MFA cost (only SMS is charged)
        sms_mfa_cost = 0
        mfa_users = 0
        if request.mfa_enabled and request.mfa_type == "sms":
            sms_mfa_cost, mfa_users = self.pricing.calculate_sms_mfa_cost(
                mau, request.mfa_percentage
            )
        
        # Calculate advanced security cost
        advanced_security_cost = 0
        billable_evaluations = 0
        if request.advanced_security_enabled:
            advanced_security_cost, billable_evaluations = self.pricing.calculate_advanced_security_cost(
                request.risk_evaluated_logins
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
            + advanced_security_cost
            + custom_domain_cost
            + email_customization_cost
        )
        
        # Calculate free tier savings (for informational purposes)
        free_tier_savings = (
            (self.pricing.free_tier["mau"] * self.pricing.rates["mau_rate"]) +
            (self.pricing.free_tier["advanced_security_evaluations"] * self.pricing.rates["advanced_security_rate"])
        )
        
        # Build response
        breakdown = CognitoCostBreakdown(
            total_cost=total_cost,
            mau_charge=mau_cost,
            sms_mfa_charge=sms_mfa_cost,
            advanced_security_charge=advanced_security_cost,
            custom_domain_charge=custom_domain_cost,
            email_customization_charge=email_customization_cost,
            free_tier_savings=free_tier_savings,
        )
        
        details = CognitoUsageDetails(
            mau=mau,
            billable_mau=billable_mau,
            mfa_users=int(mfa_users) if request.mfa_enabled else 0,
            risk_evaluated_logins=request.risk_evaluated_logins if request.advanced_security_enabled else 0,
            billable_evaluations=billable_evaluations,
            monthly_emails=request.monthly_emails if request.email_customization_enabled else 0,
        )
        
        return CognitoResponse(
            service="cognito",
            breakdown=breakdown,
            details=details,
        )
