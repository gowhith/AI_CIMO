from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.models import Role, User
from app.core.db import get_db
from app.core.security import get_current_user, require_role
from app.services.models import Service
from app.services.schemas import ServiceCreate, ServiceOut, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceOut])
def list_services(
    db: Session = Depends(get_db), _user: User = Depends(get_current_user)
) -> list[Service]:
    return db.query(Service).order_by(Service.name).all()


@router.post("", response_model=ServiceOut, status_code=201)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(Role.ADMIN.value)),
) -> Service:
    if db.query(Service).filter(Service.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Service name already exists")
    svc = Service(**payload.model_dump())
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc


@router.get("/{service_id}", response_model=ServiceOut)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> Service:
    svc = db.get(Service, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return svc


@router.patch("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(Role.ADMIN.value)),
) -> Service:
    svc = db.get(Service, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(svc, k, v)
    db.commit()
    db.refresh(svc)
    return svc


@router.delete("/{service_id}", status_code=204)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(Role.ADMIN.value)),
) -> None:
    svc = db.get(Service, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(svc)
    db.commit()
