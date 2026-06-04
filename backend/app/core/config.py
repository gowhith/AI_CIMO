from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI-CIMO"
    environment: Literal["dev", "staging", "prod"] = "dev"
    api_v1_prefix: str = "/api/v1"
    debug: bool = False

    database_url: str = Field(
        default="postgresql+psycopg://cimo:cimo@postgres:5432/cimo",
        description="SQLAlchemy URL for PostgreSQL",
    )

    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"

    jwt_secret_key: str = "change-me-in-prod-please-use-a-real-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5173",
    ]

    # IBM watsonx.ai
    watsonx_api_key: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_model_id: str = "ibm/granite-3-8b-instruct"
    watsonx_enabled: bool = False  # set False to use stub summaries in dev

    # Incident detection defaults
    incident_default_error_threshold: int = 5
    incident_default_window_seconds: int = 60
    incident_scan_interval_seconds: int = 30

    # Notifications
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "alerts@ai-cimo.local"
    slack_webhook_url: str = ""

    # AI cost guardrails
    ai_rate_limit_per_service_seconds: int = 300  # 1 RCA per service per 5 min

    # Demo simulator
    simulator_enabled: bool = True
    simulator_interval_seconds: int = 10
    seed_on_startup: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
