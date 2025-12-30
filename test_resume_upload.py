import requests
import json

# Test resume upload functionality
BASE_URL = "http://localhost:8000"

def test_resume_upload():
    # First, login to get token
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }

    try:
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if login_response.status_code != 200:
            print("Login failed, creating test user...")

            # Try to register a test user
            register_data = {
                "email": "test@example.com",
                "password": "password123",
                "first_name": "Test",
                "last_name": "User",
                "user_type": "recruiter",
                "company_name": "Test Corp",
                "company_description": "Test Description"
            }
            register_response = requests.post(f"{BASE_URL}/api/auth/register", data=register_data)
            if register_response.status_code != 200:
                print(f"Registration failed: {register_response.text}")
                return

            # Login again
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
            if login_response.status_code != 200:
                print(f"Login failed after registration: {login_response.text}")
                return

        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        print("Login successful, testing resume upload...")

        # Create a dummy PDF file content
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000200 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n284\n%%EOF"

        # Upload resume
        files = {
            'file': ('test_resume.pdf', pdf_content, 'application/pdf')
        }

        upload_response = requests.post(
            f"{BASE_URL}/api/users/upload/resume",
            files=files,
            headers=headers
        )

        print(f"Resume upload status: {upload_response.status_code}")
        print(f"Resume upload response: {upload_response.text}")

        if upload_response.status_code == 200:
            print("Resume upload successful!")
            
            resp_json = upload_response.json()
            if "ats_score" in resp_json:
                 print(f"ATS score in upload response: {resp_json['ats_score']}")
            else:
                 print("ATS score NOT in upload response!")

            # Test ATS score retrieval
            score_response = requests.get(
                f"{BASE_URL}/api/users/me/ats-score",
                headers=headers
            )

            print(f"ATS score status: {score_response.status_code}")
            print(f"ATS score response: {score_response.text}")

            if score_response.status_code == 200:
                print("ATS score retrieval successful!")
            else:
                print("ATS score retrieval failed!")
        else:
            print("Resume upload failed!")

    except Exception as e:
        print(f"Error during testing: {e}")

if __name__ == "__main__":
    test_resume_upload()
