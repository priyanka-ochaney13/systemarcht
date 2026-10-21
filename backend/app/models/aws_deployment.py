from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AwsConnectionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role_arn: str = Field(min_length=20, max_length=2048)
    region: str = Field(default="ap-south-1", min_length=9, max_length=20)


class TerraformPreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    terraform_code: str = Field(min_length=1, max_length=200_000)
    region: str = Field(default="ap-south-1", min_length=9, max_length=20)
    architecture_id: str | None = Field(default=None, max_length=200)


class TerraformApprovalRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    confirmation: str = Field(min_length=1, max_length=80)


class DeploymentOut(BaseModel):
    id: str
    status: str
    region: str
    resources: list[dict[str, Any]]
    warnings: list[str]
    error: str | None = None
