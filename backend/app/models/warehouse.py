from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class ZoneType(str, Enum):
    RECEIVING = "RECEIVING"
    STORAGE = "STORAGE"
    SHIPPING = "SHIPPING"
    QUARANTINE = "QUARANTINE"


class Warehouse(SQLModel, table=True):
    __tablename__ = "warehouses"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    location: str = Field(max_length=200)
    total_area_sqm: Optional[float] = None
    is_active: bool = Field(default=True)


class Zone(SQLModel, table=True):
    __tablename__ = "zones"

    id: Optional[int] = Field(default=None, primary_key=True)
    warehouse_id: int = Field(foreign_key="warehouses.id", index=True)
    name: str = Field(max_length=100)
    zone_type: ZoneType


class Bin(SQLModel, table=True):
    __tablename__ = "bins"

    id: Optional[int] = Field(default=None, primary_key=True)
    zone_id: int = Field(foreign_key="zones.id", index=True)
    code: str = Field(max_length=20, unique=True)
    max_capacity: int = Field(default=1000)
    current_fill: int = Field(default=0)
