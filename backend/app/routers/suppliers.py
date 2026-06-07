from typing import List, Optional
from fastapi import APIRouter, HTTPException
from sqlmodel import select
from pydantic import BaseModel
from app.core.deps import SessionDep, CurrentUser, require_roles
from app.models.product import Supplier
from app.models.user import UserRole

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

_ALLOWED = (UserRole.PROCUREMENT, UserRole.ADMIN, UserRole.MANAGER)


class SupplierOut(BaseModel):
    id: int
    company_name: str
    contact_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    country: str
    lead_time_days: int
    is_active: bool


class SupplierCreate(BaseModel):
    company_name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: str = "UK"
    lead_time_days: int = 5


@router.get("", response_model=List[SupplierOut], dependencies=[require_roles(*_ALLOWED)])
def list_suppliers(session: SessionDep):
    suppliers = session.exec(select(Supplier).where(Supplier.is_active == True)).all()
    return [SupplierOut(**s.model_dump()) for s in suppliers]


@router.post("", response_model=SupplierOut, dependencies=[require_roles(UserRole.PROCUREMENT, UserRole.ADMIN)])
def create_supplier(body: SupplierCreate, session: SessionDep):
    s = Supplier(**body.model_dump())
    session.add(s)
    session.commit()
    session.refresh(s)
    return SupplierOut(**s.model_dump())


@router.get("/{supplier_id}", response_model=SupplierOut, dependencies=[require_roles(*_ALLOWED)])
def get_supplier(supplier_id: int, session: SessionDep):
    s = session.get(Supplier, supplier_id)
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return SupplierOut(**s.model_dump())
