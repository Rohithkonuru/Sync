from app.models.job import JobCreate
from typing import List

def test_job_payload_validation():
    print("Testing JobCreate payload validation...")
    
    # Payload similar to what frontend sends now
    payload = {
        "title": "Test Job",
        "description": "Test Description",
        "location": "Remote",
        "job_type": "full-time",
        "salary_min": 50000,
        "salary_max": 100000,
        "required_skills": ["Python", "React"],
        "requirements": ["Req 1"],
        "benefits": ["Ben 1"],
        "experience_level": "mid",
        # Extra fields like 'skills' should be ignored or allowed depending on config
        "skills": ["Python", "React"] 
    }
    
    try:
        job = JobCreate(**payload)
        print("Validation SUCCESS!")
        print(f"Title: {job.title}")
        print(f"Required Skills: {job.required_skills}")
        print(f"Requirements: {job.requirements}")
        
        if job.required_skills == ["Python", "React"]:
            print("Skills mapped correctly.")
        else:
            print(f"Skills mismatch: {job.required_skills}")
            
    except Exception as e:
        print(f"Validation FAILED: {e}")

if __name__ == "__main__":
    test_job_payload_validation()
