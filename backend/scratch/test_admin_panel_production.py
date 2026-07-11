import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"admin-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Admin Panel Tester"
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

    print("\n=== Querying Workspace Members (Users tab) ===")
    members_resp = requests.get(f"{BASE_URL}/team", headers=headers)
    print(f"Users Count: {len(members_resp.json())}")
    assert members_resp.status_code == 200

    print("\n=== Querying Projects (Projects tab) ===")
    projects_resp = requests.get(f"{BASE_URL}/projects", headers=headers)
    print(f"Projects Count: {len(projects_resp.json())}")
    assert projects_resp.status_code == 200

    print("\n=== Querying File Assets (Storage tab) ===")
    files_resp = requests.get(f"{BASE_URL}/files", headers=headers)
    print(f"Files Count: {len(files_resp.json())}")
    assert files_resp.status_code == 200

    print("\n=== Querying Workspace Config (Branding tab) ===")
    settings_resp = requests.get(f"{BASE_URL}/workspace/settings", headers=headers)
    print(f"Branding Settings Loaded: {settings_resp.json()['name']}")
    assert settings_resp.status_code == 200

    print("\n=== Querying Audit Logs (Audit tab) ===")
    audit_resp = requests.get(f"{BASE_URL}/activities/audit", headers=headers)
    print(f"Audit Logs Count: {len(audit_resp.json())}")
    assert audit_resp.status_code == 200

    print("\n🎉 Admin Panel integration test passed successfully!")

if __name__ == "__main__":
    run_test()
