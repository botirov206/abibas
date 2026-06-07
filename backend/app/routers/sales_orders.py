from typing import List, Optional
from fastapi import APIRouter, HTTPException
from sqlmodel import select
from pydantic import BaseModel
from datetime import date
from app.core.deps import SessionDep, CurrentUser, require_roles
from app.models.sales_order import SalesOrder, SOItem, SOStatus
from app.models.product import Product
from app.models.user import UserRole

router = APIRouter(prefix="/sales-orders", tags=["sales-orders"])

_VIEW = (UserRole.ADMIN, UserRole.MANAGER)


class SOItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    part_number: str
    quantity: int
    unit_price: float


class SOOut(BaseModel):
    id: int
    customer_ref: str
    customer_email: Optional[str]
    status: str
    ship_by_date: Optional[date]
    created_by_id: int
    items: List[SOItemOut] = []


class SOItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float = 0.0


class SOCreate(BaseModel):
    customer_ref: str
    customer_email: Optional[str] = None
    ship_by_date: Optional[date] = None
    items: List[SOItemCreate] = []


class SOStatusUpdate(BaseModel):
    status: SOStatus


def _build_so_out(so: SalesOrder, session) -> SOOut:
    items = session.exec(select(SOItem).where(SOItem.so_id == so.id)).all()
    item_outs = []
    for item in items:
        product = session.get(Product, item.product_id)
        item_outs.append(SOItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=product.name if product else "",
            part_number=product.part_number if product else "",
            quantity=item.quantity,
            unit_price=item.unit_price,
        ))
    return SOOut(
        id=so.id,
        customer_ref=so.customer_ref,
        customer_email=so.customer_email,
        status=so.status,
        ship_by_date=so.ship_by_date,
        created_by_id=so.created_by_id,
        items=item_outs,
    )


@router.get("", response_model=List[SOOut], dependencies=[require_roles(*_VIEW)])
def list_sos(session: SessionDep):
    sos = session.exec(select(SalesOrder).order_by(SalesOrder.created_at.desc())).all()
    return [_build_so_out(so, session) for so in sos]


@router.post("", response_model=SOOut, dependencies=[require_roles(UserRole.ADMIN)])
def create_so(body: SOCreate, current_user: CurrentUser, session: SessionDep):
    so = SalesOrder(
        customer_ref=body.customer_ref,
        customer_email=body.customer_email,
        ship_by_date=body.ship_by_date,
        created_by_id=current_user.id,
    )
    session.add(so)
    session.commit()
    session.refresh(so)
    for item_data in body.items:
        item = SOItem(so_id=so.id, **item_data.model_dump())
        session.add(item)
    session.commit()
    return _build_so_out(so, session)


@router.patch("/{so_id}/status", dependencies=[require_roles(UserRole.ADMIN)])
def update_so_status(so_id: int, body: SOStatusUpdate, session: SessionDep):
    so = session.get(SalesOrder, so_id)
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found")
    so.status = body.status
    session.add(so)
    session.commit()
    return {"ok": True, "new_status": so.status}
