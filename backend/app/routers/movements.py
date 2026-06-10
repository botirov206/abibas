from typing import List, Optional
from fastapi import APIRouter
from sqlmodel import select
from pydantic import BaseModel
from datetime import datetime
from app.core.deps import SessionDep, CurrentUser, require_roles
from app.models.movement import StockMovement, MovementType
from app.models.product import Product
from app.models.warehouse import Bin
from app.models.user import User, UserRole

router = APIRouter(prefix="/movements", tags=["movements"])


class MovementOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    part_number: str
    from_bin_code: Optional[str]
    to_bin_code: Optional[str]
    quantity: int
    movement_type: str
    reference_po_id: Optional[int]
    reference_so_id: Optional[int]
    performed_by: str
    notes: Optional[str]
    created_at: datetime


class MovementCreate(BaseModel):
    product_id: int
    from_bin_id: Optional[int] = None
    to_bin_id: Optional[int] = None
    quantity: int
    movement_type: MovementType
    reference_po_id: Optional[int] = None
    reference_so_id: Optional[int] = None
    notes: Optional[str] = None


@router.get(
    "",
    response_model=List[MovementOut],
    dependencies=[require_roles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.WAREHOUSE_OPERATOR,
    )],
)
def list_movements(session: SessionDep, limit: int = 50):
    movements = session.exec(
        select(StockMovement).order_by(StockMovement.created_at.desc()).limit(limit)
    ).all()
    result = []
    for m in movements:
        product = session.get(Product, m.product_id)
        from_bin = session.get(Bin, m.from_bin_id) if m.from_bin_id else None
        to_bin = session.get(Bin, m.to_bin_id) if m.to_bin_id else None
        performed_by = session.get(User, m.performed_by_id)
        result.append(MovementOut(
            id=m.id,
            product_id=m.product_id,
            product_name=product.name if product else "",
            part_number=product.part_number if product else "",
            from_bin_code=from_bin.code if from_bin else None,
            to_bin_code=to_bin.code if to_bin else None,
            quantity=m.quantity,
            movement_type=m.movement_type,
            reference_po_id=m.reference_po_id,
            reference_so_id=m.reference_so_id,
            performed_by=performed_by.name if performed_by else "",
            notes=m.notes,
            created_at=m.created_at,
        ))
    return result


@router.post(
    "",
    response_model=MovementOut,
    dependencies=[require_roles(UserRole.WAREHOUSE_OPERATOR, UserRole.ADMIN)],
)
def create_movement(body: MovementCreate, current_user: CurrentUser, session: SessionDep):
    movement = StockMovement(**body.model_dump(), performed_by_id=current_user.id)
    session.add(movement)
    session.commit()
    session.refresh(movement)

    product = session.get(Product, movement.product_id)
    from_bin = session.get(Bin, movement.from_bin_id) if movement.from_bin_id else None
    to_bin = session.get(Bin, movement.to_bin_id) if movement.to_bin_id else None
    return MovementOut(
        id=movement.id,
        product_id=movement.product_id,
        product_name=product.name if product else "",
        part_number=product.part_number if product else "",
        from_bin_code=from_bin.code if from_bin else None,
        to_bin_code=to_bin.code if to_bin else None,
        quantity=movement.quantity,
        movement_type=movement.movement_type,
        reference_po_id=movement.reference_po_id,
        reference_so_id=movement.reference_so_id,
        performed_by=current_user.name,
        notes=movement.notes,
        created_at=movement.created_at,
    )
