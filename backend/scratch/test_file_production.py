import requests
import io
import uuid

BASE_URL = "http://127.0.0.1:8001"

def run_test():
    email = f"file-tester-{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"

    print("=== Registering User ===")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "File Sandbox Tester"
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

    print("\n=== Creating Folder ===")
    folder_resp = requests.post(f"{BASE_URL}/files/folder", json={
        "name": "Design Spec Documents"
    }, headers=headers)
    print(f"Status: {folder_resp.status_code}")
    assert folder_resp.status_code == 201
    folder = folder_resp.json()
    folder_id = folder["id"]
    print(f"Folder Created. ID: {folder_id}")

    print("\n=== Uploading File inside Folder ===")
    file_content = b"This is a fake PDF file content mock simulation."
    file_obj = io.BytesIO(file_content)
    files = {"file": ("design_v1.pdf", file_obj, "application/pdf")}
    data = {"parent_id": folder_id}
    
    upload_resp = requests.post(
        f"{BASE_URL}/files/upload",
        files=files,
        data=data,
        headers=headers
    )
    print(f"Status: {upload_resp.status_code}")
    assert upload_resp.status_code == 201
    uploaded_file = upload_resp.json()
    file_id = uploaded_file["id"]
    print(f"File uploaded inside folder successfully. ID: {file_id}")

    print("\n=== Listing Files under Folder ===")
    list_resp = requests.get(f"{BASE_URL}/files?parent_id={folder_id}", headers=headers)
    print(f"Status: {list_resp.status_code}")
    assert list_resp.status_code == 200
    assets = list_resp.json()
    print(f"Assets Count inside Folder: {len(assets)}")
    assert len(assets) == 1
    assert assets[0]["id"] == file_id

    print("\n=== Renaming File ===")
    rename_resp = requests.patch(f"{BASE_URL}/files/{file_id}", json={
        "name": "design_specification_final.pdf"
    }, headers=headers)
    print(f"Status: {rename_resp.status_code}")
    assert rename_resp.status_code == 200
    assert rename_resp.json()["name"] == "design_specification_final.pdf"

    print("\n=== Downloading/Streaming File content ===")
    download_resp = requests.get(f"{BASE_URL}/files/download/{file_id}", headers=headers)
    print(f"Status: {download_resp.status_code}")
    assert download_resp.status_code == 200
    print(f"Mime-Type matches: {download_resp.headers['content-type'] == 'application/pdf'}")
    assert download_resp.content == file_content

    print("\n=== Deleting Parent Folder (Cascades to nested file) ===")
    del_resp = requests.delete(f"{BASE_URL}/files/{folder_id}", headers=headers)
    print(f"Status: {del_resp.status_code}")
    assert del_resp.status_code == 204

    # Confirm file is also removed from database
    check_deleted_resp = requests.get(f"{BASE_URL}/files?parent_id={folder_id}", headers=headers)
    print(f"Confirm parent children deleted: {len(check_deleted_resp.json()) == 0}")
    assert len(check_deleted_resp.json()) == 0

    print("\n🎉 File Management and Directory Storage integration test passed successfully!")

if __name__ == "__main__":
    run_test()
