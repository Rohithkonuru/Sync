from fastapi import APIRouter, Depends, HTTPException
from app.database import get_connections_collection
from app.models import Connection
from app.services.auth import get_current_user
from bson import ObjectId

router = APIRouter()

@router.post("/request")
async def send_request(receiver_id: str, user: dict = Depends(get_current_user)):
    if get_connections_collection().find_one({"requester_id": str(user['_id']), "receiver_id": receiver_id}):
        raise HTTPException(status_code=400, detail="Request already sent")
    conn = Connection(requester_id=str(user['_id']), receiver_id=receiver_id)
    get_connections_collection().insert_one(conn.dict())
    return {"message": "Request sent"}

@router.post("/respond")
async def respond_request(connection_id: str, accept: bool, user: dict = Depends(get_current_user)):
    conn = get_connections_collection().find_one({"_id": ObjectId(connection_id), "receiver_id": str(user['_id'])})
    if not conn:
        raise HTTPException(status_code=404)
    status = "accepted" if accept else "rejected"
    get_connections_collection().update_one({"_id": ObjectId(connection_id)}, {"$set": {"status": status}})
    return {"message": f"Request {status}"}

@router.get("/list")
async def get_connections(user: dict = Depends(get_current_user)):
    conns = list(get_connections_collection().find({"$or": [{"requester_id": str(user['_id'])}, {"receiver_id": str(user['_id'])}]}))
    return [{"id": str(c["_id"]), **c} for c in conns]