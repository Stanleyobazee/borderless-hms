"""
Borderless HMS Load Test
========================
Simulates 100,000 users/hour hitting the hospital management API.

Usage:
  export LOAD_TEST_USERNAME=admin
  export LOAD_TEST_PASSWORD=your-password

  locust -f locustfile.py --host=http://<ALB_DNS_NAME> \
         --users=500 --spawn-rate=50 --run-time=10m --headless

  Or with the web UI:
  locust -f locustfile.py --host=http://<ALB_DNS_NAME>

100,000 users/hour = ~1,667 requests/minute = ~28 requests/second
We use 500 concurrent users to achieve this throughput.

Required environment variables:
  LOAD_TEST_USERNAME  -- API username to authenticate with
  LOAD_TEST_PASSWORD  -- API password for that user
"""

import os
import random
import json
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner

# ── Credentials from environment — never hardcode these ──────────
_USERNAME = os.environ.get("LOAD_TEST_USERNAME", "")
_PASSWORD = os.environ.get("LOAD_TEST_PASSWORD", "")

if not _USERNAME or not _PASSWORD:
    raise RuntimeError(
        "LOAD_TEST_USERNAME and LOAD_TEST_PASSWORD environment variables must be "
        "set before running the load test."
    )

# ── Shared data pool (seeded during setup) ─────────────────────────
patient_ids = []
doctor_ids  = []
token_cache = {}

FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer",
               "Michael", "Linda", "William", "Barbara", "David", "Jessica",
               "Richard", "Sarah", "Joseph", "Karen", "Thomas", "Lisa"]

LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
              "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"]

SPECIALIZATIONS = ["Cardiology", "Neurology", "Orthopedics", "Pediatrics",
                   "Oncology", "Dermatology", "Psychiatry", "Radiology"]


def random_name():
    return random.choice(FIRST_NAMES), random.choice(LAST_NAMES)


class HospitalUser(HttpUser):
    """
    Simulates a hospital staff member browsing the HMS.
    Wait between 1-3 seconds between tasks — realistic think time.
    """
    wait_time = between(1, 3)
    token: str = ""

    def on_start(self):
        """Authenticate before running tasks."""
        self._login()

    def _login(self):
        resp = self.client.post("/api/v1/auth/login", json={
            "username": _USERNAME,
            "password": _PASSWORD,
        }, name="POST /auth/login")
        if resp.status_code == 200:
            self.token = resp.json()["access_token"]
            self.client.headers.update({"Authorization": f"Bearer {self.token}"})

    def _headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    # ── Read-heavy tasks (highest weight) ──────────────────────────
    @task(30)
    def view_dashboard_stats(self):
        self.client.get("/api/v1/stats", name="GET /stats")

    @task(25)
    def list_patients(self):
        page = random.randint(1, 5)
        self.client.get(f"/api/v1/patients?page={page}&size=20", name="GET /patients")

    @task(20)
    def list_doctors(self):
        self.client.get("/api/v1/doctors?page=1&size=20", name="GET /doctors")

    @task(20)
    def list_appointments(self):
        self.client.get("/api/v1/appointments?page=1&size=20", name="GET /appointments")

    @task(10)
    def get_todays_appointments(self):
        self.client.get("/api/v1/appointments/today", name="GET /appointments/today")

    @task(5)
    def get_departments(self):
        self.client.get("/api/v1/doctors/departments", name="GET /departments")

    # ── Single record fetches ─────────────────────────────────────
    @task(15)
    def get_patient_detail(self):
        if patient_ids:
            pid = random.choice(patient_ids)
            self.client.get(f"/api/v1/patients/{pid}", name="GET /patients/:id")

    @task(10)
    def get_doctor_detail(self):
        if doctor_ids:
            did = random.choice(doctor_ids)
            self.client.get(f"/api/v1/doctors/{did}", name="GET /doctors/:id")

    # ── Write tasks (lower weight — realistic ratio) ──────────────
    @task(8)
    def create_patient(self):
        first, last = random_name()
        resp = self.client.post("/api/v1/patients", json={
            "first_name": first,
            "last_name":  last,
            "email":      f"{first.lower()}.{last.lower()}.{random.randint(1000,9999)}@test.com",
            "phone":      f"+1{random.randint(2000000000, 9999999999)}",
            "gender":     random.choice(["male", "female"]),
            "blood_type": random.choice(["A+", "B+", "O+", "AB+"]),
        }, name="POST /patients")
        if resp.status_code == 201:
            patient_ids.append(resp.json()["id"])

    @task(4)
    def create_appointment(self):
        if not patient_ids or not doctor_ids:
            return
        import datetime
        future_date = (datetime.date.today() + datetime.timedelta(days=random.randint(1, 30))).isoformat()
        hour   = random.randint(8, 17)
        minute = random.choice([0, 15, 30, 45])
        self.client.post("/api/v1/appointments", json={
            "patient_id":       random.choice(patient_ids),
            "doctor_id":        random.choice(doctor_ids),
            "appointment_date": future_date,
            "appointment_time": f"{hour:02d}:{minute:02d}:00",
            "duration_minutes": 30,
            "reason":           "Routine checkup",
        }, name="POST /appointments")

    @task(3)
    def search_patients(self):
        letter = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        self.client.get(f"/api/v1/patients?search={letter}&size=20", name="GET /patients?search")

    @task(2)
    def health_check(self):
        self.client.get("/health", name="GET /health")


