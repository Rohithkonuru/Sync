from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Job(BaseModel):
    id: Optional[str]
    recruiter_id: str
    title: str
    description: str
    location: str
    salary_range: str
    experience_required: str
    skills_required: List[str]
    job_type: str
    status: str = "active"
    created_at: datetime = datetime.utcnow()
    applicants_count: int = 0

class JobApplication(BaseModel):
    id: Optional[str]
    job_id: str
    candidate_id: str
    recruiter_id: str
    resume_url: Optional[str]
    ats_score: float = 0.0
    sync_score: float = 0.0
    growth_score: float = 0.0
    status: str = "submitted"
    is_seen: bool = False
    applied_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

class Connection(BaseModel):
    id: Optional[str]
    requester_id: str
    receiver_id: str
    status: str = "pending"
    created_at: datetime = datetime.utcnow()

class Message(BaseModel):
    id: Optional[str]
    sender_id: str
    receiver_id: str
    message: str
    attachment_url: Optional[str]
    timestamp: datetime = datetime.utcnow()
    seen: bool = False

class Notification(BaseModel):
    id: Optional[str]
    user_id: str
    message: str
    type: str  # e.g., 'job_applied', 'status_update'
    created_at: datetime = datetime.utcnow()
    seen: bool = False