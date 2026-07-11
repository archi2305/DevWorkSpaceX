import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"github-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "GitHub Tester"
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

    print("\n=== Testing OAuth Authorize URL ===")
    oauth_resp = requests.get(f"{BASE_URL}/github/oauth/url", headers=headers)
    print(f"Authorize URL: {oauth_resp.json()['url']}")
    assert oauth_resp.status_code == 200

    print("\n=== Testing OAuth Callback Linkage ===")
    callback_resp = requests.post(f"{BASE_URL}/github/oauth/callback", json={"code": "mock_code_123"}, headers=headers)
    print(f"Callback Status: {callback_resp.status_code} | connected to: {callback_resp.json()['username']}")
    assert callback_resp.status_code == 200

    print("\n=== Adding Repository ===")
    repo_resp = requests.post(f"{BASE_URL}/github/repositories", json={
        "name": "web-frontend",
        "full_name": "acme/web-frontend",
        "html_url": "https://github.com/acme/web-frontend"
    }, headers=headers)
    print(f"Repo Status: {repo_resp.status_code}")
    assert repo_resp.status_code == 201
    repo = repo_resp.json()

    print("\n=== Adding Pull Request ===")
    pr_resp = requests.post(f"{BASE_URL}/github/pull-requests", json={
        "repository_id": repo["id"],
        "number": 101,
        "title": "feat: update task scheduler",
        "state": "open",
        "html_url": "https://github.com/acme/web-frontend/pull/101"
    }, headers=headers)
    print(f"PR Status: {pr_resp.status_code}")
    assert pr_resp.status_code == 201
    pr = pr_resp.json()

    print("\n=== Listing Repositories ===")
    repos_resp = requests.get(f"{BASE_URL}/github/repositories", headers=headers)
    print(f"Found {len(repos_resp.json())} Repositories.")
    assert len(repos_resp.json()) >= 1

    print("\n=== Querying Branches ===")
    branches_resp = requests.get(f"{BASE_URL}/github/branches?repository_id={repo['id']}", headers=headers)
    print(f"Branches Status: {branches_resp.status_code} | Count: {len(branches_resp.json())}")
    assert branches_resp.status_code == 200

    print("\n=== Querying Commits ===")
    commits_resp = requests.get(f"{BASE_URL}/github/commits?repository_id={repo['id']}", headers=headers)
    print(f"Commits Status: {commits_resp.status_code} | Count: {len(commits_resp.json())}")
    assert commits_resp.status_code == 200

    print("\n=== Querying Issues ===")
    issues_resp = requests.get(f"{BASE_URL}/github/issues?repository_id={repo['id']}", headers=headers)
    print(f"Issues Status: {issues_resp.status_code} | Count: {len(issues_resp.json())}")
    assert issues_resp.status_code == 200

    print("\n=== Querying Deployments ===")
    deployments_resp = requests.get(f"{BASE_URL}/github/deployments?repository_id={repo['id']}", headers=headers)
    print(f"Deployments Status: {deployments_resp.status_code} | Count: {len(deployments_resp.json())}")
    assert deployments_resp.status_code == 200

    print("\n=== Simulating Webhook Payload ===")
    webhook_resp = requests.post(f"{BASE_URL}/github/webhook", json={
        "action": "opened",
        "pull_request": {
            "number": 102,
            "title": "feat: customize theme hsb values",
            "state": "open",
            "html_url": "https://github.com/acme/web-frontend/pull/102"
        },
        "repository": {
            "full_name": "acme/web-frontend"
        }
    }, headers={"X-GitHub-Event": "pull_request"})
    print(f"Webhook Status: {webhook_resp.status_code}")
    assert webhook_resp.status_code == 200

    print("\n🎉 GitHub Integration module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
