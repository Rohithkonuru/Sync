from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from app.middleware.auth_middleware import get_current_user
from app.services.analytics import get_analytics_service

router = APIRouter()

@router.get("/gender-demographics")
async def get_gender_demographics(
    job_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get gender demographics for applicants (recruiters only)"""
    try:
        # Check if user is recruiter
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only recruiters can view gender demographics."
            )
        
        analytics_service = get_analytics_service()
        demographics = await analytics_service.get_gender_demographics(job_id)
        
        return {
            "success": True,
            "data": demographics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching gender demographics: {str(e)}"
        )

@router.get("/applications-over-time")
async def get_applications_over_time(
    job_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Get application trends over time (recruiters only)"""
    try:
        # Check if user is recruiter
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only recruiters can view application analytics."
            )
        
        analytics_service = get_analytics_service()
        applications_data = await analytics_service.get_applications_over_time(job_id, days)
        
        return {
            "success": True,
            "data": applications_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching applications over time: {str(e)}"
        )

@router.get("/status-breakdown")
async def get_application_status_breakdown(
    job_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get application status breakdown (recruiters only)"""
    try:
        # Check if user is recruiter
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only recruiters can view application analytics."
            )
        
        analytics_service = get_analytics_service()
        status_data = await analytics_service.get_application_status_breakdown(job_id)
        
        return {
            "success": True,
            "data": status_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching status breakdown: {str(e)}"
        )

@router.get("/sync-score-distribution")
async def get_sync_score_distribution(
    job_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get Sync Score distribution (recruiters only)"""
    try:
        # Check if user is recruiter
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only recruiters can view application analytics."
            )
        
        analytics_service = get_analytics_service()
        distribution_data = await analytics_service.get_sync_score_distribution(job_id)
        
        return {
            "success": True,
            "data": distribution_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sync score distribution: {str(e)}"
        )

@router.get("/ats-score-averages")
async def get_ats_score_averages(
    job_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get ATS score averages (recruiters only)"""
    try:
        # Check if user is recruiter
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only recruiters can view application analytics."
            )
        
        analytics_service = get_analytics_service()
        ats_data = await analytics_service.get_ats_score_averages(job_id)
        
        return {
            "success": True,
            "data": ats_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching ATS score averages: {str(e)}"
        )

@router.get("/overview")
async def get_recruiter_analytics_overview(
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive analytics overview for recruiter"""
    try:
        # Check if user is recruiter
        if current_user.get("user_type") != "recruiter":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only recruiters can view analytics."
            )
        
        analytics_service = get_analytics_service()
        overview_data = await analytics_service.get_recruiter_analytics_overview(current_user["_id"])
        
        return {
            "success": True,
            "data": overview_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching analytics overview: {str(e)}"
        )
