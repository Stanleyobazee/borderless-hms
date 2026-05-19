from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, time


class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    head_doctor_id: Optional[int] = None
    is_active: Optional[bool] = None


class DepartmentResponse(DepartmentBase):
    id: int
    head_doctor_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DoctorBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    specialization: str
    license_number: str
    department_id: Optional[int] = None
    years_of_experience: Optional[int] = None
    consultation_fee: Optional[float] = None
    bio: Optional[str] = None
    available_days: Optional[str] = None
    available_from: Optional[time] = None
    available_to: Optional[time] = None


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    department_id: Optional[int] = None
    years_of_experience: Optional[int] = None
    consultation_fee: Optional[float] = None
    bio: Optional[str] = None
    available_days: Optional[str] = None
    available_from: Optional[time] = None
    available_to: Optional[time] = None
    is_active: Optional[bool] = None


class DoctorResponse(DoctorBase):
    id: int
    is_active: bool
    department: Optional[DepartmentResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DoctorListResponse(BaseModel):
    total: int
    page: int
    size: int
    doctors: list[DoctorResponse]
