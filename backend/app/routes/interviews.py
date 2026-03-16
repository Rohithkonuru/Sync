from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends
from app.database import get_database
from app.middleware.auth_middleware import get_current_user

router = APIRouter()


def _load_interview(interviews, interview_id: str, current_user_id: str):
    if ObjectId.is_valid(interview_id):
        return interviews.find_one({"_id": ObjectId(interview_id), "candidate_id": current_user_id})
    return interviews.find_one({"invite_id": interview_id, "candidate_id": current_user_id})


@router.post("/{interview_id}/accept")
async def accept_interview(interview_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    interviews = db.interviews
    current_user_id = str(current_user.get("_id"))

    interview = await _load_interview(interviews, interview_id, current_user_id)
    if not interview:
        await interviews.insert_one(
            {
                "invite_id": interview_id,
                "candidate_id": current_user_id,
                "status": "accepted",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )
        return {"status": "accepted", "message": "Interview accepted"}

    await interviews.update_one(
        {"_id": interview["_id"]},
        {"$set": {"status": "accepted", "updated_at": datetime.utcnow()}},
    )
    return {"status": "accepted", "message": "Interview accepted"}


@router.post("/{interview_id}/decline")
async def decline_interview(interview_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    interviews = db.interviews
    current_user_id = str(current_user.get("_id"))

    interview = await _load_interview(interviews, interview_id, current_user_id)
    if not interview:
        await interviews.insert_one(
            {
                "invite_id": interview_id,
                "candidate_id": current_user_id,
                "status": "declined",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )
        return {"status": "declined", "message": "Interview declined"}

    await interviews.update_one(
        {"_id": interview["_id"]},
        {"$set": {"status": "declined", "updated_at": datetime.utcnow()}},
    )
    return {"status": "declined", "message": "Interview declined"}
