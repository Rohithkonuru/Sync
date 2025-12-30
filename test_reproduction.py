import requests
import json
import time

BASE_URL = "http://localhost:8000"

def register_user(email, user_type):
    print(f"Registering {user_type}: {email}")
    url = f"{BASE_URL}/api/auth/register"
    data = {
        "email": email,
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "user_type": user_type
    }
    if user_type == "recruiter":
        data.update({
            "company_name": "Test Corp",
            "company_description": "A test company",
            "company_website": "http://test.com",
            "company_location": "Remote",
            "company_industry": "Tech",
            "company_size": "10-50"
        })
    
    response = requests.post(url, data=data)
    if response.status_code in [200, 201]:
        return response.json()
    elif response.status_code == 400 and "already registered" in response.text:
        return login_user(email)
    else:
        print(f"Registration failed: {response.text}")
        return None

def login_user(email):
    url = f"{BASE_URL}/api/auth/login"
    data = {
        "email": email,
        "password": "password123"
    }
    response = requests.post(url, json=data) # Try JSON first
    if response.status_code != 200:
         response = requests.post(url, data=data) # Try form data
    
    if response.status_code == 200:
        return response.json()
    print(f"Login failed: {response.text}")
    return None

def test_job_flow():
    # 1. Register Recruiter
    recruiter_email = f"recruiter_{int(time.time())}@test.com"
    recruiter_auth = register_user(recruiter_email, "recruiter")
    if not recruiter_auth:
        return
    
    recruiter_token = recruiter_auth["access_token"]
    headers = {"Authorization": f"Bearer {recruiter_token}"}
    
    # 2. Create Job
    print("\n--- Testing Create Job ---")
    job_data = {
        "title": "Test Job",
        "description": "Test Description",
        "location": "Remote",
        "job_type": "full-time",
        "salary_min": 100000,
        "salary_max": 150000,
        "required_skills": ["Python", "React"],
        "experience_level": "mid",
        "requirements": ["Req 1", "Req 2"],
        "benefits": ["Benefit 1"]
    }
    
    res = requests.post(f"{BASE_URL}/api/jobs/", json=job_data, headers=headers)
    if res.status_code == 200:
        print("Job created successfully")
        job_id = res.json()["id"]
        print(f"Job ID: {job_id}")
    else:
        print(f"Failed to create job: {res.status_code} - {res.text}")
        return

    # 3. Get All Jobs
    print("\n--- Testing Get All Jobs ---")
    res = requests.get(f"{BASE_URL}/api/jobs/", headers=headers)
    if res.status_code == 200:
        jobs = res.json()
        print(f"Fetched {len(jobs)} jobs")
        found = any(j["id"] == job_id for j in jobs)
        print(f"Created job found in list: {found}")
    else:
        print(f"Failed to get jobs: {res.status_code} - {res.text}")

    # 4. Get Job Details
    print(f"\n--- Testing Get Job Details ({job_id}) ---")
    res = requests.get(f"{BASE_URL}/api/jobs/{job_id}", headers=headers)
    if res.status_code == 200:
        print("Job details fetched successfully")
        print(res.json())
    else:
        print(f"Failed to get job details: {res.status_code} - {res.text}")

    # 5. Register Student
    student_email = f"student_{int(time.time())}@test.com"
    student_auth = register_user(student_email, "student")
    if not student_auth:
        return
    student_token = student_auth["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 6. Student View Job
    print("\n--- Testing Student View Job ---")
    res = requests.get(f"{BASE_URL}/api/jobs/{job_id}", headers=student_headers)
    if res.status_code == 200:
        print("Student can view job details")
    else:
        print(f"Student failed to view job: {res.status_code} - {res.text}")

if __name__ == "__main__":
    test_job_flow()
