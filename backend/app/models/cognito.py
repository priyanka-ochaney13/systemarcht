"""AWS Cognito specific models"""
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Literal, List
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse


class CognitoRequest(BaseCalculateRequest):
    """Cognito User Pools calculation request"""

    @model_validator(mode="before")
    @classmethod
    def reject_login_count_for_security_pricing(cls, values):
        if isinstance(values, dict) and "risk_evaluated_logins" in values:
            raise ValueError(
                "Use advanced_security_mau: Cognito catalog pricing is per MAU, not per login."
            )
        return values
    
    # Core MAU
    mau: int = Field(
        ...,
        ge=0,
        description="Monthly Active Users"
    )
    
    # Authentication requests
    signups_per_month: int = Field(
        ...,
        ge=0,
        description="New user registrations per month"
    )
    
    signins_per_month: int = Field(
        ...,
        ge=0,
        description="User sign-ins per month"
    )
    
    token_refreshes_per_month: int = Field(
        default=0,
        ge=0,
        description="Token refresh requests per month"
    )
    
    # MFA settings
    mfa_enabled: bool = Field(
        default=False,
        description="Enable Multi-Factor Authentication"
    )
    
    mfa_type: Literal["sms", "email", "totp"] = Field(
        default="sms",
        description="MFA type: SMS, Email, or TOTP"
    )
    
    mfa_percentage: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Percentage of MAU using MFA (0-100)"
    )
    
    # Advanced Security
    advanced_security_enabled: bool = Field(
        default=False,
        description="Enable advanced security features"
    )
    
    advanced_security_mau: int = Field(
        default=0,
        ge=0,
        description="Monthly active users billed for advanced security"
    )
    
    # Additional Features
    custom_domain_enabled: bool = Field(
        default=False,
        description="Enable custom domain for hosted UI"
    )
    
    email_customization_enabled: bool = Field(
        default=False,
        description="Enable email customization"
    )
    
    monthly_emails: int = Field(
        default=0,
        ge=0,
        description="Estimated emails sent per month"
    )


class CognitoCostBreakdown(BaseCostBreakdown):
    """Cognito cost breakdown"""
    mau_charge: float = Field(..., description="MAU pricing charge")
    sms_mfa_charge: float = Field(default=0, description="SMS MFA charges")
    totp_mfa_charge: float = Field(default=0, description="TOTP MFA charges")
    advanced_security_charge: float = Field(default=0, description="Advanced security charges")
    custom_domain_charge: float = Field(default=0, description="Custom domain charge")
    email_customization_charge: float = Field(default=0, description="Email customization charges")
    free_tier_savings: float = Field(default=0, description="Free tier savings")


class CognitoUsageDetails(BaseModel):
    """Detailed usage information"""
    mau: int = Field(..., description="Monthly Active Users")
    billable_mau: int = Field(..., description="MAU billable after free tier")
    mfa_users: int = Field(default=0, description="Users with MFA")
    advanced_security_mau: int = Field(default=0, description="MAU using advanced security")
    billable_advanced_security_mau: int = Field(
        default=0,
        description="Billable MAU using advanced security"
    )
    monthly_emails: int = Field(default=0, description="Monthly emails")


class CognitoResponse(BaseCalculateResponse):
    """Cognito calculation response"""
    breakdown: CognitoCostBreakdown
    details: CognitoUsageDetails
    
    @field_validator('breakdown', mode='before')
    @classmethod
    def validate_breakdown(cls, v):
        if isinstance(v, dict):
            return CognitoCostBreakdown(**v)
        return v
