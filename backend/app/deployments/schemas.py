from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DeploymentIn(BaseModel):
    service_id: int
    version: str
    commit_id: str | None = None
    status: str = "success"


class DeploymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_id: int
    version: str
    commit_id: str | None
    status: str
    deployed_at: datetime
