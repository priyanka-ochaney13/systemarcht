"""S3 calculator"""
from typing import Dict, Any, Tuple
from app.core.base_calculator import BaseCalculator
from app.services.s3.pricing import S3Pricing
from app.models.s3 import (
    S3Request,
    S3Response,
    S3CostBreakdown,
    S3StorageBreakdown,
    S3RequestBreakdown,
    S3TransferBreakdown
)
from app.utils.constants import S3_FALLBACK_PRICING


class S3Calculator(BaseCalculator):
    """S3 cost calculator"""
    
    def __init__(self):
        super().__init__("s3")
        self.pricing = S3Pricing()
        self._fallback = S3_FALLBACK_PRICING
    
    def calculate(self, request: S3Request) -> S3Response:
        """Main calculation method"""
        region = request.region
        storage_gb = request.storage_gb
        storage_class = request.storage_class
        
        # Calculate storage costs
        storage_cost, storage_breakdown = self._calculate_storage(
            region, storage_gb, storage_class
        )
        
        # Calculate request costs
        request_cost, request_breakdown = self._calculate_requests(
            region,
            request.put_requests_per_month,
            request.get_requests_per_month,
            request.delete_requests_per_month
        )
        
        # Calculate data transfer costs
        transfer_cost, transfer_breakdown = self._calculate_transfer(
            region,
            request.outbound_transfer_gb,
            request.intra_region_transfer_gb
        )
        
        total_cost = storage_cost + request_cost + transfer_cost
        
        breakdown = S3CostBreakdown(
            total_cost=round(total_cost, 2),
            storage_cost=round(storage_cost, 2),
            request_cost=round(request_cost, 2),
            transfer_cost=round(transfer_cost, 2),
            storage_breakdown=storage_breakdown,
            request_breakdown=request_breakdown,
            transfer_breakdown=transfer_breakdown
        )
        
        return S3Response(
            service="s3",
            breakdown=breakdown,
            details={
                "region": region,
                "storage_class": storage_class,
                "storage_gb": storage_gb,
                "requests": {
                    "put": request.put_requests_per_month,
                    "get": request.get_requests_per_month,
                    "delete": request.delete_requests_per_month
                },
                "data_transfer": {
                    "outbound_gb": request.outbound_transfer_gb,
                    "intra_region_gb": request.intra_region_transfer_gb
                }
            }
        )
    
    def _calculate_storage(
        self, region: str, storage_gb: float, storage_class: str
    ) -> Tuple[float, S3StorageBreakdown]:
        """Calculate storage costs"""
        cost = 0.0
        breakdown = S3StorageBreakdown()
        
        # Get pricing rate from pricing data
        rate = self._get_storage_rate(region, storage_class)
        cost = storage_gb * rate
        
        # Set appropriate breakdown field
        if storage_class == "standard":
            breakdown.standard_storage_cost = round(cost, 2)
        elif storage_class == "intelligent_tiering":
            breakdown.intelligent_tiering_cost = round(cost, 2)
        elif storage_class == "standard_ia":
            breakdown.standard_ia_storage_cost = round(cost, 2)
        elif storage_class == "one_zone_ia":
            breakdown.one_zone_ia_storage_cost = round(cost, 2)
        elif storage_class == "glacier_instant":
            breakdown.glacier_instant_storage_cost = round(cost, 2)
        elif storage_class == "glacier_flexible":
            breakdown.glacier_flexible_storage_cost = round(cost, 2)
        elif storage_class == "deep_archive":
            breakdown.deep_archive_storage_cost = round(cost, 2)
        
        return cost, breakdown
    
    def _calculate_requests(
        self, region: str, put_requests: int, get_requests: int, delete_requests: int
    ) -> Tuple[float, S3RequestBreakdown]:
        """Calculate request costs"""
        put_cost = put_requests * self._get_request_rate(region, "put")
        get_cost = get_requests * self._get_request_rate(region, "get")
        delete_cost = delete_requests * self._get_request_rate(region, "delete")
        
        total_cost = put_cost + get_cost + delete_cost
        
        breakdown = S3RequestBreakdown(
            put_request_cost=round(put_cost, 2),
            get_request_cost=round(get_cost, 2),
            delete_request_cost=round(delete_cost, 2)
        )
        
        return total_cost, breakdown
    
    def _calculate_transfer(
        self, region: str, outbound_gb: float, intra_region_gb: float
    ) -> Tuple[float, S3TransferBreakdown]:
        """Calculate data transfer costs"""
        outbound_cost = outbound_gb * self._get_transfer_rate(region, "outbound")
        intra_region_cost = intra_region_gb * self._get_transfer_rate(region, "intra_region")
        
        total_cost = outbound_cost + intra_region_cost
        
        breakdown = S3TransferBreakdown(
            outbound_transfer_cost=round(outbound_cost, 2),
            intra_region_transfer_cost=round(intra_region_cost, 2)
        )
        
        return total_cost, breakdown
    
    def _get_storage_rate(self, region: str, storage_class: str) -> float:
        """Get storage rate per GB from pricing data"""
        tier = self.pricing.get_storage_price(region, storage_class)
        
        if tier:
            return tier.price_per_unit
        
        # Use fallback pricing
        return self._fallback.get(storage_class, {}).get("storage_per_gb", 0.023)
    
    def _get_request_rate(self, region: str, request_type: str) -> float:
        """Get request rate per 1000 requests from pricing data"""
        tier = self.pricing.get_request_price(region, request_type)
        
        if tier:
            return tier.price_per_unit / 1000  # Convert to per-request rate
        
        # Use fallback pricing
        return self._fallback.get(request_type, {}).get("per_1000_requests", 0.0) / 1000
    
    def _get_transfer_rate(self, region: str, transfer_type: str) -> float:
        """Get data transfer rate per GB from pricing data"""
        tier = self.pricing.get_transfer_price(region, transfer_type)
        
        if tier:
            return tier.price_per_unit
        
        # Use fallback pricing
        if transfer_type == "outbound":
            return self._fallback.get("outbound_transfer", {}).get("per_gb", 0.09)
        else:
            return self._fallback.get("intra_region_transfer", {}).get("per_gb", 0.01)
