from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.ai_analysis.service import analyze_incident_sync
from app.core.celery_app import celery_app
from app.core.db import SessionLocal
from app.core.logging import get_logger
from app.incidents.models import Incident, IncidentStatus, Severity
from app.logs.models import LogEntry
from app.notifications.tasks import notify_slack
from app.services.models import Service, ServiceStatus
from app.ws.incidents import publish_incident

log = get_logger(__name__)


def detect_for_service(db: Session, service: Service) -> Incident | None:
    """Return a newly-created Incident if the service crossed its error threshold."""
    since = datetime.now(timezone.utc) - timedelta(seconds=service.window_seconds)
    error_count = (
        db.query(func.count(LogEntry.id))
        .filter(
            LogEntry.service_id == service.id,
            LogEntry.timestamp >= since,
            LogEntry.level.in_(["ERROR", "CRITICAL"]),
        )
        .scalar()
        or 0
    )

    if error_count < service.error_threshold:
        if error_count == 0:
            service.status = ServiceStatus.HEALTHY.value
        elif error_count >= max(1, service.error_threshold // 2):
            service.status = ServiceStatus.WARNING.value
        db.commit()
        return None

    service.status = ServiceStatus.CRITICAL.value

    # Avoid duplicate open incidents per service
    existing = (
        db.query(Incident)
        .filter(
            Incident.service_id == service.id,
            Incident.status.in_(
                [IncidentStatus.OPEN.value, IncidentStatus.INVESTIGATING.value]
            ),
        )
        .first()
    )
    if existing:
        db.commit()
        return None

    inc = Incident(
        service_id=service.id,
        title=f"{service.name}: {error_count} errors in {service.window_seconds}s",
        description=(
            f"Detected {error_count} ERROR/CRITICAL logs for {service.name} "
            f"in the last {service.window_seconds}s (threshold={service.error_threshold})."
        ),
        severity=Severity.CRITICAL.value,
        status=IncidentStatus.OPEN.value,
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    log.info("incident_created", incident_id=inc.id, service=service.name, errors=error_count)
    publish_incident(inc.id, service.id, inc.title)
    try:
        notify_slack.delay(inc.id, f"[CRITICAL] {inc.title}", inc.description or inc.title)
    except Exception:
        pass
    try:
        analyze_incident_sync(db, inc.id)
    except Exception as e:
        log.warning("ai_analysis_failed", incident_id=inc.id, error=str(e))
    return inc


@celery_app.task(name="app.incidents.detector.scan_for_incidents")
def scan_for_incidents() -> dict:
    db = SessionLocal()
    created = 0
    try:
        services = db.query(Service).all()
        for svc in services:
            if detect_for_service(db, svc):
                created += 1
    finally:
        db.close()
    return {"created": created}
