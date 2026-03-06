"""
Job routes with clean architecture
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from typing import Optional, List
from app.controllers import BaseController
from app.models import Job, JobCreate, JobUpdate, JobType, JobStatus
from app.validators import validate_job_creation_data
from app.middleware.auth_middleware import get_current_user
from app.utils.database import build_filter_query, add_soft_delete_filter
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/jobs", tags=["jobs"])
job_controller = BaseController("jobs")

@router.post("/", response_model=dict)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new job posting"""
    try:
        # Validate user is recruiter
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only recruiters can create job postings"
            )
        
        # Validate job data
        validated_data = validate_job_creation_data(job_data.dict())
        
        # Add recruiter info
        validated_data["posted_by"] = current_user["_id"]
        validated_data["company_name"] = validated_data.get("company_name") or f"{current_user['first_name']} {current_user['last_name']}"
        validated_data["company_location"] = validated_data.get("company_location") or current_user.get("location", "")
        
        # Create job
        job = await job_controller.create(validated_data)
        
        return {
            "success": True,
            "message": "Job created successfully",
            "data": job
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create job: {str(e)}"
        )

@router.get("/", response_model=dict)
async def list_jobs(
    skip: int = Query(0, ge=0, description="Number of jobs to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of jobs to return"),
    sort_field: str = Query("created_at", description="Field to sort by"),
    sort_direction: int = Query(-1, description="Sort direction (1 for asc, -1 for desc)"),
    job_type: Optional[JobType] = Query(None, description="Filter by job type"),
    location: Optional[str] = Query(None, description="Filter by location"),
    is_remote: Optional[bool] = Query(None, description="Filter remote jobs"),
    is_active: Optional[bool] = Query(True, description="Filter active jobs"),
    search: Optional[str] = Query(None, description="Search in job title and description"),
    current_user: dict = Depends(get_current_user)
):
    """List all jobs with filtering and pagination"""
    try:
        # Build filters
        filters = {"is_deleted": False}
        
        if job_type:
            filters["job_type"] = job_type
        if location:
            filters["location"] = {"$regex": location, "$options": "i"}
        if is_remote is not None:
            filters["is_remote"] = is_remote
        if is_active is not None:
            filters["is_active"] = is_active
        
        # Add search filter
        if search:
            filters["$text"] = {"$search": search}
        
        # Get jobs
        jobs = await job_controller.list(
            skip=skip,
            limit=limit,
            sort_field=sort_field,
            sort_direction=sort_direction,
            filters=filters
        )
        
        # Get total count
        total = await job_controller.count(filters)
        
        return {
            "success": True,
            "data": jobs,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
                "has_next": skip + limit < total,
                "has_prev": skip > 0,
                "current_page": skip // limit + 1
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list jobs: {str(e)}"
        )

@router.get("/my-jobs", response_model=dict)
async def get_my_jobs(current_user: dict = Depends(get_current_user)):
    """Get jobs posted by current user"""
    try:
        # Validate user is recruiter
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only recruiters can view their jobs"
            )
        
        filters = {
            "posted_by": current_user["_id"],
            "is_deleted": False
        }
        
        jobs = await job_controller.list(
            skip=0,
            limit=100,
            sort_field="created_at",
            sort_direction=-1,
            filters=filters
        )
        
        return {
            "success": True,
            "data": jobs
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get your jobs: {str(e)}"
        )

