from fastapi import APIRouter
from sqlmodel import select, func
from pydantic import BaseModel
from typing import List
from app.core.deps import SessionDep, CurrentUser
from app.models.product import Product
from app.models.inventory import InventoryBatch, QualityStatus
from app.models.purchase_order import PurchaseOrder, POStatus
from app.models.sales_order import SalesOrder, SOStatus
from app.models.movement import StockMovement, MovementType

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class MovementSummary(BaseModel):
    movement_type: str
    count: int


class DashboardOut(BaseModel):
    total_products: int
    total_stock_units: int
    open_purchase_orders: int
    low_stock_count: int
    quarantine_batches: int
    pending_sales_orders: int
    movement_summary: List[MovementSummary]


@router.get("", response_model=DashboardOut)
def get_dashboard(session: SessionDep, current_user: CurrentUser):
    total_products = len(session.exec(select(Product).where(Product.is_active == True)).all())

    batches = session.exec(select(InventoryBatch)).all()
    total_stock = sum(b.quantity for b in batches)
    quarantine_count = sum(1 for b in batches if b.quality_status == QualityStatus.QUARANTINE)

    products = session.exec(select(Product).where(Product.is_active == True)).all()
    low_stock = 0
    for p in products:
        released = session.exec(
            select(InventoryBatch).where(
                InventoryBatch.product_id == p.id,
                InventoryBatch.quality_status == QualityStatus.RELEASED,
            )
        ).all()
        if sum(b.quantity for b in released) < p.reorder_point:
            low_stock += 1

    open_pos = len(session.exec(
        select(PurchaseOrder).where(PurchaseOrder.status.in_([POStatus.DRAFT, POStatus.SENT, POStatus.PARTIALLY_RECEIVED]))
    ).all())

    pending_sos = len(session.exec(
        select(SalesOrder).where(SalesOrder.status.in_([SOStatus.PENDING, SOStatus.PROCESSING]))
    ).all())

    movements = session.exec(select(StockMovement)).all()
    type_counts: dict = {}
    for m in movements:
        type_counts[m.movement_type] = type_counts.get(m.movement_type, 0) + 1

    movement_summary = [MovementSummary(movement_type=k, count=v) for k, v in type_counts.items()]

    return DashboardOut(
        total_products=total_products,
        total_stock_units=total_stock,
        open_purchase_orders=open_pos,
        low_stock_count=low_stock,
        quarantine_batches=quarantine_count,
        pending_sales_orders=pending_sos,
        movement_summary=movement_summary,
    )
