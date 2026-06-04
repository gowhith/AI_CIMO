"""Live traffic simulator.

A Celery beat task that, every N seconds, injects a small batch of realistic
INFO/WARNING/ERROR logs across all services so the dashboard always shows
live activity — and occasionally spikes errors on one service to trigger
the detector + AI RCA pipeline.

Controlled by env var SIMULATOR_ENABLED (default false). Toggleable at
runtime via Redis flag `simulator:enabled`.
"""

from __future__ import annotations

import random
from datetime import datetime, timezone

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.db import SessionLocal
from app.core.logging import get_logger
from app.core.redis_client import redis_client
from app.logs.models import LogEntry
from app.services.models import Service

log = get_logger(__name__)
_settings = get_settings()

LOG_TEMPLATES = {
    "INFO": [
        "Request {method} {path} -> 200 in {ms}ms",
        "Health check OK",
        "Background job '{job}' completed in {ms}ms",
        "Cache hit ratio: {pct}%",
        "Worker picked up message from queue",
    ],
    "WARNING": [
        "Slow query: {ms}ms (p99 threshold 500ms)",
        "Retry attempt {n}/3 for downstream call",
        "Cache miss rate elevated: {pct}%",
        "High memory usage: {pct}%",
    ],
    "ERROR": [
        "Database connection timeout after 5s",
        "Failed to call upstream: 503 Service Unavailable",
        "Connection pool exhausted",
        "Request {method} {path} -> 500 Internal Server Error",
        "Failed to process transaction: insufficient funds",
        "Redis CLUSTERDOWN",
    ],
}

METHODS = ["GET", "POST", "PUT", "DELETE"]
PATHS = ["/api/v1/users", "/api/v1/orders", "/api/v1/payments", "/api/v1/auth/login", "/api/v1/search"]
JOBS = ["send_email", "process_payment", "index_documents", "compute_recommendations"]


SIM_FLAG = "simulator:enabled"
SIM_INCIDENT_FLAG = "simulator:next_spike_service"


def _format(tmpl: str) -> str:
    return tmpl.format(
        method=random.choice(METHODS),
        path=random.choice(PATHS),
        ms=random.randint(15, 5000),
        n=random.randint(1, 3),
        pct=random.randint(10, 95),
        job=random.choice(JOBS),
    )


def is_enabled() -> bool:
    try:
        flag = redis_client.get(SIM_FLAG)
        if flag is not None:
            return flag == "1"
    except Exception:
        pass
    return _settings.simulator_enabled


def set_enabled(enabled: bool) -> None:
    redis_client.set(SIM_FLAG, "1" if enabled else "0")


def trigger_spike(service_id: int) -> None:
    """Mark a service to receive an error-storm on the next simulator tick."""
    redis_client.setex(SIM_INCIDENT_FLAG, 120, str(service_id))


@celery_app.task(name="app.simulator.traffic.tick")
def tick() -> dict:
    if not is_enabled():
        return {"skipped": True, "reason": "simulator disabled"}

    db = SessionLocal()
    inserted = 0
    try:
        services = db.query(Service).all()
        if not services:
            return {"skipped": True, "reason": "no services"}

        # Check whether someone asked for an error storm on a specific service.
        spike_target = None
        try:
            raw = redis_client.get(SIM_INCIDENT_FLAG)
            if raw:
                spike_target = int(raw)
                redis_client.delete(SIM_INCIDENT_FLAG)
        except Exception:
            pass

        rows = []
        now = datetime.now(timezone.utc)
        for svc in services:
            if spike_target == svc.id:
                # Burst of errors that should cross threshold.
                for _ in range(svc.error_threshold + 2):
                    rows.append(
                        {
                            "service_id": svc.id,
                            "level": "ERROR",
                            "message": _format(random.choice(LOG_TEMPLATES["ERROR"])),
                            "trace_id": f"trace-{random.randint(10000, 99999)}",
                            "timestamp": now,
                        }
                    )
                continue

            # Normal traffic: mostly INFO, a few WARNING, rare ERROR.
            level = random.choices(
                ["INFO", "WARNING", "ERROR"], weights=[80, 15, 5], k=1
            )[0]
            n = random.randint(1, 4)
            for _ in range(n):
                rows.append(
                    {
                        "service_id": svc.id,
                        "level": level,
                        "message": _format(random.choice(LOG_TEMPLATES[level])),
                        "trace_id": f"trace-{random.randint(10000, 99999)}",
                        "timestamp": now,
                    }
                )

        if rows:
            db.bulk_insert_mappings(LogEntry, rows)
            db.commit()
            inserted = len(rows)
    finally:
        db.close()
    return {"inserted": inserted, "spike_target": spike_target}
