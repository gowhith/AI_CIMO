from app.ai_analysis.service import analyze_incident_sync
from app.core.celery_app import celery_app
from app.core.db import SessionLocal
from app.core.logging import get_logger

log = get_logger(__name__)


@celery_app.task(name="app.ai_analysis.tasks.analyze_incident", bind=True, max_retries=3)
def analyze_incident(self, incident_id: int) -> dict:
    db = SessionLocal()
    try:
        summary = analyze_incident_sync(db, incident_id)
        return {"incident_id": incident_id, "summary_id": summary.id}
    except Exception as exc:
        log.error("ai_task_failed", incident_id=incident_id, error=str(exc))
        raise self.retry(exc=exc, countdown=10) from exc
    finally:
        db.close()
