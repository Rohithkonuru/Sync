"""
User service with clean architecture
"""

from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from datetime import datetime
from bson import ObjectId
from app.models import User, UserCreate, UserUpdate, UserType
from app.controllers import UserController
from app.validators import validate_user_profile_data
from app.utils.database import serialize_mongo_doc
import hashlib
import secrets

class UserService:
    """User service with business logic"""
    
    def __init__(self):
        self.controller = UserController()
    
    async def create_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """Create a new user with password hashing"""
        try:
            # Hash password
            hashed_password = self._hash_password(user_data.password)
            
            # Prepare user data
            user_dict = user_data.dict()
            user_dict["password"] = hashed_password
            
            # Create user
            return await self.controller.create_user(UserCreate(**user_dict))
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}"
            )
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password"""
        try:
            user = await self.controller.get_user_by_email(email)
            
            if not user:
                return None
            
            # Verify password
            if not self._verify_password(password, user["password"]):
                return None
            
            # Update last login
            await self.controller.update_last_login(user["id"])
            
            # Remove password from response
            user_data = user.copy()
            user_data.pop("password", None)
            
            return user_data
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Authentication failed: {str(e)}"
            )
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            user = await self.controller.get_by_id(user_id)
            # Remove password from response
            user.pop("password", None)
            return user
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user: {str(e)}"
            )
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            user = await self.controller.get_user_by_email(email)
            if user:
                # Remove password from response
                user.pop("password", None)
            return user
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user by email: {str(e)}"
            )
    
    async def update_user_profile(self, user_id: str, update_data: UserUpdate) -> Dict[str, Any]:
        """Update user profile"""
        try:
            return await self.controller.update_user_profile(user_id, update_data)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update user profile: {str(e)}"
            )
    
    async def change_password(self, user_id: str, current_password: str, new_password: str) -> Dict[str, Any]:
        """Change user password"""
        try:
            # Get current user
            user = await self.controller.get_by_id(user_id)
            
            # Verify current password
            if not self._verify_password(current_password, user["password"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect"
                )
            
            # Update password
            hashed_new_password = self._hash_password(new_password)
            return await self.controller.update_user_password(user_id, hashed_new_password)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to change password: {str(e)}"
            )
    
    async def deactivate_user(self, user_id: str) -> Dict[str, Any]:
        """Deactivate user account"""
        try:
            return await self.controller.deactivate_user(user_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to deactivate user: {str(e)}"
            )
    
    async def search_users(
        self,
        search_text: str,
        user_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Search users"""
        try:
            result = await self.controller.search_users(search_text, user_type, skip, limit)
            
            # Remove passwords from results
            for user in result["data"]:
                user.pop("password", None)
            
            return result
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
            result = await self.controller.get_users_by_type(user_type, skip, limit)
            
            # Remove passwords from results
            for user in result["data"]:
                user.pop("password", None)
            
            return result
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
            return await self.controller.get_user_connections(user_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user connections: {str(e)}"
            )
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics"""
        try:
            return await self.controller.get_user_stats(user_id)
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
            return await self.controller.add_skill(user_id, skill)
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
            return await self.controller.remove_skill(user_id, skill)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to remove skill: {str(e)}"
            )
    
    async def verify_email(self, user_id: str) -> Dict[str, Any]:
        """Verify user's email"""
        try:
            return await self.controller.verify_email(user_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify email: {str(e)}"
            )
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256 with salt"""
        # In production, use bcrypt or argon2 instead
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}:{password_hash}"
    
    def _verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            salt, password_hash = hashed_password.split(":")
            computed_hash = hashlib.sha256((password + salt).encode()).hexdigest()
            return computed_hash == password_hash
        except Exception:
            return False

# Global instance
user_service = UserService()
