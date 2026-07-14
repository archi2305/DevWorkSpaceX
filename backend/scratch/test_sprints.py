import requests
import random
import string

BASE_URL = "http://127.0.0.1:8001"

def random_string(length=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_tests():
    email = f"sprint_{random_string()}@example.com"
    password = "SecurePassword123!"
    
    # 1. Register
    print("=== Registering User ===")
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Sprint Scrum Master"
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
        "name": "Sprint Core Platform",
        "description": "Scrum board backing",
        "color": "purple",
        "icon": "🚀",
        "visibility": "Workspace"
    }
    r = requests.post(f"{BASE_URL}/projects", json=project_data, headers=headers)
    project_id = r.json()["id"]
    print(f"Created Project ID: {project_id}")

    # 4. Create Tasks
    print("\n=== Creating Backlog Tasks ===")
    task1_data = {"title": "Task One Backlog", "description": "Scope A", "project_id": project_id}
    task2_data = {"title": "Task Two Backlog", "description": "Scope B", "project_id": project_id}
    t1_id = requests.post(f"{BASE_URL}/tasks", json=task1_data, headers=headers).json()["id"]
    t2_id = requests.post(f"{BASE_URL}/tasks", json=task2_data, headers=headers).json()["id"]
    print(f"Task 1: {t1_id}, Task 2: {t2_id}")

    # 5. Create Sprints
    print("\n=== Creating Sprints ===")
    sprint1_data = {"project_id": project_id, "name": "Sprint 1: Bootstrap Core", "goal": "Setup base stack", "duration_weeks": 2}
    sprint2_data = {"project_id": project_id, "name": "Sprint 2: Extensibility", "goal": "Finish APIs", "duration_weeks": 1}
    s1 = requests.post(f"{BASE_URL}/sprints", json=sprint1_data, headers=headers).json()
    s2 = requests.post(f"{BASE_URL}/sprints", json=sprint2_data, headers=headers).json()
    s1_id = s1["id"]
    s2_id = s2["id"]
    print(f"Sprint 1 ID: {s1_id}, Sprint 2 ID: {s2_id}")

    # 6. List Sprints
    print("\n=== Listing Sprints ===")
    r = requests.get(f"{BASE_URL}/sprints?project_id={project_id}", headers=headers)
    print(f"Status: {r.status_code}, count: {len(r.json())}")
    assert r.status_code == 200
    assert len(r.json()) == 2

    # 7. Move Tasks into Sprint 1
    print("\n=== Moving Tasks into Sprint 1 ===")
    r = requests.post(f"{BASE_URL}/sprints/{s1_id}/tasks", json=[t1_id, t2_id], headers=headers)
    print(f"Status: {r.status_code}, Body: {r.json()}")
    assert r.status_code == 200

    # 8. Start Sprint 1 (Set Active)
    print("\n=== Starting Sprint 1 (Active) ===")
    r = requests.patch(f"{BASE_URL}/sprints/{s1_id}", json={"status": "Active"}, headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200
    active_sprint = r.json()
    print(f"Status changed to: {active_sprint['status']}, Starts: {active_sprint['start_date']}, Ends: {active_sprint['end_date']}")
    assert active_sprint["status"] == "Active"

    # 9. Verify Conflict (Cannot start Sprint 2 while Sprint 1 is active)
    print("\n=== Testing Concurrent Active Sprints Preventer ===")
    r = requests.patch(f"{BASE_URL}/sprints/{s2_id}", json={"status": "Active"}, headers=headers)
    print(f"Status (Expected 400): {r.status_code}, details: {r.json()['detail']}")
    assert r.status_code == 400

    # 10. Complete Task One
    print("\n=== Completing Task One in Sprint ===")
    requests.patch(f"{BASE_URL}/tasks/{t1_id}", json={"completed": True}, headers=headers)
    print("Task 1 set to completed.")

    # 11. Fetch Stats & Burndown
    print("\n=== Fetching Sprint 1 Statistics ===")
    r = requests.get(f"{BASE_URL}/sprints/{s1_id}/stats", headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200
    stats = r.json()
    print(f"Name: {stats['name']}, Status: {stats['status']}")
    print(f"Total tasks: {stats['total_tasks']}, Completed tasks: {stats['completed_tasks']}, Completion %: {stats['completion_percentage']}%")
    assert stats["total_tasks"] == 2
    assert stats["completed_tasks"] == 1
    assert len(stats["burndown"]) == 10

    # 12. Complete Sprint 1
    print("\n=== Completing Sprint 1 (Completed) ===")
    r = requests.patch(f"{BASE_URL}/sprints/{s1_id}", json={"status": "Completed"}, headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200
    assert r.json()["status"] == "Completed"

    # 13. Remove Task from Sprint Backlog
    print("\n=== Removing Task from Sprint Backlog ===")
    r = requests.delete(f"{BASE_URL}/sprints/{s1_id}/tasks/{t2_id}", headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200

    # 14. Delete Sprint 2
    print("\n=== Deleting Sprint 2 ===")
    r = requests.delete(f"{BASE_URL}/sprints/{s2_id}", headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 204

    print("\n🎉 All Sprint Management CRUD, conflict, and statistics API tests passed successfully!")

if __name__ == "__main__":
    run_tests()
