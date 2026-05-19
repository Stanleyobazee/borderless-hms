from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional

KNOWN_WEAK_SECRETS = {
    "postgres",
    "password",
    "secret",
    "your-secret-key-change-in-production-use-openssl-rand-hex-32",
    "change-me-use-openssl-rand-hex-32-in-production",
}


class Settings(BaseSettings):
    PROJECT_NAME: str = "Borderless Hospital Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "hospital_db"
    POSTGRES_SSL_MODE: str = "disable"  # set to "require" for RDS

    @field_validator("POSTGRES_PASSWORD")
    @classmethod
    def postgres_password_must_be_set(cls, v: str) -> str:
        if not v or v.lower() in KNOWN_WEAK_SECRETS:
            raise ValueError(
                "POSTGRES_PASSWORD must be set to a strong value via environment variable"
            )
        return v

    @property
    def DATABASE_URL(self) -> str:
        url = (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        if self.POSTGRES_SSL_MODE != "disable":
            url += f"?sslmode={self.POSTGRES_SSL_MODE}"
        return url

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_set(cls, v: str) -> str:
        if not v or v.lower() in KNOWN_WEAK_SECRETS or len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be set to a strong random value of at least 32 characters "
                "(generate with: openssl rand -hex 32)"
            )
        return v

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    # App
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
