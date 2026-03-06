from fastapi import APIRouter, Depends, HTTPException
from app.database import get_jobs_collection
from app.models import Job
from app.services.auth import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/create")
async def create_job(job: Job, user: dict = Depends(get_current_user)):
    if user['user_type'] != 'recruiter':
        raise HTTPException(status_code=403, detail="Only recruiters can create jobs")
    job_dict = job.dict()
    job_dict['recruiter_id'] = str(user['_id'])
    job_dict['created_at'] = datetime.utcnow()
    result = get_jobs_collection().insert_one(job_dict)
    return {"job_id": str(result.inserted_id)}

@router.get("/")
async def get_jobs():
    jobs = list(get_jobs_collection().find({"status": "active"}))
    return [{"id": str(j["_id"]), **j} for j in jobs]

@router.get("/recruiter/jobs")
async def get_recruiter_jobs(user: dict = Depends(get_current_user)):
    if user['user_type'] != 'recruiter':
        raise HTTPException(status_code=403)
    jobs = list(get_jobs_collection().find({"recruiter_id": str(user['_id'])}))
    return [{"id": str(j["_id"]), **j} for j in jobs]

@router.get("/{job_id}")
async def get_job(job_id: str):
    job = get_jobs_collection().find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404)
    return {"id": str(job["_id"]), **job}

@router.delete("/{job_id}")
async def delete_job(job_id: str, user: dict = Depends(get_current_user)):
    job = get_jobs_collection().find_one({"_id": ObjectId(job_id)})
    if not job or job['recruiter_id'] != str(user['_id']):
        raise HTTPException(status_code=403)
    get_jobs_collection().delete_one({"_id": ObjectId(job_id)})
    return {"message": "Job deleted"}

@router.put("/{job_id}")
async def update_job(job_id: str, updates: dict, user: dict = Depends(get_current_user)):
    job = get_jobs_collection().find_one({"_id": ObjectId(job_id)})
    if not job or job['recruiter_id'] != str(user['_id']):
        raise HTTPException(status_code=403)
    get_jobs_collection().update_one({"_id": ObjectId(job_id)}, {"$set": updates})
    return {"message": "Job updated"}