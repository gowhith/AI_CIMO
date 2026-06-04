from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IncidentCreate(BaseModel):
    service_id: int
    title: str
    description: str | None = None
    severity: str = "high"


class IncidentUpdate(BaseModel):
    status: str | None = None
    severity: str | None = None
    assigned_to: int | None = None
    resolution_notes: str | None = None


class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_id: int
    title: str
    description: str | None
    severity: str
    status: str
    assigned_to: int | None
    resolution_notes: str | None
    created_at: datetime
    resolved_at: datetime | None


class SummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_id: int
    ai_summary: str
    possible_root_cause: str
    recommended_steps: str
    confidence_score: float
    model_used: str | None
    feedback_score: int | None
    created_at: datetime


class FeedbackIn(BaseModel):
    score: int = Field(ge=-1, le=1, description="-1, 0, or +1")
