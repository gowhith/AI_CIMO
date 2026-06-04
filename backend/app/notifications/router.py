from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.db import get_db
from app.core.security import get_current_user
from app.notifications.models import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list[dict]:
    rows = (
        db.query(Notification)
        .order_by(desc(Notification.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": n.id,
            "channel": n.channel,
            "target": n.target,
            "subject": n.subject,
            "body": n.body,
            "sent": n.sent,
            "incident_id": n.incident_id,
            "created_at": n.created_at,
        }
        for n in rows
    ]
