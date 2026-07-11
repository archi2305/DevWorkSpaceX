import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"doc-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Documentation Tester"
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

    print("\n=== Creating Root Document ===")
    doc_resp = requests.post(f"{BASE_URL}/documents", json={
        "title": "System Specification Specs",
        "content": "# Root Spec\nThis is the base system spec."
    }, headers=headers)
    print(f"Status: {doc_resp.status_code}")
    assert doc_resp.status_code == 201
    root_doc = doc_resp.json()
    root_id = root_doc["id"]
    print(f"Root Document ID: {root_id}")

    print("\n=== Creating Nested Child Document ===")
    child_resp = requests.post(f"{BASE_URL}/documents", json={
        "title": "Database Schema Details",
        "content": "## Database\nNested under Root Spec.",
        "parent_id": root_id
    }, headers=headers)
    print(f"Status: {child_resp.status_code}")
    assert child_resp.status_code == 201
    child_doc = child_resp.json()
    print(f"Child Parent ID matches: {child_doc['parent_id'] == root_id}")
    assert child_doc['parent_id'] == root_id

    print("\n=== Querying Documents Tree ===")
    list_resp = requests.get(f"{BASE_URL}/documents", headers=headers)
    print(f"Status: {list_resp.status_code}")
    assert list_resp.status_code == 200
    docs = list_resp.json()
    doc_ids = [d["id"] for d in docs]
    print(f"Total documents found: {len(docs)}")
    assert root_id in doc_ids
    assert str(child_doc["id"]) in doc_ids

    print("\n=== Updating Document to trigger Version Snapshot ===")
    update_resp = requests.patch(f"{BASE_URL}/documents/{root_id}", json={
        "content": "# Root Spec (V2)\nWe have updated the specs."
    }, headers=headers)
    print(f"Status: {update_resp.status_code}")
    assert update_resp.status_code == 200
    root_v2 = update_resp.json()
    print(f"Current version number: {root_v2['version']}")
    assert root_v2['version'] == 2

    print("\n=== Fetching Version History Snapshots ===")
    versions_resp = requests.get(f"{BASE_URL}/documents/{root_id}/versions", headers=headers)
    print(f"Status: {versions_resp.status_code}")
    assert versions_resp.status_code == 200
    versions = versions_resp.json()
    print(f"Snapshots Count: {len(versions)}")
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1
    print(f"Snapshot V1 content: {versions[0]['content']}")

    print("\n=== Restoring Version Snapshot V1 ===")
    restore_resp = requests.post(f"{BASE_URL}/documents/{root_id}/restore/1", headers=headers)
    print(f"Status: {restore_resp.status_code}")
    assert restore_resp.status_code == 200
    restored = restore_resp.json()
    print(f"Restored Doc version: {restored['version']}")
    print(f"Restored Doc title: {restored['title']}")
    print(f"Restored Doc content: {restored['content']}")
    assert restored["version"] == 3
    assert "base system spec" in restored["content"]

    print("\n=== Deleting Root Document (Cascades to nested child) ===")
    del_resp = requests.delete(f"{BASE_URL}/documents/{root_id}", headers=headers)
    print(f"Status: {del_resp.status_code}")
    assert del_resp.status_code == 204

    # Confirm child is also deleted
    confirm_resp = requests.get(f"{BASE_URL}/documents", headers=headers)
    remaining_ids = [d["id"] for d in confirm_resp.json()]
    print(f"Remaining documents count: {len(confirm_resp.json())}")
    assert root_id not in remaining_ids
    assert str(child_doc["id"]) not in remaining_ids

    print("\n🎉 Documentation Nested Pages and Version Snapshots integration test passed successfully!")

if __name__ == "__main__":
    run_test()
