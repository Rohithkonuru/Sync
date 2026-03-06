"""
User controller
"""

from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from datetime import datetime
from bson import ObjectId
from app.controllers.base import AuthenticatedController, PaginatedController
from app.models import User, UserCreate, UserUpdate, UserType
from app.validators import validate_user_profile_data
from app.utils.database import build_filter_query, add_soft_delete_filter

class UserController(AuthenticatedController, PaginatedController):
    """User controller with authentication and pagination"""
    
    def __init__(self):
        super().__init__("users")
    
    async def create_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """Create a new user"""
        try:
            # Validate user data
            validated_data = validate_user_profile_data(user_data.dict())
            
            # Check if email already exists
            collection = self.get_collection()
            existing_user = await collection.find_one({"email": validated_data["email"]})
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Create user
            return await self.create(validated_data)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}"
            )
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            collection = self.get_collection()
            user = await collection.find_one({"email": email, "is_active": True})
            
            if not user:
                return None
            
            return serialize_mongo_doc(user)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user by email: {str(e)}"
            )
    
    async def update_user_profile(self, user_id: str, update_data: UserUpdate) -> Dict[str, Any]:
        """Update user profile"""
        try:
            # Validate update data
            validated_data = validate_user_profile_data(update_data.dict(exclude_unset=True))
            
            # Remove None values
            validated_data = {k: v for k, v in validated_data.items() if v is not None}
            
            # Update user
            return await self.update(user_id, validated_data)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update user profile: {str(e)}"
            )
    
    async def update_user_password(self, user_id: str, new_password: str) -> Dict[str, Any]:
        """Update user password"""
        try:
            from app.validators import PasswordValidator
            
            # Validate password
            validated_password = PasswordValidator.validate_password(new_password)
            
            # Hash password (you should implement proper password hashing)
            # For now, we'll just update it directly (in production, use bcrypt)
            return await self.update(user_id, {"password": validated_password})
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update password: {str(e)}"
            )
    
    async def deactivate_user(self, user_id: str) -> Dict[str, Any]:
        """Deactivate user account"""
        try:
            return await self.update(user_id, {"is_active": False})
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to deactivate user: {str(e)}"
            )
    
    async def activate_user(self, user_id: str) -> Dict[str, Any]:
        """Activate user account"""
        try:
            return await self.update(user_id, {"is_active": True})
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to activate user: {str(e)}"
            )
    
    async def search_users(
        self,
        search_text: str,
        user_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Search users with filters"""
        try:
            # Build search parameters
            search_params = {
                "search_text": search_text,
                "search_fields": ["first_name", "last_name", "headline", "skills"],
                "sort_field": "created_at",
                "sort_direction": -1
            }
            
            # Add user type filter
            if user_type:
                search_params["user_type"] = user_type
            
            # Add active filter
            search_params["is_active"] = True
            
            return await self.advanced_search(search_params, skip, limit)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to search users: {str(e)}"
            )
    
    async def get_users_by_type(
        self,
        user_type: UserType,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get users by type"""
        try:
            filters = {
                "user_type": user_type,
                "is_active": True
            }
            
            return await self.paginated_list(skip, limit, "created_at", -1, filters)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get users by type: {str(e)}"
            )
    
    async def get_user_connections(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's connections"""
        try:
            collection = self.get_collection()
            user = await collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            connections = user.get("connections", [])
            if not connections:
                return []
            
            # Get connection details
            cursor = collection.find({
                "_id": {"$in": [ObjectId(conn_id) for conn_id in connections]},
                "is_active": True
            }).project({
                "first_name": 1,
                "last_name": 1,
                "headline": 1,
                "profile_picture": 1,
                "user_type": 1
            })
            
            docs = await cursor.to_list(length=None)
            return serialize_mongo_docs(docs)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user connections: {str(e)}"
            )
    
    async def update_last_login(self, user_id: str) -> Dict[str, Any]:
        """Update user's last login time"""
        try:
            return await self.update(user_id, {"last_login": datetime.utcnow()})
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update last login: {str(e)}"
            )
    
    async def verify_email(self, user_id: str) -> Dict[str, Any]:
        """Verify user's email"""
        try:
            return await self.update(user_id, {"email_verified": True})
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify email: {str(e)}"
            )
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics"""
        try:
            collection = self.get_collection()
            user = await collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Get user's stats
            stats = {
                "connections_count": len(user.get("connections", [])),
                "connection_requests_count": len(user.get("connection_requests", [])),
                "skills_count": len(user.get("skills", [])),
                "education_count": len(user.get("education", [])),
                "experience_count": len(user.get("experience", [])),
                "projects_count": len(user.get("projects", [])),
                "certifications_count": len(user.get("certifications", [])),
                "sync_score": user.get("sync_score", 0),
                "growth_score": user.get("growth_score", 0),
                "ats_score": user.get("ats_score", {}),
                "last_login": user.get("last_login"),
                "email_verified": user.get("email_verified", False),
                "is_active": user.get("is_active", True)
            }
            
            return stats
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user stats: {str(e)}"
            )
    
    async def add_skill(self, user_id: str, skill: str) -> Dict[str, Any]:
        """Add skill to user profile"""
        try:
            collection = self.get_collection()
            user = await collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            skills = user.get("skills", [])
            if skill not in skills:
                skills.append(skill)
                await self.update(user_id, {"skills": skills})
            
            return {"message": "Skill added successfully", "skills": skills}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add skill: {str(e)}"
            )
    
    async def remove_skill(self, user_id: str, skill: str) -> Dict[str, Any]:
        """Remove skill from user profile"""
        try:
            collection = self.get_collection()
            user = await collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            skills = user.get("skills", [])
            if skill in skills:
                skills.remove(skill)
                await self.update(user_id, {"skills": skills})
            
            return {"message": "Skill removed successfully", "skills": skills}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to remove skill: {str(e)}"
            )
