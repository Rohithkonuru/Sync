"""Growth Score calculation aligned with required formula."""

from datetime import datetime, timedelta
from typing import Dict, Optional
from bson import ObjectId
from app.database import get_database


class GrowthScoreService:
    def __init__(self):
        self.db = None
        self.users_collection = None
        self.activities_collection = None

    def _ensure_db_connection(self):
        if self.db is None:
            self.db = get_database()
            self.users_collection = self.db.users
            # store granular events for growth scoring
            self.activities_collection = self.db.user_activities

    # calculations --------------------------------------------------------
    async def calculate_growth_score(self, user_id: str) -> int:
        """Apply weighted formula using recent improvements."""
        try:
            self._ensure_db_connection()
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return 0

            thirty_days_ago = datetime.utcnow() - timedelta(days=30)

            new_connections = await self.activities_collection.count_documents({
                "user_id": user_id,
                "activity_type": "connection_added",
                "created_at": {"$gte": thirty_days_ago},
            })

            new_skills = await self.activities_collection.count_documents({
                "user_id": user_id,
                "activity_type": {"$in": ["skill_added", "education_added", "experience_added", "certification_added"]},
                "created_at": {"$gte": thirty_days_ago},
            })

            profile_updates = await self.activities_collection.count_documents({
                "user_id": user_id,
                "activity_type": "profile_updated",
                "created_at": {"$gte": thirty_days_ago},
            })

            current_sync = user.get("sync_score", 0)
            prev_sync = user.get("previous_sync_score", 0)
            sync_score_increase = max(0, current_sync - prev_sync)

            ats_data = user.get("ats_score", {}) or {}
            current_ats = ats_data.get("score", 0)
            prev_ats = user.get("previous_ats_score", 0)
            ats_score_increase = max(0, current_ats - prev_ats)

            raw = (
                sync_score_increase * 0.40
                + new_connections * 0.20
                + new_skills * 0.15
                + profile_updates * 0.15
                + ats_score_increase * 0.10
            )
            return int(min(100, raw))
        except Exception as e:
            print(f"Error calculating growth score for user {user_id}: {e}")
            return 0

    async def update_growth_score(self, user_id: str) -> int:
        """Recalculate, persist, and update baselines."""
        try:
            self._ensure_db_connection()
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)}) or {}
            new_score = await self.calculate_growth_score(user_id)

            await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "growth_score": new_score,
                    "growth_score_updated": datetime.utcnow(),
                    "previous_sync_score": user.get("sync_score", 0),
                    "previous_ats_score": (user.get("ats_score", {}) or {}).get("score", 0),
                }}
            )

            await self.activities_collection.insert_one({
                "user_id": user_id,
                "activity_type": "growth_score_updated",
                "score": new_score,
                "created_at": datetime.utcnow(),
            })

            return new_score
        except Exception as e:
            print(f"Error updating growth score for user {user_id}: {e}")
            return 0

    async def get_growth_score(self, user_id: str, requester_id: str, requester_role: str) -> Optional[Dict]:
        try:
            self._ensure_db_connection()
            if not self._has_access(user_id, requester_id, requester_role):
                return None
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return None
            return {
                "growth_score": user.get("growth_score", 0),
                "growth_score_updated": user.get("growth_score_updated"),
                "user_id": user_id,
            }
        except Exception as e:
            print(f"Error getting growth score for user {user_id}: {e}")
            return None

    async def record_activity(self, user_id: str, activity_type: str, **kwargs):
        try:
            self._ensure_db_connection()
            await self.activities_collection.insert_one({
                "user_id": user_id,
                "activity_type": activity_type,
                "created_at": datetime.utcnow(),
                **kwargs,
            })

            if activity_type in {
                "profile_updated",
                "skill_added",
                "education_added",
                "experience_added",
                "certification_added",
                "course_completed",
                "sync_score_increase",
                "ats_score_improved",
                "connection_added",
            }:
                await self.update_growth_score(user_id)
        except Exception as e:
            print(f"Error recording activity for user {user_id}: {e}")

    def _has_access(self, user_id: str, requester_id: str, requester_role: str) -> bool:
        return user_id == requester_id or requester_role == "recruiter"


def get_growth_score_service():
    return GrowthScoreService()
