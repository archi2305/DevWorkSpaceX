import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"milestone-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Milestone Tester"
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
        "name": "Milestone Sandbox Project",
        "description": "Testing releases and task counts"
    }, headers=headers)
    project_id = proj_resp.json()["id"]

    print("\n=== Creating Milestone ===")
    ms_resp = requests.post(f"{BASE_URL}/milestones", json={
        "project_id": project_id,
        "title": "Release v1.0",
        "description": "Beta launch candidate",
        "due_date": "2026-12-31T23:59:59Z",
        "status": "Active"
    }, headers=headers)
    print(f"Status: {ms_resp.status_code}")
    assert ms_resp.status_code == 201
    ms_id = ms_resp.json()["id"]

    print("\n=== Creating 2 Tasks ===")
    t1_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Task 1: Feature scope A",
        "project_id": project_id
    }, headers=headers)
    t1_id = t1_resp.json()["id"]

    t2_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Task 2: Feature scope B",
        "project_id": project_id
    }, headers=headers)
    t2_id = t2_resp.json()["id"]

    print("\n=== Assigning Tasks to Milestone ===")
    assign_resp = requests.post(f"{BASE_URL}/milestones/{ms_id}/tasks", json=[t1_id, t2_id], headers=headers)
    print(f"Status: {assign_resp.status_code}")
    assert assign_resp.status_code == 200

    print("\n=== Fetching Milestone Stats (0% completed expected) ===")
    stats_resp = requests.get(f"{BASE_URL}/milestones/{ms_id}/stats", headers=headers)
    stats = stats_resp.json()
    print(f"Stats: {stats}")
    assert stats["total_tasks"] == 2
    assert stats["completed_tasks"] == 0
    assert stats["completion_percentage"] == 0.0

    print("\n=== Completing Task 1 ===")
    requests.patch(f"{BASE_URL}/tasks/{t1_id}", json={"status": "Done"}, headers=headers)

    print("\n=== Fetching Milestone Stats (50% completed expected) ===")
    stats_resp2 = requests.get(f"{BASE_URL}/milestones/{ms_id}/stats", headers=headers)
    stats2 = stats_resp2.json()
    print(f"Stats: {stats2}")
    assert stats2["completed_tasks"] == 1
    assert stats2["completion_percentage"] == 50.0

    print("\n=== Archiving Milestone ===")
    arch_resp = requests.patch(f"{BASE_URL}/milestones/{ms_id}", json={"is_archived": True}, headers=headers)
    print(f"Status: {arch_resp.status_code}")
    assert arch_resp.status_code == 200
    assert arch_resp.json()["is_archived"] is True

    print("\n=== Listing Active Milestones (Should be 0) ===")
    list_active = requests.get(f"{BASE_URL}/milestones?project_id={project_id}&is_archived=false", headers=headers)
    print(f"Active Count: {len(list_active.json())}")
    assert len(list_active.json()) == 0

    print("\n=== Listing Archived Milestones (Should be 1) ===")
    list_archived = requests.get(f"{BASE_URL}/milestones?project_id={project_id}&is_archived=true", headers=headers)
    print(f"Archived Count: {len(list_archived.json())}")
    assert len(list_archived.json()) == 1

    print("\n🎉 Agile Milestone module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
