from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.database import get_applications_collection, get_jobs_collection
from app.models import JobApplication
from app.services.auth import get_current_user
from app.services.scores import calculate_ats_score, calculate_sync_score, calculate_growth_score
from bson import ObjectId
import shutil
from datetime import datetime

router = APIRouter()

@router.post("/apply")
async def apply_job(job_id: str, resume: UploadFile = File(None), user: dict = Depends(get_current_user)):
    job = get_jobs_collection().find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404)
    resume_url = None
    if resume:
        resume_url = f"uploads/{user['_id']}_{resume.filename}"
        with open(resume_url, "wb") as f:
            shutil.copyfileobj(resume.file, f)
    ats_score = calculate_ats_score(job['skills_required'], user.get('skills', []), resume_url)
    sync_score = await calculate_sync_score(str(user['_id']))
    growth_score = await calculate_growth_score(str(user['_id']))
    app = JobApplication(
        job_id=job_id,
        candidate_id=str(user['_id']),
        recruiter_id=job['recruiter_id'],
        resume_url=resume_url,
        ats_score=ats_score,
        sync_score=sync_score,
        growth_score=growth_score
    )
    result = get_applications_collection().insert_one(app.dict())
    get_jobs_collection().update_one({"_id": ObjectId(job_id)}, {"$inc": {"applicants_count": 1}})
    return {"application_id": str(result.inserted_id)}

@router.get("/user")
async def get_user_applications(user: dict = Depends(get_current_user)):
    apps = list(get_applications_collection().find({"candidate_id": str(user['_id'])}))
    return [{"id": str(a["_id"]), **a} for a in apps]

@router.get("/recruiter/jobs/{job_id}/applications")
async def get_job_applications(job_id: str, user: dict = Depends(get_current_user)):
    job = get_jobs_collection().find_one({"_id": ObjectId(job_id)})
    if job['recruiter_id'] != str(user['_id']):
        raise HTTPException(status_code=403)
    apps = list(get_applications_collection().find({"job_id": job_id}))
    for app in apps:
        app['is_seen'] = True
        get_applications_collection().update_one({"_id": ObjectId(app['_id'])}, {"$set": {"is_seen": True}})
    return [{"id": str(a["_id"]), **a} for a in apps]

@router.put("/{application_id}/status")
async def update_status(application_id: str, status: str, user: dict = Depends(get_current_user)):
    app = get_applications_collection().find_one({"_id": ObjectId(application_id)})
    if app['recruiter_id'] != str(user['_id']):
        raise HTTPException(status_code=403)
    get_applications_collection().update_one({"_id": ObjectId(application_id)}, {"$set": {"status": status, "updated_at": datetime.utcnow()}})
    return {"message": "Status updated"}