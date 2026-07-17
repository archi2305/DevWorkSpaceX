import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"profile-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "SecurePassword123!"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Original Name"
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

    print("\n=== Updating User Profile Settings ===")
    update_resp = requests.put(f"{BASE_URL}/users/me/profile", json={
        "full_name": "Updated Profile Name",
        "bio": "Senior Dev working on Antigravity solutions.",
        "skills": ["Python", "FastAPI", "Next.js"],
        "timezone": "Asia/Kolkata"
    }, headers=headers)
    user_updated = update_resp.json()
    print(f"Updated Name: {user_updated['full_name']}, Bio: {user_updated['bio']}, Timezone: {user_updated['timezone']}")
    assert user_updated["full_name"] == "Updated Profile Name"
    assert user_updated["timezone"] == "Asia/Kolkata"
    assert len(user_updated["skills"]) == 3

    print("\n=== Fetching Logged In User Profile Payload ===")
    profile_resp = requests.get(f"{BASE_URL}/users/me/profile", headers=headers)
    profile = profile_resp.json()
    print(f"Payload keys: {list(profile.keys())}")
    print(f"User in payload: {profile['user']['full_name']}")
    assert profile["user"]["full_name"] == "Updated Profile Name"
    assert "assigned_tasks" in profile
    assert "projects" in profile
    assert "recent_activity" in profile

    print("\n🎉 User Profiles module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
