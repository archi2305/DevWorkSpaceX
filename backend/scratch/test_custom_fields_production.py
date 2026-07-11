import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"cf-user-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Custom Fields User"
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

    print("\n=== Creating Project ===")
    proj_resp = requests.post(f"{BASE_URL}/projects", json={
        "name": f"project-{uuid.uuid4().hex[:6]}",
        "description": "Custom Fields Test Project"
    }, headers=headers)
    project = proj_resp.json()
    project_id = project["id"]
    print(f"Project ID: {project_id}")

    print("\n=== Creating Custom Field Definition ===")
    def_resp = requests.post(f"{BASE_URL}/custom-fields/definitions", json={
        "name": "Design Complexity",
        "field_type": "Dropdown",
        "target_type": "Project",
        "options": ["Low", "Medium", "High"]
    }, headers=headers)
    definition = def_resp.json()
    print(f"Definition ID: {definition['id']}, Name: {definition['name']}")
    assert definition["field_type"] == "Dropdown"

    print("\n=== Saving Custom Field Value ===")
    val_resp = requests.post(f"{BASE_URL}/custom-fields/values", json={
        "field_definition_id": definition["id"],
        "entity_id": project_id,
        "value": {"val": "High"}
    }, headers=headers)
    value_record = val_resp.json()
    print(f"Saved Value ID: {value_record['id']}, Value: {value_record['value']}")
    assert value_record["value"]["val"] == "High"

    print("\n=== Retrieving Custom Field Values for Project ===")
    list_resp = requests.get(f"{BASE_URL}/custom-fields/values/{project_id}", headers=headers)
    values = list_resp.json()
    print(f"Values list count: {len(values)}")
    assert len(values) == 1
    assert values[0]["value"]["val"] == "High"

    print("\n🎉 Custom Fields module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
