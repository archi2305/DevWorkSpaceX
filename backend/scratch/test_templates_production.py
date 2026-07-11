import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"template-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Template Tester"
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

    print("\n=== Creating Source Project ===")
    proj_resp = requests.post(f"{BASE_URL}/projects", json={
        "name": "Base Template Alpha",
        "description": "Blueprint workspace"
    }, headers=headers)
    source_id = proj_resp.json()["id"]

    print("\n=== Creating Sprints and Schedulers in Source Project ===")
    sprint_resp = requests.post(f"{BASE_URL}/sprints", json={
        "project_id": source_id,
        "name": "Sprint 1: Base Setup",
        "goal": "Setup base stack",
        "duration": "2 Weeks"
    }, headers=headers)
    sprint_id = sprint_resp.json()["id"]

    print("\n=== Creating Milestone in Source Project ===")
    ms_resp = requests.post(f"{BASE_URL}/milestones", json={
        "project_id": source_id,
        "title": "Milestone Target Alpha"
    }, headers=headers)
    ms_id = ms_resp.json()["id"]

    print("\n=== Creating Release in Source Project ===")
    rel_resp = requests.post(f"{BASE_URL}/releases", json={
        "project_id": source_id,
        "version": "v1.0.0-blueprint",
        "title": "Blueprint Spec Release"
    }, headers=headers)
    rel_id = rel_resp.json()["id"]

    print("\n=== Creating Task (Parent) ===")
    ta_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Deliverable blueprint A",
        "project_id": source_id,
        "sprint_id": sprint_id,
        "milestone_id": ms_id,
        "release_id": rel_id
    }, headers=headers)
    task_a_id = ta_resp.json()["id"]

    print("\n=== Creating Task (Subtask of A) ===")
    tb_resp = requests.post(f"{BASE_URL}/tasks", json={
        "title": "Subtask detail mapping",
        "project_id": source_id,
        "parent_id": task_a_id
    }, headers=headers)
    task_b_id = tb_resp.json()["id"]

    print("\n=== Saving Project as Reusable Template ===")
    save_resp = requests.patch(f"{BASE_URL}/projects/{source_id}/template?is_template=true", headers=headers)
    print(f"Status: {save_resp.status_code}")
    assert save_resp.status_code == 200
    assert save_resp.json()["is_template"] is True

    print("\n=== Listing Available Templates ===")
    tpl_list_resp = requests.get(f"{BASE_URL}/projects/templates/list", headers=headers)
    print(f"Templates Found: {len(tpl_list_resp.json())}")
    assert len(tpl_list_resp.json()) >= 1

    print("\n=== Spawning New Project from Template ===")
    dup_resp = requests.post(f"{BASE_URL}/projects/{source_id}/duplicate?new_name=Product+Beta+Instance", headers=headers)
    print(f"Status: {dup_resp.status_code}")
    assert dup_resp.status_code == 200
    dup_proj = dup_resp.json()["project"]
    dup_project_id = dup_proj["id"]
    print(f"Spawned Project ID: {dup_project_id}, Name: {dup_proj['name']}")

    print("\n=== Verifying Duplicated Tasks and Schedule Links ===")
    # Query all tasks for spawned project
    tasks_resp = requests.get(f"{BASE_URL}/tasks?project_id={dup_project_id}", headers=headers)
    dup_tasks = tasks_resp.json()
    print(f"Duplicated Tasks count: {len(dup_tasks)}")
    assert len(dup_tasks) == 2

    # Verify parent-subtask links mapped correctly in copy
    parent_task = [t for t in dup_tasks if t["parent_id"] is None][0]
    sub_task = [t for t in dup_tasks if t["parent_id"] is not None][0]
    print(f"Parent-child link preserved in copy: {sub_task['parent_id'] == parent_task['id']}")
    assert sub_task["parent_id"] == parent_task["id"]

    # Verify sprint, milestone, and release are duplicated and linked
    print(f"Linked Sprint Copy ID: {parent_task['sprint_id']}")
    assert parent_task["sprint_id"] is not None
    assert parent_task["sprint_id"] != sprint_id

    print(f"Linked Milestone Copy ID: {parent_task['milestone_id']}")
    assert parent_task["milestone_id"] is not None
    assert parent_task["milestone_id"] != ms_id

    print(f"Linked Release Copy ID: {parent_task['release_id']}")
    assert parent_task["release_id"] is not None
    assert parent_task["release_id"] != rel_id

    print("\n🎉 Project Templates and Duplication module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
