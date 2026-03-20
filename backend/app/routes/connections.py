"""
Connection management endpoints
Provides RESTful API for connection requests, acceptance, and management
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
import random
from bson import ObjectId
from app.middleware.auth_middleware import get_current_user
from app.database import get_database
from app.services.auth import get_user_by_id, user_to_dict
from app.services.notifications import create_notification
from app.services.socket_manager import send_notification
from pydantic import BaseModel

router = APIRouter()

class ConnectionRequestCreate(BaseModel):
    user_id: str

class ConnectionStatusUpdate(BaseModel):
    note: Optional[str] = None

@router.post("/request")
async def send_connection_request(
    request: ConnectionRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a connection request to another user"""
    user_id = request.user_id
    
    if user_id == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot connect to yourself"
        )
    
    db = get_database()
    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already connected
    if user_id in current_user.get("connections", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already connected"
        )
    
    # Check if request already sent
    if str(current_user["_id"]) in target_user.get("connection_requests", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connection request already sent"
        )
    
    # Check if user has already sent a request to current user
    if user_id in current_user.get("connection_requests", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user has already sent you a connection request. Please accept or decline it first."
        )
    
    # Add to connection requests
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"connection_requests": str(current_user["_id"])}}
    )
    
    # Create notification
    notification_data = await create_notification(
        user_id=user_id,
        type="connection_request",
        title="New Connection Request",
        message=f"{current_user.get('first_name')} {current_user.get('last_name')} wants to connect with you",
        related_user_id=str(current_user["_id"])
    )
    await send_notification(user_id, notification_data)
    
    return {
        "message": "Connection request sent",
        "status": "requested"
    }

@router.post("/{user_id}/accept")
async def accept_connection_request(
    user_id: str,
    update: Optional[ConnectionStatusUpdate] = None,
    current_user: dict = Depends(get_current_user)
):
    """Accept a connection request"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    db = get_database()
    requester = await get_user_by_id(user_id)
    if not requester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if request exists
    if user_id not in current_user.get("connection_requests", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending connection request from this user"
        )
    
    # Check if already connected
    if user_id in current_user.get("connections", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already connected"
        )
    
    # Remove from connection requests and add to connections (bi-directional)
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {
            "$pull": {"connection_requests": user_id},
            "$addToSet": {"connections": user_id}
        }
    )
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"connections": str(current_user["_id"])}}
    )

    # record activities for both users
    try:
        from app.services.sync_score import SyncScoreService
        from app.services.growth_score import get_growth_score_service
        sync_service = SyncScoreService()
        growth_service = get_growth_score_service()
        await sync_service.record_activity(str(current_user["_id"]), "connection_added")
        await sync_service.record_activity(user_id, "connection_added")
        await growth_service.record_activity(str(current_user["_id"]), "connection_added")
        await growth_service.record_activity(user_id, "connection_added")
    except Exception:
        pass
    
    # Create notification for requester
    notification_data = await create_notification(
        user_id=user_id,
        type="connection_accepted",
        title="Connection Accepted",
        message=f"{current_user.get('first_name')} {current_user.get('last_name')} accepted your connection request",
        related_user_id=str(current_user["_id"])
    )
    await send_notification(user_id, notification_data)
    
    return {
        "message": "Connection accepted",
        "status": "connected"
    }

@router.post("/{user_id}/decline")
async def decline_connection_request(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Decline a connection request"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    db = get_database()
    
    # Check if request exists
    if user_id not in current_user.get("connection_requests", []):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending connection request from this user"
        )
    
    # Remove from connection requests
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$pull": {"connection_requests": user_id}}
    )
    
    return {
        "message": "Connection request declined",
        "status": "declined"
    }

@router.delete("/{user_id}")
async def remove_connection(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove/unfriend a connection"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    if user_id == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself as a connection"
        )
    
    db = get_database()
    
    # Check if connection exists
    if user_id not in current_user.get("connections", []):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    # Remove from both users' connections (bi-directional)
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$pull": {"connections": user_id}}
    )
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"connections": str(current_user["_id"])}}
    )
    
    return {
        "message": "Connection removed successfully",
        "status": "removed"
    }

@router.get("/me/connections", response_model=List[dict])
async def get_my_connections(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's connections with pagination and search"""
    db = get_database()
    connection_ids = current_user.get("connections", [])
    
    if not connection_ids:
        return []
    
    # Convert to ObjectIds and filter valid ones
    valid_ids = [ObjectId(cid) for cid in connection_ids if ObjectId.is_valid(cid)]
    
    if not valid_ids:
        return []
    
    # Build query
    query = {"_id": {"$in": valid_ids}}
    
    # Add search filter if provided
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"headline": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}}
        ]
    
    # Fetch users with pagination
    users_cursor = db.users.find(query).skip(skip).limit(limit)
    users = await users_cursor.to_list(length=limit)
    
    return [user_to_dict(user) for user in users]

