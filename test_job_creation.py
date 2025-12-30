import requests
import uuid
import sys
import json

BASE_URL = "http://localhost:8000"

def test_job_creation():
    email = f"recruiter_{uuid.uuid4()}@example.com"
    password = "password123"
    
    print(f"1. Registering recruiter: {email}")
    register_data = {
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "Recruiter",
        "user_type": "recruiter",
        "company_name": "Test Corp",
        "company_description": "A test company",
        "company_website": "http://test.com",
        "company_location": "Remote",
        "company_industry": "Tech",
        "company_size": "10-50"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", data=register_data)
        if response.status_code != 200:
            print(f"Registration failed: {response.text}")
            return
            
        token_data = response.json()
        access_token = token_data["access_token"]
        print("   Registration successful, token received.")
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        print("2. Creating a job...")
        job_payload = {
            "title": "Senior Python Developer",
            "description": "We are looking for a python expert...",
            "location": "Remote",
            "job_type": "full-time",
            "salary_min": 100000,
            "salary_max": 150000,
            "requirements": ["Python", "FastAPI"],
            "benefits": ["Health", "Dental"],
            "required_skills": ["Python", "SQL"],
            "experience_level": "senior"
        }
        
        response = requests.post(f"{BASE_URL}/api/jobs/", json=job_payload, headers=headers)
        
        if response.status_code == 200:
            job = response.json()
            print(f"   Job created successfully! ID: {job['id']}")
            print(f"   Title: {job['title']}")
            print(f"   Status: {job['status']}")
            
            # Verify it appears in the list
            print("3. Verifying job in list...")
            response = requests.get(f"{BASE_URL}/api/jobs/my-jobs/list", headers=headers)
            if response.status_code == 200:
                jobs = response.json()
                found = any(j['id'] == job['id'] for j in jobs)
                if found:
                    print("   Job found in 'my-jobs' list.")
                else:
                    print("   ERROR: Job NOT found in 'my-jobs' list.")
                    print(f"   List content: {[j['id'] for j in jobs]}")
            else:
                 print(f"   Failed to fetch my-jobs: {response.text}")

        else:
            print(f"   Job creation failed: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_job_creation()
