"""Shared pytest fixtures. Uses an in-memory SQLite DB so tests don't need Postgres."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("WATSONX_ENABLED", "false")

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import Base, get_db
from app.main import app
from app import models  # noqa: F401 — register models


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(eng)
    return eng


@pytest.fixture
def db_session(engine) -> Generator[Session, None, None]:
    Session_ = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    s = Session_()
    try:
        yield s
    finally:
        s.rollback()
        for t in reversed(Base.metadata.sorted_tables):
            s.execute(t.delete())
        s.commit()
        s.close()


@pytest.fixture
def client(db_session) -> Generator[TestClient, None, None]:
    def _override():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _register_and_login(client: TestClient, email: str, role: str = "admin") -> str:
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": "T", "role": role},
    )
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return r.json()["access_token"]


@pytest.fixture
def admin_token(client) -> str:
    return _register_and_login(client, "admin@test.com", "admin")


@pytest.fixture
def admin_headers(admin_token) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}
