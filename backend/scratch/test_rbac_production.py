import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"rbac-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User (Workspace Owner) ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "RBAC Owner"
    })
    print(f"Status: {reg_resp.status_code}")
    assert reg_resp.status_code == 201

    print("\n=== Logging In (Workspace Owner) ===")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    print("\n=== Attempting to Create Project (Should Succeed - Owner Role) ===")
    create_proj_resp = requests.post(f"{BASE_URL}/projects", json={
        "name": f"project-{uuid.uuid4().hex[:6]}",
        "description": "Owner RBAC Project"
    }, headers=headers)
    print(f"Create Project Status: {create_proj_resp.status_code}")
    assert create_proj_resp.status_code == 201

    print("\n=== Querying Workspace Members to Demote self to Viewer ===")
    members_resp = requests.get(f"{BASE_URL}/workspace/members", headers=headers)
    members = members_resp.json()
    own_member = [m for m in members if m["user"]["email"] == email][0]
    print(f"Current Role: {own_member['role']}")

    print("\n=== Demoting User to Viewer ===")
    update_role_resp = requests.patch(
        f"{BASE_URL}/workspace/members/{own_member['id']}",
        json={"role": "Viewer"},
        headers=headers
    )
    print(f"Update Role Status: {update_role_resp.status_code}")
    assert update_role_resp.status_code == 200

    print("\n=== Attempting to Create Project again (Should Fail - Viewer Role) ===")
    create_proj_resp_fail = requests.post(f"{BASE_URL}/projects", json={
        "name": f"project-{uuid.uuid4().hex[:6]}",
        "description": "Viewer RBAC Project"
    }, headers=headers)
    print(f"Create Project Status (Expected 403): {create_proj_resp_fail.status_code}")
    assert create_proj_resp_fail.status_code == 403
    print(f"Response details: {create_proj_resp_fail.json()['detail']}")

    print("\n🎉 RBAC system integration test passed successfully!")

if __name__ == "__main__":
    run_test()
