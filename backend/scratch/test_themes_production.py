import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"theme-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Theme Tester"
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

    print("\n=== Fetching Active Workspace Settings ===")
    settings_resp = requests.get(f"{BASE_URL}/workspace/settings", headers=headers)
    print(f"Status: {settings_resp.status_code}")
    assert settings_resp.status_code == 200
    settings = settings_resp.json()
    print(f"Default Theme: {settings['theme']}, Accent Color: {settings['accent_color']}")
    assert settings["theme"] == "dark"
    assert settings["accent_color"] == "#5BB98C"

    print("\n=== Updating Theme to 'linear' & Accent to Blue ===")
    update_resp = requests.patch(f"{BASE_URL}/workspace/settings", json={
        "theme": "linear",
        "accent_color": "#2F80ED"
    }, headers=headers)
    print(f"Status: {update_resp.status_code}")
    assert update_resp.status_code == 200
    new_settings = update_resp.json()
    print(f"Updated Theme: {new_settings['theme']}, Accent Color: {new_settings['accent_color']}")
    assert new_settings["theme"] == "linear"
    assert new_settings["accent_color"] == "#2F80ED"

    print("\n=== Resetting Theme to 'dark' & Accent to Green ===")
    reset_resp = requests.patch(f"{BASE_URL}/workspace/settings", json={
        "theme": "dark",
        "accent_color": "#5BB98C"
    }, headers=headers)
    print(f"Reset Status: {reset_resp.status_code}")
    assert reset_resp.status_code == 200

    print("\n🎉 Workspace Theme and Accent Branding integration test passed successfully!")

if __name__ == "__main__":
    run_test()
