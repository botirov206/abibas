from typing import List, Optional
from fastapi import APIRouter, HTTPException
from sqlmodel import select
from pydantic import BaseModel
from app.core.deps import SessionDep, CurrentUser, require_roles
from app.models.product import Category, Supplier, Product, ProductSpec
from app.models.user import UserRole

router = APIRouter(tags=["products"])


class CategoryOut(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]


class ProductSpecOut(BaseModel):
    id: int
    product_id: int
    spec_name: str
    spec_value: str


class ProductOut(BaseModel):
    id: int
    name: str
    part_number: str
    category_id: Optional[int]
    description: Optional[str]
    unit_of_measure: str
    reorder_point: int
    reorder_qty: int
    image_url: Optional[str] = None
    is_active: bool
    specs: List[ProductSpecOut] = []


class ProductCreate(BaseModel):
    name: str
    part_number: str
    category_id: Optional[int] = None
    description: Optional[str] = None
    unit_of_measure: str = "PCS"
    reorder_point: int = 50
    reorder_qty: int = 200
    image_url: Optional[str] = None


class SpecCreate(BaseModel):
    spec_name: str
    spec_value: str


@router.get("/categories", response_model=List[CategoryOut])
def list_categories(session: SessionDep, current_user: CurrentUser):
    cats = session.exec(select(Category)).all()
    return [CategoryOut(**c.model_dump()) for c in cats]


@router.post("/categories", response_model=CategoryOut, dependencies=[require_roles(UserRole.ADMIN)])
def create_category(body: CategoryOut, session: SessionDep):
    cat = Category(name=body.name, parent_id=body.parent_id)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return CategoryOut(**cat.model_dump())


@router.get("/products", response_model=List[ProductOut])
def list_products(session: SessionDep, current_user: CurrentUser, search: Optional[str] = None):
    stmt = select(Product).where(Product.is_active == True)
    products = session.exec(stmt).all()
    if search:
        search_lower = search.lower()
        products = [p for p in products if search_lower in p.name.lower() or search_lower in p.part_number.lower()]
    result = []
    for p in products:
        specs = session.exec(select(ProductSpec).where(ProductSpec.product_id == p.id)).all()
        result.append(ProductOut(
            **p.model_dump(),
            specs=[ProductSpecOut(**s.model_dump()) for s in specs],
        ))
    return result


@router.post(
    "/products",
    response_model=ProductOut,
    dependencies=[require_roles(UserRole.ADMIN, UserRole.PROCUREMENT)],
)
def create_product(body: ProductCreate, session: SessionDep):
    existing = session.exec(select(Product).where(Product.part_number == body.part_number)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Part number already exists")
    product = Product(**body.model_dump())
    session.add(product)
    session.commit()
    session.refresh(product)
    return ProductOut(**product.model_dump(), specs=[])


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, session: SessionDep, current_user: CurrentUser):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    specs = session.exec(select(ProductSpec).where(ProductSpec.product_id == product_id)).all()
    return ProductOut(**product.model_dump(), specs=[ProductSpecOut(**s.model_dump()) for s in specs])


@router.post(
    "/products/{product_id}/specs",
    response_model=ProductSpecOut,
    dependencies=[require_roles(UserRole.ADMIN)],
)
def add_spec(product_id: int, body: SpecCreate, session: SessionDep):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    spec = ProductSpec(product_id=product_id, **body.model_dump())
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return ProductSpecOut(**spec.model_dump())
