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
        "created_at": datetime.utcnow()
    }
    
    result = await db.notifications.insert_one(notification)
    notification["id"] = str(result.inserted_id)
    
    # Send via socket
    await send_notification(user_id, notification)
    
    return notification

