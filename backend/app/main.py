import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.ai_analysis.router import router as ai_router
from app.ai_analysis.router import sim_router
from app.auth.router import router as auth_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.dashboard.router import router as dashboard_router
from app.deployments.router import router as deployments_router
from app.incidents.router import router as incidents_router
from app.logs.router import router as logs_router
from app.notifications.router import router as notifications_router
from app.services.router import router as services_router
from app.ws.incidents import _pubsub_loop
from app.ws.incidents import router as ws_router

configure_logging()
log = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    pubsub_task = asyncio.create_task(_pubsub_loop())
    log.info("startup", env=settings.environment, watsonx=settings.watsonx_enabled)
    yield
    pubsub_task.cancel()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AI-Powered Cloud Incident Management & Observability Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

prefix = settings.api_v1_prefix
app.include_router(auth_router, prefix=prefix)
app.include_router(services_router, prefix=prefix)
app.include_router(logs_router, prefix=prefix)
app.include_router(incidents_router, prefix=prefix)
app.include_router(deployments_router, prefix=prefix)
app.include_router(notifications_router, prefix=prefix)
app.include_router(dashboard_router, prefix=prefix)
app.include_router(ai_router, prefix=prefix)
app.include_router(sim_router, prefix=prefix)
app.include_router(ws_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": settings.app_name, "env": settings.environment}


@app.get("/")
def root() -> dict:
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
