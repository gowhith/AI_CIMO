import httpx

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.db import SessionLocal
from app.core.logging import get_logger
from app.notifications.models import Notification

log = get_logger(__name__)


@celery_app.task(name="app.notifications.tasks.notify_slack")
def notify_slack(incident_id: int, subject: str, body: str) -> dict:
    settings = get_settings()
    db = SessionLocal()
    n = Notification(
        incident_id=incident_id,
        channel="slack",
        target=settings.slack_webhook_url or "(disabled)",
        subject=subject,
        body=body,
    )
    try:
        if settings.slack_webhook_url:
            resp = httpx.post(
                settings.slack_webhook_url,
                json={"text": f"*{subject}*\n{body}"},
                timeout=5,
            )
            n.sent = resp.status_code < 400
            if not n.sent:
                n.error = resp.text[:500]
        else:
            n.sent = False
            n.error = "SLACK_WEBHOOK_URL not configured"
    except Exception as e:
        n.error = str(e)[:500]
    finally:
        db.add(n)
        db.commit()
        db.close()
    return {"sent": n.sent, "id": n.id}
