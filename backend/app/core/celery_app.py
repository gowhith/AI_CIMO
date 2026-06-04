from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

_settings = get_settings()

celery_app = Celery(
    "ai_cimo",
    broker=_settings.celery_broker_url,
    backend=_settings.celery_result_backend,
    include=[
        "app.ai_analysis.tasks",
        "app.notifications.tasks",
        "app.incidents.detector",
        "app.simulator.traffic",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_max_tasks_per_child=200,
    broker_connection_retry_on_startup=True,
)

celery_app.conf.beat_schedule = {
    "scan-for-incidents": {
        "task": "app.incidents.detector.scan_for_incidents",
        "schedule": _settings.incident_scan_interval_seconds,
    },
    "simulator-tick": {
        "task": "app.simulator.traffic.tick",
        "schedule": _settings.simulator_interval_seconds,
    },
}
