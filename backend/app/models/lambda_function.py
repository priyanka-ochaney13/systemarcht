"""AWS Lambda specific models"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse
from app.utils.constants import LAMBDA_MEMORY_OPTIONS, LAMBDA_STORAGE_OPTIONS, LAMBDA_LIMITS


# Valid configurations loaded from service_config.json
VALID_MEMORY_SIZES = LAMBDA_MEMORY_OPTIONS
VALID_STORAGE_SIZES = LAMBDA_STORAGE_OPTIONS


class LambdaRequest(BaseCalculateRequest):
    """Lambda calculation request"""
    
    # Architecture
    architecture: Literal["x86_64", "arm64"] = Field(
        default="x86_64",
        description="CPU architecture: x86_64 (Intel/AMD) or arm64 (Graviton2)"
    )
    
    # Core function parameters
    requests_per_month: int = Field(
        ...,
        ge=0,
        description="Number of Lambda invocations per month"
    )
    
    duration_ms: int = Field(
        ...,
        ge=1,
        le=LAMBDA_LIMITS["max_duration_ms"],
        description=f"Average execution duration in milliseconds (1ms - {LAMBDA_LIMITS['max_duration_ms'] // 60000} minutes)"
    )
    
    memory_mb: int = Field(
        ...,
        description="Allocated memory in MB (128 - 10240)"
    )
    
    # Free tier
    include_free_tier: bool = Field(
        default=True,
        description="Whether to apply free tier allowances"
    )
    
    # Advanced options
    ephemeral_storage_mb: int = Field(
        default=512,
        ge=512,
        le=LAMBDA_LIMITS["max_memory_mb"],
        description=f"Ephemeral storage (/tmp) in MB (512 - {LAMBDA_LIMITS['max_memory_mb']})"
    )
    
    provisioned_concurrency: int = Field(
        default=0,
        ge=0,
        le=LAMBDA_LIMITS["max_provisioned_concurrency"],
        description=f"Number of provisioned concurrent executions (0 - {LAMBDA_LIMITS['max_provisioned_concurrency']})"
    )
    
    @field_validator('memory_mb')
    @classmethod
    def validate_memory(cls, v: int) -> int:
        if v not in VALID_MEMORY_SIZES:
            raise ValueError(
                f"Invalid memory size: {v}. Must be one of: {VALID_MEMORY_SIZES}"
            )
        return v
    
    @field_validator('ephemeral_storage_mb')
    @classmethod
    def validate_storage(cls, v: int) -> int:
        if v not in VALID_STORAGE_SIZES:
            raise ValueError(
                f"Invalid storage size: {v}. Must be one of: {VALID_STORAGE_SIZES}"
            )
        return v


class LambdaRequestUsage(BaseModel):
    """Request usage breakdown"""
    total: int = Field(..., description="Total requests")
    free_tier: int = Field(default=0, description="Requests covered by free tier")
    billable: int = Field(..., description="Billable requests after free tier")
    rate_per_million: float = Field(..., description="Price per million requests")


class LambdaComputeUsage(BaseModel):
    """Compute (duration) usage breakdown"""
    total_gb_seconds: float = Field(..., description="Total GB-seconds used")
    free_tier_gb_seconds: float = Field(default=0, description="GB-seconds covered by free tier")
    billable_gb_seconds: float = Field(..., description="Billable GB-seconds after free tier")
    rate_per_gb_second: float = Field(..., description="Price per GB-second")


class LambdaStorageUsage(BaseModel):
    """Ephemeral storage usage breakdown"""
    configured_mb: int = Field(..., description="Configured storage in MB")
    additional_mb: int = Field(..., description="Additional storage beyond 512MB free")
    total_gb_seconds: float = Field(..., description="Total storage GB-seconds")
    rate_per_gb_second: float = Field(..., description="Price per GB-second for storage")


class LambdaProvisionedConcurrencyUsage(BaseModel):
    """Provisioned concurrency usage breakdown"""
    instances: int = Field(..., description="Number of provisioned instances")
    memory_gb: float = Field(..., description="Memory per instance in GB")
    total_gb_seconds: float = Field(..., description="Total provisioned GB-seconds")
    rate_per_gb_second: float = Field(..., description="Price per GB-second for provisioned")


class LambdaUsageDetails(BaseModel):
    """Complete usage details"""
    requests: LambdaRequestUsage
    compute: LambdaComputeUsage
    ephemeral_storage: Optional[LambdaStorageUsage] = None
    provisioned_concurrency: Optional[LambdaProvisionedConcurrencyUsage] = None


class LambdaCostBreakdown(BaseCostBreakdown):
    """Lambda cost breakdown by category"""
    requests_cost: float = Field(default=0.0, description="Cost for requests")
    compute_cost: float = Field(default=0.0, description="Cost for compute (duration)")
    ephemeral_storage_cost: float = Field(default=0.0, description="Cost for additional storage")
    provisioned_concurrency_cost: float = Field(default=0.0, description="Cost for provisioned concurrency")


class LambdaResponse(BaseCalculateResponse):
    """Lambda calculation response"""
    region: str = Field(..., description="AWS region")
    architecture: str = Field(..., description="CPU architecture used")
    breakdown: LambdaCostBreakdown
    usage: LambdaUsageDetails
    free_tier_applied: bool = Field(..., description="Whether free tier was applied")
    free_tier_savings: float = Field(default=0.0, description="Total savings from free tier")
    notes: List[str] = Field(default_factory=list, description="Additional notes or warnings")


