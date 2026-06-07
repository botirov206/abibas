from enum import Enum
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class MovementType(str, Enum):
    RECEIVE = "RECEIVE"
    SHIP = "SHIP"
    TRANSFER = "TRANSFER"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"


class StockMovement(SQLModel, table=True):
    __tablename__ = "stock_movements"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    from_bin_id: Optional[int] = Field(default=None, foreign_key="bins.id")
    to_bin_id: Optional[int] = Field(default=None, foreign_key="bins.id")
    quantity: int
    movement_type: MovementType
    reference_po_id: Optional[int] = Field(default=None, foreign_key="purchase_orders.id")
    reference_so_id: Optional[int] = Field(default=None, foreign_key="sales_orders.id")
    performed_by_id: int = Field(foreign_key="users.id")
    notes: Optional[str] = Field(default=None, max_length=300)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
