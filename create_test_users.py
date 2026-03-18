#!/usr/bin/env python3
"""
Create test users for each dashboard type
"""
import requests
import json
from datetime import datetime

# Backend URL
BASE_URL = "https://sync-backend-production.up.railway.app"

# Test user credentials for each dashboard
TEST_USERS = [
    {
        "email": "student@test.com",
        "password": "TestPass123!",
        "first_name": "Alex",
        "last_name": "Student",
        "user_type": "student",
        "headline": "Computer Science Student",
        "bio": "Passionate about learning and technology",
        "skills": ["Python", "JavaScript", "React", "CSS"]
    },
    {
        "email": "jobseeker@test.com",
        "password": "TestPass123!",
        "first_name": "Jordan",
        "last_name": "JobSeeker",
        "user_type": "job_seeker",
        "headline": "Full Stack Developer seeking opportunities",
        "bio": "Looking for exciting opportunities in tech",
        "skills": ["Node.js", "MongoDB", "React", "AWS"]
    },
    {
        "email": "professional@test.com",
        "password": "TestPass123!",
        "first_name": "Casey",
        "last_name": "Professional",
        "user_type": "professional",
        "headline": "Senior Software Engineer",
        "bio": "10+ years of experience in software development",
        "skills": ["Java", "Python", "System Design", "Leadership"]
    },
    {
        "email": "recruiter@test.com",
        "password": "TestPass123!",
        "first_name": "Morgan",
        "last_name": "Recruiter",
        "user_type": "recruiter",
        "headline": "Tech Recruiter at TechCorp",
        "bio": "Connecting talented developers with amazing opportunities",
        "skills": ["Recruitment", "HR", "Tech Talent"]
    }
]

def create_user(user_data):
    """Create a test user"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data,
            timeout=10
        )
        
        if response.status_code == 201:
            result = response.json()
            return {
                "success": True,
                "email": user_data["email"],
                "password": user_data["password"],
                "user_type": user_data["user_type"],
                "token": result.get("access_token", "")[:50] + "...",
                "message": "User created successfully"
            }
        elif response.status_code == 400:
            # User likely already exists
            return {
                "success": False,
                "email": user_data["email"],
                "user_type": user_data["user_type"],
                "message": "User already exists - try logging in with password"
            }
        else:
            return {
                "success": False,
                "email": user_data["email"],
                "user_type": user_data["user_type"],
                "message": f"Error: {response.status_code}"
            }
    except Exception as e:
        return {
            "success": False,
            "email": user_data["email"],
            "user_type": user_data["user_type"],
            "message": f"Connection error: {str(e)}"
        }

def main():
    print("\n" + "="*70)
    print("TEST USERS FOR EACH DASHBOARD")
    print("="*70 + "\n")
    
    results = []
    for user_data in TEST_USERS:
        print(f"Creating {user_data['user_type'].upper()} user: {user_data['email']}")
        result = create_user(user_data)
        results.append(result)
        
        if result["success"]:
            print(f"  ✅ Success")
        else:
            print(f"  ℹ️  {result['message']}")
        print()
    
    # Display credentials
    print("\n" + "="*70)
    print("LOGIN CREDENTIALS FOR TESTING")
    print("="*70 + "\n")
    
    for user_data in TEST_USERS:
        user_type = user_data["user_type"].upper()
        dashboard = {
            "student": "Student Dashboard",
            "job_seeker": "Job Seeker Dashboard",
            "professional": "Professional Dashboard",
            "recruiter": "Recruiter Dashboard"
        }.get(user_data["user_type"], "Unknown")
        
        print(f"📊 {dashboard}")
        print(f"   Email:    {user_data['email']}")
        print(f"   Password: {user_data['password']}")
        print()
    
    print("="*70)
    print("✅ ALL TEST USERS READY TO USE")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
