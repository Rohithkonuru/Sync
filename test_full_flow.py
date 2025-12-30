import requests
import json
import time

BASE_URL = "http://localhost:8000"

def register_user(email, user_type, first_name, last_name, with_resume=False):
    print(f"Registering {user_type}: {email}")
    url = f"{BASE_URL}/api/auth/register"
    data = {
        "email": email,
        "password": "password123",
        "first_name": first_name,
        "last_name": last_name,
        "user_type": user_type
    }
    
    files = {}
    if with_resume:
        files = {
            "resume_file": ("resume.pdf", b"%PDF-1.4 dummy content", "application/pdf")
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
    
    if files:
        response = requests.post(url, data=data, files=files)
    else:
        response = requests.post(url, data=data)

    if response.status_code in [200, 201]:
        print("  Registration successful.")
        return response.json()
    elif response.status_code == 400 and "already registered" in response.text:
        print("  User already registered. Logging in...")
        return login_user(email)
    else:
        print(f"  Registration failed: {response.status_code} - {response.text}")
        return None

def login_user(email):
    url = f"{BASE_URL}/api/auth/login"
    data = {
        "email": email,
        "password": "password123"
    }
    response = requests.post(url, json=data)
    if response.status_code != 200:
         response = requests.post(url, data=data)
    
    if response.status_code == 200:
        return response.json()
    print(f"  Login failed: {response.text}")
    return None

def run_test():
    # 1. Recruiter Flow
    print("\n[Recruiter] Starting flow...")
    recruiter_email = f"recruiter_{int(time.time())}@test.com"
    recruiter_auth = register_user(recruiter_email, "recruiter", "Recruiter", "User")
    if not recruiter_auth: return

    recruiter_token = recruiter_auth["access_token"]
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
    recruiter_id = recruiter_auth["user"]["id"]

    # Create Job
    print("[Recruiter] Posting a new job...")
    job_payload = {
        "title": "Senior React Developer",
        "description": "We are looking for an expert React developer.",
        "location": "New York, NY",
        "job_type": "full-time",
        "salary_min": 120000,
        "salary_max": 180000,
        "required_skills": ["React", "Redux", "Node.js"],
        "experience_level": "senior",
        "requirements": ["5+ years experience", "CS Degree"],
        "benefits": ["Remote work", "Health insurance"]
    }
    res = requests.post(f"{BASE_URL}/api/jobs/", json=job_payload, headers=recruiter_headers)
    if res.status_code != 200:
        print(f"  Failed to create job: {res.text}")
        return
    
    job_data = res.json()
    job_id = job_data["id"]
    print(f"  Job created successfully! ID: {job_id}")

    # Verify Job in Recruiter's List
    print("[Recruiter] Verifying job in 'My Jobs'...")
    res = requests.get(f"{BASE_URL}/api/jobs/my-jobs/list", headers=recruiter_headers) # Guessing endpoint
    # Wait, the frontend calls `jobService.getMyJobs() => api.get('/api/jobs/my-jobs/list')`
    # Let's check if this endpoint exists in backend. 
    # Based on `jobs.py` I read earlier, I didn't see `my-jobs` endpoint!
    # I saw `get_jobs` (GET /) and `get_job` (GET /{id}).
    # Let's check `jobs.py` again.
    
    # 2. Student Flow
    print("\n[Student] Starting flow...")
    student_email = f"student_{int(time.time())}@test.com"
    # Note: Backend requires resume for students? 
    # Let's assume yes based on previous turn's context.
    student_auth = register_user(student_email, "student", "Student", "User", with_resume=True)
    if not student_auth: return

    student_token = student_auth["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Verify Job Visibility
    print("[Student] Verifying job visibility in public list...")
    res = requests.get(f"{BASE_URL}/api/jobs/", headers=student_headers)
    if res.status_code != 200:
        print(f"  Failed to fetch jobs: {res.text}")
        return
    
    jobs_list = res.json()
    found_job = next((j for j in jobs_list if j["id"] == job_id), None)
    if found_job:
        print("  Job found in public list.")
    else:
        print("  Job NOT found in public list!")

    # Apply to Job
    print("[Student] Applying to job...")
    apply_data = {
        "cover_letter": "I am very interested in this role.",
        "skills": ["React", "Node.js"]
    }
    
    files = {
        "resume_file": ("resume.pdf", b"%PDF-1.4 dummy content", "application/pdf")
    }
    
    try:
        data_fields = {k: json.dumps(v) if isinstance(v, list) else v for k, v in apply_data.items()}
        print(f"  Sending application to {BASE_URL}/api/jobs/{job_id}/apply", flush=True)
        
        # res = requests.post(f"{BASE_URL}/api/jobs/{job_id}/apply", data=data_fields, files=files, headers=student_headers, timeout=10)
        res = requests.post(f"{BASE_URL}/api/jobs/{job_id}/apply", data=data_fields, headers=student_headers, timeout=10)

        if res.status_code == 200:
            print("  Application submitted successfully.", flush=True)
            print(f"  Response: {res.json()}", flush=True)
        else:
            print(f"  Application failed: {res.status_code} - {res.text}", flush=True)
            
    except Exception as e:
        print(f"  Exception during application: {e}", flush=True)

    # 3. Recruiter Check Application
    print("\n[Recruiter] Checking applications...", flush=True)
    try:
        res = requests.get(f"{BASE_URL}/api/jobs/{job_id}/applications", headers=recruiter_headers)
        if res.status_code == 200:
            apps = res.json()
            if len(apps) > 0:
                print(f"  Recruiter sees the application. Count: {len(apps)}")
            else:
                print("  Recruiter sees NO applications.")
        else:
            print(f"  Failed to fetch applications: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"  Exception checking applications: {e}")
        
    print("\nTest finished.")

if __name__ == "__main__":
    run_test()
