from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from datetime import timedelta
from typing import Optional
from app.models.user import UserCreate, UserLogin, Token, UserResponse
from app.models.otp import OTPSendRequest, OTPVerifyRequest, OTPResponse
from app.services.auth import (
    create_user, authenticate_user, create_access_token,
    user_to_dict, get_user_by_email
)
from app.services.otp import send_email_otp, send_sms_otp, verify_otp
from app.config import settings
from app.middleware.auth_middleware import get_current_user
import os
import uuid

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(
    email: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    user_type: Optional[str] = Form("professional"),
    # Alternate field names from some clients/builds
    firstName: Optional[str] = Form(None),
    lastName: Optional[str] = Form(None),
    userType: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    headline: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),  # JSON string
    company_name: Optional[str] = Form(None),
    company_description: Optional[str] = Form(None),
    company_website: Optional[str] = Form(None),
    company_location: Optional[str] = Form(None),
    company_industry: Optional[str] = Form(None),
    company_size: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None)
):
    """Register a new user with optional resume upload"""
    import json

    # Normalize alternate field names and avoid framework-level 422 loops.
    first_name = first_name or firstName
    last_name = last_name or lastName
    user_type = user_type or userType or "professional"

    missing_fields = []
    if not email:
        missing_fields.append("email")
    if not password:
        missing_fields.append("password")
    if not first_name:
        missing_fields.append("first_name")
    if not last_name:
        missing_fields.append("last_name")

    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required fields: {', '.join(missing_fields)}"
        )
    
    # Validate resume requirement for student/professional/job_seeker
    if user_type in ['student', 'job_seeker'] and not resume_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume upload is required for students and job seekers"
        )
    
    # Process resume file if provided
    resume_url = None
    if resume_file:
        # Validate file type
        allowed_types = ["application/pdf", "application/msword", 
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        if resume_file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only PDF, DOC, and DOCX files are allowed."
            )
        
        # Validate file size (max 10MB)
        file_content = await resume_file.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 10MB."
            )
        
        # Save resume file
        upload_dir = os.getenv("UPLOAD_DIR", "./uploads/resumes")
        os.makedirs(upload_dir, exist_ok=True)
        
        file_ext = os.path.splitext(resume_file.filename)[1]
        unique_filename = f"resume_{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        resume_url = f"/uploads/resumes/{unique_filename}"
    
    # Parse skills if provided
    skills_list = []
    if skills:
        try:
            skills_list = json.loads(skills) if isinstance(skills, str) else skills
        except Exception:
            # Fallback for comma-separated skills from multipart forms.
            if isinstance(skills, str):
                skills_list = [s.strip() for s in skills.split(',') if s.strip()]
    
    # Build user data dict
    user_dict = {
        "email": email,
        "password": password,
        "first_name": first_name,
        "last_name": last_name,
        "user_type": user_type,
        "location": location,
        "headline": headline,
        "bio": bio,
        "phone": phone,
        "skills": skills_list,
        "resume_url": resume_url,
        "company_name": company_name,
        "company_description": company_description,
        "company_website": company_website,
        "company_location": company_location,
        "company_industry": company_industry,
        "company_size": company_size,
    }
    
    # Remove None values
    user_dict = {k: v for k, v in user_dict.items() if v is not None}
    
    user = await create_user(user_dict)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.jwt_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    user_response = user_to_dict(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/register/simple", response_model=Token)
async def register_simple(user_data: UserCreate):
    """Simple registration without file upload"""
    user_dict = user_data.dict()
    
    # Remove None values
    user_dict = {k: v for k, v in user_dict.items() if v is not None}
    
    user = await create_user(user_dict)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.jwt_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    user_response = user_to_dict(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user"""
    user = await authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # on successful login record activity and update scores
    try:
        from app.services.sync_score import SyncScoreService
        from app.services.growth_score import get_growth_score_service
        sync_service = SyncScoreService()
        growth_service = get_growth_score_service()
        uid = str(user["_id"])
        await sync_service.record_activity(uid, "login")
        await growth_service.record_activity(uid, "login")
    except Exception:
        pass
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.jwt_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    user_response = user_to_dict(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return user_to_dict(current_user)

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Refresh access token"""
    access_token_expires = timedelta(minutes=settings.jwt_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(current_user["_id"])}, expires_delta=access_token_expires
    )
    
    user_response = user_to_dict(current_user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/forgot-password")
async def forgot_password(email: str):
    """Request password reset (placeholder - implement email service)"""
    user = await get_user_by_email(email)
    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, password reset link has been sent"}
    
    # TODO: Implement email service to send reset link
    return {"message": "Password reset link sent to email"}

@router.post("/otp/send", response_model=OTPResponse)
async def send_otp(request: OTPSendRequest):
    """Send OTP to email or phone"""
    if request.email:
        try:
            otp = await send_email_otp(request.email, purpose="email verification")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to send email OTP: {str(e)}"
            )
        return OTPResponse(
            message="OTP sent to email",
            success=True,
            otp=otp if settings.otp_debug_mode else None,
        )
    elif request.phone:
        try:
            otp = await send_sms_otp(request.phone)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to send SMS OTP: {str(e)}"
            )
        return OTPResponse(
            message="OTP sent to phone",
            success=True,
            otp=otp if settings.otp_debug_mode else None,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone must be provided"
        )

@router.post("/otp/verify", response_model=OTPResponse)
async def verify_otp_endpoint(request: OTPVerifyRequest):
    """Verify OTP for email or phone"""
    if request.email:
        is_valid = await verify_otp(request.email, request.otp, "email")
    elif request.phone:
        is_valid = await verify_otp(request.phone, request.otp, "phone")
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone must be provided"
        )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    return OTPResponse(message="OTP verified successfully", success=True)

