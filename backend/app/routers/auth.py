from fastapi import APIRouter, HTTPException, status
from sqlmodel import select
from pydantic import BaseModel
from app.core.deps import SessionDep, CurrentUser
from app.core.security import verify_password, create_access_token
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    role: str


class MeResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, session: SessionDep):
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    token = create_access_token({"sub": str(user.id)})
    return LoginResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.get("/me", response_model=MeResponse)
def me(current_user: CurrentUser):
    return MeResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
    )