@router.get("/me/requests/incoming")
async def get_incoming_requests(
    current_user: dict = Depends(get_current_user)
):
    """Get incoming connection requests for current user"""
    db = get_database()
    request_ids = current_user.get("connection_requests", [])
    
    if not request_ids:
        return []
    
    # Convert to ObjectIds
    valid_ids = [ObjectId(rid) for rid in request_ids if ObjectId.is_valid(rid)]
    
    if not valid_ids:
        return []
    
    users = await db.users.find({"_id": {"$in": valid_ids}}).to_list(length=None)
    
    return [user_to_dict(user) for user in users]

@router.get("/me/status/{user_id}")
async def get_connection_status(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get connection status between current user and target user"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    if user_id == str(current_user["_id"]):
        return {"status": "self"}
    
    connections = current_user.get("connections", [])
    connection_requests = current_user.get("connection_requests", [])
    
    # Check if connected
    if user_id in connections:
        return {"status": "connected"}
    
    # Check if has incoming request
    if user_id in connection_requests:
        return {"status": "request_received"}
    
    # Check if request sent (need to check target user)
    db = get_database()
    target_user = await get_user_by_id(user_id)
    if target_user and str(current_user["_id"]) in target_user.get("connection_requests", []):
        return {"status": "request_sent"}
    
    return {"status": "not_connected"}


@router.get("/suggestions/{user_id}", response_model=List[dict])
async def get_connection_suggestions(
    user_id: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get connection suggestions excluding self, existing connections, and pending requests."""
    db = get_database()

    # Always scope suggestions by the authenticated user.
    owner_id = str(current_user.get("_id"))
    if user_id != owner_id:
        user_id = owner_id

    current_connections = list(current_user.get("connections", []))
    current_requests = list(current_user.get("connection_requests", []))

    exclude_ids = set(current_connections + current_requests + [owner_id])
    valid_exclude_ids = [ObjectId(uid) for uid in exclude_ids if ObjectId.is_valid(uid)]

    candidates = await db.users.find(
        {
            "_id": {"$nin": valid_exclude_ids},
        },
        {
            "first_name": 1,
            "last_name": 1,
            "headline": 1,
            "location": 1,
            "skills": 1,
            "profile_picture": 1,
            "user_type": 1,
            "connections": 1,
            "connection_requests": 1,
        },
    ).limit(200).to_list(length=200)

    current_skills = {s.lower() for s in (current_user.get("skills") or []) if isinstance(s, str)}
    current_headline = (current_user.get("headline") or "").lower()

    suggestions = []
    for user in candidates:
        uid = str(user.get("_id"))
        if not uid or uid in exclude_ids:
            continue

        user_pending = set(user.get("connection_requests", []))
        user_connections = set(user.get("connections", []))

        # Exclude users where there is already a request relationship either way.
        if owner_id in user_pending or owner_id in user_connections:
            continue

        user_skills = {s.lower() for s in (user.get("skills") or []) if isinstance(s, str)}
        shared_skills = len(current_skills.intersection(user_skills))
        same_location = int((user.get("location") or "").lower() == (current_user.get("location") or "").lower())
        headline_match = int(current_headline and current_headline in (user.get("headline") or "").lower())
        social_boost = min(len(user_connections), 30) / 10

        relevance = (shared_skills * 3) + (same_location * 2) + headline_match + social_boost + random.uniform(0, 1)
        user["_relevance"] = relevance
        suggestions.append(user)

    suggestions.sort(key=lambda x: x.get("_relevance", 0), reverse=True)
    return [user_to_dict(u) for u in suggestions[:limit]]

