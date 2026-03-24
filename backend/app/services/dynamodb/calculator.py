"""DynamoDB calculator"""
from math import ceil
from typing import Any
import logging

from app.core.base_calculator import BaseCalculator
from app.services.dynamodb.pricing import DynamoDBPricing
from app.models.dynamodb import DynamoDBRequest, DynamoDBResponse, DynamoDBCostBreakdown

logger = logging.getLogger(__name__)


class DynamoDBCalculator(BaseCalculator):
    """DynamoDB cost calculator"""

    def __init__(self):
        super().__init__("dynamodb")
        self.pricing = DynamoDBPricing()

    def calculate(self, request: DynamoDBRequest) -> DynamoDBResponse:
        """Main calculation method"""
        region = request.region

        # 1. Storage Cost
        storage_tiers = self.pricing.get_storage_price(region)
        storage_cost = self._calculate_cost(request.storage_gb, storage_tiers)

        # 2. On-Demand Cost
        on_demand_read_cost = 0.0
        on_demand_write_cost = 0.0

        if request.on_demand_enabled:
            # Read Units: 4 KB chunks — price stored per single unit in JSON
            read_units_per_req = ceil(request.avg_item_size_kb / 4)
            total_read_units = request.on_demand_reads_per_month * read_units_per_req

            # Write Units: 1 KB chunks — price stored per single unit in JSON
            write_units_per_req = ceil(request.avg_item_size_kb / 1)
            total_write_units = request.on_demand_writes_per_month * write_units_per_req

            read_tiers = self.pricing.get_on_demand_price(region, "read")
            write_tiers = self.pricing.get_on_demand_price(region, "write")

            on_demand_read_cost = self._calculate_cost(total_read_units, read_tiers)
            on_demand_write_cost = self._calculate_cost(total_write_units, write_tiers)

        # 3. Provisioned Cost
        provisioned_read_cost = 0.0
        provisioned_write_cost = 0.0

        if request.provisioned_enabled:
            HOURS_PER_MONTH = 730

            read_tiers = self.pricing.get_provisioned_price(region, "read")
            write_tiers = self.pricing.get_provisioned_price(region, "write")

            total_rcu_hours = request.provisioned_read_capacity_units * HOURS_PER_MONTH
            total_wcu_hours = request.provisioned_write_capacity_units * HOURS_PER_MONTH

            provisioned_read_cost = self._calculate_cost(total_rcu_hours, read_tiers)
            provisioned_write_cost = self._calculate_cost(total_wcu_hours, write_tiers)

        # 4. Backup Cost
        pitr_cost = 0.0
        backup_storage_cost = 0.0
        restore_cost = 0.0

        if request.backup_enabled:
            if request.pitr_enabled:
                pitr_tiers = self.pricing.get_backup_price(region, "pitr")
                pitr_cost = self._calculate_cost(request.storage_gb, pitr_tiers)

            backup_tiers = self.pricing.get_backup_price(region, "storage")
            backup_storage_cost = self._calculate_cost(request.backup_storage_gb, backup_tiers)

            restore_tiers = self.pricing.get_backup_price(region, "restore")
            restore_cost = self._calculate_cost(request.restore_data_size_gb, restore_tiers)

        total_cost = (
            storage_cost
            + on_demand_read_cost + on_demand_write_cost
            + provisioned_read_cost + provisioned_write_cost
            + pitr_cost + backup_storage_cost + restore_cost
        )

        breakdown = DynamoDBCostBreakdown(
            storage_cost=round(storage_cost, 2),
            on_demand_read_cost=round(on_demand_read_cost, 2),
            on_demand_write_cost=round(on_demand_write_cost, 2),
            provisioned_read_cost=round(provisioned_read_cost, 2),
            provisioned_write_cost=round(provisioned_write_cost, 2),
            pitr_cost=round(pitr_cost, 2),
            backup_storage_cost=round(backup_storage_cost, 2),
            restore_cost=round(restore_cost, 2),
            total_cost=round(total_cost, 2),
        )

        return DynamoDBResponse(
            service="dynamodb",
            breakdown=breakdown,
            details={
                "region": region,
                "storage_gb": request.storage_gb,
                "features": {
                    "on_demand": request.on_demand_enabled,
                    "provisioned": request.provisioned_enabled,
                    "backup": request.backup_enabled,
                },
            },
        )

    def _calculate_cost(self, quantity: float, tiers: Any) -> float:
        """Helper to calculate cost using tiers"""
        if tiers is None:
            return 0.0

        if not isinstance(tiers, list):
            logger.warning(f"Invalid tiers type: expected list, got {type(tiers).__name__}")
            return 0.0

        return self.apply_tiered_pricing(quantity, tiers)