class HighLoadReadUser(HttpUser):
    """
    Aggressive read-only user simulating peak hour traffic bursts.
    No wait time — hammers the API continuously.
    """
    wait_time = between(0.1, 0.5)

    def on_start(self):
        resp = self.client.post("/api/v1/auth/login", json={
            "username": _USERNAME,
            "password": _PASSWORD,
        }, name="POST /auth/login [read]")
        if resp.status_code == 200:
            self.client.headers["Authorization"] = f"Bearer {resp.json()['access_token']}"

    @task(50)
    def stats(self):
        self.client.get("/api/v1/stats", name="GET /stats [burst]")

    @task(30)
    def patients(self):
        self.client.get("/api/v1/patients?size=20", name="GET /patients [burst]")

    @task(20)
    def appointments(self):
        self.client.get("/api/v1/appointments/today", name="GET /appointments/today [burst]")


# ── Setup: seed doctors and patient IDs before tests run ──────────
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("⚡ Seeding doctor IDs from the API...")
    import requests
    host = environment.host

    try:
        login = requests.post(f"{host}/api/v1/auth/login",
                              json={"username": _USERNAME, "password": _PASSWORD}, timeout=10)
        token = login.json().get("access_token", "")
        headers = {"Authorization": f"Bearer {token}"}

        # Seed a doctor if none exist
        doc_resp = requests.get(f"{host}/api/v1/doctors?size=100", headers=headers, timeout=10)
        if doc_resp.status_code == 200:
            for d in doc_resp.json().get("doctors", []):
                doctor_ids.append(d["id"])

        if not doctor_ids:
            new_doc = requests.post(f"{host}/api/v1/doctors", headers=headers, json={
                "first_name":     "Load",
                "last_name":      "Tester",
                "email":          "load.tester@hospital.com",
                "specialization": "General Practice",
                "license_number": "LT-99999",
            }, timeout=10)
            if new_doc.status_code == 201:
                doctor_ids.append(new_doc.json()["id"])

        # Seed patients
        pat_resp = requests.get(f"{host}/api/v1/patients?size=100", headers=headers, timeout=10)
        if pat_resp.status_code == 200:
            for p in pat_resp.json().get("patients", []):
                patient_ids.append(p["id"])

        print(f"✅ Seeded {len(doctor_ids)} doctors, {len(patient_ids)} patients")
    except Exception as e:
        print(f"⚠️ Seeding failed (will create data during test): {e}")
