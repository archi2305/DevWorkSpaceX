import requests
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"auto-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Automation Tester"
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

    print("\n=== Creating Project ===")
    proj_resp = requests.post(f"{BASE_URL}/projects", json={
        "name": "Automation Sandbox",
        "description": "Trigger checks workspace"
    }, headers=headers)
    project_id = proj_resp.json()["id"]

    print("\n=== Creating Rule: Task Completed ➔ Move to Done ===")
    rule1_resp = requests.post(f"{BASE_URL}/automations", json={
        "project_id": project_id,
        "name": "Auto transition completed task",
        "trigger_event": "task_completed",
        "action_type": "move_to_done"
    }, headers=headers)
    print(f"Status: {rule1_resp.status_code}")
    assert rule1_resp.status_code == 201
    rule1_id = rule1_resp.json()["id"]

    print("\n=== Creating Rule: Due Date Passed ➔ Notify Owner ===")
    rule2_resp = requests.post(f"{BASE_URL}/automations", json={
        "project_id": project_id,
        "name": "Notify past due deadlines",
        "trigger_event": "due_date_passed",
        "action_type": "notify_owner"
    }, headers=headers)
    print(f"Status: {rule2_resp.status_code}")
    assert rule2_resp.status_code == 201
    rule2_id = rule2_resp.json()["id"]

    print("\n=== Listing Automation Rules ===")
    list_resp = requests.get(f"{BASE_URL}/automations?project_id={project_id}", headers=headers)
    print(f"Rules Count: {len(list_resp.json())}")
    assert len(list_resp.json()) == 2

    print("\n=== Creating Past Due Task ===")
    past_due_date = (datetime.utcnow() - timedelta(days=2)).isoformat() + "Z"
    task_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Overdue task action item",
        "project_id": project_id,
        "due_date": past_due_date
    }, headers=headers)
    print(f"Status: {task_resp.status_code}")
    assert task_resp.status_code == 201

    print("\n=== Triggering Due Date Checks ===")
    trig_resp = requests.post(f"{BASE_URL}/automations/trigger/due-dates?project_id={project_id}", headers=headers)
    print(f"Trigger Status: {trig_resp.status_code}")
    assert trig_resp.status_code == 200
    print(f"Processed Alerts Triggered: {trig_resp.json()['triggered_count']}")
    assert trig_resp.json()["triggered_count"] >= 1

    print("\n=== Disabling Automation Rule ===")
    patch_resp = requests.patch(f"{BASE_URL}/automations/{rule2_id}", json={
        "is_active": False
    }, headers=headers)
    print(f"Status: {patch_resp.status_code}")
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_active"] is False

    print("\n🎉 Automation Rules module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
