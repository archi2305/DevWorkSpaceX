import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"dependency-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Dependency Tester"
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
        "name": "Dependency Engine Sandbox",
        "description": "Validating subtasks and dependency locks"
    }, headers=headers)
    project_id = proj_resp.json()["id"]

    print("\n=== Creating Task A (Parent) ===")
    ta_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Task A: Parent spec mapping",
        "project_id": project_id
    }, headers=headers)
    task_a_id = ta_resp.json()["id"]

    print("\n=== Creating Task B (Subtask of A) ===")
    tb_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Task B: Subtask details definition",
        "project_id": project_id,
        "parent_id": task_a_id
    }, headers=headers)
    task_b_id = tb_resp.json()["id"]
    print(f"Subtask Created. Parent ID matches: {tb_resp.json()['parent_id'] == task_a_id}")
    assert tb_resp.json()["parent_id"] == task_a_id

    print("\n=== Fetching Subtasks for Task A ===")
    sub_resp = requests.get(f"{BASE_URL}/tasks/{task_a_id}/subtasks", headers=headers)
    print(f"Status: {sub_resp.status_code}")
    assert sub_resp.status_code == 200
    subs = sub_resp.json()
    print(f"Subtasks Count: {len(subs)}")
    assert len(subs) == 1
    assert subs[0]["id"] == task_b_id

    print("\n=== Creating Task C ===")
    tc_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Task C: Dependency validation",
        "project_id": project_id
    }, headers=headers)
    task_c_id = tc_resp.json()["id"]

    print("\n=== Linking Dependency: Task C is Blocked By Task A ===")
    dep_resp = requests.post(f"{BASE_URL}/tasks/{task_c_id}/dependencies", json={
        "depends_on_id": task_a_id,
        "dependency_type": "blocked_by"
    }, headers=headers)
    print(f"Status: {dep_resp.status_code}")
    assert dep_resp.status_code == 201
    dep_data = dep_resp.json()
    dep_link_id = dep_data["id"]

    print("\n=== Fetching Dependencies of Task C ===")
    tc_deps_resp = requests.get(f"{BASE_URL}/tasks/{task_c_id}/dependencies", headers=headers)
    print(f"Status: {tc_deps_resp.status_code}")
    assert tc_deps_resp.status_code == 200
    assert len(tc_deps_resp.json()) == 1

    print("\n=== Attempting to Complete Task C (Should Fail - Blocked by uncompleted Task A) ===")
    fail_update = requests.patch(f"{BASE_URL}/tasks/{task_c_id}", json={
        "status": "Done"
    }, headers=headers)
    print(f"Status (Expected 400): {fail_update.status_code}, details: {fail_update.json()['detail']}")
    assert fail_update.status_code == 400

    print("\n=== Completing Task A (Blocking Task) ===")
    ok_ta_update = requests.patch(f"{BASE_URL}/tasks/{task_a_id}", json={
        "status": "Done"
    }, headers=headers)
    print(f"Status: {ok_ta_update.status_code}")
    assert ok_ta_update.status_code == 200

    print("\n=== Attempting to Complete Task C again (Should Succeed now) ===")
    ok_tc_update = requests.patch(f"{BASE_URL}/tasks/{task_c_id}", json={
        "status": "Done"
    }, headers=headers)
    print(f"Status: {ok_tc_update.status_code}")
    assert ok_tc_update.status_code == 200
    assert ok_tc_update.json()["completed"] is True

    print("\n=== Querying Project-wide Bulk Dependencies ===")
    project_deps_resp = requests.get(f"{BASE_URL}/tasks/project/{project_id}/dependencies", headers=headers)
    print(f"Status: {project_deps_resp.status_code}")
    assert project_deps_resp.status_code == 200
    proj_deps = project_deps_resp.json()
    print(f"Project Dependencies Count: {len(proj_deps)}")
    assert len(proj_deps) == 1

    print("\n=== Unlinking Dependency ===")
    unlink_resp = requests.delete(f"{BASE_URL}/tasks/{task_c_id}/dependencies/{dep_link_id}", headers=headers)
    print(f"Status: {unlink_resp.status_code}")
    assert unlink_resp.status_code == 204

    print("\n🎉 Task Dependencies, Subtasks, and Block-Locks integration test passed successfully!")

if __name__ == "__main__":
    run_test()
