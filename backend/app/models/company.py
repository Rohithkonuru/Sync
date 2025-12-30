from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class CompanyBase(BaseModel):
    name: str
    description: str
    website: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None  # startup, small, medium, large, enterprise

class CompanyCreate(CompanyBase):
    logo: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    logo: Optional[str] = None

class CompanyResponse(BaseModel):
    id: str
    name: str
    description: str
    website: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    logo: Optional[str] = None
    admin_ids: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str, datetime: str}

