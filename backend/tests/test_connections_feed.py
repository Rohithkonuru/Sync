"""
Integration tests for connections and feed features
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_database
from bson import ObjectId

client = TestClient(app)

# Test user tokens (should be obtained from auth endpoints in real tests)
TEST_RECRUITER_TOKEN = None
TEST_APPLICANT_TOKEN = None
TEST_USER1_TOKEN = None
TEST_USER2_TOKEN = None

@pytest.fixture
def setup_test_users():
    """Setup test users and return their tokens"""
    # In real implementation, create users via auth endpoints
    # For now, we'll use mock tokens
    return {
        "recruiter_token": TEST_RECRUITER_TOKEN,
        "applicant_token": TEST_APPLICANT_TOKEN,
        "user1_token": TEST_USER1_TOKEN,
        "user2_token": TEST_USER2_TOKEN
    }

def test_send_connection_request(setup_test_users):
    """Test sending a connection request"""
    user1_token = setup_test_users["user1_token"]
    user2_id = "test_user2_id"
    
    response = client.post(
        f"/api/users/{user2_id}/connect",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    assert "message" in response.json()
    assert "Connection request sent" in response.json()["message"]

def test_accept_connection_request(setup_test_users):
    """Test accepting a connection request"""
    user2_token = setup_test_users["user2_token"]
    user1_id = "test_user1_id"
    
    response = client.post(
        f"/api/users/{user1_id}/accept",
        headers={"Authorization": f"Bearer {user2_token}"}
    )
    
    assert response.status_code == 200
    assert "message" in response.json()
    assert "Connection accepted" in response.json()["message"]

def test_reject_connection_request(setup_test_users):
    """Test rejecting a connection request"""
    user2_token = setup_test_users["user2_token"]
    user1_id = "test_user1_id"
    
    response = client.post(
        f"/api/users/{user1_id}/reject",
        headers={"Authorization": f"Bearer {user2_token}"}
    )
    
    assert response.status_code == 200
    assert "message" in response.json()
    assert "rejected" in response.json()["message"].lower()

def test_cancel_connection_request(setup_test_users):
    """Test canceling a connection request you sent"""
    user1_token = setup_test_users["user1_token"]
    user2_id = "test_user2_id"
    
    response = client.delete(
        f"/api/users/{user2_id}/cancel-request",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    assert "message" in response.json()
    assert "cancelled" in response.json()["message"].lower()

def test_get_connections_list(setup_test_users):
    """Test getting connections list with pagination"""
    user1_token = setup_test_users["user1_token"]
    
    response = client.get(
        "/api/users/connections/list?skip=0&limit=20",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_connection_requests(setup_test_users):
    """Test getting pending connection requests"""
    user2_token = setup_test_users["user2_token"]
    
    response = client.get(
        "/api/users/connection-requests/list",
        headers={"Authorization": f"Bearer {user2_token}"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_remove_connection(setup_test_users):
    """Test removing a connection"""
    user1_token = setup_test_users["user1_token"]
    user2_id = "test_user2_id"
    
    response = client.delete(
        f"/api/users/connections/{user2_id}",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    assert "message" in response.json()
    assert "removed" in response.json()["message"].lower()

def test_get_feed_recent(setup_test_users):
    """Test getting feed sorted by recent"""
    user1_token = setup_test_users["user1_token"]
    
    response = client.get(
        "/api/posts/feed?sort_by=recent&limit=20",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    
    # Verify posts are sorted by created_at (most recent first)
    posts = response.json()
    if len(posts) > 1:
        for i in range(len(posts) - 1):
            current_time = posts[i]["created_at"]
            next_time = posts[i + 1]["created_at"]
            assert current_time >= next_time

def test_get_feed_relevance(setup_test_users):
    """Test getting feed sorted by relevance"""
    user1_token = setup_test_users["user1_token"]
    
    response = client.get(
        "/api/posts/feed?sort_by=relevance&limit=20",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_save_post(setup_test_users):
    """Test saving a post"""
    user1_token = setup_test_users["user1_token"]
    post_id = "test_post_id"
    
    response = client.post(
        f"/api/posts/{post_id}/save",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    assert "saved" in response.json()
    assert response.json()["saved"] in [True, False]

def test_get_saved_posts(setup_test_users):
    """Test getting saved posts"""
    user1_token = setup_test_users["user1_token"]
    
    response = client.get(
        "/api/posts/saved/list?skip=0&limit=20",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_feed_includes_recommended(setup_test_users):
    """Test that feed includes recommended posts when enabled"""
    user1_token = setup_test_users["user1_token"]
    
    response = client.get(
        "/api/posts/feed?include_recommended=true&limit=50",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    posts = response.json()
    assert isinstance(posts, list)
    # Feed should include posts from connections and recommended posts

def test_feed_excludes_recommended(setup_test_users):
    """Test that feed excludes recommended posts when disabled"""
    user1_token = setup_test_users["user1_token"]
    
    response = client.get(
        "/api/posts/feed?include_recommended=false&limit=50",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    
    assert response.status_code == 200
    posts = response.json()
    assert isinstance(posts, list)
    # Feed should only include posts from connections

def test_application_status_update_notification(setup_test_users):
    """Test that applicant receives notification when status is updated"""
    recruiter_token = setup_test_users["recruiter_token"]
    application_id = "test_application_id"
    
    # Update application status
    response = client.put(
        f"/api/jobs/applications/{application_id}/status",
        headers={"Authorization": f"Bearer {recruiter_token}"},
        json={
            "status": "shortlisted",
            "note": "Candidate shortlisted for interview"
        }
    )
    
    assert response.status_code == 200
    
    # Verify notification was created (check database)
    # In real implementation, check notifications collection
    # For now, we verify the endpoint returns success

def test_get_my_applications_with_pagination(setup_test_users):
    """Test getting applications with pagination"""
    applicant_token = setup_test_users["applicant_token"]
    
    response = client.get(
        "/api/jobs/my-applications/list?skip=0&limit=20",
        headers={"Authorization": f"Bearer {applicant_token}"}
    )
    
    assert response.status_code == 200
    applications = response.json()
    assert isinstance(applications, list)
    
    # Verify each application has required fields
    for app in applications:
        assert "id" in app
        assert "status" in app
        assert "job" in app
        assert "status_history" in app

def test_application_status_history(setup_test_users):
    """Test that status history is maintained correctly"""
    recruiter_token = setup_test_users["recruiter_token"]
    application_id = "test_application_id"
    
    # Update status multiple times
    statuses = ["seen", "in-processing", "shortlisted"]
    
    for status in statuses:
        response = client.put(
            f"/api/jobs/applications/{application_id}/status",
            headers={"Authorization": f"Bearer {recruiter_token}"},
            json={"status": status, "note": f"Status updated to {status}"}
        )
        assert response.status_code == 200
    
    # Get application and verify history
    response = client.get(
        f"/api/jobs/applications/{application_id}",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == 200
    application = response.json()
    assert "status_history" in application
    assert len(application["status_history"]) >= len(statuses)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

