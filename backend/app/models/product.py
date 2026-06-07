from typing import Optional
from sqlmodel import Field, SQLModel


class Category(SQLModel, table=True):
    __tablename__ = "categories"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, unique=True)
    parent_id: Optional[int] = Field(default=None, foreign_key="categories.id")


class Supplier(SQLModel, table=True):
    __tablename__ = "suppliers"

    id: Optional[int] = Field(default=None, primary_key=True)
    company_name: str = Field(max_length=150)
    contact_name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=30)
    country: str = Field(default="UK", max_length=50)
    lead_time_days: int = Field(default=5)
    is_active: bool = Field(default=True)


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    part_number: str = Field(unique=True, index=True, max_length=50)
    category_id: Optional[int] = Field(default=None, foreign_key="categories.id")
    description: Optional[str] = Field(default=None, max_length=500)
    unit_of_measure: str = Field(default="PCS", max_length=20)
    reorder_point: int = Field(default=50)
    reorder_qty: int = Field(default=200)
    image_url: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)


class ProductSpec(SQLModel, table=True):
    __tablename__ = "product_specs"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    spec_name: str = Field(max_length=80)
    spec_value: str = Field(max_length=200)
