import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"int-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Integration Tester"
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

    print("\n=== Configuring GitHub Integration ===")
    gh_resp = requests.post(f"{BASE_URL}/integrations", json={
        "provider": "GitHub",
        "config": {"repository": "google/antigravity"}
    }, headers=headers)
    print(f"GitHub Integration Status: {gh_resp.status_code}")
    assert gh_resp.status_code == 201
    gh_data = gh_resp.json()
    assert gh_data["provider"] == "GitHub"
    assert gh_data["config"]["repository"] == "google/antigravity"

    print("\n=== Configuring Slack Incoming Webhook ===")
    slack_resp = requests.post(f"{BASE_URL}/integrations", json={
        "provider": "Slack",
        "config": {"webhook_url": "https://example.com/slack-mock-incoming-webhook"}
    }, headers=headers)
    print(f"Slack Integration Status: {slack_resp.status_code}")
    assert slack_resp.status_code == 201

    print("\n=== Listing Workspace Integrations ===")
    list_resp = requests.get(f"{BASE_URL}/integrations", headers=headers)
    ints = list_resp.json()
    print(f"Integrations List Count: {len(ints)}")
    assert len(ints) == 2

    print("\n=== Modifying Integration Config ===")
    update_resp = requests.put(f"{BASE_URL}/integrations/{gh_data['id']}", json={
        "status": "Disabled",
        "config": {"repository": "google/antigravity-edited"}
    }, headers=headers)
    print(f"Update Status: {update_resp.status_code}")
    assert update_resp.status_code == 200
    updated_gh = update_resp.json()
    assert updated_gh["status"] == "Disabled"
    assert updated_gh["config"]["repository"] == "google/antigravity-edited"

    print("\n=== Triggering Mock OAuth Callback Exchange ===")
    oauth_resp = requests.post(f"{BASE_URL}/integrations/oauth-callback", json={
        "provider": "Google Calendar",
        "code": "auth_code_gcal_12345"
    }, headers=headers)
    print(f"OAuth Callback Status: {oauth_resp.status_code}")
    assert oauth_resp.status_code == 200
    oauth_data = oauth_resp.json()
    print(f"OAuth Detail: {oauth_data['detail']}")
    assert oauth_data["status"] == "success"
    assert "access_token" in oauth_data["credentials"]

    print("\n=== Deleting/Disconnecting Integration ===")
    del_resp = requests.delete(f"{BASE_URL}/integrations/{gh_data['id']}", headers=headers)
    print(f"Deletion Status: {del_resp.status_code}")
    assert del_resp.status_code == 204

    print("\n🎉 Modular Workspace Integrations integration test passed successfully!")

if __name__ == "__main__":
    run_test()
