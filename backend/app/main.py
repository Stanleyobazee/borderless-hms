import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import engine, Base
from app.api.routes import auth, patients, doctors, appointments
from app.db.models import User
from app.core.security import get_password_hash
from app.api.deps import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine, checkfirst=True)

    from app.db.database import SessionLocal
    from app.db.models import UserRoleEnum
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.is_superuser == True).first()
        if not admin:
            default_admin = User(
                username="admin",
                email="admin@borderlesshospital.com",
                first_name="System",
                last_name="Admin",
                role=UserRoleEnum.admin,
                hashed_password=get_password_hash("Admin@12345"),
                is_superuser=True,
                is_active=True,
            )
            db.add(default_admin)
            db.commit()
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patients"])
app.include_router(doctors.router, prefix=f"{settings.API_V1_STR}/doctors", tags=["Doctors"])
app.include_router(appointments.router, prefix=f"{settings.API_V1_STR}/appointments", tags=["Appointments"])


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/api/v1/stats", tags=["Statistics"])
def get_stats(current_user=Depends(get_current_user)):
    from app.db.database import SessionLocal
    from app.db.models import Patient, Doctor, Appointment, AppointmentStatusEnum
    db = SessionLocal()
    try:
        return {
            "total_patients": db.query(Patient).filter(Patient.is_active == True).count(),
            "total_doctors": db.query(Doctor).filter(Doctor.is_active == True).count(),
            "total_appointments": db.query(Appointment).count(),
            "appointments_today": db.query(Appointment).filter(
                Appointment.appointment_date == datetime.date.today()
            ).count(),
            "appointments_scheduled": db.query(Appointment).filter(
                Appointment.status == AppointmentStatusEnum.scheduled
            ).count(),
        }
    finally:
        db.close()
