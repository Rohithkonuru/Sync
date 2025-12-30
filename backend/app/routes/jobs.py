from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import os
import uuid
from app.models.job import (
    JobCreate, JobResponse, JobUpdate, JobApplication, 
    JobApplicationCreate, JobApplicationResponse, ApplicationStatusUpdate
)
from app.middleware.auth_middleware import get_current_user
from app.database import get_database
from app.services.notifications import create_notification
from app.services.socket_manager import send_notification
from app.services.auth import get_user_by_id

router = APIRouter()

def job_to_dict(job: dict) -> dict:
    """Convert MongoDB job document to dict with id field"""
    if not job:
        return None
    job_dict = dict(job)
    if "_id" in job_dict:
        job_dict["id"] = str(job_dict["_id"])
        del job_dict["_id"]
    # Ensure applicants is a list
    if "applicants" not in job_dict:
        job_dict["applicants"] = []
    return job_dict

@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new job posting"""
    if current_user.get("user_type") != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can create job postings"
        )

    db = get_database()
    job_dict = job_data.dict()

    # If no company is selected, use recruiter's info as company
    if not job_dict.get("company_id") or not job_dict.get("company_name"):
        job_dict["company_id"] = str(current_user["_id"])  # Use user ID as company ID for now
        job_dict["company_name"] = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or "Personal"

    job_dict["recruiter_id"] = str(current_user["_id"])
    job_dict["posted_by"] = str(current_user["_id"])  # Keep for backward compatibility
    job_dict["created_at"] = datetime.utcnow()
    job_dict["updated_at"] = datetime.utcnow()
    job_dict["status"] = "active"  # Default status as per task
    job_dict["applicants"] = []

    result = await db.jobs.insert_one(job_dict)
    job_dict["_id"] = result.inserted_id

    return job_to_dict(job_dict)

@router.get("/", response_model=List[JobResponse])
async def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    title: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    salary_min: Optional[int] = Query(None, ge=0),
    salary_max: Optional[int] = Query(None, ge=0),
    skills: Optional[str] = Query(None),
    company: Optional[str] = Query(None)
):
    """Get jobs with optional filters"""
    db = get_database()
    query = {"status": {"$in": ["active", "open"]}}  # Support both statuses

    if title:
        query["title"] = {"$regex": title, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if job_type:
        query["job_type"] = job_type
    if experience_level:
        query["experience_level"] = experience_level
    if salary_min is not None or salary_max is not None:
        salary_query = {}
        if salary_min is not None:
            salary_query["$gte"] = salary_min
        if salary_max is not None:
            salary_query["$lte"] = salary_max
        query["salary_range.min"] = salary_query
    if skills:
        skill_list = [s.strip() for s in skills.split(",") if s.strip()]
        if skill_list:
            query["required_skills"] = {"$in": skill_list}
    if company:
        query["company_name"] = {"$regex": company, "$options": "i"}

    jobs_cursor = db.jobs.find(query).skip(skip).limit(limit).sort("created_at", -1)
    jobs = await jobs_cursor.to_list(length=limit)

    return [job_to_dict(job) for job in jobs]

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get job by ID"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    db = get_database()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    return job_to_dict(job)

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_update: JobUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update job posting"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    db = get_database()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    if str(job["posted_by"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the job poster can update this job"
        )

    update_data = job_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update_data}
    )

    updated_job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    return job_to_dict(updated_job)

@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete job posting"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    db = get_database()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    if str(job["posted_by"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the job poster can delete this job"
        )

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "deleted", "updated_at": datetime.utcnow()}}
    )

    return {"message": "Job deleted successfully"}

@router.post("/{job_id}/apply")
async def apply_for_job(
    job_id: str,
    full_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    contact_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    cover_letter: str = Form(""),
    contact_email: Optional[str] = Form(None),
    contact_phone: Optional[str] = Form(None),
    portfolio_url: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),  # JSON string or comma-separated
    experience_years: Optional[int] = Form(None),
    custom_fields: Optional[str] = Form(None),  # JSON string
    resume_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Apply for a job with enhanced form fields"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    db = get_database()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check if job is active/open
    if job.get("status") not in ["active", "open"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is not active"
        )

    # Check if already applied
    existing_application = await db.job_applications.find_one({
        "job_id": job_id,
        "applicant_id": str(current_user["_id"])
    })
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already applied for this job"
        )

    # Handle resume file upload
    resume_file_url = None
    if resume_file:
        # Validate file
        max_size = 5 * 1024 * 1024  # 5MB
        allowed_types = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]
        
        file_content = await resume_file.read()
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume file size exceeds 5MB limit"
            )
        
        if resume_file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only PDF and DOC files are allowed"
            )
        
        # Save file
        upload_dir = os.getenv("UPLOAD_DIR", "./uploads/resumes")
        os.makedirs(upload_dir, exist_ok=True)
        
        file_ext = os.path.splitext(resume_file.filename)[1]
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        resume_file_url = f"/uploads/resumes/{file_name}"

    # Parse skills
    skills_list = []
    if skills:
        try:
            # Try parsing as JSON array first
            import json
            skills_list = json.loads(skills)
        except:
            # Fall back to comma-separated string
            skills_list = [s.strip() for s in skills.split(",") if s.strip()]

    # Get user's experience years from profile if not provided
    user = await get_user_by_id(str(current_user["_id"]))
    if not experience_years and user:
        # Calculate from experience array
        total_years = 0
        for exp in user.get("experience", []):
            if exp.get("start_date") and (exp.get("end_date") or exp.get("current")):
                # Simple calculation (can be improved)
                total_years += 2  # Default estimate
        experience_years = total_years if total_years > 0 else None

    # Parse custom_fields if provided
    custom_fields_dict = None
    if custom_fields:
        try:
            import json
            custom_fields_dict = json.loads(custom_fields)
        except:
            pass

    # Get user info to populate fields if not provided
    user = await get_user_by_id(str(current_user["_id"]))
    if not full_name and user:
        full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    if not email and user:
        email = user.get('email')
    if not contact_number and user:
        contact_number = user.get('phone') or contact_phone
    if not contact_email:
        contact_email = email
    
    # Validate mandatory fields
    errors = {}
    if not full_name or not full_name.strip():
        errors["full_name"] = "Full name is required"
    if not email or not email.strip():
        errors["email"] = "Email is required"
    elif "@" not in email or "." not in email.split("@")[1]:
        errors["email"] = "Invalid email format"
    if not contact_number or not contact_number.strip():
        errors["contact_number"] = "Contact number is required"
    if not resume_file:
        errors["resume_file"] = "Resume upload is required"
    
    if errors:
        # Return validation errors in a format that frontend can parse
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Validation failed", "errors": errors}
        )

    # Create application with status history
    application_dict = {
        "job_id": job_id,
        "applicant_id": str(current_user["_id"]),
        "full_name": full_name,
        "email": email,
        "contact_number": contact_number or contact_phone,
        "address": address,
        "cover_letter": cover_letter,
        "contact_email": contact_email,
        "contact_phone": contact_phone or contact_number,
        "portfolio_url": portfolio_url,
        "skills": skills_list,
        "experience_years": experience_years,
        "custom_fields": custom_fields_dict,
        "resume_file_url": resume_file_url,
        "applied_at": datetime.utcnow(),
        "status": "submitted",
        "updated_at": datetime.utcnow(),
        "status_history": [{
            "status": "submitted",
            "updated_at": datetime.utcnow(),
            "updated_by": str(current_user["_id"]),
            "note": "Application submitted"
        }]
    }

    result = await db.job_applications.insert_one(application_dict)
    
    # Add applicant to job's applicants list
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$addToSet": {"applicants": str(current_user["_id"])}}
    )

    # Create notification for job poster
    notification_data = await create_notification(
        user_id=str(job["posted_by"]),
        type="job_application",
        title="New Job Application",
        message=f"{current_user.get('first_name')} {current_user.get('last_name')} applied for {job['title']}",
        related_job_id=job_id,
        related_user_id=str(current_user["_id"])
    )
    
    # Send real-time notification via WebSocket
    await send_notification(str(job["posted_by"]), notification_data)

    return {"message": "Application submitted successfully", "application_id": str(result.inserted_id)}

@router.get("/{job_id}/applications")
async def get_job_applications(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get applications for a job (job poster only)"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    db = get_database()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    if str(job["posted_by"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the job poster can view applications"
        )

    applications = await db.job_applications.find({"job_id": job_id}).sort("applied_at", -1).to_list(length=None)

    # Enrich with applicant data and convert to dict
    enriched_applications = []
    for app in applications:
        applicant = await db.users.find_one({"_id": ObjectId(app["applicant_id"])})
        if applicant:
            app["applicant"] = {
                "id": str(applicant["_id"]),
                "first_name": applicant.get("first_name"),
                "last_name": applicant.get("last_name"),
                "email": applicant.get("email"),
                "headline": applicant.get("headline"),
                "location": applicant.get("location"),
                "profile_picture": applicant.get("profile_picture")
            }
        # Convert to dict format
        enriched_applications.append(application_to_dict(app))

    return enriched_applications

@router.get("/recruiter/jobs/{job_id}/applications")
async def get_recruiter_job_applications(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Alias endpoint for /api/jobs/{job_id}/applications - returns applications for recruiter-owned job"""
    return await get_job_applications(job_id, current_user)

