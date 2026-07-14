import requests
import random
import string
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8001"

def random_string(length=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_tests():
    email = f"timer_{random_string()}@example.com"
    password = "SecurePassword123!"
    
    # 1. Register user
    print("=== Registering User ===")
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Time Tracker Scrum Master"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    print(f"Status: {r.status_code}")
    assert r.status_code == 201

    # 2. Login
    print("\n=== Logging In ===")
    login_data = {
        "email": email,
        "password": password
    }
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 3. Start timer
    print("\n=== Starting Timer ===")
    start_data = {
        "description": "Initial design draft wireframe"
    }
    r = requests.post(f"{BASE_URL}/time-logs/start", json=start_data, headers=headers)
    print(f"Status: {r.status_code}, Is Running: {r.json()['is_running']}")
    assert r.status_code == 201
    assert r.json()["is_running"] is True

    # 4. Stop active timer
    print("\n=== Stopping Active Timer ===")
    r = requests.post(f"{BASE_URL}/time-logs/stop", headers=headers)
    print(f"Status: {r.status_code}, Is Running: {r.json()['is_running']}, Duration: {r.json()['duration_seconds']}s")
    assert r.status_code == 200
    assert r.json()["is_running"] is False

    # 5. Log manual time entry
    print("\n=== Log Manual Entry ===")
    start_time = datetime.utcnow() - timedelta(hours=3)
    end_time = datetime.utcnow() - timedelta(hours=1)
    manual_data = {
        "start_time": start_time.isoformat() + "Z",
        "end_time": end_time.isoformat() + "Z",
        "description": "Retrospective meeting"
    }
    r = requests.post(f"{BASE_URL}/time-logs/manual", json=manual_data, headers=headers)
    print(f"Status: {r.status_code}, Duration: {r.json()['duration_seconds']}s")
    assert r.status_code == 201
    assert r.json()["duration_seconds"] == 7200 # 2 hours in seconds

    # 6. Get totals
    print("\n=== Getting Totals ===")
    r = requests.get(f"{BASE_URL}/time-logs/totals", headers=headers)
    print(f"Status: {r.status_code}, totals: {r.json()}")
    assert r.status_code == 200

    # 7. Get productivity report
    print("\n=== Getting Productivity Report ===")
    r = requests.get(f"{BASE_URL}/time-logs/report", headers=headers)
    report = r.json()
    print(f"Status: {r.status_code}, rating: {report['productivity_rating']}, hours: {report['total_logged_hours']}")
    assert r.status_code == 200
    assert report["total_logged_hours"] > 0

    print("\n🎉 All Time Tracking CRUD, timers control, and reports tests passed successfully!")

if __name__ == "__main__":
    run_tests()
