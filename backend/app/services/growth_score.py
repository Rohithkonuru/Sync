"""
Growth Score Service
Handles calculation and management of Growth Score for users
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from bson import ObjectId
from app.database import get_database
from app.models.user import UserResponse


class GrowthScoreService:
    """Service for managing Growth Score calculations and updates"""
    
    def __init__(self):
        # Lazy initialization - don't get database here
        self.db = None
        self.users_collection = None
        self.activities_collection = None
        
    def _ensure_db_connection(self):
        """Ensure database connection is available"""
        if self.db is None:
            try:
                from app.database import get_database
                self.db = get_database()
                self.users_collection = self.db.users
                self.activities_collection = self.db.user_activities
            except Exception as e:
                print(f"Database not available: {e}")
                raise e
        
    async def calculate_growth_score(self, user_id: str) -> int:
        """
        Calculate Growth Score based on user's improvement over time
        
        Growth Score = (Recent Activity + Score Improvement Rate) scaled to 100
        """
        try:
            self._ensure_db_connection()
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return 0
            
            # Get user's activity history for the last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            activities = await self.activities_collection.find({
                "user_id": user_id,
                "created_at": {"$gte": thirty_days_ago}
            }).to_list(length=None)
            
            # Calculate recent activity score (0-50 points)
            activity_score = self._calculate_activity_score(activities)
            
            # Calculate improvement rate (0-50 points)
            improvement_score = self._calculate_improvement_score(user, activities)
            
            # Combine scores (max 100)
            total_score = min(100, activity_score + improvement_score)
            
            return total_score
            
        except Exception as e:
            print(f"Error calculating growth score for user {user_id}: {e}")
            return 0
    
    def _calculate_activity_score(self, activities: List[Dict]) -> int:
        """Calculate score based on recent activities (max 50 points)"""
        if not activities:
            return 0
        
        activity_weights = {
            "profile_updated": 5,
            "skill_added": 8,
            "education_added": 10,
            "experience_added": 10,
            "project_added": 12,
            "certification_added": 15,
            "course_completed": 15,
            "sync_score_increased": 8,
            "ats_score_improved": 10,
            "daily_active": 3
        }
        
        total_score = 0
        for activity in activities:
            activity_type = activity.get("activity_type")
            weight = activity_weights.get(activity_type, 1)
            total_score += weight
        
        # Cap at 50 points
        return min(50, total_score)
    
    def _calculate_improvement_score(self, user: Dict, activities: List[Dict]) -> int:
        """Calculate score based on improvement trends (max 50 points)"""
        improvement_score = 0
        
        # Sync Score improvement (0-20 points)
        current_sync_score = user.get("sync_score", 0)
        if current_sync_score >= 75:
            improvement_score += 20
        elif current_sync_score >= 50:
            improvement_score += 15
        elif current_sync_score >= 25:
            improvement_score += 10
        else:
            improvement_score += 5
        
        # ATS Score improvement (0-15 points)
        ats_score_data = user.get("ats_score", {})
        if ats_score_data:
            ats_score = ats_score_data.get("score", 0)
            if ats_score >= 80:
                improvement_score += 15
            elif ats_score >= 60:
                improvement_score += 10
            elif ats_score >= 40:
                improvement_score += 5
        
        # Profile completeness (0-15 points)
        completeness_score = self._calculate_profile_completeness(user)
        if completeness_score >= 80:
            improvement_score += 15
        elif completeness_score >= 60:
            improvement_score += 10
        elif completeness_score >= 40:
            improvement_score += 5
        
        return min(50, improvement_score)
    
    def _calculate_profile_completeness(self, user: Dict) -> int:
        """Calculate profile completeness percentage"""
        required_fields = [
            "first_name", "last_name", "email", "headline", 
            "location", "bio", "phone", "skills"
        ]
        
        completed_fields = 0
        for field in required_fields:
            value = user.get(field)
            if value and (isinstance(value, str) and value.strip()) or (isinstance(value, list) and len(value) > 0):
                completed_fields += 1
        
        # Check for optional sections
        if user.get("education"):
            completed_fields += 1
        if user.get("experience"):
            completed_fields += 1
        if user.get("projects"):
            completed_fields += 1
        if user.get("certifications"):
            completed_fields += 1
        if user.get("resume_url"):
            completed_fields += 1
        
        total_possible = len(required_fields) + 5  # 5 optional sections
        return int((completed_fields / total_possible) * 100)
    
    async def update_growth_score(self, user_id: str) -> int:
        """Update user's Growth Score and return the new score"""
        try:
            self._ensure_db_connection()
            new_score = await self.calculate_growth_score(user_id)
            
            # Update user document
            await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "growth_score": new_score,
                        "growth_score_updated": datetime.utcnow()
                    }
                }
            )
            
            # Record activity
            await self.activities_collection.insert_one({
                "user_id": user_id,
                "activity_type": "growth_score_updated",
                "score": new_score,
                "created_at": datetime.utcnow()
            })
            
            return new_score
            
        except Exception as e:
            print(f"Error updating growth score for user {user_id}: {e}")
            return 0
    
    async def get_growth_score(self, user_id: str, requester_id: str, requester_role: str) -> Optional[Dict]:
        """
        Get Growth Score with role-based access control
        """
        try:
            self._ensure_db_connection()
            # Check access permissions
            if not self._has_growth_score_access(user_id, requester_id, requester_role):
                return None
            
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return None
            
            return {
                "growth_score": user.get("growth_score", 0),
                "growth_score_updated": user.get("growth_score_updated"),
                "user_id": user_id
            }
            
        except Exception as e:
            print(f"Error getting growth score for user {user_id}: {e}")
            return None
    
    def _has_growth_score_access(self, user_id: str, requester_id: str, requester_role: str) -> bool:
        """Check if requester has access to view Growth Score"""
        # Users can see their own growth score
        if user_id == requester_id:
            return True
        
        # Recruiters can see growth scores of candidates
        if requester_role == "recruiter":
            return True
        
        # Admin access (if needed)
        # if requester_role == "admin":
        #     return True
        
        return False
    
    async def record_activity(self, user_id: str, activity_type: str, **kwargs):
        """Record user activity for Growth Score calculation"""
        try:
            self._ensure_db_connection()
            activity_data = {
                "user_id": user_id,
                "activity_type": activity_type,
                "created_at": datetime.utcnow(),
                **kwargs
            }
            
            await self.activities_collection.insert_one(activity_data)
            
            # Update Growth Score if it's a significant activity
            significant_activities = [
                "profile_updated", "skill_added", "education_added",
                "experience_added", "project_added", "certification_added",
                "course_completed", "sync_score_increased", "ats_score_improved"
            ]
            
            if activity_type in significant_activities:
                await self.update_growth_score(user_id)
                
        except Exception as e:
            print(f"Error recording activity for user {user_id}: {e}")


# Lazy factory function instead of global instance
def get_growth_score_service():
    """Get Growth Score service instance (lazy initialization)"""
    return GrowthScoreService()
