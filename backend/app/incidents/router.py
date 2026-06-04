from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.ai_analysis.service import analyze_incident_sync
from app.auth.models import User
from app.core.db import get_db
from app.core.security import get_current_user
from app.incidents.models import Incident, IncidentStatus, IncidentSummary
from app.incidents.schemas import (
    FeedbackIn,
    IncidentCreate,
    IncidentOut,
    IncidentUpdate,
    SummaryOut,
)
from app.notifications.tasks import notify_slack
from app.services.models import Service
from app.ws.incidents import publish_incident

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("", response_model=list[IncidentOut])
def list_incidents(
    status_filter: str | None = None,
    service_id: int | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list[Incident]:
    q = db.query(Incident)
    if status_filter:
        q = q.filter(Incident.status == status_filter)
    if service_id:
        q = q.filter(Incident.service_id == service_id)
    return q.order_by(desc(Incident.created_at)).limit(limit).all()


@router.post("", response_model=IncidentOut, status_code=201)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> Incident:
    if not db.get(Service, payload.service_id):
        raise HTTPException(status_code=404, detail="Service not found")
    inc = Incident(**payload.model_dump())
    db.add(inc)
    db.commit()
    db.refresh(inc)
    publish_incident(inc.id, inc.service_id, inc.title)
    try:
        notify_slack.delay(inc.id, f"[CRITICAL] {inc.title}", inc.description or inc.title)
    except Exception:
        pass
    try:
        analyze_incident_sync(db, inc.id)
    except Exception:
        pass
    return inc


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> Incident:
    inc = db.get(Incident, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> Incident:
    inc = db.get(Incident, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(inc, k, v)
    if data.get("status") in {IncidentStatus.RESOLVED.value, IncidentStatus.CLOSED.value}:
        inc.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inc)
    return inc


@router.get("/{incident_id}/summary", response_model=SummaryOut)
def get_summary(
    incident_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> IncidentSummary:
    summ = (
        db.query(IncidentSummary).filter(IncidentSummary.incident_id == incident_id).first()
    )
    if not summ:
        raise HTTPException(status_code=404, detail="No AI summary yet")
    return summ


@router.post("/{incident_id}/analyze", response_model=SummaryOut)
def analyze_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> IncidentSummary:
    if not db.get(Incident, incident_id):
        raise HTTPException(status_code=404, detail="Incident not found")
    return analyze_incident_sync(db, incident_id)


@router.post("/{incident_id}/feedback", response_model=SummaryOut)
def submit_feedback(
    incident_id: int,
    payload: FeedbackIn,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> IncidentSummary:
    summ = (
        db.query(IncidentSummary).filter(IncidentSummary.incident_id == incident_id).first()
    )
    if not summ:
        raise HTTPException(status_code=404, detail="No AI summary yet")
    summ.feedback_score = payload.score
    db.commit()
    db.refresh(summ)
    return summ
