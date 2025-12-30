from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class Comment(BaseModel):
    id: Optional[str] = None
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    content: str
    created_at: datetime

class PostBase(BaseModel):
    content: str
    images: List[str] = []
    certificate_id: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    content: str
    images: List[str] = []
    certificate_id: Optional[str] = None
    likes: List[str] = []
    comments: List[Comment] = []
    shares: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str, datetime: str}

