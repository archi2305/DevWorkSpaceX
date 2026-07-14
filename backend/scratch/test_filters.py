import requests
import random
import string

BASE_URL = "http://127.0.0.1:8001"

def random_string(length=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_tests():
    email = f"filter_{random_string()}@example.com"
    password = "SecurePassword123!"
    
    # 1. Register
    print("=== Registering User ===")
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Filter Scrum Master"
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

    # 3. Save a filter preset
    print("\n=== Saving Filter Preset ===")
    preset_data = {
        "name": "My High Priority Backlog",
        "target_type": "Task",
        "criteria": {
            "status": "Todo,In Progress",
            "priority": "High,Urgent"
        }
    }
    r = requests.post(f"{BASE_URL}/saved-filters", json=preset_data, headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 201
    preset_id = r.json()["id"]

    # 4. List saved filter presets
    print("\n=== Listing Saved Filter Presets ===")
    r = requests.get(f"{BASE_URL}/saved-filters?target_type=Task", headers=headers)
    print(f"Status: {r.status_code}, count: {len(r.json())}")
    assert r.status_code == 200
    assert len(r.json()) == 1

    # 5. Delete saved filter preset
    print("\n=== Deleting Saved Filter Preset ===")
    r = requests.delete(f"{BASE_URL}/saved-filters/{preset_id}", headers=headers)
    print(f"Status: {r.status_code}")
    assert r.status_code == 204

    print("\n🎉 All Advanced Filters API and saved criteria presets tests passed successfully!")

if __name__ == "__main__":
    run_tests()
