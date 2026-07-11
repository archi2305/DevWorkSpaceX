import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"archive-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Archive User"
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
        "name": f"test-project-{uuid.uuid4().hex[:6]}",
        "description": "To be trashed"
    }, headers=headers)
    project = proj_resp.json()
    print(f"Project ID: {project['id']}")

    print("\n=== Trashing Project ===")
    trash_proj_resp = requests.patch(f"{BASE_URL}/projects/{project['id']}/trash", headers=headers)
    print(f"Trash Status: {trash_proj_resp.status_code}")
    assert trash_proj_resp.status_code == 200

    print("\n=== Listing Active Projects (Should not contain trashed project) ===")
    active_resp = requests.get(f"{BASE_URL}/projects", headers=headers)
    active_ids = [p["id"] for p in active_resp.json()]
    print(f"Active projects count: {len(active_ids)}")
    assert project["id"] not in active_ids

    print("\n=== Listing Trashed Projects (Should contain trashed project) ===")
    trashed_resp = requests.get(f"{BASE_URL}/projects/trash", headers=headers)
    trashed_ids = [p["id"] for p in trashed_resp.json()]
    print(f"Trashed projects: {trashed_ids}")
    assert project["id"] in trashed_ids

    print("\n=== Restoring Project from Trash ===")
    restore_resp = requests.patch(f"{BASE_URL}/projects/{project['id']}/restore-trash", headers=headers)
    print(f"Restore Status: {restore_resp.status_code}")
    assert restore_resp.status_code == 200

    print("\n=== Verifying Restored Project is back in Active List ===")
    active_resp2 = requests.get(f"{BASE_URL}/projects", headers=headers)
    active_ids2 = [p["id"] for p in active_resp2.json()]
    assert project["id"] in active_ids2

    print("\n=== Permanent Deleting Project ===")
    perm_resp = requests.delete(f"{BASE_URL}/projects/{project['id']}/permanent", headers=headers)
    print(f"Permanent Delete Status: {perm_resp.status_code}")
    assert perm_resp.status_code == 200

    print("\n🎉 Project Archive & Recovery module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
