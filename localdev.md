# Local Development Guide

This guide documents the steps to run the Borderless Hospital Management System locally using Docker Desktop.

---

## Prerequisites

- Docker Desktop 24+
- Python 3.x (for load testing)
- Git Bash or WSL (recommended over CMD for running shell commands)

---

## 1. Create the `.env` File

Create a `.env` file in the project root with the following content:

```env
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=H0sp1talDev2024!
POSTGRES_DB=hospital_db
POSTGRES_SSL_MODE=disable
SECRET_KEY=<generate with: openssl rand -hex 32>
ENVIRONMENT=development
DEBUG=true
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:80","http://localhost:8080"]
```

> Key differences from `.env.example`:
> - `POSTGRES_SERVER` must be `postgres` (the docker-compose service name, not an RDS endpoint)
> - `POSTGRES_SSL_MODE` must be `disable`
> - No AWS credentials needed

---

## 2. Start the Application

```bash
docker compose up --build
```

This builds and starts:
- `hms-postgres` — PostgreSQL 16 database
- `hms-backend` — FastAPI backend on port 8000
- `hms-frontend` — React frontend on port 80
- `hms-proxy` — Nginx reverse proxy on port 8080

### Access the App

| URL | Description |
|-----|-------------|
| http://localhost:8080 | Full app (via nginx proxy) |
| http://localhost:8000/api/v1/docs | Swagger API docs |

### Default Login

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@12345 | System Administrator |

---

## 3. Stopping and Cleaning Up

```bash
# Stop containers (keeps data)
docker compose down

# Stop containers AND delete the database volume (full reset)
docker compose down -v
```

> Use `down -v` when you need a completely fresh database. If you just run `down`, the postgres volume persists and data is kept between restarts.

---

## 4. Rebuilding After Code Changes

If you change backend code, rebuild only the backend (faster than rebuilding everything):

```bash
docker compose up -d --build backend
```

For frontend changes:

```bash
docker compose up -d --build frontend
```

---

## 5. Viewing Logs

```bash
# All services
docker compose logs -f

# Backend only
docker logs hms-backend --tail 50

# Postgres only
docker logs hms-postgres --tail 50
```

---

## 6. Database Access (pgAdmin)

A pgAdmin service is included for browsing the database via a GUI.

### Start pgAdmin

```bash
docker compose up -d pgadmin
```

### Access pgAdmin

Open http://localhost:5050

| Field | Value |
|-------|-------|
| Email | admin@admin.com |
| Password | admin |

### Connect to the Database

1. Right-click **Servers → Register → Server**
2. **General tab** — Name: `HMS`
3. **Connection tab**:

| Field | Value |
|-------|-------|
| Host | db |
| Port | 5432 |
| Database | hospital_db |
| Username | postgres |
| Password | H0sp1talDev2024! |

### Viewing Table Data

1. Expand **Servers → HMS → Databases → hospital_db → Schemas → public → Tables**
2. Right-click a table (e.g. `patients`)
3. Click **View/Edit Data → All Rows**

---

## 7. Load Testing with Locust

### Install Locust

```bash
cd load-tests
python -m pip install locust
```

### Run with Web UI (Git Bash / WSL)

```bash
export LOAD_TEST_USERNAME=admin
export LOAD_TEST_PASSWORD=Admin@12345
python -m locust -f locustfile.py --host=http://localhost:8080
```

Open http://localhost:8089, then set:
- **Number of users**: `10` (keep low for local)
- **Spawn rate**: `2`
- Click **Start**

### Run Headless

```bash
export LOAD_TEST_USERNAME=admin
export LOAD_TEST_PASSWORD=Admin@12345
python -m locust -f locustfile.py --host=http://localhost:8080 --users=10 --spawn-rate=2 --run-time=1m --headless
```

> Keep users at 10–20 locally. The 500-user target in the README is for the AWS deployment.

> **Note:** Use `export` in Git Bash/WSL. Use `set` only in Windows CMD.

---

