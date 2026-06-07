from typing import List, Optional
from fastapi import APIRouter, HTTPException
from sqlmodel import select
from pydantic import BaseModel
from app.core.deps import SessionDep, CurrentUser, require_roles
from app.core.security import hash_password
from app.models.user import User, UserRole

router = APIRouter(prefix="/users", tags=["users"])


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole = UserRole.WAREHOUSE_OPERATOR


@router.get("", response_model=List[UserOut], dependencies=[require_roles(UserRole.ADMIN)])
def list_users(session: SessionDep):
    users = session.exec(select(User)).all()
    return [UserOut(id=u.id, name=u.name, email=u.email, role=u.role, is_active=u.is_active) for u in users]


@router.post("", response_model=UserOut, dependencies=[require_roles(UserRole.ADMIN)])
def create_user(body: UserCreate, session: SessionDep):
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role, is_active=user.is_active)
