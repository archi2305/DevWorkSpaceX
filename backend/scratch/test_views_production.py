import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"views-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Views User"
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

    print("\n=== Creating Saved ViewPreset ===")
    view_resp = requests.post(f"{BASE_URL}/saved-filters", json={
        "name": "My Custom Kanban View",
        "target_type": "Task",
        "criteria": {"status": "Todo", "priority": "High"},
        "layout": "kanban",
        "is_favorite": True
    }, headers=headers)
    view = view_resp.json()
    print(f"Created View: {view['name']} (ID: {view['id']}), Is Favorite: {view['is_favorite']}")
    assert view["layout"] == "kanban"
    assert view["is_favorite"] is True

    print("\n=== Listing Saved Views ===")
    list_resp = requests.get(f"{BASE_URL}/saved-filters", headers=headers)
    views = list_resp.json()
    print(f"Saved views count: {len(views)}")
    assert len(views) == 1

    print("\n=== Toggling Favorite Status ===")
    fav_resp = requests.patch(f"{BASE_URL}/saved-filters/{view['id']}/favorite", headers=headers)
    updated_view = fav_resp.json()
    print(f"Updated Favorite Status: {updated_view['is_favorite']}")
    assert updated_view["is_favorite"] is False

    print("\n=== Registering Usage (Recently Visited) ===")
    use_resp = requests.patch(f"{BASE_URL}/saved-filters/{view['id']}/use", headers=headers)
    used_view = use_resp.json()
    print(f"Last Used At: {used_view['last_used_at']}")
    assert used_view["last_used_at"] is not None

    print("\n=== Listing Recently Visited Views ===")
    recent_resp = requests.get(f"{BASE_URL}/saved-filters/recent", headers=headers)
    recents = recent_resp.json()
    print(f"Recent views count: {len(recents)}")
    assert len(recents) == 1
    assert recents[0]["id"] == view["id"]

    print("\n🎉 Saved Views module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
