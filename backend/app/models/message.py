from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

class MessageBase(BaseModel):
    receiver_id: str
    content: str
    message_type: str = "text"  # text, image, file, attachment, post_share
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None  # pdf, doc, image, etc.
    attachment_name: Optional[str] = None
    shared_post_id: Optional[str] = None  # For post sharing

class MessageCreate(MessageBase):
    pass

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    message_type: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_name: Optional[str] = None
    shared_post_id: Optional[str] = None
    read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str, datetime: str}

class ConversationResponse(BaseModel):
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str, datetime: str}