@router.get("/my-applications/list", response_model=List[JobApplicationResponse])
async def get_my_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's job applications with pagination"""
    db = get_database()
    applications = await db.job_applications.find({
        "applicant_id": str(current_user["_id"])
    }).sort("applied_at", -1).skip(skip).limit(limit).to_list(length=limit)

    # Enrich with job data and convert to dict
    enriched_applications = []
    for app in applications:
        job = await db.jobs.find_one({"_id": ObjectId(app["job_id"])})
        if job:
            app["job"] = {
                "id": str(job["_id"]),
                "title": job.get("title"),
                "company_name": job.get("company_name"),
                "location": job.get("location"),
                "job_type": job.get("job_type"),
                "posted_by": str(job.get("posted_by", ""))
            }
        enriched_applications.append(application_to_dict(app))

    return enriched_applications

@router.get("/my-jobs/list", response_model=List[JobResponse])
async def get_my_jobs(current_user: dict = Depends(get_current_user)):
    """Get jobs posted by current user"""
    db = get_database()
    jobs = await db.jobs.find({
        "posted_by": str(current_user["_id"]),
        "status": {"$ne": "deleted"}
    }).sort("created_at", -1).to_list(length=None)

    return [job_to_dict(job) for job in jobs]

@router.get("/applications/{application_id}", response_model=JobApplicationResponse)
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get application by ID"""
    if not ObjectId.is_valid(application_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )

    db = get_database()
    application = await db.job_applications.find_one({"_id": ObjectId(application_id)})
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Check authorization: applicant or job poster
    job = await db.jobs.find_one({"_id": ObjectId(application["job_id"])})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    is_applicant = application["applicant_id"] == str(current_user["_id"])
    is_poster = job["posted_by"] == str(current_user["_id"])

    if not is_applicant and not is_poster:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this application"
        )

    # Enrich with applicant and job data
    applicant = await get_user_by_id(application["applicant_id"])
    if applicant:
        application["applicant"] = {
            "id": str(applicant["_id"]),
            "first_name": applicant.get("first_name"),
            "last_name": applicant.get("last_name"),
            "email": applicant.get("email"),
            "headline": applicant.get("headline"),
            "location": applicant.get("location"),
            "profile_picture": applicant.get("profile_picture")
        }

    return application_to_dict(application)

@router.get("/applications/{application_id}/history")
async def get_application_history(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get application status history"""
    if not ObjectId.is_valid(application_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )

    db = get_database()
    application = await db.job_applications.find_one({"_id": ObjectId(application_id)})
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Check authorization: applicant or job poster
    job = await db.jobs.find_one({"_id": ObjectId(application["job_id"])})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    is_applicant = application["applicant_id"] == str(current_user["_id"])
    is_poster = job["posted_by"] == str(current_user["_id"])

    if not is_applicant and not is_poster:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this application history"
        )

    # Get status history and enrich with updater info
    status_history = application.get("status_history", [])
    enriched_history = []
    
    for entry in status_history:
        updater = await get_user_by_id(entry.get("updated_by", ""))
        enriched_entry = {
            "status": entry.get("status"),
            "updated_at": entry.get("updated_at"),
            "updated_by": {
                "id": entry.get("updated_by"),
                "name": f"{updater.get('first_name', '')} {updater.get('last_name', '')}".strip() if updater else "Unknown"
            },
            "note": entry.get("note")
        }
        enriched_history.append(enriched_entry)
    
    return {"history": enriched_history}

