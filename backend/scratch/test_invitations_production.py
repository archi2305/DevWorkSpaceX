import requests
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    inviter_email = f"inviter-{uuid.uuid4().hex[:6]}@example.com"
    invitee_email = f"invitee-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering Inviter ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": inviter_email,
        "password": password,
        "full_name": "Inviter User"
    })
    print(f"Status: {reg_resp.status_code}")
    assert reg_resp.status_code == 201

    print("\n=== Logging In Inviter ===")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": inviter_email,
        "password": password
    })
    inviter_token = login_resp.json()["access_token"]
    inviter_headers = {"Authorization": f"Bearer {inviter_token}"}
    print("Inviter login successful.")

    print("\n=== Registering Invitee ===")
    reg2_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": invitee_email,
        "password": password,
        "full_name": "Invitee User"
    })
    print(f"Status: {reg2_resp.status_code}")
    assert reg2_resp.status_code == 201

    print("\n=== Logging In Invitee ===")
    login2_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": invitee_email,
        "password": password
    })
    invitee_token = login2_resp.json()["access_token"]
    invitee_headers = {"Authorization": f"Bearer {invitee_token}"}
    print("Invitee login successful.")

    print("\n=== Inviter Sends Invitation to Invitee ===")
    invite_resp = requests.post(f"{BASE_URL}/workspace/invitations", json={
        "email": invitee_email,
        "role": "Developer"
    }, headers=inviter_headers)
    print(f"Invite Status: {invite_resp.status_code}")
    assert invite_resp.status_code == 201
    invite = invite_resp.json()
    token = invite["token"]
    print(f"Secure Token Generated: {token}")

    print("\n=== Listing Invitations ===")
    list_resp = requests.get(f"{BASE_URL}/workspace/invitations", headers=inviter_headers)
    print(f"Invitations Count: {len(list_resp.json())}")
    assert len(list_resp.json()) >= 1

    print("\n=== Invitee Rejects Invitation ===")
    reject_resp = requests.post(f"{BASE_URL}/workspace/invitations/reject?token={token}", headers=invitee_headers)
    print(f"Reject Status: {reject_resp.status_code}")
    assert reject_resp.status_code == 200

    print("\n=== Inviter Resends Invitation ===")
    resend_resp = requests.post(f"{BASE_URL}/workspace/invitations/{invite['id']}/resend", headers=inviter_headers)
    print(f"Resend Status: {resend_resp.status_code}")
    assert resend_resp.status_code == 200
    new_token = resend_resp.json()["token"]

    print("\n=== Invitee Accepts Invitation (New Token) ===")
    accept_resp = requests.post(f"{BASE_URL}/workspace/invitations/accept?token={new_token}", headers=invitee_headers)
    print(f"Accept Status: {accept_resp.status_code}")
    assert accept_resp.status_code == 200

    print("\n=== Verifying New Member Added in Workspace ===")
    members_resp = requests.get(f"{BASE_URL}/workspace/members", headers=inviter_headers)
    member_emails = [m["user"]["email"] for m in members_resp.json()]
    print(f"Member Emails: {member_emails}")
    assert invitee_email in member_emails

    print("\n🎉 Workspace Invitation system integration test passed successfully!")

if __name__ == "__main__":
    run_test()
