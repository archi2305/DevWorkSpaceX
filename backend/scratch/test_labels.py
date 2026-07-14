import requests
import random
import string

BASE_URL = "http://127.0.0.1:8001"

def random_string(length=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_tests():
    email = f"label_{random_string()}@example.com"
    password = "SecurePassword123!"
    
    # 1. Register
    print("=== Registering User ===")
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Label Manager Master"
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
    project_data = {
        "name": "Label Scoping Platform",
        "description": "Tagging tasks",
        "color": "blue",
        "icon": "🎨",
        "visibility": "Workspace"
    }
    r = requests.post(f"{BASE_URL}/projects", json=project_data, headers=headers)
    project_id = r.json()["id"]

    # 4. Create Labels
    print("\n=== Creating Labels ===")
    res1 = requests.post(f"{BASE_URL}/labels", json={"project_id": project_id, "name": "Bug", "color": "#EB5757"}, headers=headers)
    print("res1 status:", res1.status_code, "res1 body:", res1.json())
    l1 = res1.json()
    res2 = requests.post(f"{BASE_URL}/labels", json={"project_id": project_id, "name": "Feature", "color": "#5BB98C"}, headers=headers)
    l2 = res2.json()
    l1_id = l1["id"]
    l2_id = l2["id"]
    print(f"Created Label 1: {l1['name']}, Label 2: {l2['name']}")

    # 5. Search Labels
    print("\n=== Searching Labels ===")
    r = requests.get(f"{BASE_URL}/labels?project_id={project_id}&q=bug", headers=headers)
    print(f"Status: {r.status_code}, count: {len(r.json())}")
    assert r.status_code == 200
    assert len(r.json()) == 1

    # 6. Create Task
    print("\n=== Creating Task ===")
    task_data = {"title": "Debug Websocket Handshake", "description": "Status 500 error", "project_id": project_id}
    task = requests.post(f"{BASE_URL}/tasks", json=task_data, headers=headers).json()
    task_id = task["id"]

    # 7. Assign Labels to Task
    print("\n=== Assigning Multiple Labels to Task ===")
    r = requests.post(f"{BASE_URL}/labels/tasks/{task_id}", json=[l1_id, l2_id], headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200

    # 8. Verify Labels are Returned in Task Details
    print("\n=== Fetching Task Details and Verifying Labels List ===")
    r = requests.get(f"{BASE_URL}/tasks?project_id={project_id}", headers=headers)
    tasks_list = r.json()
    t = [tk for tk in tasks_list if tk["id"] == task_id][0]
    print(f"Task Labels returned: {len(t['labels'])}")
    assert len(t["labels"]) == 2
    assert t["labels"][0]["name"] in ["Bug", "Feature"]

    # 9. Remove Label from Task
    print("\n=== Removing single Label from Task ===")
    r = requests.delete(f"{BASE_URL}/labels/tasks/{task_id}/{l1_id}", headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200

    # 10. Verify Remaining
    r = requests.get(f"{BASE_URL}/tasks?project_id={project_id}", headers=headers)
    t = [tk for tk in r.json() if tk["id"] == task_id][0]
    print(f"Task Labels remaining: {len(t['labels'])}")
    assert len(t["labels"]) == 1

    # 11. Delete Label
    print("\n=== Deleting Label ===")
    r = requests.delete(f"{BASE_URL}/labels/{l2_id}", headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 204

    print("\n🎉 All Labels & Tags CRUD, Assignment, and Verification tests passed successfully!")

if __name__ == "__main__":
    run_tests()
