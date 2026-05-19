from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from app.db.database import get_db
from app.db.models import Doctor, Department, User
from app.schemas.doctor import (
    DoctorCreate, DoctorUpdate, DoctorResponse, DoctorListResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse
)
from app.api.deps import get_current_user

router = APIRouter(redirect_slashes=False)


# Department endpoints
@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Department).filter(Department.is_active == True).all()


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Department).filter(Department.name == dept_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists",
        )
    dept = Department(**dept_data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


# Doctor endpoints
@router.get("", response_model=DoctorListResponse)
def list_doctors(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=1000),
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    specialization: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Doctor).options(joinedload(Doctor.department)).filter(Doctor.is_active == True)

    if search:
        query = query.filter(
            or_(
                Doctor.first_name.ilike(f"%{search}%"),
                Doctor.last_name.ilike(f"%{search}%"),
                Doctor.specialization.ilike(f"%{search}%"),
                Doctor.email.ilike(f"%{search}%"),
            )
        )
    if department_id:
        query = query.filter(Doctor.department_id == department_id)
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

    total = query.count()
    doctors = query.offset((page - 1) * size).limit(size).all()

    return {"total": total, "page": page, "size": size, "doctors": doctors}


@router.post("", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Doctor).filter(
        (Doctor.email == doctor_data.email) | (Doctor.license_number == doctor_data.license_number)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor with this email or license number already exists",
        )

    doctor = Doctor(**doctor_data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doctor = db.query(Doctor).options(joinedload(Doctor.department)).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    doctor_data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    update_data = doctor_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    doctor.is_active = False
    db.commit()
