from typing import List, Optional
from fastapi import APIRouter, HTTPException
from sqlmodel import select, func
from pydantic import BaseModel
from datetime import date
from app.core.deps import SessionDep, CurrentUser, require_roles
from app.models.inventory import InventoryBatch, QualityStatus
from app.models.product import Product
from app.models.warehouse import Bin, Zone, Warehouse
from app.models.user import UserRole

router = APIRouter(tags=["inventory"])


class BatchOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    part_number: str
    bin_id: int
    bin_code: str
    zone_name: str
    warehouse_name: str
    quantity: int
    lot_number: Optional[str]
    received_date: date
    expiry_date: Optional[date]
    quality_status: str


class AlertOut(BaseModel):
    product_id: int
    name: str
    part_number: str
    total_stock: int
    reorder_point: int
    deficit: int


class AdjustRequest(BaseModel):
    product_id: int
    bin_id: int
    quantity_delta: int
    notes: Optional[str] = None


def _enrich_batch(batch: InventoryBatch, session) -> BatchOut:
    product = session.get(Product, batch.product_id)
    bin_ = session.get(Bin, batch.bin_id)
    zone = session.get(Zone, bin_.zone_id) if bin_ else None
    warehouse = session.get(Warehouse, zone.warehouse_id) if zone else None
    return BatchOut(
        id=batch.id,
        product_id=batch.product_id,
        product_name=product.name if product else "",
        part_number=product.part_number if product else "",
        bin_id=batch.bin_id,
        bin_code=bin_.code if bin_ else "",
        zone_name=zone.name if zone else "",
        warehouse_name=warehouse.name if warehouse else "",
        quantity=batch.quantity,
        lot_number=batch.lot_number,
        received_date=batch.received_date,
        expiry_date=batch.expiry_date,
        quality_status=batch.quality_status,
    )


@router.get("/inventory", response_model=List[BatchOut])
def list_inventory(
    session: SessionDep,
    current_user: CurrentUser,
    quality_status: Optional[str] = None,
    product_id: Optional[int] = None,
):
    stmt = select(InventoryBatch)
    if quality_status:
        stmt = stmt.where(InventoryBatch.quality_status == quality_status)
    if product_id:
        stmt = stmt.where(InventoryBatch.product_id == product_id)
    batches = session.exec(stmt).all()
    return [_enrich_batch(b, session) for b in batches]


@router.get("/inventory/alerts", response_model=List[AlertOut])
def inventory_alerts(session: SessionDep, current_user: CurrentUser):
    products = session.exec(select(Product).where(Product.is_active == True)).all()
    alerts = []
    for p in products:
        batches = session.exec(
            select(InventoryBatch).where(
                InventoryBatch.product_id == p.id,
                InventoryBatch.quality_status == QualityStatus.RELEASED,
            )
        ).all()
        total = sum(b.quantity for b in batches)
        if total < p.reorder_point:
            alerts.append(AlertOut(
                product_id=p.id,
                name=p.name,
                part_number=p.part_number,
                total_stock=total,
                reorder_point=p.reorder_point,
                deficit=p.reorder_point - total,
            ))
    return alerts


@router.post(
    "/inventory/adjust",
    dependencies=[require_roles(UserRole.WAREHOUSE_OPERATOR, UserRole.ADMIN)],
)
def adjust_inventory(body: AdjustRequest, session: SessionDep):
    batch = session.exec(
        select(InventoryBatch).where(
            InventoryBatch.product_id == body.product_id,
            InventoryBatch.bin_id == body.bin_id,
        )
    ).first()
    if batch:
        batch.quantity = max(0, batch.quantity + body.quantity_delta)
        session.add(batch)
    else:
        if body.quantity_delta <= 0:
            raise HTTPException(status_code=400, detail="Cannot create batch with zero/negative quantity")
        batch = InventoryBatch(
            product_id=body.product_id,
            bin_id=body.bin_id,
            quantity=body.quantity_delta,
            quality_status=QualityStatus.RELEASED,
        )
        session.add(batch)
    session.commit()
    return {"ok": True}


@router.get(
    "/quality",
    response_model=List[BatchOut],
    dependencies=[require_roles(UserRole.QC_INSPECTOR, UserRole.ADMIN, UserRole.MANAGER)],
)
def list_quarantine(session: SessionDep):
    batches = session.exec(
        select(InventoryBatch).where(InventoryBatch.quality_status == QualityStatus.QUARANTINE)
    ).all()
    return [_enrich_batch(b, session) for b in batches]


class QualityUpdate(BaseModel):
    quality_status: QualityStatus


@router.patch(
    "/quality/{batch_id}",
    dependencies=[require_roles(UserRole.QC_INSPECTOR, UserRole.ADMIN)],
)
def update_quality(batch_id: int, body: QualityUpdate, session: SessionDep):
    batch = session.get(InventoryBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch.quality_status = body.quality_status
    session.add(batch)
    session.commit()
    return {"ok": True, "new_status": body.quality_status}
