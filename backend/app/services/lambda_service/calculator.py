"""Lambda calculator"""
from typing import Dict, Any, Tuple
from app.core.base_calculator import BaseCalculator
from app.services.lambda_service.pricing import LambdaPricing
from app.models.lambda_function import (
    LambdaRequest,
    LambdaCostBreakdown,
    LambdaResponse,
    LambdaUsageDetails,
    LambdaRequestUsage,
    LambdaComputeUsage,
    LambdaStorageUsage,
    LambdaProvisionedConcurrencyUsage
)
from app.utils.constants import (
    LAMBDA_FREE_TIER_REQUESTS,
    LAMBDA_FREE_TIER_GB_SECONDS,
    LAMBDA_STORAGE_FREE_MB,
    LAMBDA_FALLBACK_PRICING,
    SECONDS_PER_MONTH
)


class LambdaCalculator(BaseCalculator):
    """Lambda cost calculator"""
    
    def __init__(self):
        super().__init__("lambda")
        self.pricing = LambdaPricing()
        
        # Load fallback pricing from config
        self._fallback = LAMBDA_FALLBACK_PRICING
    
    def calculate(self, request: LambdaRequest) -> LambdaResponse:
        """Main calculation method"""
        
        # Extract parameters
        region = request.region
        arch = request.architecture
        requests = request.requests_per_month
        duration_ms = request.duration_ms
        memory_mb = request.memory_mb
        include_free_tier = request.include_free_tier
        storage_mb = request.ephemeral_storage_mb
        provisioned = request.provisioned_concurrency
        
        # Calculate GB-seconds for compute
        duration_seconds = duration_ms / 1000
        memory_gb = memory_mb / 1024
        total_gb_seconds = requests * duration_seconds * memory_gb
        
        # Get pricing rates
        request_rate = self._get_request_rate(region, arch)
        duration_rate = self._get_duration_rate(region, arch)
        storage_rate = self._get_storage_rate(region)
        provisioned_rate = self._get_provisioned_rate(region, arch)
        
        # Calculate request costs
        free_tier_requests = LAMBDA_FREE_TIER_REQUESTS if include_free_tier else 0
        billable_requests = max(0, requests - free_tier_requests)
        requests_cost = billable_requests * request_rate
        
        # Calculate compute costs
        free_tier_gb_seconds = LAMBDA_FREE_TIER_GB_SECONDS if include_free_tier else 0
        billable_gb_seconds = max(0, total_gb_seconds - free_tier_gb_seconds)
        compute_cost = billable_gb_seconds * duration_rate
        
        # Calculate storage costs (first 512 MB is free)
        additional_storage_mb = max(0, storage_mb - LAMBDA_STORAGE_FREE_MB)
        additional_storage_gb = additional_storage_mb / 1024
        storage_gb_seconds = requests * duration_seconds * additional_storage_gb
        storage_cost = storage_gb_seconds * storage_rate
        
        # Calculate provisioned concurrency costs
        provisioned_cost = 0.0
        provisioned_gb_seconds = 0.0
        if provisioned > 0:
            provisioned_gb_seconds = provisioned * memory_gb * SECONDS_PER_MONTH
            provisioned_cost = provisioned_gb_seconds * provisioned_rate
        
        # Total cost
        total_cost = requests_cost + compute_cost + storage_cost + provisioned_cost
        
        # Calculate free tier savings
        free_tier_savings = 0.0
        if include_free_tier:
            saved_requests = min(requests, LAMBDA_FREE_TIER_REQUESTS)
            saved_gb_seconds = min(total_gb_seconds, LAMBDA_FREE_TIER_GB_SECONDS)
            free_tier_savings = (saved_requests * request_rate) + (saved_gb_seconds * duration_rate)
        
        # Build response
        breakdown = LambdaCostBreakdown(
            total_cost=round(total_cost, 2),
            requests_cost=round(requests_cost, 2),
            compute_cost=round(compute_cost, 2),
            ephemeral_storage_cost=round(storage_cost, 2),
            provisioned_concurrency_cost=round(provisioned_cost, 2)
        )
        
        request_usage = LambdaRequestUsage(
            total=requests,
            free_tier=min(requests, free_tier_requests),
            billable=billable_requests,
            rate_per_million=round(request_rate * 1_000_000, 2)
        )
        
        compute_usage = LambdaComputeUsage(
            total_gb_seconds=round(total_gb_seconds, 2),
            free_tier_gb_seconds=min(total_gb_seconds, free_tier_gb_seconds),
            billable_gb_seconds=round(billable_gb_seconds, 2),
            rate_per_gb_second=duration_rate
        )
        
        storage_usage = None
        if additional_storage_mb > 0:
            storage_usage = LambdaStorageUsage(
                configured_mb=storage_mb,
                additional_mb=additional_storage_mb,
                total_gb_seconds=round(storage_gb_seconds, 2),
                rate_per_gb_second=storage_rate
            )
        
        provisioned_usage = None
        if provisioned > 0:
            provisioned_usage = LambdaProvisionedConcurrencyUsage(
                instances=provisioned,
                memory_gb=memory_gb,
                total_gb_seconds=round(provisioned_gb_seconds, 2),
                rate_per_gb_second=provisioned_rate
            )
        
        usage = LambdaUsageDetails(
            requests=request_usage,
            compute=compute_usage,
            ephemeral_storage=storage_usage,
            provisioned_concurrency=provisioned_usage
        )
        
        notes = []
        if duration_ms > 30000:
            notes.append("Long duration functions (>30s) may benefit from other compute options")
        if memory_mb >= 3008:
            notes.append(f"At {memory_mb}MB, function gets multiple vCPUs")
        if provisioned > 0:
            notes.append("Provisioned concurrency charges apply 24/7 regardless of invocations")
        
        return LambdaResponse(
            service="lambda",
            region=region,
            architecture=arch,
            breakdown=breakdown,
            usage=usage,
            details={
                "memory_mb": memory_mb,
                "duration_ms": duration_ms,
                "storage_mb": storage_mb
            },
            free_tier_applied=include_free_tier,
            free_tier_savings=round(free_tier_savings, 2),
            notes=notes
        )
    
    def _get_request_rate(self, region: str, architecture: str) -> float:
        """Get request rate per request"""
        tiers = self.pricing.get_request_pricing(region, architecture)
        if tiers and len(tiers) > 0:
            # Find the non-free tier rate
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit
        return self._fallback["request_price_per_request"]
    
    def _get_duration_rate(self, region: str, architecture: str) -> float:
        """Get compute duration rate per GB-second"""
        tiers = self.pricing.get_duration_pricing(region, architecture)
        if tiers and len(tiers) > 0:
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit
        key = "duration_x86_per_gb_second" if architecture == "x86_64" else "duration_arm_per_gb_second"
        return self._fallback[key]
    
    def _get_storage_rate(self, region: str) -> float:
        """Get ephemeral storage rate per GB-second"""
        tiers = self.pricing.get_storage_pricing(region)
        if tiers and len(tiers) > 0:
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit
        return self._fallback["storage_per_gb_second"]
    
    def _get_provisioned_rate(self, region: str, architecture: str) -> float:
        """Get provisioned concurrency rate per GB-second"""
        tiers = self.pricing.get_provisioned_pricing(region, architecture)
        if tiers and len(tiers) > 0:
            for tier in tiers:
                if tier.price_per_unit > 0:
                    return tier.price_per_unit
        key = "provisioned_x86_per_gb_second" if architecture == "x86_64" else "provisioned_arm_per_gb_second"
        return self._fallback[key]