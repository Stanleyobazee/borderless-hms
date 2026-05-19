from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, date
from app.db.models import GenderEnum, BloodTypeEnum


class PatientBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    blood_type: Optional[BloodTypeEnum] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None

    @field_validator('gender', 'blood_type', 'date_of_birth', 'email', 'phone',
                     'address', 'emergency_contact_name', 'emergency_contact_phone',
                     'medical_history', 'allergies', 'insurance_provider',
                     'insurance_number', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        return None if v == '' else v


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    blood_type: Optional[BloodTypeEnum] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    is_active: Optional[bool] = None


class PatientResponse(PatientBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    total: int
    page: int
    size: int
    patients: list[PatientResponse]
