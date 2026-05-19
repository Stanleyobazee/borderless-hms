from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.db.models import UserRoleEnum


class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRoleEnum = UserRoleEnum.receptionist


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRoleEnum] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
