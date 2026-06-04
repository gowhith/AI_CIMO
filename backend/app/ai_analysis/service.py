from datetime import datetime, timedelta, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.ai_analysis.watsonx_client import analyze
from app.core.config import get_settings
from app.core.redis_client import redis_client
from app.deployments.models import Deployment
from app.incidents.models import Incident, IncidentSummary
from app.logs.models import LogEntry
from app.services.models import Service


def _last_deployment_str(db: Session, service_id: int) -> str:
    dep = (
        db.query(Deployment)
        .filter(Deployment.service_id == service_id)
        .order_by(desc(Deployment.deployed_at))
        .first()
    )
    if not dep:
        return "no recent deployments recorded"
    return f"{dep.version} ({dep.commit_id or 'no commit'}) at {dep.deployed_at.isoformat()}"


def _rate_limited(service_id: int) -> bool:
    key = f"ai_rca_rate:{service_id}"
    settings = get_settings()
    try:
        if redis_client.exists(key):
            return True
        redis_client.setex(key, settings.ai_rate_limit_per_service_seconds, "1")
    except Exception:
        # Redis optional in dev; never block analysis on cache failure.
        return False
    return False


def analyze_incident_sync(db: Session, incident_id: int) -> IncidentSummary:
    inc = db.get(Incident, incident_id)
    if inc is None:
        raise ValueError(f"Incident {incident_id} not found")

    existing = (
        db.query(IncidentSummary).filter(IncidentSummary.incident_id == inc.id).first()
    )
    if existing and _rate_limited(inc.service_id):
        return existing

    svc = db.get(Service, inc.service_id)
    since = datetime.now(timezone.utc) - timedelta(minutes=15)
    errors = [
        e.message
        for e in db.query(LogEntry)
        .filter(
            LogEntry.service_id == inc.service_id,
            LogEntry.timestamp >= since,
            LogEntry.level.in_(["ERROR", "CRITICAL"]),
        )
        .order_by(desc(LogEntry.timestamp))
        .limit(20)
        .all()
    ]
    deployment_str = _last_deployment_str(db, inc.service_id)
    result = analyze(svc.name if svc else "unknown", errors, deployment_str)

    if existing:
        existing.ai_summary = result.summary
        existing.possible_root_cause = result.root_cause
        existing.recommended_steps = result.recommended_steps
        existing.confidence_score = result.confidence
        existing.model_used = result.model_used
        summary = existing
    else:
        summary = IncidentSummary(
            incident_id=inc.id,
            ai_summary=result.summary,
            possible_root_cause=result.root_cause,
            recommended_steps=result.recommended_steps,
            confidence_score=result.confidence,
            model_used=result.model_used,
        )
        db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary
