from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class Education(BaseModel):
    school: str
    degree: str
    field: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class Experience(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    current: bool = False
    description: Optional[str] = None

class Certification(BaseModel):
    name: str
    issuer: str
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    file_url: Optional[str] = None

class Project(BaseModel):
    name: str
    description: Optional[str] = None
    url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    tools: List[str] = []

class UserBase(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    user_type: str = "professional"  # student, job_seeker, professional, recruiter

class UserCreate(UserBase):
    # Personal details (for job_seeker, student, professional)
    location: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[List[str]] = None
    education: Optional[List[Education]] = None
    experience: Optional[List[Experience]] = None
    projects: Optional[List[Project]] = None
    gender: Optional[str] = None  # Male, Female, Prefer not to say
    
    # Company details (for recruiter)
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    company_location: Optional[str] = None
    company_industry: Optional[str] = None
    company_size: Optional[str] = None  # startup, small, medium, large, enterprise

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    banner_picture: Optional[str] = None
    skills: Optional[List[str]] = None
    education: Optional[List[Education]] = None
    experience: Optional[List[Experience]] = None
    projects: Optional[List[Project]] = None
    certifications: Optional[List[Certification]] = None
    resume_url: Optional[str] = None
    gender: Optional[str] = None  # Male, Female, Prefer not to say

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    headline: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    banner_picture: Optional[str] = None
    user_type: str
    skills: List[str] = []
    education: List[Education] = []
    experience: List[Experience] = []
    projects: List[Project] = []
    certifications: List[Certification] = []
    resume_url: Optional[str] = None
    ats_score: Optional[dict] = None
    ats_score_updated: Optional[datetime] = None
    sync_score: int = 0
    sync_score_updated: Optional[datetime] = None
    profile_completion: Optional[float] = None
    last_activity: Optional[datetime] = None
    previous_sync_score: Optional[int] = None
    previous_ats_score: Optional[float] = None
    growth_score: int = 0
    growth_score_updated: Optional[datetime] = None
    gender: Optional[str] = None  # Only visible to recruiters in analytics
    connections: List[str] = []
    connection_requests: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