@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update application status (recruiter only)"""
    if not ObjectId.is_valid(application_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )

    valid_statuses = ["drafted", "submitted", "seen", "in-processing", "shortlisted", "accepted", "rejected"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    db = get_database()
    application = await db.job_applications.find_one({"_id": ObjectId(application_id)})
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    job = await db.jobs.find_one({"_id": ObjectId(application["job_id"])})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Only job poster can update status
    if str(job["posted_by"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the job poster can update application status"
        )

    # Add to status history
    status_history = application.get("status_history", [])
    status_history.append({
        "status": status_update.status,
        "updated_at": datetime.utcnow(),
        "updated_by": str(current_user["_id"]),
        "note": status_update.note
    })

    # Update application
    await db.job_applications.update_one(
        {"_id": ObjectId(application_id)},
        {
            "$set": {
                "status": status_update.status,
                "updated_at": datetime.utcnow(),
                "status_updated_by": str(current_user["_id"]),
                "status_history": status_history
            }
        }
    )

    # Create notification for applicant
    applicant = await get_user_by_id(application["applicant_id"])
    if applicant:
        notification_data = await create_notification(
            user_id=application["applicant_id"],
            type="application_status_update",
            title="Application Status Updated",
            message=f"Your application for {job['title']} has been updated to {status_update.status}",
            related_job_id=application["job_id"],
            related_user_id=str(current_user["_id"])
        )
        await send_notification(application["applicant_id"], notification_data)

    return {"message": "Application status updated successfully"}

@router.post("/applications/{application_id}/status")
async def update_application_status_post(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update application status (POST alias for PUT)"""
    return await update_application_status(application_id, status_update, current_user)