@router.get("/{job_id}", response_model=dict)
async def get_job_by_id(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get job by ID"""
    try:
        job = await job_controller.get_by_id(job_id)
        
        # Increment view count
        await job_controller.update(job_id, {"views": job.get("views", 0) + 1})
        
        return {
            "success": True,
            "data": job
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get job: {str(e)}"
        )

@router.put("/{job_id}", response_model=dict)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update job posting"""
    try:
        # Get job to check ownership
        job = await job_controller.get_by_id(job_id)
        
        # Check if user owns the job
        if job["posted_by"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own job postings"
            )
        
        # Update job
        updated_job = await job_controller.update(job_id, job_data.dict(exclude_unset=True))
        
        return {
            "success": True,
            "message": "Job updated successfully",
            "data": updated_job
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update job: {str(e)}"
        )

@router.delete("/{job_id}", response_model=dict)
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete job posting"""
    try:
        # Get job to check ownership
        job = await job_controller.get_by_id(job_id)
        
        # Check if user owns the job
        if job["posted_by"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own job postings"
            )
        
        # Soft delete job
        await job_controller.soft_delete(job_id)
        
        return {
            "success": True,
            "message": "Job deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete job: {str(e)}"
        )

@router.post("/{job_id}/apply", response_model=dict)
async def apply_for_job(
    job_id: str,
    application_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Apply for a job"""
    try:
        # Get job details
        job = await job_controller.get_by_id(job_id)
        
        # Check if job is active
        if job.get("status") != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This job is no longer accepting applications"
            )
        
        # Check if user already applied
        collection = job_controller.get_collection()
        existing_application = await collection.find_one({
            "job_id": job_id,
            "applicant_id": current_user["_id"]
        })
        
        if existing_application:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already applied for this job"
            )
        
        # Check if user is not the job poster
        if job["posted_by"] == current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot apply for your own job posting"
            )
        
        # Create application
        application_dict = {
            "job_id": job_id,
            "applicant_id": current_user["_id"],
            "recruiter_id": job["posted_by"],
            "full_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip(),
            "email": current_user.get("email"),
            "contact_number": current_user.get("phone"),
            "contact_email": current_user.get("email"),
            "skills": current_user.get("skills", []),
            "status": "submitted",
            "is_seen": False,
            "applied_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status_history": [{
                "status": "submitted",
                "updated_at": datetime.utcnow(),
                "updated_by": str(current_user["_id"]),
                "note": "Application submitted"
            }]
        }
        
        # Add application data
        for key, value in application_data.items():
            if value is not None:
                application_dict[key] = value
        
        # Insert application
        result = await collection.insert_one(application_dict)
        
        # Add applicant to job's applicants list
        await job_controller.get_collection().update_one(
            {"_id": ObjectId(job_id)},
            {"$addToSet": {"applicants": str(current_user["_id"])}}
        )
        
        # Create notification for job poster
        notification_data = {
            "user_id": job["posted_by"],
            "title": "New Job Application",
            "message": f"{current_user.get('first_name')} {current_user.get('last_name')} applied for {job['title']}",
            "type": "job_application",
            "related_job_id": job_id,
            "related_user_id": str(current_user["_id"]),
            "is_read": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert notification
        notifications_collection = job_controller.get_database().notifications
        await notifications_collection.insert_one(notification_data)
        
        # Get created application
        created_application = await collection.find_one({"_id": result.inserted_id})
        
        return {
            "success": True,
            "message": "Application submitted successfully",
            "data": job_controller.serialize_mongo_doc(created_application)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit application: {str(e)}"
        )

@router.get("/{job_id}/applications", response_model=dict)
async def get_job_applications(
    job_id: str,
    skip: int = Query(0, ge=0, description="Number of applications to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of applications to return"),
    status: Optional[str] = Query(None, description="Filter by application status"),
    current_user: dict = Depends(get_current_user)
):
    """Get applications for a specific job"""
    try:
        # Get job to check ownership
        job = await job_controller.get_by_id(job_id)
        
        # Check if user owns the job
        if job["posted_by"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the job poster can view applications"
            )
        
        # Build filters
        filters = {"job_id": job_id}
        if status:
            filters["status"] = status
        
        # Get applications
        applications = await job_controller.list(
            skip=skip,
            limit=limit,
            sort_field="applied_at",
            sort_direction=-1,
            filters=filters
        )
        
        # Enrich with applicant data
        collection = job_controller.get_collection()
        enriched_applications = []
        
        for app in applications:
            applicant = await collection.find_one({"_id": ObjectId(app["applicant_id"])})
            if applicant:
                app["applicant"] = {
                    "id": str(applicant["_id"]),
                    "first_name": applicant.get("first_name"),
                    "last_name": applicant.get("last_name"),
                    "email": applicant.get("email"),
                    "headline": applicant.get("headline"),
                    "location": applicant.get("location"),
                    "profile_picture": applicant.get("profile_picture"),
                    "sync_score": applicant.get("sync_score", 0),
                    "growth_score": applicant.get("growth_score", 0),
                    "ats_score": applicant.get("ats_score", {})
                }
            enriched_applications.append(job_controller.serialize_mongo_doc(app))
        
        return {
            "success": True,
            "data": enriched_applications
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get applications: {str(e)}"
        )

@router.get("/{job_id}/stats", response_model=dict)
async def get_job_stats(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get job statistics"""
    try:
        # Get job to check ownership
        job = await job_controller.get_by_id(job_id)
        
        # Check if user owns the job
        if job["posted_by"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the job poster can view job statistics"
            )
        
        # Get statistics
        collection = job_controller.get_collection()
        
        # Application stats
        total_applications = await collection.count_documents({"job_id": job_id})
        
        # Status breakdown
        status_pipeline = [
            {"$match": {"job_id": job_id}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        status_breakdown = await collection.aggregate(status_pipeline).to_list(length=None)
        
        # Recent applications
        recent_applications = await collection.find({"job_id": job_id}).sort("applied_at", -1).limit(5).to_list(length=None)
        
        return {
            "success": True,
            "data": {
                "job": job,
                "total_applications": total_applications,
                "status_breakdown": {item["_id"]: item["count"] for item in status_breakdown},
                "recent_applications": job_controller.serialize_mongo_docs(recent_applications),
                "views": job.get("views", 0)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get job stats: {str(e)}"
        )

@router.post("/{job_id}/toggle-status", response_model=dict)
async def toggle_job_status(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Toggle job status between active and closed"""
    try:
        # Get job to check ownership
        job = await job_controller.get_by_id(job_id)
        
        # Check if user owns the job
        if job["posted_by"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the job poster can change job status"
            )
        
        # Toggle status
        new_status = "closed" if job["status"] == "active" else "active"
        
        await job_controller.update(job_id, {"status": new_status})
        
        return {
            "success": True,
            "message": f"Job status changed to {new_status}",
            "data": {"status": new_status}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle job status: {str(e)}"
        )

@router.post("/{job_id}/feature", response_model=dict)
async def feature_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Feature/unfeature a job"""
    try:
        # Get job to check ownership
        job = await job_controller.get_by_id(job_id)
        
        # Check if user owns the job
        if job["posted_by"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the job poster can feature a job"
            )
        
        # Toggle featured status
        is_featured = not job.get("is_featured", False)
        
        await job_controller.update(job_id, {"is_featured": is_featured})
        
        return {
            "success": True,
            "message": f"Job {'featured' if is_featured else 'unfeatured'} successfully",
            "data": {"is_featured": is_featured}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to feature job: {str(e)}"
        )
