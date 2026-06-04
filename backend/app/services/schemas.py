from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    description: str | None = None
    owner: str | None = None
    environment: str = "prod"
    error_threshold: int = Field(default=5, ge=1, le=1000)
    window_seconds: int = Field(default=60, ge=10, le=3600)


class ServiceUpdate(BaseModel):
    description: str | None = None
    owner: str | None = None
    environment: str | None = None
    error_threshold: int | None = Field(default=None, ge=1, le=1000)
    window_seconds: int | None = Field(default=None, ge=10, le=3600)
    status: str | None = None


class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    owner: str | None
    status: str
    environment: str
    error_threshold: int
    window_seconds: int
    created_at: datetime
