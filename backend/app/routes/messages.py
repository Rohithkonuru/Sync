from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import os
import uuid
from app.models.message import MessageCreate, MessageResponse, ConversationResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_database
from app.services.auth import get_user_by_id, user_to_dict
from app.services.socket_manager import send_message

router = APIRouter()

@router.post("", response_model=MessageResponse)
async def send_message_endpoint(
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a message - only between connected users"""
    db = get_database()
    
    # Verify receiver exists
    receiver = await get_user_by_id(message_data.receiver_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Check if users are connected
    current_user_connections = current_user.get("connections", [])
    receiver_connections = receiver.get("connections", [])
    
    is_connected = (
        message_data.receiver_id in current_user_connections and
        str(current_user["_id"]) in receiver_connections
    )
    
    if not is_connected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only message users you are connected with"
        )
    
    message_dict = {
        "sender_id": str(current_user["_id"]),
        "receiver_id": message_data.receiver_id,
        "content": message_data.content,
        "message_type": message_data.message_type,
        "attachment_url": message_data.attachment_url,
        "attachment_type": message_data.attachment_type,
        "attachment_name": message_data.attachment_name,
        "read": False,
        "read_at": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.messages.insert_one(message_dict)
    message = await db.messages.find_one({"_id": result.inserted_id})
    
    # Send via socket
    message_response = message_to_dict(message)
    await send_message(message_data.receiver_id, message_response)
    
    return message_response

@router.post("/conversations")
async def create_or_get_conversation(
    receiver_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Create or get a conversation with a user"""
    db = get_database()
    
    # Verify receiver exists
    receiver = await get_user_by_id(receiver_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Check if users are connected
    current_user_connections = current_user.get("connections", [])
    receiver_connections = receiver.get("connections", [])
    
    is_connected = (
        receiver_id in current_user_connections and
        str(current_user["_id"]) in receiver_connections
    )
    
    if not is_connected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only message users you are connected with"
        )
    
    # Get or create conversation
    current_user_id = str(current_user["_id"])
    
    # Get last message
    last_message_doc = await db.messages.find_one({
        "$or": [
            {"sender_id": current_user_id, "receiver_id": receiver_id},
            {"sender_id": receiver_id, "receiver_id": current_user_id}
        ]
    }, sort=[("created_at", -1)])
    
    # Count unread messages
    unread_count = await db.messages.count_documents({
        "sender_id": receiver_id,
        "receiver_id": current_user_id,
        "read": False
    })
    
    return {
        "user_id": receiver_id,
        "user_name": f"{receiver.get('first_name', '')} {receiver.get('last_name', '')}".strip(),
        "user_picture": receiver.get("profile_picture"),
        "last_message": message_to_dict(last_message_doc) if last_message_doc else None,
        "unread_count": unread_count,
        "updated_at": last_message_doc.get("created_at") if last_message_doc else datetime.utcnow()
    }

@router.post("/{receiver_id}/attachment")
async def send_message_with_attachment(
    receiver_id: str,
    content: str = Query(""),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Send a message with file attachment"""
    db = get_database()
    
    # Verify receiver exists
    receiver = await get_user_by_id(receiver_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Check if users are connected
    current_user_connections = current_user.get("connections", [])
    receiver_connections = receiver.get("connections", [])
    
    is_connected = (
        receiver_id in current_user_connections and
        str(current_user["_id"]) in receiver_connections
    )
    
    if not is_connected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only message users you are connected with"
        )
    
    # Validate file
    max_size = 10 * 1024 * 1024  # 10MB
    allowed_types = ["application/pdf", "application/msword", 
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                     "image/jpeg", "image/png", "image/gif"]
    
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Save file
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads/messages")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    file_url = f"/uploads/messages/{file_name}"
    
    # Determine message type
    message_type = "attachment"
    if file.content_type.startswith("image/"):
        message_type = "image"
    
    message_dict = {
        "sender_id": str(current_user["_id"]),
        "receiver_id": receiver_id,
        "content": content or f"Sent {file.filename}",
        "message_type": message_type,
        "attachment_url": file_url,
        "attachment_type": file.content_type,
        "attachment_name": file.filename,
        "shared_post_id": None,
        "read": False,
        "read_at": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.messages.insert_one(message_dict)
    message = await db.messages.find_one({"_id": result.inserted_id})
    
    # Send via socket
    message_response = message_to_dict(message)
    await send_message(receiver_id, message_response)
    
    return message_response

@router.post("/share-post")
async def share_post_to_message(
    receiver_id: str = Query(...),
    post_id: str = Query(...),
    note: Optional[str] = Query(""),
    current_user: dict = Depends(get_current_user)
):
    """Share a post to a connection via message"""
    db = get_database()
    
    # Verify receiver exists
    receiver = await get_user_by_id(receiver_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Check if users are connected
    current_user_connections = current_user.get("connections", [])
    receiver_connections = receiver.get("connections", [])
    
    is_connected = (
        receiver_id in current_user_connections and
        str(current_user["_id"]) in receiver_connections
    )
    
    if not is_connected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only share posts with users you are connected with"
        )
    
    # Verify post exists
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID format"
        )
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Create message with shared post
    message_dict = {
        "sender_id": str(current_user["_id"]),
        "receiver_id": receiver_id,
        "content": note or f"Shared a post: {post.get('content', '')[:100]}...",
        "message_type": "post_share",
        "shared_post_id": post_id,
        "read": False,
        "read_at": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.messages.insert_one(message_dict)
    message = await db.messages.find_one({"_id": result.inserted_id})
    
    # Send via socket
    message_response = message_to_dict(message)
    await send_message(receiver_id, message_response)
    
    return message_response

@router.get("", response_model=List[ConversationResponse])
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all conversations for current user - only with connected users"""
    db = get_database()
    user_id = str(current_user["_id"])
    connections = current_user.get("connections", [])
    
    if not connections:
        return []
    
    # Get all messages where user is sender or receiver, and partner is in connections
    messages = await db.messages.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": {"$in": connections}},
            {"receiver_id": user_id, "sender_id": {"$in": connections}}
        ]
    }).sort("created_at", -1).to_list(length=1000)
    
    # Group by conversation partner
    conversations = {}
    for msg in messages:
        partner_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
        
        # Only include connected users
        if partner_id not in connections:
            continue
        
        if partner_id not in conversations:
            partner = await get_user_by_id(partner_id)
            if partner:
                conversations[partner_id] = {
                    "user_id": partner_id,
                    "user_name": f"{partner.get('first_name', '')} {partner.get('last_name', '')}".strip(),
                    "user_picture": partner.get("profile_picture"),
                    "last_message": None,
                    "unread_count": 0,
                    "updated_at": msg["created_at"]
                }
        
        # Update last message if newer
        if not conversations[partner_id]["last_message"] or \
           msg["created_at"] > conversations[partner_id]["updated_at"]:
            conversations[partner_id]["last_message"] = message_to_dict(msg)
            conversations[partner_id]["updated_at"] = msg["created_at"]
        
        # Count unread messages
        if msg["receiver_id"] == user_id and not msg.get("read", False):
            conversations[partner_id]["unread_count"] += 1
    
    return list(conversations.values())

