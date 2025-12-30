from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from datetime import datetime
from bson import ObjectId
from app.models.notification import NotificationResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_database

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    db = get_database()
    user_id = str(current_user["_id"])
    user_type = current_user.get("user_type", "")
    
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    
    # For recruiters, exclude profile visit notifications
    if user_type == "recruiter":
        query["type"] = {"$ne": "profile_visit"}
    
    notifications = await db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    return [notification_to_dict(notif) for notif in notifications]

@router.get("/unread/count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    count = await db.notifications.count_documents({"user_id": user_id, "read": False})
    
    return {"count": count}

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    db = get_database()
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    if notification["user_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}

@router.put("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    db = get_database()
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    if notification["user_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    await db.notifications.delete_one({"_id": ObjectId(notification_id)})
    return {"message": "Notification deleted"}

def notification_to_dict(notification: dict) -> dict:
    """Convert notification document to response dict"""
    if not notification:
        return None
    notification["id"] = str(notification["_id"])
    notification.pop("_id", None)
    return notification

