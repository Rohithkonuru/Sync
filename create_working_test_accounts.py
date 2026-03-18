#!/usr/bin/env python3
"""
Create and verify test accounts for all dashboards
"""
import requests
import json
import time

BASE_URL = "https://sync-backend-production.up.railway.app"

# Test user details for each dashboard
TEST_USERS = [
    {
        "email": "student.test@mailinator.com",
        "password": "TestPass123!",
        "first_name": "Alex",
        "last_name": "Student",
        "user_type": "student",
        "headline": "Computer Science Student",
        "bio": "Passionate about learning and technology",
        "skills": ["Python", "JavaScript", "React", "CSS"]
    },
    {
        "email": "jobseeker.test@mailinator.com",
        "password": "TestPass123!",
        "first_name": "Jordan",
        "last_name": "JobSeeker",
        "user_type": "job_seeker",
        "headline": "Full Stack Developer seeking opportunities",
        "bio": "Looking for exciting opportunities in tech",
        "skills": ["Node.js", "MongoDB", "React", "AWS"]
    },
    {
        "email": "professional.test@mailinator.com",
        "password": "TestPass123!",
        "first_name": "Casey",
        "last_name": "Professional",
        "user_type": "professional",
        "headline": "Senior Software Engineer",
        "bio": "10+ years of experience in software development",
        "skills": ["Java", "Python", "System Design", "Leadership"]
    },
    {
        "email": "recruiter.test@mailinator.com",
        "password": "TestPass123!",
        "first_name": "Morgan",
        "last_name": "Recruiter",
        "user_type": "recruiter",
        "headline": "Tech Recruiter at TechCorp",
        "bio": "Connecting talented developers with amazing opportunities",
        "skills": ["Recruitment", "HR", "Tech Talent"],
        "company_name": "TechCorp Recruitment",
        "company_description": "Leading tech recruitment firm",
        "company_location": "San Francisco, CA",
        "company_industry": "Technology",
        "company_size": "medium"
    }
]

def register_user(user_data):
    """Register a new user"""
    try:
        # Use /register/simple endpoint for cleaner registration
        response = requests.post(
            f"{BASE_URL}/api/auth/register/simple",
            json=user_data,
            timeout=10
        )
        
        print(f"\n📝 Registering: {user_data['email']}")
        print(f"   User Type: {user_data['user_type'].upper()}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Registered successfully")
            return {
                "success": True,
                "email": user_data["email"],
                "password": user_data["password"],
                "user_type": user_data["user_type"],
                "token": result.get("access_token", "")
            }
        elif response.status_code == 400:
            error_msg = response.json().get("detail", "")
            if "already registered" in str(error_msg).lower() or "already exists" in str(error_msg).lower():
                print(f"   ℹ️  Account already exists")
                return {
                    "success": False,
                    "email": user_data["email"],
                    "password": user_data["password"],
                    "exists": True
                }
            else:
                print(f"   ❌ Error: {error_msg}")
                return {"success": False}
        else:
            error_detail = response.json().get("detail", response.text[:100])
            print(f"   ❌ Error ({response.status_code}): {error_detail}")
            return {"success": False}
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)[:100]}")
        return {"success": False}

def test_login(email, password, user_type):
    """Test login for an account"""
    try:
        time.sleep(0.5)  # Small delay between requests
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Login works!")
            return True
        else:
            print(f"   ⚠️  Login failed: {response.json().get('detail', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"   ❌ Login error: {str(e)[:50]}")
        return False

def main():
    print("\n" + "="*70)
    print("CREATING TEST ACCOUNTS FOR ALL DASHBOARDS")
    print("="*70)
    
    created_accounts = []
    
    # Step 1: Register all users
    print("\n📋 STEP 1: REGISTERING ACCOUNTS")
    print("-" * 70)
    
    for user_data in TEST_USERS:
        result = register_user(user_data)
        if result.get("success") or result.get("exists"):
            created_accounts.append({
                "email": user_data["email"],
                "password": user_data["password"],
                "user_type": user_data["user_type"],
                "name": f"{user_data['first_name']} {user_data['last_name']}"
            })
    
    # Step 2: Test login for all accounts
    print("\n\n🔐 STEP 2: TESTING LOGIN (WAIT FOR BACKEND TO SYNC)")
    print("-" * 70)
    
    time.sleep(2)  # Wait for backend to sync
    
    login_results = []
    for account in created_accounts:
        print(f"\n🔑 Testing {account['user_type'].upper()}: {account['email']}")
        success = test_login(account["email"], account["password"], account["user_type"])
        login_results.append({"email": account["email"], "success": success})
    
    # Step 3: Display results
    print("\n\n" + "="*70)
    print("✅ TEST ACCOUNTS READY FOR TESTING")
    print("="*70 + "\n")
    
    for account in created_accounts:
        print(f"📊 {account['user_type'].upper()} DASHBOARD")
        print(f"   Name:     {account['name']}")
        print(f"   Email:    {account['email']}")
        print(f"   Password: {account['password']}")
        print()
    
    print("="*70)
    print("🚀 TESTING INSTRUCTIONS")
    print("="*70)
    print("""
1. Go to your app login page
2. Use the email and password from above
3. Select the appropriate user type when prompted
4. You should see the specific dashboard for that role

Each account has unique features:
  ✅ Student: Course recommendations, job search, networking
  ✅ Job Seeker: Browse jobs, apply, track applications
  ✅ Professional: Network, post updates, connect with others  
  ✅ Recruiter: Post jobs, browse candidates, manage applications
    """)

if __name__ == "__main__":
    main()
