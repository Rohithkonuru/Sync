from fastapi import APIRouter, Depends
from app.database import get_notifications_collection
from app.models import Notification
from app.services.auth import get_current_user
from bson import ObjectId

router = APIRouter()

@router.get("/")
async def get_notifications(user: dict = Depends(get_current_user)):
    notifs = list(get_notifications_collection().find({"user_id": str(user['_id'])}))
    return [{"id": str(n["_id"]), **n} for n in notifs]

@router.post("/")
async def create_notification(user_id: str, message: str, type: str):
    notif = Notification(user_id=user_id, message=message, type=type)
    get_notifications_collection().insert_one(notif.dict())
    return {"message": "Notification created"}