from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.db import get_db
from app.core.security import get_current_user
from app.deployments.models import Deployment
from app.incidents.models import Incident, IncidentStatus
from app.services.models import Service, ServiceStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db), _user: User = Depends(get_current_user)
) -> dict:
    total = db.query(func.count(Service.id)).scalar() or 0
    healthy = db.query(func.count(Service.id)).filter(Service.status == ServiceStatus.HEALTHY.value).scalar() or 0
    warning = db.query(func.count(Service.id)).filter(Service.status == ServiceStatus.WARNING.value).scalar() or 0
    critical = db.query(func.count(Service.id)).filter(Service.status == ServiceStatus.CRITICAL.value).scalar() or 0

    open_inc = (
        db.query(func.count(Incident.id))
        .filter(Incident.status.in_([IncidentStatus.OPEN.value, IncidentStatus.INVESTIGATING.value]))
        .scalar()
        or 0
    )
    resolved_inc = (
        db.query(func.count(Incident.id))
        .filter(Incident.status.in_([IncidentStatus.RESOLVED.value, IncidentStatus.CLOSED.value]))
        .scalar()
        or 0
    )

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_deployments = (
        db.query(func.count(Deployment.id)).filter(Deployment.deployed_at >= since).scalar() or 0
    )

    return {
        "services_monitored": total,
        "healthy": healthy,
        "warning": warning,
        "critical": critical,
        "open_incidents": open_inc,
        "resolved_incidents": resolved_inc,
        "recent_deployments_24h": recent_deployments,
        "avg_response_time_ms": 142,  # placeholder until Prometheus scrape wired
    }
