from app.database import get_database
from app.services.auth import get_user_by_id
import asyncio

async def calculate_sync_score(user_id: str) -> float:
    try:
        # Get user directly in async context
        user = await get_user_by_id(user_id)
        if not user:
            return 0.0
        score = 0
        if user.get('first_name') and user.get('last_name'): score += 25
        if user.get('location'): score += 25
        if user.get('resume_url'): score += 20
        db = get_database()
        applications = await db.job_applications.count_documents({'candidate_id': user_id})
        score += min(applications * 10, 10)
        connections = await db.connections.count_documents({'$or': [{'requester_id': user_id}, {'receiver_id': user_id}], 'status': 'accepted'})
        score += min(connections * 10, 10)
        return min(score, 100)
    except Exception as e:
        print(f"Error calculating sync score: {e}")
        return 0.0

def calculate_ats_score(job_skills: list, user_skills: list, resume_url: str) -> float:
    # Simple keyword match + profile completeness
    match = len(set(job_skills) & set(user_skills)) / len(job_skills) * 50 if job_skills else 0
    completeness = 50 if resume_url else 0
    return min(match + completeness, 100)

async def calculate_growth_score(user_id: str) -> float:
    # Track improvements over time (simplified: based on current scores)
    # Assume historical data; for now, base on current scores
    sync = await calculate_sync_score(user_id)
    # Placeholder: Growth based on sync score (can expand with history)
    return min(sync * 1.2, 100)  # Example multiplier