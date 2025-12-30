"""
Integration tests for connections and messaging features
Tests connection flow and messaging between connected users
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_database
from bson import ObjectId

client = TestClient(app)

# Test users
test_user1 = {
    "email": "testuser1@example.com",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User1",
    "user_type": "professional"
}

test_user2 = {
    "email": "testuser2@example.com",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User2",
    "user_type": "professional"
}

@pytest.fixture
def auth_tokens():
    """Create two test users and return their auth tokens"""
    # Register users
    client.post("/api/auth/register", json=test_user1)
    client.post("/api/auth/register", json=test_user2)
    
    # Login
    response1 = client.post("/api/auth/login", json={
        "email": test_user1["email"],
        "password": test_user1["password"]
    })
    response2 = client.post("/api/auth/login", json={
        "email": test_user2["email"],
        "password": test_user2["password"]
    })
    
    token1 = response1.json()["access_token"]
    token2 = response2.json()["access_token"]
    
    return {
        "user1_token": token1,
        "user2_token": token2
    }

def test_send_connection_request(auth_tokens):
    """Test sending a connection request"""
    headers1 = {"Authorization": f"Bearer {auth_tokens['user1_token']}"}
    
    # Get user2's ID (would need to fetch from DB or endpoint)
    # For now, assume we have a way to get it
    db = get_database()
    user2 = db.users.find_one({"email": test_user2["email"]})
    user2_id = str(user2["_id"])
    
    response = client.post(
        "/api/connections/request",
        json={"user_id": user2_id},
        headers=headers1
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "requested"

def test_accept_connection_request(auth_tokens):
    """Test accepting a connection request"""
    headers1 = {"Authorization": f"Bearer {auth_tokens['user1_token']}"}
    headers2 = {"Authorization": f"Bearer {auth_tokens['user2_token']}"}
    
    db = get_database()
    user1 = db.users.find_one({"email": test_user1["email"]})
    user2 = db.users.find_one({"email": test_user2["email"]})
    user1_id = str(user1["_id"])
    user2_id = str(user2["_id"])
    
    # Send request
    client.post(
        "/api/connections/request",
        json={"user_id": user2_id},
        headers=headers1
    )
    
    # Accept request
    response = client.post(
        f"/api/connections/{user1_id}/accept",
        headers=headers2
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "connected"
    
    # Verify bi-directional connection
    user1_updated = db.users.find_one({"_id": user1["_id"]})
    user2_updated = db.users.find_one({"_id": user2["_id"]})
    
    assert user2_id in user1_updated.get("connections", [])
    assert user1_id in user2_updated.get("connections", [])

def test_decline_connection_request(auth_tokens):
    """Test declining a connection request"""
    headers1 = {"Authorization": f"Bearer {auth_tokens['user1_token']}"}
    headers2 = {"Authorization": f"Bearer {auth_tokens['user2_token']}"}
    
    db = get_database()
    user1 = db.users.find_one({"email": test_user1["email"]})
    user2 = db.users.find_one({"email": test_user2["email"]})
    user1_id = str(user1["_id"])
    user2_id = str(user2["_id"])
    
    # Send request
    client.post(
        "/api/connections/request",
        json={"user_id": user2_id},
        headers=headers1
    )
    
    # Decline request
    response = client.post(
        f"/api/connections/{user1_id}/decline",
        headers=headers2
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "declined"
    
    # Verify request removed
    user2_updated = db.users.find_one({"_id": user2["_id"]})
    assert user1_id not in user2_updated.get("connection_requests", [])

def test_remove_connection(auth_tokens):
    """Test removing a connection"""
    headers1 = {"Authorization": f"Bearer {auth_tokens['user1_token']}"}
    headers2 = {"Authorization": f"Bearer {auth_tokens['user2_token']}"}
    
    db = get_database()
    user1 = db.users.find_one({"email": test_user1["email"]})
    user2 = db.users.find_one({"email": test_user2["email"]})
    user1_id = str(user1["_id"])
    user2_id = str(user2["_id"])
    
    # Create connection
    client.post(
        "/api/connections/request",
        json={"user_id": user2_id},
        headers=headers1
    )
    client.post(
        f"/api/connections/{user1_id}/accept",
        headers=headers2
    )
    
    # Remove connection
    response = client.delete(
        f"/api/connections/{user2_id}",
        headers=headers1
    )
    
    assert response.status_code == 200
    
    # Verify bi-directional removal
    user1_updated = db.users.find_one({"_id": user1["_id"]})
    user2_updated = db.users.find_one({"_id": user2["_id"]})
    
    assert user2_id not in user1_updated.get("connections", [])
    assert user1_id not in user2_updated.get("connections", [])

def test_get_my_connections(auth_tokens):
    """Test getting user's connections"""
    headers1 = {"Authorization": f"Bearer {auth_tokens['user1_token']}"}
    headers2 = {"Authorization": f"Bearer {auth_tokens['user2_token']}"}
    
    db = get_database()
    user2 = db.users.find_one({"email": test_user2["email"]})
    user2_id = str(user2["_id"])
    
    # Create connection
    client.post(
        "/api/connections/request",
        json={"user_id": user2_id},
        headers=headers1
    )
    client.post(
        f"/api/connections/{user2_id}/accept",
        headers=headers2
    )
    
    # Get connections
    response = client.get(
        "/api/connections/me/connections",
        headers=headers1
    )
    
    assert response.status_code == 200
    connections = response.json()
    assert len(connections) > 0
    assert any(conn["id"] == user2_id for conn in connections)

