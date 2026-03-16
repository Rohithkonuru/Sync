from datetime import datetime, timedelta
from typing import Dict, Any
from bson import ObjectId
from app.database import get_database


class SyncScoreService:
    """Compute and persist Sync Score using the required weighted formula."""

    MAX_SYNC_SCORE = 100

    def __init__(self):
        self.db = get_database()

    # helpers -------------------------------------------------------------
    def _clamp(self, value: float) -> float:
        return max(0, min(self.MAX_SYNC_SCORE, value))

    def _percent(self, part: float, whole: float) -> float:
        return (part / whole * 100) if whole else 0

    def _user_filter(self, user_id: str) -> Dict[str, Any]:
        """Support both ObjectId and string ids for user lookups."""
        if ObjectId.is_valid(user_id):
            return {"_id": ObjectId(user_id)}
        return {"_id": user_id}

    async def _profile_completion(self, user: dict) -> float:
        fields = [
            "first_name",
            "last_name",
            "profile_picture",
            "headline",
            "bio",
            "location",
            "skills",
            "experience",
            "education",
            "resume_url",
        ]
        total = len(fields)
        completed = 0
        for f in fields:
            v = user.get(f)
            if isinstance(v, str) and v.strip():
                completed += 1
            elif isinstance(v, (list, dict)) and len(v) > 0:
                completed += 1
            elif v not in (None, ""):
                completed += 1
        return self._percent(completed, total)

    async def _connections_score(self, user: dict) -> float:
        return self._clamp(len(user.get("connections", [])) * 2)  # 50 connections -> 100

    async def _posts_score(self, user_id: str) -> float:
        count = await self.db.posts.count_documents({"user_id": user_id})
        return self._clamp((count / 20) * 100)

    async def _applications_score(self, user_id: str) -> float:
        count = await self.db.job_applications.count_documents({"applicant_id": user_id})
        return self._clamp((count / 10) * 100)

    async def _activity_score(self, user_id: str) -> float:
        since = datetime.utcnow() - timedelta(days=30)
        events = await self.db.user_activity.count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": since},
            "activity_type": {"$in": ["login", "post_created", "like", "comment", "connection_added"]},
        })
        return self._clamp((events / 50) * 100)

    # calculations --------------------------------------------------------
    async def calculate_sync_score(self, user_id: str) -> int:
        user = await self.db.users.find_one(self._user_filter(user_id))
        if not user:
            return 0

        profile_completion = await self._profile_completion(user)
        connections = await self._connections_score(user)
        posts = await self._posts_score(user_id)
        applications = await self._applications_score(user_id)
        activity = await self._activity_score(user_id)

        raw = (
            profile_completion * 0.30
            + connections * 0.20
            + posts * 0.15
            + applications * 0.20
            + activity * 0.15
        )
        return int(self._clamp(raw))

    async def update_sync_score(self, user_id: str, activity_type: str | None = None) -> int:
        """Recalculate score, persist, and optionally log activity."""
        user = await self.db.users.find_one(self._user_filter(user_id)) or {}
        previous = user.get("sync_score", 0)
        score = await self.calculate_sync_score(user_id)
        profile_completion = await self._profile_completion(user) if user else 0

        await self.db.users.update_one(
            self._user_filter(user_id),
            {"$set": {
                "sync_score": score,
                "previous_sync_score": previous,
                "profile_completion": profile_completion,
                "sync_score_updated": datetime.utcnow(),
            }}
        )

        if activity_type:
            await self.db.user_activity.insert_one({
                "user_id": user_id,
                "activity_type": activity_type,
                "timestamp": datetime.utcnow(),
            })

        if score > previous:
            try:
                from app.services.growth_score import get_growth_score_service
                await get_growth_score_service().record_activity(user_id, "sync_score_increase", amount=score-previous)
            except Exception:
                pass

        return score

    async def get_sync_score(self, user_id: str, requester_id: str | None = None, requester_role: str | None = None) -> Dict[str, Any]:
        user = await self.db.users.find_one(self._user_filter(user_id))
        if not user:
            return {"error": "User not found"}

        if requester_id != user_id and requester_role != "recruiter":
            return {"score": None, "message": "Sync Score not available"}

        connections = len(user.get("connections", []))
        posts = await self.db.posts.count_documents({"user_id": user_id})
        applications = await self.db.job_applications.count_documents({"applicant_id": user_id})

        return {
            "score": user.get("sync_score", 0),
            "updated_at": user.get("sync_score_updated"),
            "max_score": self.MAX_SYNC_SCORE,
            "profile_completion": user.get("profile_completion", 0),
            "connections": connections,
            "posts": posts,
            "applications": applications,
        }

    async def record_activity(self, user_id: str, activity_type: str):
        await self.db.user_activity.insert_one({
            "user_id": user_id,
            "activity_type": activity_type,
            "timestamp": datetime.utcnow(),
        })
        await self.update_sync_score(user_id, activity_type)
