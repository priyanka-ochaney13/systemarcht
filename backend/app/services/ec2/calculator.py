"""EC2 calculator"""
from app.core.base_calculator import BaseCalculator
from app.services.ec2.pricing import EC2Pricing
from app.models.ec2 import EC2Request, EC2CostBreakdown, EC2Response


class EC2Calculator(BaseCalculator):
    """EC2 cost calculator"""

    def __init__(self):
        super().__init__("ec2")
        self.pricing = EC2Pricing()

    def calculate(self, request: EC2Request) -> EC2Response:
        info = self.pricing.get_instance(request.region, request.instance_type)
        if not info:
            raise ValueError(
                f"No EC2 pricing for {request.instance_type} in {request.region}"
            )

        hourly_rate = info["tiers"][0].price_per_unit
        compute_cost = hourly_rate * request.hours_per_month * request.instance_count

        breakdown = EC2CostBreakdown(
            total_cost=round(compute_cost, 2),
            compute_cost=round(compute_cost, 2),
        )

        return EC2Response(
            service="ec2",
            breakdown=breakdown,
            details={
                "instance_type": request.instance_type,
                "vcpu": info["vcpu"],
                "memory": info["memory"],
                "hourly_rate": hourly_rate,
                "hours_per_month": request.hours_per_month,
                "instance_count": request.instance_count,
            },
            notes=[],
        )