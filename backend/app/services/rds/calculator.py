"""RDS calculator"""
from app.core.base_calculator import BaseCalculator
from app.services.rds.pricing import RDSPricing
from app.models.rds import RDSRequest, RDSCostBreakdown, RDSResponse


class RDSCalculator(BaseCalculator):
    """RDS cost calculator"""

    def __init__(self):
        super().__init__("rds")
        self.pricing = RDSPricing()

    def calculate(self, request: RDSRequest) -> RDSResponse:
        notes = []

        info = self.pricing.get_instance(
            request.region, request.db_engine, request.deployment, request.instance_type
        )
        if not info:
            raise ValueError(
                f"No RDS pricing for {request.db_engine} {request.instance_type} "
                f"({request.deployment}) in {request.region}"
            )

        hourly_rate = info["tiers"][0].price_per_unit
        instance_cost = hourly_rate * request.hours_per_month * request.instance_count

        storage_rate = self.pricing.get_storage_rate(request.region, request.deployment)
        if storage_rate is None:
            storage_cost = 0.0
            if request.storage_gb > 0:
                notes.append(f"No storage pricing found for {request.region}; storage cost not included")
        else:
            storage_cost = storage_rate * request.storage_gb * request.instance_count

        total_cost = instance_cost + storage_cost

        breakdown = RDSCostBreakdown(
            total_cost=round(total_cost, 2),
            instance_cost=round(instance_cost, 2),
            storage_cost=round(storage_cost, 2),
        )

        return RDSResponse(
            service="rds",
            breakdown=breakdown,
            details={
                "db_engine": request.db_engine,
                "instance_type": request.instance_type,
                "deployment": request.deployment,
                "vcpu": info["vcpu"],
                "memory": info["memory"],
                "hourly_rate": hourly_rate,
                "hours_per_month": request.hours_per_month,
                "instance_count": request.instance_count,
                "storage_gb": request.storage_gb,
                "storage_rate_per_gb": storage_rate,
            },
            notes=notes,
        )