@router.get("/applications/{application_id}/resume")
async def download_resume(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download resume file for an application"""
    if not ObjectId.is_valid(application_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )

    db = get_database()
    application = await db.job_applications.find_one({"_id": ObjectId(application_id)})
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    job = await db.jobs.find_one({"_id": ObjectId(application["job_id"])})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check authorization: applicant or job poster
    is_applicant = application["applicant_id"] == str(current_user["_id"])
    is_poster = job["posted_by"] == str(current_user["_id"])

    if not is_applicant and not is_poster:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to download this resume"
        )

    resume_file_url = application.get("resume_file_url")
    if not resume_file_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found for this application"
        )

    # Remove leading slash and construct file path
    file_path = resume_file_url.lstrip("/")
    if not os.path.exists(file_path):
        # Try with uploads prefix
        file_path = os.path.join(os.getenv("UPLOAD_DIR", "./uploads"), file_path.replace("uploads/", ""))
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found on server"
        )

    from fastapi.responses import FileResponse
    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type="application/pdf"
    )

@router.delete("/applications/{application_id}")
async def delete_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an application (applicant or job poster only)"""
    if not ObjectId.is_valid(application_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )

    db = get_database()
    application = await db.job_applications.find_one({"_id": ObjectId(application_id)})
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    job = await db.jobs.find_one({"_id": ObjectId(application["job_id"])})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check authorization: applicant or job poster
    is_applicant = application["applicant_id"] == str(current_user["_id"])
    is_poster = job["posted_by"] == str(current_user["_id"])

    if not is_applicant and not is_poster:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the applicant or job poster can delete this application"
        )

    # Delete application
    await db.job_applications.delete_one({"_id": ObjectId(application_id)})

    # Remove from job's applicants list
    await db.jobs.update_one(
        {"_id": ObjectId(application["job_id"])},
        {"$pull": {"applicants": application["applicant_id"]}}
    )

    return {"message": "Application deleted successfully"}

def application_to_dict(application: dict) -> dict:
    """Convert application document to response dict"""
    if not application:
        return None
    app_dict = dict(application)
    if "_id" in app_dict:
        app_dict["id"] = str(app_dict["_id"])
        del app_dict["_id"]
    # Ensure all fields are present
    app_dict.setdefault("status_history", [])
    app_dict.setdefault("skills", [])
    app_dict.setdefault("experience_years", None)
    app_dict.setdefault("portfolio_url", None)
    app_dict.setdefault("full_name", None)
    app_dict.setdefault("email", None)
    app_dict.setdefault("contact_number", None)
    app_dict.setdefault("address", None)
    app_dict.setdefault("custom_fields", None)
    app_dict.setdefault("resume_file_url", None)
    return app_dict
