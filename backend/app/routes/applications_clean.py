"""
Application routes with clean architecture
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from app.controllers import BaseController
from app.models import Application, ApplicationStatus
from app.middleware.auth_middleware import get_current_user
from app.utils.database import serialize_mongo_doc
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/applications", tags=["applications"])
application_controller = BaseController("job_applications")

@router.get("/", response_model=dict)
async def get_my_applications(
    skip: int = Query(0, ge=0, description="Number of applications to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of applications to return"),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by application status"),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's job applications"""
    try:
        # Build filters
        filters = {"applicant_id": current_user["_id"]}
        if status:
            filters["status"] = status
        
        # Get applications
        applications = await application_controller.list(
            skip=skip,
            limit=limit,
            sort_field="applied_at",
            sort_direction=-1,
            filters=filters
        )
        
        # Enrich with job data
        collection = application_controller.get_collection()
        enriched_applications = []
        
        for app in applications:
            job = await collection.find_one({"_id": ObjectId(app["job_id"])})
            if job:
                app["job"] = {
                    "id": str(job["_id"]),
                    "title": job.get("title"),
                    "company_name": job.get("company_name"),
                    "location": job.get("location"),
                    "job_type": job.get("job_type"),
                    "status": job.get("status"),
                    "posted_by": job.get("posted_by")
                }
            enriched_applications.append(serialize_mongo_doc(app))
        
        return {
            "success": True,
            "data": enriched_applications
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get applications: {str(e)}"
        )

@router.get("/{application_id}", response_model=dict)
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get application by ID"""
    try:
        application = await application_controller.get_by_id(application_id)
        
        # Check if user owns the application or is the job poster
        if (application["applicant_id"] != current_user["_id"] and 
            application["recruiter_id"] != current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return {
            "success": True,
            "data": application
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get application: {str(e)}"
        )

@router.put("/{application_id}/status", response_model=dict)
async def update_application_status(
    application_id: str,
    status_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update application status (recruiter only)"""
    try:
        # Get application
        application = await application_controller.get_by_id(application_id)
        
        # Validate status
        valid_statuses = ["submitted", "seen", "in_processing", "shortlisted", "accepted", "rejected"]
        new_status = status_data.get("status")
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Check if user is recruiter and owns the job
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only recruiters can update application status"
            )
        
        # Get job to verify ownership
        collection = application_controller.get_collection()
        job = await collection.find_one({"_id": ObjectId(application["job_id"])})
        
        if not job or job["posted_by"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the job poster can update application status"
            )
        
        # Add to status history
        status_history = application.get("status_history", [])
        status_history.append({
            "status": new_status,
            "updated_at": datetime.utcnow(),
            "updated_by": str(current_user["_id"]),
            "note": status_data.get("note", "")
        })
        
        # Update application
        await application_controller.update(application_id, {
            "status": new_status,
            "updated_at": datetime.utcnow(),
            "status_updated_by": str(current_user["_id"]),
            "status_history": status_history
        })
        
        # Create notification for applicant
        applicant_collection = application_controller.get_database().users
        applicant = await applicant_collection.find_one({"_id": ObjectId(application["applicant_id"])})
        
        if applicant:
            notification_data = {
                "user_id": application["applicant_id"],
                "title": "Application Status Updated",
                "message": f"Your application for {job['title']} has been updated to {new_status}",
                "type": "application_status_update",
                "related_job_id": application["job_id"],
                "related_user_id": str(current_user["_id"]),
                "is_read": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            notifications_collection = application_controller.get_database().notifications
            await notifications_collection.insert_one(notification_data)
        
        return {
            "success": True,
            "message": "Application status updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update application status: {str(e)}"
        )

@router.put("/{application_id}/seen", response_model=dict)
async def mark_application_as_seen(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark application as seen (recruiter only)"""
    try:
        # Get application
        application = await application_controller.get_by_id(application_id)
        
        # Check if user is recruiter and owns the job
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only recruiters can mark applications as seen"
            )
        
        # Get job to verify ownership
        collection = application_controller.get_collection()
        job = await collection.find_one({"_id": ObjectId(application["job_id"])})
        
        if not job or job["posted_by"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the job poster can mark applications as seen"
            )
        
        # Update application if not already seen
        if not application.get("is_seen", False):
            # Add to status history if status is still "submitted"
            status_history = application.get("status_history", [])
            if application.get("status") == "submitted":
                status_history.append({
                    "status": "seen",
                    "updated_at": datetime.utcnow(),
                    "updated_by": str(current_user["_id"]),
                    "note": "Application viewed by recruiter"
                })
            
            await application_controller.update(application_id, {
                "is_seen": True,
                "seen_at": datetime.utcnow(),
                "status": "seen" if application.get("status") == "submitted" else application.get("status"),
                "updated_at": datetime.utcnow(),
                "status_history": status_history
            })
        
        return {
            "success": True,
            "message": "Application marked as seen"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark application as seen: {str(e)}"
        )

@router.get("/{application_id}/history", response_model=dict)
async def get_application_history(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get application status history"""
    try:
        # Get application
        application = await application_controller.get_by_id(application_id)
        
        # Check if user owns the application or is the job poster
        if (application["applicant_id"] != current_user["_id"] and 
            application["recruiter_id"] != current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get status history with enriched updater info
        status_history = application.get("status_history", [])
        enriched_history = []
        
        users_collection = application_controller.get_database().users
        
        for entry in status_history:
            updater = await users_collection.find_one({"_id": ObjectId(entry.get("updated_by", "")})
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
        
        return {
            "success": True,
            "data": {"history": enriched_history}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get application history: {str(e)}"
        )

@router.delete("/{application_id}", response_model=dict)
async def withdraw_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Withdraw application (applicant only)"""
    try:
        # Get application
        application = await application_controller.get_by_id(application_id)
        
        # Check if user owns the application
        if application["applicant_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only withdraw your own applications"
            )
        
        # Check if application is still in early status
        if application["status"] not in ["submitted", "seen"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot withdraw application that is already being processed"
            )
        
        # Update status to withdrawn
        status_history = application.get("status_history", [])
        status_history.append({
            "status": "withdrawn",
            "updated_at": datetime.utcnow(),
            "updated_by": str(current_user["_id"]),
            "note": "Application withdrawn by applicant"
        })
        
        await application_controller.update(application_id, {
            "status": "withdrawn",
            "updated_at": datetime.utcnow(),
            "status_history": status_history
        })
        
        # Remove from job's applicants list
        jobs_collection = application_controller.get_database().jobs
        await jobs_collection.update_one(
            {"_id": ObjectId(application["job_id"])},
            {"$pull": {"applicants": str(current_user["_id"]}}
        )
        
        return {
            "success": True,
            "message": "Application withdrawn successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to withdraw application: {str(e)}"
        )

@router.get("/{application_id}/resume", response_model=dict)
async def download_resume(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download resume file for an application"""
    try:
        # Get application
        application = await application_controller.get_by_id(application_id)
        
        # Check if user owns the application or is the job poster
        if (application["applicant_id"] != current_user["_id"] and 
            application["recruiter_id"] != current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if resume file exists
        resume_url = application.get("resume_file_url")
        if not resume_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume file not found"
            )
        
        return {
            "success": True,
            "data": {
                "download_url": resume_url,
                "file_name": f"resume_{application['full_name'].replace(' ', '_')}_{application_id}.pdf"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download resume: {str(e)}"
        )
