import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"cicd-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "CICD Tester"
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

    print("\n=== Adding Repository ===")
    repo_resp = requests.post(f"{BASE_URL}/github/repositories", json={
        "name": "api-service",
        "full_name": "acme/api-service",
        "html_url": "https://github.com/acme/api-service"
    }, headers=headers)
    print(f"Repo Status: {repo_resp.status_code}")
    assert repo_resp.status_code == 201
    repo = repo_resp.json()

    print("\n=== Fetching workflow runs (Builds) ===")
    runs_resp = requests.get(f"{BASE_URL}/github/workflow-runs?repository_id={repo['id']}", headers=headers)
    print(f"Runs Count: {len(runs_resp.json())}")
    assert len(runs_resp.json()) >= 2
    first_run = runs_resp.json()[0]
    print(f"First run number: {first_run['run_number']} | Status: {first_run['status']} | Conclusion: {first_run['conclusion']}")

    print("\n=== Webhook Event: workflow_run Update ===")
    webhook_resp = requests.post(f"{BASE_URL}/github/webhook", json={
        "action": "completed",
        "workflow_run": {
            "run_number": 206,
            "event": "push",
            "status": "completed",
            "conclusion": "success",
            "html_url": "https://github.com/acme/api-service/actions/runs/206"
        },
        "repository": {
            "full_name": "acme/api-service"
        }
    }, headers={"X-GitHub-Event": "workflow_run"})
    print(f"Webhook response status: {webhook_resp.status_code}")
    assert webhook_resp.status_code == 200

    print("\n🎉 CI/CD Actions Cockpit integration test passed successfully!")

if __name__ == "__main__":
    run_test()
