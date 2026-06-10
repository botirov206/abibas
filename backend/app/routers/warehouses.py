from typing import List, Optional
from fastapi import APIRouter, HTTPException
from sqlmodel import select
from pydantic import BaseModel
from app.core.deps import SessionDep, require_roles
from app.models.warehouse import Warehouse, Zone, Bin, ZoneType
from app.models.user import UserRole

router = APIRouter(tags=["warehouses"])


class WarehouseOut(BaseModel):
    id: int
    name: str
    location: str
    total_area_sqm: Optional[float]
    is_active: bool


class WarehouseCreate(BaseModel):
    name: str
    location: str
    total_area_sqm: Optional[float] = None


class ZoneOut(BaseModel):
    id: int
    warehouse_id: int
    name: str
    zone_type: str


class ZoneCreate(BaseModel):
    name: str
    zone_type: ZoneType


class BinOut(BaseModel):
    id: int
    zone_id: int
    code: str
    max_capacity: int
    current_fill: int


class BinCreate(BaseModel):
    code: str
    max_capacity: int = 1000


@router.get(
    "/warehouses",
    response_model=List[WarehouseOut],
    dependencies=[require_roles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.WAREHOUSE_OPERATOR,
    )],
)
def list_warehouses(session: SessionDep):
    warehouses = session.exec(select(Warehouse).where(Warehouse.is_active == True)).all()
    return [WarehouseOut(**w.model_dump()) for w in warehouses]


@router.post("/warehouses", response_model=WarehouseOut, dependencies=[require_roles(UserRole.ADMIN)])
def create_warehouse(body: WarehouseCreate, session: SessionDep):
    w = Warehouse(**body.model_dump())
    session.add(w)
    session.commit()
    session.refresh(w)
    return WarehouseOut(**w.model_dump())


@router.get(
    "/warehouses/{warehouse_id}/zones",
    response_model=List[ZoneOut],
    dependencies=[require_roles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.WAREHOUSE_OPERATOR,
    )],
)
def list_zones(warehouse_id: int, session: SessionDep):
    zones = session.exec(select(Zone).where(Zone.warehouse_id == warehouse_id)).all()
    return [ZoneOut(**z.model_dump()) for z in zones]


@router.post(
    "/warehouses/{warehouse_id}/zones",
    response_model=ZoneOut,
    dependencies=[require_roles(UserRole.ADMIN)],
)
def create_zone(warehouse_id: int, body: ZoneCreate, session: SessionDep):
    warehouse = session.get(Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    zone = Zone(warehouse_id=warehouse_id, **body.model_dump())
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return ZoneOut(**zone.model_dump())


@router.get(
    "/zones/{zone_id}/bins",
    response_model=List[BinOut],
    dependencies=[require_roles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.WAREHOUSE_OPERATOR,
    )],
)
def list_bins(zone_id: int, session: SessionDep):
    bins = session.exec(select(Bin).where(Bin.zone_id == zone_id)).all()
    return [BinOut(**b.model_dump()) for b in bins]


@router.post(
    "/zones/{zone_id}/bins",
    response_model=BinOut,
    dependencies=[require_roles(UserRole.ADMIN)],
)
def create_bin(zone_id: int, body: BinCreate, session: SessionDep):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    bin_ = Bin(zone_id=zone_id, **body.model_dump())
    session.add(bin_)
    session.commit()
    session.refresh(bin_)
    return BinOut(**bin_.model_dump())
