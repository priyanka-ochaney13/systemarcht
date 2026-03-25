"""DynamoDB Pydantic models"""
from pydantic import BaseModel, Field
from typing import Optional, Dict


class DynamoDBRequest(BaseModel):
    region: str = Field(..., description="AWS Region")
    storage_gb: float = Field(..., description="Data storage in GB")
    avg_item_size_kb: Optional[float] = Field(4.0, description="Average item size in KB")

    # Features
    on_demand_enabled: bool = Field(False, description="Enable On-Demand Capacity")
    provisioned_enabled: bool = Field(False, description="Enable Provisioned Capacity")
    backup_enabled: bool = Field(False, description="Enable Backup features")

    # On-Demand Parameters
    on_demand_reads_per_month: Optional[int] = Field(0, description="Total On-Demand reads per month")
    on_demand_writes_per_month: Optional[int] = Field(0, description="Total On-Demand writes per month")

    # Provisioned Parameters
    provisioned_read_capacity_units: Optional[int] = Field(0, description="Provisioned Read Capacity Units")
    provisioned_write_capacity_units: Optional[int] = Field(0, description="Provisioned Write Capacity Units")

    # Backup Parameters
    pitr_enabled: Optional[bool] = Field(False, description="Enable Point-In-Time Recovery")
    backup_storage_gb: Optional[float] = Field(0, description="Backup storage size in GB")
    restore_data_size_gb: Optional[float] = Field(0, description="Data size to restore in GB")


class DynamoDBCostBreakdown(BaseModel):
    storage_cost: float
    on_demand_read_cost: float
    on_demand_write_cost: float
    provisioned_read_cost: float
    provisioned_write_cost: float
    pitr_cost: float
    backup_storage_cost: float
    restore_cost: float
    total_cost: float


class DynamoDBResponse(BaseModel):
    service: str = "dynamodb"
    breakdown: DynamoDBCostBreakdown
    details: Dict