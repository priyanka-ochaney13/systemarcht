from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str = Field(min_length=1, max_length=80)
    avatar_url: str | None = None
    preferences: dict[str, object] = Field(default_factory=dict)


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str = Field(min_length=1, max_length=80)

    @field_validator("display_name")
    @classmethod
    def strip_display_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Display name cannot be empty.")
        return value