"""
User routes with clean architecture
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from pydantic import EmailStr
from app.controllers import UserController
from app.models import User, UserCreate, UserUpdate, UserType
from app.validators import validate_search_params
from app.middleware.auth_middleware import get_current_user
from app.utils.database import serialize_mongo_doc

router = APIRouter(prefix="/users", tags=["users"])
user_controller = UserController()

@router.post("/register", response_model=dict)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await user_controller.create_user(user_data)
        return {
            "success": True,
            "message": "User registered successfully",
            "data": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=dict)
async def login_user(email: EmailStr, password: str):
    """Login user"""
    try:
        user = await user_controller.authenticate_user(email, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        return {
            "success": True,
            "message": "Login successful",
            "data": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me", response_model=dict)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    try:
        user = await user_controller.get_by_id(current_user["_id"])
        return {
            "success": True,
            "data": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )

@router.put("/me", response_model=dict)
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        user = await user_controller.update_user_profile(current_user["_id"], user_data)
        return {
            "success": True,
            "message": "Profile updated successfully",
            "data": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.put("/password", response_model=dict)
async def change_password(
    current_password: str,
    new_password: str,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    try:
        await user_controller.change_password(current_user["_id"], current_password, new_password)
        return {
            "success": True,
            "message": "Password changed successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

@router.post("/deactivate", response_model=dict)
async def deactivate_user(current_user: dict = Depends(get_current_user)):
    """Deactivate user account"""
    try:
        await user_controller.deactivate_user(current_user["_id"])
        return {
            "success": True,
            "message": "Account deactivated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate account: {str(e)}"
        )

@router.post("/activate", response_model=dict)
async def activate_user(current_user: dict = Depends(get_current_user)):
    """Activate user account"""
    try:
        await user_controller.activate_user(current_user["_id"])
        return {
            "success": True,
            "message": "Account activated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate account: {str(e)}"
        )

@router.get("/search", response_model=dict)
async def search_users(
    q: str = Query(..., description="Search query"),
    user_type: Optional[str] = Query(None, description="Filter by user type"),
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of users to return"),
    current_user: dict = Depends(get_current_user)
):
    """Search users"""
    try:
        result = await user_controller.search_users(q, user_type, skip, limit)
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search users: {str(e)}"
        )

@router.get("/type/{user_type}", response_model=dict)
async def get_users_by_type(
    user_type: UserType,
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of users to return"),
    current_user: dict = Depends(get_current_user)
):
    """Get users by type"""
    try:
        result = await user_controller.get_users_by_type(user_type, skip, limit)
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users by type: {str(e)}"
        )

@router.get("/{user_id}", response_model=dict)
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user by ID"""
    try:
        user = await user_controller.get_by_id(user_id)
        return {
            "success": True,
            "data": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user: {str(e)}"
        )

@router.get("/{user_id}/connections", response_model=dict)
async def get_user_connections(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user's connections"""
    try:
        connections = await user_controller.get_user_connections(user_id)
        return {
            "success": True,
            "data": connections
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user connections: {str(e)}"
        )

@router.get("/{user_id}/stats", response_model=dict)
async def get_user_stats(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user statistics"""
    try:
        stats = await user_controller.get_user_stats(user_id)
        return {
            "success": True,
            "data": stats
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user stats: {str(e)}"
        )

@router.post("/{user_id}/skills", response_model=dict)
async def add_user_skill(
    user_id: str,
    skill: str,
    current_user: dict = Depends(get_current_user)
):
    """Add skill to user profile"""
    try:
        result = await user_controller.add_skill(user_id, skill)
        return {
            "success": True,
            "message": result["message"],
            "data": result["skills"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add skill: {str(e)}"
        )

@router.delete("/{user_id}/skills/{skill}", response_model=dict)
async def remove_user_skill(
    user_id: str,
    skill: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove skill from user profile"""
    try:
        result = await user_controller.remove_skill(user_id, skill)
        return {
            "success": True,
            "message": result["message"],
            "data": result["skills"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove skill: {str(e)}"
        )

@router.post("/{user_id}/verify-email", response_model=dict)
async def verify_user_email(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Verify user's email"""
    try:
        await user_controller.verify_email(user_id)
        return {
            "success": True,
            "message": "Email verified successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify email: {str(e)}"
        )

# Growth Score endpoints
@router.get("/me/growth-score", response_model=dict)
async def get_my_growth_score(current_user: dict = Depends(get_current_user)):
    """Get current user's Growth Score"""
    try:
        from app.services.growth_score import get_growth_score_service
        
        service = get_growth_score_service()
        growth_score_data = await service.get_growth_score(
            current_user["_id"], 
            current_user["_id"], 
            current_user.get("user_type", "")
        )
        
        if not growth_score_data:
            return {"growth_score": 0, "growth_score_updated": None}
        
        return {
            "success": True,
            "data": growth_score_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get growth score: {str(e)}"
        )

@router.get("/{user_id}/growth-score", response_model=dict)
async def get_user_growth_score(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get another user's Growth Score (recruiter access)"""
    try:
        from app.services.growth_score import get_growth_score_service
        
        # Check if requester has access
        requester_id = current_user["_id"]
        requester_role = current_user.get("user_type", "")
        
        service = get_growth_score_service()
        growth_score_data = await service.get_growth_score(
            user_id, 
            requester_id, 
            requester_role
        )
        
        if not growth_score_data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied or growth score not found"
            )
        
        return {
            "success": True,
            "data": growth_score_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get growth score: {str(e)}"
        )

@router.post("/growth-score/update", response_model=dict)
async def update_growth_score(current_user: dict = Depends(get_current_user)):
    """Manually update growth score (for testing/admin purposes)"""
    try:
        from app.services.growth_score import get_growth_score_service
        
        service = get_growth_score_service()
        new_score = await service.update_growth_score(current_user["_id"])
        
        return {
            "success": True,
            "message": "Growth score updated successfully",
            "data": {"growth_score": new_score}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update growth score: {str(e)}"
        )

@router.post("/activity/{activity_type}", response_model=dict)
async def record_user_activity(
    activity_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Record user activity for Growth Score calculation"""
    try:
        from app.services.growth_score import get_growth_score_service
        
        service = get_growth_score_service()
        await service.record_activity(current_user["_id"], activity_type)
        
        return {
            "success": True,
            "message": f"Activity {activity_type} recorded successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record activity: {str(e)}"
        )
