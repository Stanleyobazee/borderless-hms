from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import Optional
from datetime import date
from app.db.database import get_db
from app.db.models import Appointment, Patient, Doctor, User, AppointmentStatusEnum
from app.schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse, AppointmentListResponse
)
from app.api.deps import get_current_user

router = APIRouter(redirect_slashes=False)


@router.get("", response_model=AppointmentListResponse)
def list_appointments(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    status: Optional[AppointmentStatusEnum] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor),
    )

    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if status:
        query = query.filter(Appointment.status == status)
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)

    query = query.order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())

    total = query.count()
    appointments = query.offset((page - 1) * size).limit(size).all()

    return {"total": total, "page": page, "size": size, "appointments": appointments}


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appt_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == appt_data.patient_id, Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == appt_data.doctor_id, Doctor.is_active == True).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    conflict = db.query(Appointment).filter(
        and_(
            Appointment.doctor_id == appt_data.doctor_id,
            Appointment.appointment_date == appt_data.appointment_date,
            Appointment.appointment_time == appt_data.appointment_time,
            Appointment.status.notin_([AppointmentStatusEnum.cancelled, AppointmentStatusEnum.no_show]),
        )
    ).first()

    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Doctor already has an appointment at this date and time",
        )

    appointment = Appointment(**appt_data.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor),
    ).filter(Appointment.id == appointment.id).first()


@router.get("/today", response_model=AppointmentListResponse)
def get_today_appointments(
    doctor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import date as today_date
    today = today_date.today()
    query = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor),
    ).filter(Appointment.appointment_date == today)

    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)

    appointments = query.order_by(Appointment.appointment_time).all()
    return {"total": len(appointments), "page": 1, "size": len(appointments), "appointments": appointments}


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor),
    ).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appt_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    update_data = appt_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)

    return db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor),
    ).filter(Appointment.id == appointment_id).first()


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    appointment.status = AppointmentStatusEnum.cancelled
    db.commit()
