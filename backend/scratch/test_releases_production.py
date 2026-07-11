import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"release-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Release Tester"
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
        "name": "Release Sandbox Project",
        "description": "Testing releases and changelogs"
    }, headers=headers)
    project_id = proj_resp.json()["id"]

    print("\n=== Planning Release v1.0.0 (Draft) ===")
    rel_resp = requests.post(f"{BASE_URL}/releases", json={
        "project_id": project_id,
        "version": "v1.0.0",
        "title": "Initial Public Launch",
        "release_notes": "# Changelog\n* Initial feature complete\n* Bug fixes",
        "status": "Draft"
    }, headers=headers)
    print(f"Status: {rel_resp.status_code}")
    assert rel_resp.status_code == 201
    rel_id = rel_resp.json()["id"]

    print("\n=== Creating 2 Tasks ===")
    t1_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Task 1: Core release deliverable",
        "project_id": project_id
    }, headers=headers)
    t1_id = t1_resp.json()["id"]

    t2_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Task 2: Minor release fix",
        "project_id": project_id
    }, headers=headers)
    t2_id = t2_resp.json()["id"]

    print("\n=== Assigning Tasks to Release ===")
    assign_resp = requests.post(f"{BASE_URL}/releases/{rel_id}/tasks", json=[t1_id, t2_id], headers=headers)
    print(f"Status: {assign_resp.status_code}")
    assert assign_resp.status_code == 200

    print("\n=== Fetching Release Stats (0% completed expected) ===")
    stats_resp = requests.get(f"{BASE_URL}/releases/{rel_id}/stats", headers=headers)
    stats = stats_resp.json()
    print(f"Stats: {stats}")
    assert stats["total_tasks"] == 2
    assert stats["completed_tasks"] == 0
    assert stats["completion_percentage"] == 0.0

    print("\n=== Completing Task 1 ===")
    requests.patch(f"{BASE_URL}/tasks/{t1_id}", json={"status": "Done"}, headers=headers)

    print("\n=== Fetching Release Stats (50% completed expected) ===")
    stats_resp2 = requests.get(f"{BASE_URL}/releases/{rel_id}/stats", headers=headers)
    stats2 = stats_resp2.json()
    print(f"Stats: {stats2}")
    assert stats2["completed_tasks"] == 1
    assert stats2["completion_percentage"] == 50.0

    print("\n=== Completing Task 2 ===")
    requests.patch(f"{BASE_URL}/tasks/{t2_id}", json={"status": "Done"}, headers=headers)

    print("\n=== Promoting to Released Status ===")
    pub_resp = requests.patch(f"{BASE_URL}/releases/{rel_id}", json={"status": "Released"}, headers=headers)
    print(f"Status: {pub_resp.status_code}")
    assert pub_resp.status_code == 200
    assert pub_resp.json()["status"] == "Released"
    assert pub_resp.json()["released_at"] is not None

    print("\n=== Listing Releases ===")
    list_releases = requests.get(f"{BASE_URL}/releases?project_id={project_id}", headers=headers)
    print(f"Total Release Versions found: {len(list_releases.json())}")
    assert len(list_releases.json()) == 1

    print("\n🎉 Software Release Management module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
