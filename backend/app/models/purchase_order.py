from enum import Enum
from datetime import datetime, date, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class POStatus(str, Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


class PurchaseOrder(SQLModel, table=True):
    __tablename__ = "purchase_orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    supplier_id: int = Field(foreign_key="suppliers.id", index=True)
    status: POStatus = Field(default=POStatus.DRAFT)
    expected_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=500)
    created_by_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class POItem(SQLModel, table=True):
    __tablename__ = "po_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    po_id: int = Field(foreign_key="purchase_orders.id", index=True)
    product_id: int = Field(foreign_key="products.id")
    quantity_ordered: int
    quantity_received: int = Field(default=0)
    unit_cost: float = Field(default=0.0)
