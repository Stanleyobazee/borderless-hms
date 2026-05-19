from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, time
from app.db.models import AppointmentStatusEnum
from app.schemas.patient import PatientResponse
from app.schemas.doctor import DoctorResponse


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    duration_minutes: int = 30
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    status: Optional[AppointmentStatusEnum] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    follow_up_date: Optional[date] = None


class AppointmentResponse(AppointmentBase):
    id: int
    status: AppointmentStatusEnum
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    follow_up_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    total: int
    page: int
    size: int
    appointments: list[AppointmentResponse]
