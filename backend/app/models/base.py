"""Base Pydantic models for all services"""
from pydantic import BaseModel, Field
from typing import Optional

class BaseCalculateRequest(BaseModel):
    """Base request model"""
    region: str = Field(..., description="AWS region code")

class BaseCostBreakdown(BaseModel):
    """Base cost breakdown"""
    total_cost: float = Field(..., description="Total monthly cost in USD")
    
class BaseCalculateResponse(BaseModel):
    """Base response model"""
    service: str = Field(..., description="AWS service name")
    breakdown: BaseCostBreakdown
    details: dict = Field(default_factory=dict, description="Detailed calculations")