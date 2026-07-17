import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"team-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "SecurePassword123!"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Team Lead Tester"
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

    print("\n=== Fetching Workspace Members ===")
    members_resp = requests.get(f"{BASE_URL}/workspace/members", headers=headers)
    print(f"Status: {members_resp.status_code}")
    assert members_resp.status_code == 200
    members = members_resp.json()
    print(f"Members Count: {len(members)}")
    assert len(members) >= 1

    print("\n=== Inviting Workspace Member ===")
    invite_resp = requests.post(f"{BASE_URL}/workspace/invite", json={
        "email": f"developer-{uuid.uuid4().hex[:6]}@example.com",
        "full_name": "Dev Collaborator",
        "role": "Developer"
    }, headers=headers)
    print(f"Status: {invite_resp.status_code}")
    assert invite_resp.status_code == 201
    new_member = invite_resp.json()
    new_member_id = new_member["id"]
    new_user_id = new_member["user"]["id"]
    print(f"Invited successfully. Member ID: {new_member_id}")

    print("\n=== Updating Workspace Member Role ===")
    update_role_resp = requests.patch(f"{BASE_URL}/workspace/member/{new_member_id}", json={
        "role": "Designer"
    }, headers=headers)
    print(f"Status: {update_role_resp.status_code}")
    assert update_role_resp.status_code == 200
    print(f"Updated role: {update_role_resp.json()['role']}")
    assert update_role_resp.json()["role"] == "Designer"

    print("\n=== Creating Project ===")
    proj_resp = requests.post(f"{BASE_URL}/projects", json={
        "name": "Team Sandbox Project",
        "description": "Sandbox to allocate collaborators"
    }, headers=headers)
    project_id = proj_resp.json()["id"]

    print("\n=== Assigning Member to Project ===")
    assign_proj_resp = requests.post(f"{BASE_URL}/workspace/projects/{project_id}/members", json={
        "user_id": new_user_id
    }, headers=headers)
    print(f"Status: {assign_proj_resp.status_code}")
    assert assign_proj_resp.status_code == 200

    print("\n=== Removing Member from Project ===")
    remove_proj_resp = requests.delete(f"{BASE_URL}/workspace/projects/{project_id}/members/{new_user_id}", headers=headers)
    print(f"Status: {remove_proj_resp.status_code}")
    assert remove_proj_resp.status_code == 204

    print("\n=== Fetching Profile, Workload, and Activities ===")
    profile_resp = requests.get(f"{BASE_URL}/workspace/member/{new_member_id}/profile", headers=headers)
    print(f"Status: {profile_resp.status_code}")
    assert profile_resp.status_code == 200
    profile = profile_resp.json()
    print(f"Member Full Name: {profile['full_name']}")
    print(f"Assigned Projects: {profile['assigned_projects']}")
    print(f"Workload Task Count: {profile['tasks_count']}")
    
    print("\n=== Removing Member from Workspace ===")
    remove_member_resp = requests.delete(f"{BASE_URL}/workspace/member/{new_member_id}", headers=headers)
    print(f"Status: {remove_member_resp.status_code}")
    assert remove_member_resp.status_code == 204

    print("\n🎉 Workspace and Project Team Management tests passed successfully!")

if __name__ == "__main__":
    run_test()
