"""Quick test to verify post creation works after fix"""
import requests

BASE_URL = "http://localhost:8000"

# Step 1: Register new user
print("📝 Registering test user...")
email = f"fixtest{int(__import__('time').time())}@test.com"
register_data = {
    "email": email,
    "password": "TestPass123!",
    "first_name": "Fix",
    "last_name": "Test",
    "user_type": "professional"
}

try:
    # Try registration as form data
    resp = requests.post(f"{BASE_URL}/api/auth/register", data=register_data, timeout=5)
    if resp.status_code in [200, 201]:
        user_data = resp.json()
        token = user_data.get("access_token")
        print(f"✅ User registered! Token: {token[:20]}...")
    else:
        print(f"❌ Registration failed: {resp.status_code}")
        print(resp.text[:200])
        
        # Try login instead if registration doesn't exist
        print("\n🔍 Trying login with existing account...")
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "professional@test.com", "password": "TestPass123!"},
            timeout=5
        )
        if login_resp.status_code == 200:
            token = login_resp.json().get("access_token")
            print(f"✅ Logged in! Token: {token[:20]}...")
            email = "professional@test.com"
        else:
            exit(1)
except Exception as e:
    print(f"❌ Registration error: {e}")
    exit(1)

# Step 2: Create post
print("\n📝 Creating test post...")
headers = {"Authorization": f"Bearer {token}"}

try:
    resp = requests.post(
        f"{BASE_URL}/api/posts/create",
        data={"content": "Test post created after fix! ✅"},
        headers=headers,
        timeout=10
    )
    if resp.status_code == 200:
        post = resp.json()
        print(f"✅ SUCCESS! Post created!")
        print(f"   Post ID: {post.get('id')}")
        print(f"   Content: {post.get('content')}")
        print(f"\n🎉 Fix verified - post creation is working!")
    else:
        print(f"❌ Post creation failed: {resp.status_code}")
        print(f"Response: {resp.text[:300]}")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
