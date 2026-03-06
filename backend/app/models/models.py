"""
Database Models
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

# Helper for ObjectId
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

# Enums
class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    PREFER_NOT_TO_SAY = "Prefer not to say"

class UserType(str, Enum):
    STUDENT = "student"
    JOB_SEEKER = "job_seeker"
    PROFESSIONAL = "professional"
    RECRUITER = "recruiter"

class JobType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    REMOTE = "remote"

class JobStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"
    EXPIRED = "expired"

class ApplicationStatus(str, Enum):
    SUBMITTED = "submitted"
    SEEN = "seen"
    IN_PROCESSING = "in_processing"
    SHORTLISTED = "shortlisted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class ConnectionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"

# Base Models
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SoftDeleteMixin(BaseModel):
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(None)

# User Models
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
    current: bool = Field(default=False)
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
    tools: List[str] = Field(default_factory=list)

class UserBase(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    user_type: UserType = UserType.PROFESSIONAL

class User(UserBase, TimestampMixin, SoftDeleteMixin):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    headline: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    banner_picture: Optional[str] = None
    user_type: UserType
    skills: List[str] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)
    resume_url: Optional[str] = None
    gender: Optional[Gender] = None
    ats_score: Optional[Dict[str, Any]] = None
    ats_score_updated: Optional[datetime] = None
    sync_score: int = Field(default=0)
    sync_score_updated: Optional[datetime] = None
    growth_score: int = Field(default=0)
    growth_score_updated: Optional[datetime] = None
    connections: List[str] = Field(default_factory=list)
    connection_requests: List[str] = Field(default_factory=list)
    is_active: bool = Field(default=True)
    last_login: Optional[datetime] = None
    email_verified: bool = Field(default=False)

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True

class UserCreate(UserBase):
    # Personal details
    location: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[List[str]] = None
    education: Optional[List[Education]] = None
    experience: Optional[List[Experience]] = None
    projects: Optional[List[Project]] = None
    certifications: Optional[List[Certification]] = None
    gender: Optional[Gender] = None
    
    # Company details (for recruiter)
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    company_location: Optional[str] = None
    company_industry: Optional[str] = None
    company_size: Optional[str] = None

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
    gender: Optional[Gender] = None

class UserResponse(UserBase):
    pass

# Job Models
class JobBase(BaseModel):
    title: str
    description: str
    requirements: str
    responsibilities: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    location: str
    job_type: JobType = JobType.FULL_TIME
    work_mode: Optional[str] = None
    experience_level: Optional[str] = None
    education_level: Optional[str] = None
    benefits: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_remote: bool = Field(default=False)
    is_active: bool = Field(default=True)

class Job(JobBase, TimestampMixin, SoftDeleteMixin):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    posted_by: str
    company_name: str
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    company_location: str
    company_industry: Optional[str] = None
    company_size: Optional[str] = None
    status: JobStatus = JobStatus.ACTIVE
    application_deadline: Optional[datetime] = None
    applicants: List[str] = Field(default_factory=list)
    views: int = Field(default=0)
    is_featured: bool = Field(default=False)
    is_urgent: bool = Field(default=False)

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    work_mode: Optional[str] = None
    experience_level: Optional[str] = None
    education_level: Optional[str] = None
    benefits: Optional[str] = None
    tags: Optional[List[str]] = None
    is_remote: Optional[bool] = None
    is_active: Optional[bool] = None
    status: Optional[JobStatus] = None
    application_deadline: Optional[datetime] = None

class JobResponse(JobBase):
    id: str
    posted_by: str
    posted_at: datetime
    applicant_count: int = Field(default=0)

# Application Models
class ApplicationBase(BaseModel):
    cover_letter: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience_years: Optional[int] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    resume_file_url: Optional[str] = None

class Application(ApplicationBase, TimestampMixin):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    job_id: str
    applicant_id: str
    recruiter_id: str
    full_name: str
    email: str
    status: ApplicationStatus = ApplicationStatus.SUBMITTED
    is_seen: bool = Field(default=False)
    seen_at: Optional[datetime] = None
    status_history: List[Dict[str, Any]] = Field(default_factory=list)

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    note: Optional[str] = None

class ApplicationResponse(ApplicationBase):
    id: str
    job_id: str
    applicant_id: str
    recruiter_id: str
    full_name: str
    email: str
    status: ApplicationStatus
    is_seen: bool
    seen_at: Optional[datetime]
    applied_at: datetime
    updated_at: datetime
    status_history: List[Dict[str, Any]]
    job: Optional[Dict[str, Any]] = None
    applicant: Optional[Dict[str, Any]] = None

# Connection Models
class ConnectionBase(BaseModel):
    message: Optional[str] = None

class Connection(ConnectionBase, TimestampMixin):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    requester_id: str
    recipient_id: str
    status: ConnectionStatus = ConnectionStatus.PENDING
    message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ConnectionCreate(ConnectionBase):
    message: Optional[str] = None

class ConnectionUpdate(BaseModel):
    status: Optional[ConnectionStatus] = None
    message: Optional[str] = None

class ConnectionResponse(ConnectionBase):
    id: str
    requester_id: str
    recipient_id: str
    status: ConnectionStatus
    message: Optional[str]
    created_at: datetime
    updated_at: datetime
    requester: Optional[Dict[str, Any]] = None
    recipient: Optional[Dict[str, Any]] = None

# Message Models
class MessageBase(BaseModel):
    content: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None

class Message(MessageBase, TimestampMixin):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    sender_id: str
    receiver_id: str
    content: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    is_read: bool = Field(default=False)
    read_at: Optional[datetime] = None

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    is_read: Optional[bool] = None

class MessageResponse(MessageBase):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    file_url: Optional[str]
    file_name: Optional[str]
    file_type: Optional[str]
    file_size: Optional[int]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    sender: Optional[Dict[str, Any]] = None
    receiver: Optional[Dict[str, Any]] = None

# Notification Models
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    related_job_id: Optional[str] = None
    related_user_id: Optional[str] = None
    is_read: bool = Field(default=False)
    read_at: Optional[datetime] = None

class Notification(NotificationBase, TimestampMixin):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    user_id: str
    title: str
    message: str
    type: str
    related_job_id: Optional[str] = None
    related_user_id: Optional[str] = None
    is_read: bool = Field(default=False)
    read_at: Optional[datetime] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    read_at: Optional[datetime] = None

class NotificationResponse(NotificationBase):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    related_job_id: Optional[str]
    related_user_id: Optional[str]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

# Company Models
class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    founded_year: Optional[int] = None
    employee_count: Optional[int] = None
    revenue: Optional[str] = None
    logo_url: Optional[str] = None

class Company(CompanyBase, TimestampMixin, SoftDeleteMixin):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    user_id: str  # Company owner
    is_verified: bool = Field(default=False)

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    founded_year: Optional[int] = None
    employee_count: Optional[int] = None
    revenue: Optional[str] = None
    logo_url: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: str
    user_id: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime

# Post Models
class PostBase(BaseModel):
    content: str
    image_url: Optional[str] = None
    likes: List[str] = Field(default_factory=list)
    comments: List[str] = Field(default_factory=list)
    shares: List[str] = Field(default_factory=list)

class Post(PostBase, TimestampMixin, SoftDeleteMixin):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    author_id: str
    author: Optional[Dict[str, Any]] = None

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None
    likes: Optional[List[str]] = None
    comments: Optional[List[str]] = None
    shares: Optional[List[str]] = None

class PostResponse(PostBase):
    id: str
    author_id: str
    author: Optional[Dict[str, Any]]
    content: str
    image_url: Optional[str]
    likes: List[str]
    comments: List[str]
    shares: List[str]
    created_at: datetime
    updated_at: datetime
    author: Optional[Dict[str, Any]] = None

# Activity Models
class UserActivity(BaseModel):
    activity_type: str
    user_id: str
    data: Optional[Dict[str, Any]] = None
    created_at: datetime

class UserActivityCreate(UserActivity):
    pass

class UserActivityResponse(UserActivity):
    id: str
    activity_type: str
    user_id: str
    data: Optional[Dict[str, Any]]
    created_at: datetime
