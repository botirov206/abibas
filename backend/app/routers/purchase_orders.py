from typing import List, Optional
from fastapi import APIRouter, HTTPException
from sqlmodel import select
from pydantic import BaseModel
from datetime import date
from app.core.deps import SessionDep, CurrentUser, require_roles
from app.models.purchase_order import PurchaseOrder, POItem, POStatus
from app.models.product import Product, Supplier
from app.models.user import UserRole

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])

_VIEW = (UserRole.PROCUREMENT, UserRole.ADMIN, UserRole.MANAGER)
_EDIT = (UserRole.PROCUREMENT, UserRole.ADMIN)


class POItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    part_number: str
    quantity_ordered: int
    quantity_received: int
    unit_cost: float


class POOut(BaseModel):
    id: int
    supplier_id: int
    supplier_name: str
    status: str
    expected_date: Optional[date]
    notes: Optional[str]
    created_by_id: int
    items: List[POItemOut] = []


class POItemCreate(BaseModel):
    product_id: int
    quantity_ordered: int
    unit_cost: float = 0.0


class POCreate(BaseModel):
    supplier_id: int
    expected_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[POItemCreate] = []


class ReceiveItemRequest(BaseModel):
    po_item_id: int
    quantity_received: int


def _build_po_out(po: PurchaseOrder, session) -> POOut:
    supplier = session.get(Supplier, po.supplier_id)
    items = session.exec(select(POItem).where(POItem.po_id == po.id)).all()
    item_outs = []
    for item in items:
        product = session.get(Product, item.product_id)
        item_outs.append(POItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=product.name if product else "",
            part_number=product.part_number if product else "",
            quantity_ordered=item.quantity_ordered,
            quantity_received=item.quantity_received,
            unit_cost=item.unit_cost,
        ))
    return POOut(
        id=po.id,
        supplier_id=po.supplier_id,
        supplier_name=supplier.company_name if supplier else "",
        status=po.status,
        expected_date=po.expected_date,
        notes=po.notes,
        created_by_id=po.created_by_id,
        items=item_outs,
    )


@router.get("", response_model=List[POOut], dependencies=[require_roles(*_VIEW)])
def list_pos(session: SessionDep):
    pos = session.exec(select(PurchaseOrder).order_by(PurchaseOrder.created_at.desc())).all()
    return [_build_po_out(po, session) for po in pos]


@router.post("", response_model=POOut, dependencies=[require_roles(*_EDIT)])
def create_po(body: POCreate, current_user: CurrentUser, session: SessionDep):
    po = PurchaseOrder(
        supplier_id=body.supplier_id,
        expected_date=body.expected_date,
        notes=body.notes,
        created_by_id=current_user.id,
    )
    session.add(po)
    session.commit()
    session.refresh(po)
    for item_data in body.items:
        item = POItem(po_id=po.id, **item_data.model_dump())
        session.add(item)
    session.commit()
    return _build_po_out(po, session)


@router.get("/{po_id}", response_model=POOut, dependencies=[require_roles(*_VIEW)])
def get_po(po_id: int, session: SessionDep):
    po = session.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return _build_po_out(po, session)


@router.post(
    "/{po_id}/receive",
    dependencies=[require_roles(UserRole.WAREHOUSE_OPERATOR, UserRole.ADMIN)],
)
def receive_items(po_id: int, body: List[ReceiveItemRequest], session: SessionDep):
    po = session.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    for req in body:
        item = session.get(POItem, req.po_item_id)
        if not item or item.po_id != po_id:
            raise HTTPException(status_code=404, detail=f"PO item {req.po_item_id} not found")
        item.quantity_received = min(item.quantity_ordered, item.quantity_received + req.quantity_received)
        session.add(item)

    all_items = session.exec(select(POItem).where(POItem.po_id == po_id)).all()
    if all(i.quantity_received >= i.quantity_ordered for i in all_items):
        po.status = POStatus.RECEIVED
    else:
        po.status = POStatus.PARTIALLY_RECEIVED
    session.add(po)
    session.commit()
    return {"ok": True, "new_status": po.status}
