import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"audit-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Audit Tester"
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

    print("\n=== Fetching Immutable Audit Logs ===")
    audit_resp = requests.get(f"{BASE_URL}/activities/audit", headers=headers)
    print(f"Status: {audit_resp.status_code}")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    print(f"Found {len(logs)} logs.")

    print("\n=== Filtering Audit Logs by Action 'Login' ===")
    filter_resp = requests.get(f"{BASE_URL}/activities/audit?action=Login", headers=headers)
    print(f"Filtered Login Logs Count: {len(filter_resp.json())}")
    assert len(filter_resp.json()) >= 1

    print("\n=== Verifying Audit Log Export (CSV) ===")
    export_resp = requests.get(f"{BASE_URL}/activities/audit/export", headers=headers)
    print(f"Status: {export_resp.status_code}")
    assert export_resp.status_code == 200
    assert "text/csv" in export_resp.headers["content-type"]
    csv_text = export_resp.text
    print("CSV Header sample:")
    print(csv_text.splitlines()[0])
    assert "Action Triggered" in csv_text

    print("\n=== Checking Immutability (Delete should fail/not exist) ===")
    # Delete requests to secure logs should return 405 or 404 since there are no delete methods on audit
    del_resp = requests.delete(f"{BASE_URL}/activities/audit", headers=headers)
    print(f"Delete method status (Expected 405/404): {del_resp.status_code}")
    assert del_resp.status_code in [404, 405]

    print("\n🎉 Secure Audit Logs module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
