import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"activity-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Activity Feed User"
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

    print("\n=== Triggering activity events ===")
    requests.post(f"{BASE_URL}/projects", json={
        "name": f"test-project-{uuid.uuid4().hex[:6]}",
        "description": "Feed Trigger"
    }, headers=headers)

    print("\n=== Fetching Activity Feed (Offset=0, Limit=5) ===")
    feed_resp = requests.get(f"{BASE_URL}/activities?offset=0&limit=5", headers=headers)
    logs = feed_resp.json()
    print(f"Status: {feed_resp.status_code}")
    assert feed_resp.status_code == 200
    print(f"Activities returned: {len(logs)}")
    assert len(logs) > 0

    print("\n🎉 Project Activity Feed integration test passed successfully!")

if __name__ == "__main__":
    run_test()
