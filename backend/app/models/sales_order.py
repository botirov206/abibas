from enum import Enum
from datetime import datetime, date, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class SOStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class SalesOrder(SQLModel, table=True):
    __tablename__ = "sales_orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    customer_ref: str = Field(max_length=100)
    customer_email: Optional[str] = Field(default=None, max_length=255)
    status: SOStatus = Field(default=SOStatus.PENDING)
    ship_by_date: Optional[date] = None
    created_by_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SOItem(SQLModel, table=True):
    __tablename__ = "so_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    so_id: int = Field(foreign_key="sales_orders.id", index=True)
    product_id: int = Field(foreign_key="products.id")
    quantity: int
    unit_price: float = Field(default=0.0)
