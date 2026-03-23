from datetime import datetime
from bson import ObjectId

from app.database import get_database
from app.services.socket_manager import send_notification

async def create_notification(
    user_id: str,
    type: str,
    title: str,
    message: str,
    link: str = None,
    related_user_id: str = None,
    related_post_id: str = None,
    related_job_id: str = None
):
    """Create a notification"""
    db = get_database()
    
    notification = {
        "user_id": user_id,
        "type": type,
        "title": title,
        "message": message,
        "link": link,
        "related_user_id": related_user_id,
        "related_post_id": related_post_id,
        "related_job_id": related_job_id,
        "read": False,
        "is_read": False,
        "created_at": datetime.utcnow()
    }
    
    result = await db.notifications.insert_one(notification)
    notification["id"] = str(result.inserted_id)
    notification["_id"] = result.inserted_id
    
    # Send via socket
    await send_notification(user_id, notification)
    
    return notification


async def list_notifications(user_id: str, skip: int = 0, limit: int = 20, unread_only: bool = False):
    db = get_database()
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False

    notifications = await db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return notifications


async def count_unread_notifications(user_id: str) -> int:
    db = get_database()
    return await db.notifications.count_documents({"user_id": user_id, "is_read": False})


async def mark_notification_read(notification_id: str, user_id: str):
    db = get_database()
    if not ObjectId.is_valid(notification_id):
        return False

    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user_id},
        {"$set": {"read": True, "is_read": True}}
    )

    return result.modified_count > 0


async def mark_all_notifications_read(user_id: str):
    db = get_database()
    await db.notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"read": True, "is_read": True}}
    )

