import requests
import random
import string

BASE_URL = "http://127.0.0.1:8001"

def random_string(length=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_tests():
    email = f"reporter_{random_string()}@example.com"
    password = "SecurePassword123!"
    
    # 1. Register user
    print("=== Registering User ===")
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Reports Chief Officer"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    print(f"Status: {r.status_code}")
    assert r.status_code == 201

    # 2. Login
    print("\n=== Logging In ===")
    login_data = {
        "email": email,
        "password": password
    }
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 3. Export Project Report (CSV)
    print("\n=== Exporting Project Report (CSV) ===")
    r = requests.get(f"{BASE_URL}/reports/export?type=project&format=csv", headers=headers)
    print(f"Status: {r.status_code}, Length: {len(r.content)} bytes, Content Type: {r.headers.get('Content-Type')}")
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("Content-Type")

    # 4. Export Task Report (Excel)
    print("\n=== Exporting Task Report (Excel) ===")
    r = requests.get(f"{BASE_URL}/reports/export?type=task&format=excel", headers=headers)
    print(f"Status: {r.status_code}, Length: {len(r.content)} bytes, Content Type: {r.headers.get('Content-Type')}")
    assert r.status_code == 200
    assert "application/vnd.ms-excel" in r.headers.get("Content-Type")

    # 5. Export Team Report (PDF)
    print("\n=== Exporting Team Report (PDF) ===")
    r = requests.get(f"{BASE_URL}/reports/export?type=team&format=pdf", headers=headers)
    print(f"Status: {r.status_code}, Length: {len(r.content)} bytes, Content Type: {r.headers.get('Content-Type')}")
    assert r.status_code == 200
    assert "application/pdf" in r.headers.get("Content-Type")

    print("\n🎉 All Reports generation and file exports tests passed successfully!")

if __name__ == "__main__":
    run_tests()
