from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.db import get_db
from app.core.security import get_current_user
from app.deployments.models import Deployment
from app.deployments.schemas import DeploymentIn, DeploymentOut
from app.services.models import Service

router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.get("", response_model=list[DeploymentOut])
def list_deployments(
    service_id: int | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list[Deployment]:
    q = db.query(Deployment)
    if service_id:
        q = q.filter(Deployment.service_id == service_id)
    return q.order_by(desc(Deployment.deployed_at)).limit(limit).all()


@router.post("", response_model=DeploymentOut, status_code=201)
def record_deployment(
    payload: DeploymentIn,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> Deployment:
    if not db.get(Service, payload.service_id):
        raise HTTPException(status_code=404, detail="Service not found")
    dep = Deployment(**payload.model_dump())
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return dep
