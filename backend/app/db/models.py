import enum
from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Time,
    Text, ForeignKey, Enum as SAEnum, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class BloodTypeEnum(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class AppointmentStatusEnum(str, enum.Enum):
    scheduled = "scheduled"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class UserRoleEnum(str, enum.Enum):
    admin = "admin"
    doctor = "doctor"
    nurse = "nurse"
    receptionist = "receptionist"
    patient = "patient"


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    head_doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    doctors = relationship("Doctor", back_populates="department", foreign_keys="Doctor.department_id")
    head_doctor = relationship("Doctor", foreign_keys=[head_doctor_id], post_update=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(SAEnum(UserRoleEnum, native_enum=False), default=UserRoleEnum.receptionist, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(SAEnum(GenderEnum, native_enum=False), nullable=True)
    blood_type = Column(SAEnum(BloodTypeEnum, native_enum=False), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    medical_history = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    insurance_provider = Column(String(200), nullable=True)
    insurance_number = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    appointments = relationship("Appointment", back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    specialization = Column(String(200), nullable=False)
    license_number = Column(String(100), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    consultation_fee = Column(Float, nullable=True)
    bio = Column(Text, nullable=True)
    available_days = Column(String(200), nullable=True)  # JSON string e.g. "Mon,Tue,Wed"
    available_from = Column(Time, nullable=True)
    available_to = Column(Time, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    department = relationship("Department", back_populates="doctors", foreign_keys=[department_id])
    appointments = relationship("Appointment", back_populates="doctor")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, default=30)
    status = Column(SAEnum(AppointmentStatusEnum, native_enum=False), default=AppointmentStatusEnum.scheduled, nullable=False)
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
