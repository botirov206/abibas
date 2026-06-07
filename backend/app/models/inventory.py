from enum import Enum
from datetime import datetime, date, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class QualityStatus(str, Enum):
    QUARANTINE = "QUARANTINE"
    PASSED = "PASSED"
    FAILED = "FAILED"
    RELEASED = "RELEASED"


class InventoryBatch(SQLModel, table=True):
    __tablename__ = "inventory_batches"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    bin_id: int = Field(foreign_key="bins.id", index=True)
    quantity: int = Field(default=0)
    lot_number: Optional[str] = Field(default=None, max_length=50)
    received_date: date = Field(default_factory=lambda: datetime.now(timezone.utc).date())
    expiry_date: Optional[date] = None
    quality_status: QualityStatus = Field(default=QualityStatus.RELEASED)
