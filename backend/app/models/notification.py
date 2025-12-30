from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

class NotificationBase(BaseModel):
    user_id: str
    type: str  # like, comment, connection_request, connection_accepted, job_match, message
    title: str
    message: str
    link: Optional[str] = None
    related_user_id: Optional[str] = None
    related_post_id: Optional[str] = None
    related_job_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    related_user_id: Optional[str] = None
    related_post_id: Optional[str] = None
    related_job_id: Optional[str] = None
    read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str, datetime: str}

