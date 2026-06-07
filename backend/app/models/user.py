from enum import Enum
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    WAREHOUSE_OPERATOR = "WAREHOUSE_OPERATOR"
    PROCUREMENT = "PROCUREMENT"
    QC_INSPECTOR = "QC_INSPECTOR"
    MANAGER = "MANAGER"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str
    role: UserRole = Field(default=UserRole.WAREHOUSE_OPERATOR)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
