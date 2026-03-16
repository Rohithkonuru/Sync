from datetime import datetime
from fastapi import APIRouter, Depends
from app.database import get_database
from app.middleware.auth_middleware import get_current_user

router = APIRouter()


@router.post("/start-trial")
async def start_trial(current_user: dict = Depends(get_current_user)):
    """Activate premium trial for the authenticated user."""
    db = get_database()
    user_id = current_user.get("_id")

    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "premium_status": True,
                "trial_started_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {
        "premium_status": True,
        "message": "Premium trial activated!",
    }