@router.get("/{user_id}", response_model=List[MessageResponse])
async def get_conversation(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get conversation with a specific user - only if connected"""
    db = get_database()
    current_user_id = str(current_user["_id"])
    
    # Verify receiver exists and check connection
    receiver = await get_user_by_id(user_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if users are connected
    current_user_connections = current_user.get("connections", [])
    receiver_connections = receiver.get("connections", [])
    
    is_connected = (
        user_id in current_user_connections and
        str(current_user["_id"]) in receiver_connections
    )
    
    if not is_connected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view conversations with users you are connected with"
        )
    
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user_id, "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": current_user_id}
        ]
    }).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    # Mark messages as read with timestamp
    await db.messages.update_many(
        {
            "sender_id": user_id,
            "receiver_id": current_user_id,
            "read": False
        },
        {
            "$set": {
                "read": True,
                "read_at": datetime.utcnow()
            }
        }
    )
    
    return [message_to_dict(msg) for msg in reversed(messages)]

@router.put("/{message_id}/read")
async def mark_message_read(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a message as read"""
    db = get_database()
    if not ObjectId.is_valid(message_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    message = await db.messages.find_one({"_id": ObjectId(message_id)})
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    if message["receiver_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    await db.messages.update_one(
        {"_id": ObjectId(message_id)},
        {
            "$set": {
                "read": True,
                "read_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Message marked as read"}

def message_to_dict(message: dict) -> dict:
    """Convert message document to response dict"""
    if not message:
        return None
    message["id"] = str(message["_id"])
    message.pop("_id", None)
    # Ensure all fields are present for backward compatibility
    message.setdefault("attachment_url", None)
    message.setdefault("attachment_type", None)
    message.setdefault("attachment_name", None)
    message.setdefault("shared_post_id", None)
    message.setdefault("read_at", None)
    return message

