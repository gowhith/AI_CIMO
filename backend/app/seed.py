"""Seed the database with demo services, users, deployments, and historical logs
so a fresh `docker compose up` immediately has interesting data on the dashboard.

Idempotent — safe to run multiple times.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth.models import Role, User
from app.core.db import SessionLocal
from app.core.logging import configure_logging, get_logger
from app.core.security import hash_password
from app.deployments.models import Deployment
from app.logs.models import LogEntry
from app.services.models import Service, ServiceStatus

configure_logging()
log = get_logger(__name__)

DEMO_SERVICES = [
    ("auth-service", "Authentication & token issuance", "team-platform", 5, 60, "healthy"),
    ("payment-service", "Stripe + Coinbase payment gateway", "team-payments", 3, 60, "warning"),
    ("user-service", "User profile + preferences CRUD", "team-platform", 5, 60, "healthy"),
    ("order-service", "Order lifecycle + checkout", "team-commerce", 5, 60, "healthy"),
    ("notification-service", "Email + push + SMS dispatch", "team-growth", 5, 60, "healthy"),
    ("database-service", "Shared Postgres read replicas", "team-data", 5, 60, "healthy"),
    ("search-service", "Elasticsearch query layer", "team-data", 5, 60, "warning"),
    ("ml-inference", "Recommendation model server", "team-ml", 5, 60, "healthy"),
]

DEPLOY_VERSIONS = ["v1.2.4", "v1.2.5", "v2.0.0", "v2.0.1", "v3.1.0"]

SAMPLE_LOGS = [
    ("INFO", "Request handled successfully in {ms}ms"),
    ("INFO", "Health check OK"),
    ("INFO", "Cache hit for key user:{id}"),
    ("INFO", "Connection pool size: {n} active / {m} idle"),
    ("INFO", "Background job completed in {ms}ms"),
    ("WARNING", "Slow query: {ms}ms > p99 threshold"),
    ("WARNING", "Retry attempt {n} for downstream call"),
    ("WARNING", "Cache miss rate elevated: {pct}%"),
    ("ERROR", "Database connection timeout after 5s"),
    ("ERROR", "Failed to process transaction: insufficient funds"),
    ("ERROR", "Upstream 502 from auth-service"),
    ("CRITICAL", "Connection pool exhausted"),
]


def _maybe(db: Session, model, **filters):
    return db.query(model).filter_by(**filters).first()


def seed_users(db: Session) -> None:
    if _maybe(db, User, email="demo@aicimo.io"):
        return
    db.add(
        User(
            email="demo@aicimo.io",
            full_name="Demo Engineer",
            hashed_password=hash_password("demo1234"),
            role=Role.ADMIN.value,
        )
    )
    db.commit()
    log.info("seed_user_created", email="demo@aicimo.io")


def seed_services(db: Session) -> list[Service]:
    out: list[Service] = []
    for name, desc, owner, thresh, window, status in DEMO_SERVICES:
        svc = _maybe(db, Service, name=name)
        if not svc:
            svc = Service(
                name=name,
                description=desc,
                owner=owner,
                error_threshold=thresh,
                window_seconds=window,
                status=status,
                environment="prod",
            )
            db.add(svc)
            db.commit()
            db.refresh(svc)
            log.info("seed_service_created", name=name)
        out.append(svc)
    return out


def seed_deployments(db: Session, services: list[Service]) -> None:
    if db.query(Deployment).count() >= len(services):
        return
    now = datetime.now(timezone.utc)
    for svc in services:
        for i, ver in enumerate(random.sample(DEPLOY_VERSIONS, k=3)):
            db.add(
                Deployment(
                    service_id=svc.id,
                    version=ver,
                    commit_id=f"{random.randint(0x10000000, 0xfffffff0):08x}",
                    status="success",
                    deployed_at=now - timedelta(hours=random.randint(1, 72) + i * 6),
                )
            )
    db.commit()
    log.info("seed_deployments_created", count=len(services) * 3)


def seed_history_logs(db: Session, services: list[Service]) -> None:
    if db.query(LogEntry).count() > 100:
        return
    now = datetime.now(timezone.utc)
    rows = []
    for svc in services:
        for _ in range(80):
            level, tmpl = random.choices(
                SAMPLE_LOGS,
                weights=[5, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1],
                k=1,
            )[0]
            msg = tmpl.format(
                ms=random.randint(15, 4500),
                n=random.randint(1, 8),
                m=random.randint(2, 15),
                id=random.randint(1000, 9999),
                pct=random.randint(10, 60),
            )
            rows.append(
                {
                    "service_id": svc.id,
                    "level": level,
                    "message": msg,
                    "trace_id": f"trace-{random.randint(10000, 99999)}",
                    "timestamp": now - timedelta(seconds=random.randint(60, 3600 * 24)),
                }
            )
    if rows:
        db.bulk_insert_mappings(LogEntry, rows)
        db.commit()
        log.info("seed_logs_created", count=len(rows))


def run() -> None:
    db = SessionLocal()
    try:
        seed_users(db)
        services = seed_services(db)
        seed_deployments(db, services)
        seed_history_logs(db, services)
    finally:
        db.close()


if __name__ == "__main__":
    run()
