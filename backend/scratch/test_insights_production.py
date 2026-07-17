import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"insights-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "SecurePassword123!"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Insights Tester"
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

    print("\n=== Fetching AI Workspace Insights ===")
    insights_resp = requests.get(f"{BASE_URL}/ai/insights", headers=headers)
    print(f"Status: {insights_resp.status_code}")
    assert insights_resp.status_code == 200
    data = insights_resp.json()
    print("Insights Content:")
    print(data["insights"])
    assert "insights" in data
    assert "Active Projects" in data["insights"] or "AI Assistant" in data["insights"] or "Workspace" in data["insights"]

    print("\n🎉 AI Workspace Insights module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
