import asyncio
from datetime import datetime
from app.database import get_database

async def calculate_feed_score(post: dict, user: dict = None) -> float:
    """Calculate AI-based feed score using multiple signals."""
    engagement = (len(post.get("likes", [])) + len(post.get("comments", []))) * 0.4
    recency_hours = max(1, (datetime.utcnow() - post.get("created_at", datetime.utcnow())).total_seconds() / 3600)
    recency = 100 / (1 + recency_hours) * 0.3
    connection_priority = 10 if user and post.get("user_id") in user.get("connections", []) else 0
    connection_priority *= 0.2
    
    # User interests: bonus for posts from same skills/role
    user_interest = 0
    if user and post.get("user_role") and user.get("user_type"):
        if post.get("user_role") == user.get("user_type"):
            user_interest = 5 * 0.1
        if user.get("skills"):
            post_skills = post.get("skills", [])
            matching_skills = len(set(user.get("skills", [])) & set(post_skills))
            user_interest += matching_skills * 0.1
    
    total_score = engagement + recency + connection_priority + user_interest
    return max(0, min(100, total_score))


async def rank_feed_posts(posts: list, user: dict = None) -> list:
    db = get_database()
    scored_posts = []
    
    for post in posts:
        score = await calculate_feed_score(post, user)
        scored_posts.append((score, post))
    
    # Sort by score descending (highest engagement/recency first)
    scored_posts.sort(key=lambda x: x[0], reverse=True)
    
    return [post for _, post in scored_posts]


async def get_ranked_feed(user_id: str, limit: int = 20):
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    
    # Fetch recent posts from all users 
    posts = await db.posts.find({}).sort("created_at", -1).limit(limit * 2).to_list(length=limit * 2)
    
    # Rank posts using AI algorithm
    ranked = await rank_feed_posts(posts, user)
    
    return ranked[:limit]
