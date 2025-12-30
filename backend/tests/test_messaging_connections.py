"""
Integration tests for messaging and connections features
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_database
from app.services.auth import create_user, get_user_by_email
import asyncio

client = TestClient(app)

@pytest.fixture
def test_users():
    """Create test users"""
    db = get_database()
    
    # Create user 1
    user1_data = {
        "email": "user1@test.com",
        "password": "testpass123",
        "first_name": "John",
        "last_name": "Doe",
        "user_type": "professional"
    }
    user1 = asyncio.run(create_user(user1_data))
    
    # Create user 2
    user2_data = {
        "email": "user2@test.com",
        "password": "testpass123",
        "first_name": "Jane",
        "last_name": "Smith",
        "user_type": "professional"
    }
    user2 = asyncio.run(create_user(user2_data))
    
    yield {
        "user1": user1,
        "user2": user2
    }
    
    # Cleanup
    asyncio.run(db.users.delete_many({"email": {"$in": ["user1@test.com", "user2@test.com"]}}))

@pytest.fixture
def auth_headers(test_users):
    """Get auth tokens for test users"""
    # Login user1
    response1 = client.post("/api/auth/login", json={
        "email": "user1@test.com",
        "password": "testpass123"
    })
    token1 = response1.json()["access_token"]
    
    # Login user2
    response2 = client.post("/api/auth/login", json={
        "email": "user2@test.com",
        "password": "testpass123"
    })
    token2 = response2.json()["access_token"]
    
    return {
        "user1": {"Authorization": f"Bearer {token1}"},
        "user2": {"Authorization": f"Bearer {token2}"}
    }

def test_send_connection_request(test_users, auth_headers):
    """Test sending a connection request"""
    user1_id = str(test_users["user1"]["_id"])
    user2_id = str(test_users["user2"]["_id"])
    
    # User1 sends connection request to User2
    response = client.post(
        f"/api/users/{user2_id}/connect",
        headers=auth_headers["user1"]
    )
    assert response.status_code == 200
    assert "Connection request sent" in response.json()["message"]

def test_accept_connection_request(test_users, auth_headers):
    """Test accepting a connection request"""
    user1_id = str(test_users["user1"]["_id"])
    user2_id = str(test_users["user2"]["_id"])
    
    # User1 sends request to User2
    client.post(
        f"/api/users/{user2_id}/connect",
        headers=auth_headers["user1"]
    )
    
    # User2 accepts request
    response = client.post(
        f"/api/users/{user1_id}/accept",
        headers=auth_headers["user2"]
    )
    assert response.status_code == 200
    
    # Verify both users are in each other's connections
    db = get_database()
    user1 = asyncio.run(get_user_by_email("user1@test.com"))
    user2 = asyncio.run(get_user_by_email("user2@test.com"))
    
    assert user2_id in user1.get("connections", [])
    assert user1_id in user2.get("connections", [])

def test_message_requires_connection(test_users, auth_headers):
    """Test that messaging requires connection"""
    user1_id = str(test_users["user1"]["_id"])
    user2_id = str(test_users["user2"]["_id"])
    
    # Try to send message without connection
    response = client.post(
        "/api/messages",
        json={
            "receiver_id": user2_id,
            "content": "Hello",
            "message_type": "text"
        },
        headers=auth_headers["user1"]
    )
    assert response.status_code == 403
    assert "connected" in response.json()["detail"].lower()

def test_message_after_connection(test_users, auth_headers):
    """Test messaging after connection"""
    user1_id = str(test_users["user1"]["_id"])
    user2_id = str(test_users["user2"]["_id"])
    
    # Establish connection
    client.post(f"/api/users/{user2_id}/connect", headers=auth_headers["user1"])
    client.post(f"/api/users/{user1_id}/accept", headers=auth_headers["user2"])
    
    # Send message
    response = client.post(
        "/api/messages",
        json={
            "receiver_id": user2_id,
            "content": "Hello, connected!",
            "message_type": "text"
        },
        headers=auth_headers["user1"]
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Hello, connected!"

def test_get_conversations(test_users, auth_headers):
    """Test getting conversations"""
    user1_id = str(test_users["user1"]["_id"])
    user2_id = str(test_users["user2"]["_id"])
    
    # Establish connection and send messages
    client.post(f"/api/users/{user2_id}/connect", headers=auth_headers["user1"])
    client.post(f"/api/users/{user1_id}/accept", headers=auth_headers["user2"])
    
    client.post(
        "/api/messages",
        json={
            "receiver_id": user2_id,
            "content": "Test message",
            "message_type": "text"
        },
        headers=auth_headers["user1"]
    )
    
    # Get conversations
    response = client.get("/api/messages", headers=auth_headers["user1"])
    assert response.status_code == 200
    conversations = response.json()
    assert len(conversations) > 0
    assert any(c["user_id"] == user2_id for c in conversations)

def test_share_post_to_message(test_users, auth_headers):
    """Test sharing a post via message"""
    user1_id = str(test_users["user1"]["_id"])
    user2_id = str(test_users["user2"]["_id"])
    
    # Establish connection
    client.post(f"/api/users/{user2_id}/connect", headers=auth_headers["user1"])
    client.post(f"/api/users/{user1_id}/accept", headers=auth_headers["user2"])
    
    # Create a post
    post_response = client.post(
        "/api/posts",
        json={"content": "Test post to share"},
        headers=auth_headers["user1"]
    )
    post_id = post_response.json()["id"]
    
    # Share post
    response = client.post(
        "/api/messages/share-post",
        params={
            "receiver_id": user2_id,
            "post_id": post_id,
            "note": "Check this out!"
        },
        headers=auth_headers["user1"]
    )
    assert response.status_code == 200
    assert response.json()["message_type"] == "post_share"
    assert response.json()["shared_post_id"] == post_id

