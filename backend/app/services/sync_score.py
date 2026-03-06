from datetime import datetime, timedelta
from typing import Dict, Any
from app.database import get_database

class SyncScoreService:
    def __init__(self):
        self.db = get_database()

    # Activity point values
    ACTIVITY_POINTS = {
        'profile_completion': 10,
        'resume_uploaded': 15,
        'ats_score_generated': 10,
        'post_created': 5,
        'like_or_comment': 2,
        'job_application': 8,
        'profile_update': 3,
        'daily_active': 1
    }

    # Maximum caps
    MAX_POSTS_PER_DAY = 5  # Cap for post creation points
    MAX_INTERACTIONS_PER_DAY = 10  # Cap for likes/comments
    MAX_DAILY_ACTIVE = 7  # Max daily active points per week
    MAX_SYNC_SCORE = 100

    async def calculate_sync_score(self, user_id: str) -> int:
        """Calculate the current sync score for a user based on their activity"""
        user = await self.db.users.find_one({"_id": user_id})

        if not user:
            return 0

        score = 0

        # Profile completion (basic info)
        if user.get('first_name') and user.get('last_name') and user.get('headline'):
            score += self.ACTIVITY_POINTS['profile_completion']

        # Resume uploaded
        if user.get('resume_url'):
            score += self.ACTIVITY_POINTS['resume_uploaded']

        # ATS score generated
        if user.get('ats_score'):
            score += self.ACTIVITY_POINTS['ats_score_generated']

        # Posts created (with daily cap)
        posts = await self.db.posts.count_documents({"user_id": user_id})
        if posts > 0:
            # Calculate posts in last 24 hours for daily cap
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_posts = await self.db.posts.count_documents({
                "user_id": user_id,
                "created_at": {"$gte": yesterday}
            })
            capped_posts = min(recent_posts, self.MAX_POSTS_PER_DAY)
            score += min(capped_posts * self.ACTIVITY_POINTS['post_created'], 25)  # Max 25 points from posts

        # Likes and comments (with daily cap)
        interactions = await self.db.posts.aggregate([
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "total": {"$sum": {"$add": ["$likes_count", "$comments_count"]}}}}
        ])
        interaction_count = 0
        async for result in interactions:
            interaction_count = result.get('total', 0)

        # Apply daily cap for interactions
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_likes = await self.db.posts.aggregate([
            {"$match": {"user_id": user_id, "updated_at": {"$gte": yesterday}}},
            {"$group": {"_id": None, "total": {"$sum": "$likes_count"}}}
        ])
        recent_comments = await self.db.comments.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": yesterday}
        })

        total_recent_interactions = 0
        async for result in recent_likes:
            total_recent_interactions += result.get('total', 0)
        total_recent_interactions += recent_comments

        capped_interactions = min(total_recent_interactions, self.MAX_INTERACTIONS_PER_DAY)
        score += capped_interactions * self.ACTIVITY_POINTS['like_or_comment']

        # Job applications
        applications = await self.db.applications.count_documents({"user_id": user_id})
        score += min(applications * self.ACTIVITY_POINTS['job_application'], 40)  # Max 40 points from applications

        # Profile updates (recent activity)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_updates = await self.db.users.count_documents({
            "_id": user_id,
            "updated_at": {"$gte": week_ago}
        })
        if recent_updates > 0:
            score += self.ACTIVITY_POINTS['profile_update']

        # Daily active usage (weekly cap)
        last_week = datetime.utcnow() - timedelta(days=7)
        active_days = await self.db.user_activity.distinct("date", {
            "user_id": user_id,
            "date": {"$gte": last_week}
        })
        score += min(len(active_days), self.MAX_DAILY_ACTIVE)

        # Ensure score doesn't exceed maximum
        return min(score, self.MAX_SYNC_SCORE)

    async def update_sync_score(self, user_id: str, activity_type: str = None) -> int:
        """Update sync score for a user, optionally based on specific activity"""
        score = await self.calculate_sync_score(user_id)

        # Update user with new score
        await self.db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "sync_score": score,
                    "sync_score_updated": datetime.utcnow()
                }
            }
        )

        # Log the activity if provided
        if activity_type:
            await self.db.user_activity.insert_one({
                "user_id": user_id,
                "activity_type": activity_type,
                "points": self.ACTIVITY_POINTS.get(activity_type, 0),
                "timestamp": datetime.utcnow()
            })

        return score

    async def get_sync_score(self, user_id: str, requester_id: str = None, requester_role: str = None) -> Dict[str, Any]:
        """Get sync score for a user with access control"""
        user = await self.db.users.find_one({"_id": user_id})

        if not user:
            return {"error": "User not found"}

        # Access control: only user themselves or recruiters can see sync score
        if requester_id != user_id and requester_role != 'recruiter':
            return {"score": None, "message": "Sync Score not available"}

        return {
            "score": user.get("sync_score", 0),
            "updated_at": user.get("sync_score_updated"),
            "max_score": self.MAX_SYNC_SCORE
        }

    async def record_activity(self, user_id: str, activity_type: str):
        """Record a user activity for sync score calculation"""
        await self.db.user_activity.insert_one({
            "user_id": user_id,
            "activity_type": activity_type,
            "timestamp": datetime.utcnow()
        })

        # Update sync score
        await self.update_sync_score(user_id, activity_type)
