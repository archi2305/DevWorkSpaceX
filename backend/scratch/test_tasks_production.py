import requests
import random
import string

BASE_URL = "http://127.0.0.1:8001"

def random_string(length=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_tests():
    email = f"tasker_{random_string()}@example.com"
    password = "SecurePassword123!"
    
    # 1. Register user
    print("=== Registering User ===")
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Task Production Tester"
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

    # 3. Create Project
    print("\n=== Creating Project ===")
    proj_data = {
        "name": f"Project {random_string()}",
        "description": "Verification of Task Extensions"
    }
    r = requests.post(f"{BASE_URL}/projects", json=proj_data, headers=headers)
    project_id = r.json()["id"]
    print(f"Project Created. ID: {project_id}")

    # 4. Create Task with Story Points, Estimations, and Attachments
    print("\n=== Creating Production Task ===")
    task_data = {
        "title": "Build File Exporter Service",
        "description": "Handle large CSV binary conversions",
        "status": "Todo",
        "priority": "high",
        "project_id": project_id,
        "story_points": 8,
        "estimated_time": 16,
        "attachments": [{"name": "spec.pdf", "url": "https://example.com/spec.pdf"}]
    }
    r = requests.post(f"{BASE_URL}/tasks", json=task_data, headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 201
    res_task = r.json()
    assert res_task["story_points"] == 8
    assert res_task["estimated_time"] == 16
    assert len(res_task["attachments"]) == 1
    task_id = res_task["id"]
    print(f"Task Created. ID: {task_id}")

    # 5. Duplicate Task
    print("\n=== Duplicating Task ===")
    r = requests.post(f"{BASE_URL}/tasks/{task_id}/duplicate", headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 201
    dup_task = r.json()
    assert dup_task["title"] == "Build File Exporter Service Copy"
    assert dup_task["story_points"] == 8
    dup_id = dup_task["id"]
    print(f"Duplicated Task. ID: {dup_id}")

    # 6. Archive Task
    print("\n=== Archiving Task ===")
    r = requests.post(f"{BASE_URL}/tasks/{dup_id}/archive", headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200
    assert r.json()["is_archived"] is True

    # 7. Query Non-Archived Tasks
    print("\n=== Fetching Active Tasks ===")
    r = requests.get(f"{BASE_URL}/tasks?project_id={project_id}&is_archived=false", headers=headers)
    tasks_list = r.json()
    print(f"Active tasks count: {len(tasks_list)}")
    assert len(tasks_list) == 1 # The duplicated one is archived
    assert tasks_list[0]["id"] == task_id

    # 8. Restore Task
    print("\n=== Restoring Task ===")
    r = requests.post(f"{BASE_URL}/tasks/{dup_id}/restore", headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200
    assert r.json()["is_archived"] is False

    # 9. Query Tasks List again
    r = requests.get(f"{BASE_URL}/tasks?project_id={project_id}&is_archived=false", headers=headers)
    assert len(r.json()) == 2
    print("Restore confirmed. Active tasks count is back to 2.")

    print("\n🎉 All production-ready Tasks, duplicate, archive, restore, and metadata fields tests passed successfully!")

if __name__ == "__main__":
    run_tests()
