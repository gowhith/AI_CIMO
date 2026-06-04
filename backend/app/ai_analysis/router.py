from fastapi import APIRouter, Depends, HTTPException

from app.ai_analysis.watsonx_client import ping
from app.auth.models import Role, User
from app.core.security import get_current_user, require_role
from app.simulator.traffic import is_enabled, set_enabled, trigger_spike

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/health")
def ai_health(_user: User = Depends(get_current_user)) -> dict:
    """Verify watsonx.ai reachability and credentials."""
    return ping()


sim_router = APIRouter(prefix="/simulator", tags=["simulator"])


@sim_router.get("/status")
def sim_status(_user: User = Depends(get_current_user)) -> dict:
    return {"enabled": is_enabled()}


@sim_router.post("/toggle")
def sim_toggle(
    enabled: bool, _admin: User = Depends(require_role(Role.ADMIN.value))
) -> dict:
    set_enabled(enabled)
    return {"enabled": enabled}


@sim_router.post("/spike/{service_id}")
def sim_spike(
    service_id: int, _admin: User = Depends(require_role(Role.ADMIN.value))
) -> dict:
    if service_id < 1:
        raise HTTPException(status_code=400, detail="bad service_id")
    trigger_spike(service_id)
    return {"queued_spike_for": service_id}
