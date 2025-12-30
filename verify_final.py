import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_full_flow():
    # 1. Register Recruiter
    recruiter_email = "recruiter_final@test.com"
    recruiter_password = "password123"
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": recruiter_email,
            "password": recruiter_password,
            "full_name": "Recruiter Final",
            "user_type": "recruiter",
            "company_name": "Final Corp",
            "company_description": "Best company"
        })
        if resp.status_code == 201:
            print("Recruiter registered.")
        elif resp.status_code == 400 and "already registered" in resp.text:
            print("Recruiter already exists.")
        else:
            print(f"Recruiter registration failed: {resp.text}")
            return
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    # Login Recruiter
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": recruiter_email,
        "password": recruiter_password
    })
    if resp.status_code != 200:
        print(f"Recruiter login failed: {resp.text}")
        return
    recruiter_token = resp.json()["access_token"]
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
    print("Recruiter logged in.")

    # 2. Create Job with Requirements and Benefits
    job_data = {
        "title": "Senior Final Developer",
        "description": "Develop final things.",
        "location": "Remote",
        "job_type": "full-time",
        "salary_min": 100000,
        "salary_max": 150000,
        "skills": ["Python", "React"],
        "requirements": ["5 years experience", "Degree in CS"],
        "benefits": ["Health", "Dental", "401k"],
        "experience_level": "senior"
    }
    resp = requests.post(f"{BASE_URL}/jobs", json=job_data, headers=recruiter_headers)
    if resp.status_code != 200: # Backend might return 200 or 201
        print(f"Job creation failed: {resp.text}")
        return
    job_id = resp.json()["id"]
    print(f"Job created with ID: {job_id}")

    # Verify Job Details (Recruiter side)
    resp = requests.get(f"{BASE_URL}/jobs/{job_id}", headers=recruiter_headers)
    created_job = resp.json()
    if "requirements" in created_job and "benefits" in created_job:
        print("Job verified with requirements and benefits.")
    else:
        print("Job missing requirements or benefits.")

    # 3. Register Candidate
    candidate_email = "candidate_final@test.com"
    candidate_password = "password123"
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": candidate_email,
            "password": candidate_password,
            "full_name": "Candidate Final",
            "user_type": "job_seeker"
        })
        if resp.status_code == 201:
            print("Candidate registered.")
        elif resp.status_code == 400:
            print("Candidate already exists.")
    except:
        pass

    # Login Candidate
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": candidate_email,
        "password": candidate_password
    })
    if resp.status_code != 200:
        print("Candidate login failed")
        return
    candidate_token = resp.json()["access_token"]
    candidate_headers = {"Authorization": f"Bearer {candidate_token}"}
    print("Candidate logged in.")

    # 4. Verify Job Visibility for Candidate
    resp = requests.get(f"{BASE_URL}/jobs", headers=candidate_headers)
    jobs = resp.json()
    found = False
    for job in jobs:
        if job["id"] == job_id:
            found = True
            break
    if found:
        print("Job visible to candidate.")
    else:
        print("Job NOT visible to candidate.")

    # 5. Upload Resume and Check ATS Score
    # Create a dummy PDF
    with open("dummy_resume.pdf", "wb") as f:
        f.write(b"%PDF-1.4 dummy pdf content")

    files = {'file': ('dummy_resume.pdf', open('dummy_resume.pdf', 'rb'), 'application/pdf')}
    resp = requests.post(f"{BASE_URL}/users/upload/resume", files=files, headers=candidate_headers)
    if resp.status_code == 200:
        print("Resume uploaded successfully.")
        # Check if ATS score is returned in profile or separate endpoint
        ats_resp = requests.get(f"{BASE_URL}/users/me/ats-score", headers=candidate_headers)
        if ats_resp.status_code == 200:
            score = ats_resp.json()
            print(f"ATS Score retrieved: {score}")
        else:
            print(f"Failed to get ATS score: {ats_resp.text}")
    else:
        print(f"Resume upload failed: {resp.text}")

if __name__ == "__main__":
    test_full_flow()
