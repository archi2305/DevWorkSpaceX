import requests
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"recur-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Recurring User"
    })
    print(f"Status: {reg_resp.status_code}")
    assert reg_resp.status_code == 201

    print("\n=== Logging In ===")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # Create recurrence set in the past (to trigger auto generation instantly!)
    past_time = (datetime.utcnow() - timedelta(minutes=5)).isoformat() + "Z"

    print("\n=== Creating Recurring Task Config (Pattern: Daily) ===")
    cfg_resp = requests.post(f"{BASE_URL}/recurring-tasks", json={
        "title": "Automated Database Backup",
        "description": "Daily backup automation test",
        "recurrence_pattern": "Daily",
        "recurrence_interval": 1,
        "next_run_at": past_time
    }, headers=headers)
    config = cfg_resp.json()
    print(f"Created Config: {config['title']} (ID: {config['id']}), Next Run At: {config['next_run_at']}")
    assert config["recurrence_pattern"] == "Daily"

    print("\n=== Checking Recurrence History (Should contain one 'Generated' record) ===")
    hist_resp = requests.get(f"{BASE_URL}/recurring-tasks/{config['id']}/history", headers=headers)
    history = hist_resp.json()
    print(f"History logs count: {len(history)}")
    assert len(history) == 1
    assert history[0]["status"] == "Generated"

    print("\n=== Pausing task recurrence ===")
    pause_resp = requests.patch(f"{BASE_URL}/recurring-tasks/{config['id']}/pause", headers=headers)
    paused = pause_resp.json()
    print(f"Is Active: {paused['is_active']}")
    assert paused["is_active"] is False

    print("\n=== Resuming task recurrence ===")
    resume_resp = requests.patch(f"{BASE_URL}/recurring-tasks/{config['id']}/resume", headers=headers)
    resumed = resume_resp.json()
    print(f"Is Active: {resumed['is_active']}")
    assert resumed["is_active"] is True

    print("\n=== Skipping next run ===")
    skip_resp = requests.patch(f"{BASE_URL}/recurring-tasks/{config['id']}/skip", headers=headers)
    skipped = skip_resp.json()
    print(f"New Next Run At: {skipped['next_run_at']}")

    print("\n=== Checking Recurrence History again (Should contain a 'Skipped' log) ===")
    hist_resp2 = requests.get(f"{BASE_URL}/recurring-tasks/{config['id']}/history", headers=headers)
    history2 = hist_resp2.json()
    print(f"Updated History logs count: {len(history2)}")
    assert len(history2) == 2
    assert any(h["status"] == "Skipped" for h in history2)

    print("\n🎉 Task Recurrence scheduling module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
