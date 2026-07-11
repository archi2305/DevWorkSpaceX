import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"key-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "API Key Tester"
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

    print("\n=== Generating Developer API Key ===")
    create_resp = requests.post(f"{BASE_URL}/workspace/api-keys", json={
        "name": "Integration Deploy Token",
        "expires_in_days": 30,
        "scopes": ["read", "write"]
    }, headers=headers)
    key_created = create_resp.json()
    print(f"Key ID: {key_created['id']}, Raw Token: {key_created['token']}")
    assert key_created["name"] == "Integration Deploy Token"
    assert "read" in key_created["scopes"]

    print("\n=== Listing API Keys (Assert token field is NOT raw/exposed) ===")
    list_resp = requests.get(f"{BASE_URL}/workspace/api-keys", headers=headers)
    keys_list = list_resp.json()
    print(f"Keys list count: {len(keys_list)}")
    assert len(keys_list) == 1
    # Secure assert: token field is not exposed in list API!
    assert "token" not in keys_list[0]
    print(f"Prefix: {keys_list[0]['key_prefix']}, Expiry: {keys_list[0]['expires_at']}")

    print("\n=== Rotating API Key ===")
    rotate_resp = requests.post(f"{BASE_URL}/workspace/api-keys/{key_created['id']}/rotate", headers=headers)
    rotated = rotate_resp.json()
    print(f"Rotated Key ID: {rotated['id']}, New Raw Token: {rotated['token']}")
    assert rotated["token"] != key_created["token"]

    print("\n=== Revoking/Deleting API Key ===")
    del_resp = requests.delete(f"{BASE_URL}/workspace/api-keys/{key_created['id']}", headers=headers)
    print(f"Revocation Status: {del_resp.status_code}")
    assert del_resp.status_code == 204

    print("\n🎉 API Key Management module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