def test_message_requires_connection(auth_tokens):
    """Test that messaging requires connection"""
    headers1 = {"Authorization": f"Bearer {auth_tokens['user1_token']}"}
    
    db = get_database()
    user2 = db.users.find_one({"email": test_user2["email"]})
    user2_id = str(user2["_id"])
    
    # Try to send message without connection
    response = client.post(
        "/api/messages",
        json={
            "receiver_id": user2_id,
            "content": "Hello",
            "message_type": "text"
        },
        headers=headers1
    )
    
    assert response.status_code == 403
    assert "connected" in response.json()["detail"].lower()

def test_message_after_connection(auth_tokens):
    """Test sending message after connection"""
    headers1 = {"Authorization": f"Bearer {auth_tokens['user1_token']}"}
    headers2 = {"Authorization": f"Bearer {auth_tokens['user2_token']}"}
    
    db = get_database()
    user1 = db.users.find_one({"email": test_user1["email"]})
    user2 = db.users.find_one({"email": test_user2["email"]})
    user1_id = str(user1["_id"])
    user2_id = str(user2["_id"])
    
    # Create connection
    client.post(
        "/api/connections/request",
        json={"user_id": user2_id},
        headers=headers1
    )
    client.post(
        f"/api/connections/{user1_id}/accept",
        headers=headers2
    )
    
    # Send message
    response = client.post(
        "/api/messages",
        json={
            "receiver_id": user2_id,
            "content": "Hello, connected user!",
            "message_type": "text"
        },
        headers=headers1
    )
    
    assert response.status_code == 200
    assert response.json()["content"] == "Hello, connected user!"

def test_connection_status_endpoint(auth_tokens):
    """Test getting connection status"""
    headers1 = {"Authorization": f"Bearer {auth_tokens['user1_token']}"}
    
    db = get_database()
    user2 = db.users.find_one({"email": test_user2["email"]})
    user2_id = str(user2["_id"])
    
    # Get status (should be not_connected)
    response = client.get(
        f"/api/connections/me/status/{user2_id}",
        headers=headers1
    )
    
    assert response.status_code == 200
    assert response.json()["status"] in ["not_connected", "request_sent", "request_received", "connected"]

def test_get_incoming_requests(auth_tokens):
    """Test getting incoming connection requests"""
    headers1 = {"Authorization": f"Bearer {auth_tokens['user1_token']}"}
    headers2 = {"Authorization": f"Bearer {auth_tokens['user2_token']}"}
    
    db = get_database()
    user2 = db.users.find_one({"email": test_user2["email"]})
    user2_id = str(user2["_id"])
    
    # Send request
    client.post(
        "/api/connections/request",
        json={"user_id": user2_id},
        headers=headers1
    )
    
    # Get incoming requests
    response = client.get(
        "/api/connections/me/requests/incoming",
        headers=headers2
    )
    
    assert response.status_code == 200
    requests = response.json()
    assert len(requests) > 0

