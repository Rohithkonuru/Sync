from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_database
from app.middleware.auth_middleware import get_current_user

router = APIRouter()


@router.post("/create")
async def create_event(payload: dict, current_user: dict = Depends(get_current_user)):
    """Create an event record used by dashboard event modal."""
    event_title = (payload.get("event_title") or "").strip()
    event_date = payload.get("event_date")
    event_description = (payload.get("event_description") or "").strip()
    location = (payload.get("location") or "").strip()

    if not event_title or not event_date or not event_description or not location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="event_title, event_date, event_description, and location are required",
        )

    db = get_database()
    doc = {
        "user_id": str(current_user.get("_id")),
        "event_title": event_title,
        "event_date": event_date,
        "event_description": event_description,
        "location": location,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.events.insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "message": "Event created successfully",
    }
