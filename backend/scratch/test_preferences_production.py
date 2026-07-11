import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"pref-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Preferences Tester"
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

    print("\n=== Fetching Preferences (Should auto-seed defaults) ===")
    get_resp = requests.get(f"{BASE_URL}/users/me/preferences", headers=headers)
    prefs = get_resp.json()
    print(f"Theme: {prefs['theme']}, Accent: {prefs['accent_color']}, Lang: {prefs['language']}")
    assert prefs["theme"] == "System"
    assert prefs["email_notifications"] is True

    print("\n=== Updating User Preferences ===")
    update_resp = requests.put(f"{BASE_URL}/users/me/preferences", json={
        "theme": "Dark",
        "accent_color": "#FF5733",
        "keyboard_shortcuts_enabled": False,
        "email_notifications": False,
        "language": "es"
    }, headers=headers)
    updated = update_resp.json()
    print(f"Updated Theme: {updated['theme']}, Shortcuts: {updated['keyboard_shortcuts_enabled']}, Email Notifications: {updated['email_notifications']}, Lang: {updated['language']}")
    assert updated["theme"] == "Dark"
    assert updated["keyboard_shortcuts_enabled"] is False
    assert updated["email_notifications"] is False
    assert updated["language"] == "es"

    print("\n🎉 User Preferences module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
