import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"workload-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Workload Tester"
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

    # Create workspace member context
    print("\n=== Verifying Member Workload (Default: 40 hrs capacity) ===")
    workspace_id = "d72ac7f3-8d53-486b-bb65-71a694ce8237"
    workloads_resp = requests.get(f"{BASE_URL}/workloads?workspace_id={workspace_id}", headers=headers)
    print(f"Status: {workloads_resp.status_code}")
    assert workloads_resp.status_code == 200
    workloads = workloads_resp.json()
    print(f"Found {len(workloads)} members.")
    
    if len(workloads) > 0:
        member = workloads[0]
        member_id = member["member_id"]
        print(f"Member: {member['full_name']}, Capacity: {member['weekly_capacity_hours']}, Overloaded: {member['is_overloaded']}")
        assert member["weekly_capacity_hours"] == 40

        print("\n=== Updating Member Capacity to 20 hrs ===")
        cap_resp = requests.patch(f"{BASE_URL}/workloads/capacity/{member_id}", json={
            "weekly_capacity_hours": 20
        }, headers=headers)
        print(f"Status: {cap_resp.status_code}")
        assert cap_resp.status_code == 200
        assert cap_resp.json()["weekly_capacity_hours"] == 20

        print("\n=== Verifying updated Workload capacity ===")
        check_resp = requests.get(f"{BASE_URL}/workloads?workspace_id={workspace_id}", headers=headers)
        check_member = [m for m in check_resp.json() if m["member_id"] == member_id][0]
        print(f"Updated Capacity matches: {check_member['weekly_capacity_hours']}")
        assert check_member["weekly_capacity_hours"] == 20

    print("\n=== Fetching Workload Task Calendar ===")
    cal_resp = requests.get(f"{BASE_URL}/workloads/calendar?workspace_id={workspace_id}", headers=headers)
    print(f"Status: {cal_resp.status_code}")
    assert cal_resp.status_code == 200

    print("\n🎉 Workload Planning module integration test passed successfully!")

if __name__ == "__main__":
    run_test()
