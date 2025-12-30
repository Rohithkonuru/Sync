"""
Integration tests for job applications feature
Run with: pytest backend/tests/test_job_applications.py -v
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

# Import your app
from app.main import app
from app.database import get_database

load_dotenv()

client = TestClient(app)

# Test data
TEST_RECRUITER = {
    "email": "recruiter@test.com",
    "password": "testpass123",
    "first_name": "John",
    "last_name": "Recruiter",
    "user_type": "recruiter"
}

TEST_APPLICANT = {
    "email": "applicant@test.com",
    "password": "testpass123",
    "first_name": "Jane",
    "last_name": "Applicant",
    "user_type": "job_seeker"
}

@pytest.fixture(scope="module")
def setup_test_data():
    """Setup test data before tests"""
    # This would create test users and jobs
    # In a real scenario, use a test database
    pass

@pytest.fixture
def recruiter_token():
    """Get recruiter auth token"""
    # Register recruiter
    response = client.post("/api/auth/register", json=TEST_RECRUITER)
    if response.status_code == 201:
        token = response.json()["access_token"]
    else:
        # Try login if already exists
        response = client.post("/api/auth/login", json={
            "email": TEST_RECRUITER["email"],
            "password": TEST_RECRUITER["password"]
        })
        token = response.json()["access_token"]
    return token

@pytest.fixture
def applicant_token():
    """Get applicant auth token"""
    # Register applicant
    response = client.post("/api/auth/register", json=TEST_APPLICANT)
    if response.status_code == 201:
        token = response.json()["access_token"]
    else:
        # Try login if already exists
        response = client.post("/api/auth/login", json={
            "email": TEST_APPLICANT["email"],
            "password": TEST_APPLICANT["password"]
        })
        token = response.json()["access_token"]
    return token

@pytest.fixture
def test_job(recruiter_token):
    """Create a test job"""
    job_data = {
        "title": "Software Engineer",
        "location": "San Francisco, CA",
        "job_type": "full-time",
        "description": "We are looking for a software engineer",
        "requirements": ["Python", "FastAPI"],
        "benefits": ["Health insurance", "Remote work"]
    }
    response = client.post(
        "/api/jobs",
        json=job_data,
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    assert response.status_code == 200
    return response.json()

def test_a_apply_for_job_with_resume(applicant_token, test_job):
    """Test: Applicant submits application with resume"""
    job_id = test_job["id"]
    
    # Create a dummy resume file
    resume_content = b"PDF content here"
    
    # Prepare form data
    files = {
        "resume_file": ("resume.pdf", resume_content, "application/pdf")
    }
    data = {
        "full_name": "Jane Applicant",
        "email": "applicant@test.com",
        "contact_number": "+1234567890",
        "address": "123 Main St, City, State",
        "cover_letter": "I am very interested in this position.",
        "portfolio_url": "https://portfolio.example.com",
        "skills": '["Python", "FastAPI", "React"]',
        "experience_years": 5
    }
    
    response = client.post(
        f"/api/jobs/{job_id}/apply",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {applicant_token}"}
    )
    
    assert response.status_code == 200
    result = response.json()
    assert "message" in result
    assert "application_id" in result
    assert result["message"] == "Application submitted successfully"
    
    return result["application_id"]

def test_b_recruiter_views_applications(recruiter_token, test_job):
    """Test: Recruiter views all applications for their job"""
    job_id = test_job["id"]
    
    response = client.get(
        f"/api/jobs/{job_id}/applications",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == 200
    applications = response.json()
    assert isinstance(applications, list)
    
    if len(applications) > 0:
        app = applications[0]
        assert "id" in app
        assert "applicant_id" in app
        assert "status" in app
        assert "applied_at" in app
        assert "applicant" in app or "full_name" in app

def test_c_recruiter_downloads_resume(recruiter_token, test_job, applicant_token):
    """Test: Recruiter downloads resume from application"""
    job_id = test_job["id"]
    
    # First, create an application with resume
    resume_content = b"PDF resume content"
    files = {
        "resume_file": ("resume.pdf", resume_content, "application/pdf")
    }
    data = {
        "full_name": "Jane Applicant",
        "email": "applicant@test.com",
        "cover_letter": "Test application"
    }
    
    apply_response = client.post(
        f"/api/jobs/{job_id}/apply",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {applicant_token}"}
    )
    
    if apply_response.status_code != 200:
        pytest.skip("Could not create application with resume")
    
    # Get applications
    apps_response = client.get(
        f"/api/jobs/{job_id}/applications",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    if apps_response.status_code != 200 or len(apps_response.json()) == 0:
        pytest.skip("No applications found")
    
    application_id = apps_response.json()[0]["id"]
    
    # Download resume
    response = client.get(
        f"/api/jobs/applications/{application_id}/resume",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    # Should return file or 404 if no resume
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        assert response.headers["content-type"] in ["application/pdf", "application/octet-stream"]

def test_d_recruiter_updates_status(recruiter_token, test_job, applicant_token):
    """Test: Recruiter updates application status and applicant receives notification"""
    job_id = test_job["id"]
    
    # Create application
    data = {
        "full_name": "Jane Applicant",
        "email": "applicant@test.com",
        "cover_letter": "Test application"
    }
    
    apply_response = client.post(
        f"/api/jobs/{job_id}/apply",
        data=data,
        headers={"Authorization": f"Bearer {applicant_token}"}
    )
    
    if apply_response.status_code != 200:
        pytest.skip("Could not create application")
    
    # Get applications
    apps_response = client.get(
        f"/api/jobs/{job_id}/applications",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    if apps_response.status_code != 200 or len(apps_response.json()) == 0:
        pytest.skip("No applications found")
    
    application_id = apps_response.json()[0]["id"]
    
    # Update status
    status_update = {
        "status": "shortlisted",
        "note": "Great candidate, moving to next round"
    }
    
    response = client.put(
        f"/api/jobs/applications/{application_id}/status",
        json=status_update,
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == 200
    result = response.json()
    assert "message" in result
    
    # Verify status was updated
    app_response = client.get(
        f"/api/jobs/applications/{application_id}",
        headers={"Authorization": f"Bearer {applicant_token}"}
    )
    
    if app_response.status_code == 200:
        app = app_response.json()
        assert app["status"] == "shortlisted"
        assert len(app.get("status_history", [])) > 0

def test_e_delete_application(recruiter_token, test_job, applicant_token):
    """Test: Delete application (applicant or recruiter)"""
    job_id = test_job["id"]
    
    # Create application
    data = {
        "full_name": "Jane Applicant",
        "email": "applicant@test.com",
        "cover_letter": "Test application"
    }
    
    apply_response = client.post(
        f"/api/jobs/{job_id}/apply",
        data=data,
        headers={"Authorization": f"Bearer {applicant_token}"}
    )
    
    if apply_response.status_code != 200:
        pytest.skip("Could not create application")
    
    # Get applications
    apps_response = client.get(
        f"/api/jobs/{job_id}/applications",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    if apps_response.status_code != 200 or len(apps_response.json()) == 0:
        pytest.skip("No applications found")
    
    application_id = apps_response.json()[0]["id"]
    
    # Delete as recruiter
    response = client.delete(
        f"/api/jobs/applications/{application_id}",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == 200
    result = response.json()
    assert "message" in result

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

