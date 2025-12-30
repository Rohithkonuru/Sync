from pydantic import BaseModel, Field, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class JobBase(BaseModel):
    title: str
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    location: str
    job_type: str = "full-time"  # full-time, part-time, contract, internship
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    description: str
    requirements: List[str] = []
    benefits: List[str] = []
    required_skills: List[str] = []
    experience_level: Optional[str] = "mid"  # entry, mid, senior, executive

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    status: Optional[str] = None  # open, closed

class JobResponse(BaseModel):
    id: str
    title: str
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    location: str
    job_type: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    description: str
    requirements: List[str] = []
    benefits: List[str] = []
    required_skills: List[str] = []
    experience_level: Optional[str] = "mid"
    applicants: List[str] = []
    status: str = "open"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str, datetime: str}

class ApplicationStatusHistory(BaseModel):
    status: str
    updated_at: datetime
    updated_by: str
    note: Optional[str] = None

class JobApplication(BaseModel):
    job_id: str
    user_id: str
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    resume_file_url: Optional[str] = None  # For uploaded resume file
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    portfolio_url: Optional[HttpUrl] = None
    skills: List[str] = []
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    custom_fields: Optional[dict] = None  # For custom fields (JSON)
    additional_info: Optional[dict] = None  # For backward compatibility
    status: str = "drafted"  # drafted, submitted, seen, in-processing, shortlisted, accepted, rejected
    applied_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    status_updated_by: Optional[str] = None
    status_history: List[ApplicationStatusHistory] = []

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str, datetime: str}

class JobApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    portfolio_url: Optional[HttpUrl] = None
    skills: List[str] = []
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    additional_info: Optional[dict] = None

class JobApplicationResponse(BaseModel):
    id: str
    job_id: str
    applicant_id: str
    applicant: Optional[dict] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    cover_letter: Optional[str] = None
    resume_file_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = None
    custom_fields: Optional[dict] = None
    additional_info: Optional[dict] = None
    status: str
    applied_at: datetime
    updated_at: Optional[datetime] = None
    status_updated_by: Optional[str] = None
    status_history: List[dict] = []

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str, datetime: str}

class ApplicationStatusUpdate(BaseModel):
    status: str  # drafted, submitted, seen, in-processing, shortlisted, accepted, rejected
    note: Optional[str] = None
