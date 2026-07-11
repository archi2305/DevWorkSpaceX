import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"kanban-test-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Kanban Tester"
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
        "name": "Kanban Test Board",
        "description": "Dynamic Columns Board Integration Test"
    }, headers=headers)
    print(f"Status: {proj_resp.status_code}")
    assert proj_resp.status_code == 201
    project = proj_resp.json()
    project_id = project["id"]
    print(f"Project Created. ID: {project_id}")
    
    # Check default columns
    cols = project.get("kanban_columns")
    print(f"Default Columns: {cols}")
    assert cols is not None
    assert len(cols) == 4
    assert cols[0]["id"] == "Todo"

    print("\n=== Adding Custom Column (Column CRUD) ===")
    cols.append({"id": "qa-verify", "title": "QA Verification", "taskIds": []})
    update_resp = requests.put(f"{BASE_URL}/projects/{project_id}", json={
        "kanban_columns": cols
    }, headers=headers)
    print(f"Status: {update_resp.status_code}")
    assert update_resp.status_code == 200
    updated_project = update_resp.json()
    print(f"Updated columns list: {updated_project.get('kanban_columns')}")
    assert len(updated_project.get("kanban_columns")) == 5

    print("\n=== Creating Task ===")
    task_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Drag-and-Drop Ticket",
        "status": "Todo",
        "priority": "High",
        "project_id": project_id
    }, headers=headers)
    print(f"Status: {task_resp.status_code}")
    assert task_resp.status_code == 201
    task = task_resp.json()
    task_id = task["id"]

    print("\n=== Simulating Task Move to Custom Column (PATCH /tasks/{id}) ===")
    patch_resp = requests.patch(f"{BASE_URL}/tasks/{task_id}", json={
        "status": "qa-verify"
    }, headers=headers)
    print(f"Status: {patch_resp.status_code}")
    assert patch_resp.status_code == 200
    patched_task = patch_resp.json()
    print(f"Patched Task Status: {patched_task['status']}")
    assert patched_task["status"] == "qa-verify"

    print("\n=== Checking Project Progress ===")
    get_proj = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
    print(f"Project Progress: {get_proj.json()['progress']}%")

    print("\n🎉 Kanban dynamic columns integration test passed successfully!")

if __name__ == "__main__":
    run_test()
