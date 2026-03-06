from fastapi import APIRouter, Depends, WebSocket
from app.database import get_messages_collection
from app.models import Message
from app.services.auth import get_current_user
from bson import ObjectId

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        # Save message
        msg = Message(sender_id=user_id, receiver_id=data['receiver'], message=data['message'])
        get_messages_collection().insert_one(msg.dict())
        # Broadcast (simplified; in production, use a pub/sub)

@router.get("/{user_id}")
async def get_messages(user_id: str, user: dict = Depends(get_current_user)):
    msgs = list(get_messages_collection().find({"$or": [{"sender_id": str(user['_id']), "receiver_id": user_id}, {"sender_id": user_id, "receiver_id": str(user['_id'])}]}))
    return [{"id": str(m["_id"]), **m} for m in msgs]