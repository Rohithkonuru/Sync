from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.middleware.auth_middleware import get_current_user
from app.database import get_database

router = APIRouter()

@router.post("", response_model=CompanyResponse)
async def create_company(
    company_data: CompanyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new company (admin only)"""
    db = get_database()
    
    # Check if company name already exists
    existing = await db.companies.find_one({"name": company_data.name})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name already exists"
        )
    
    company_dict = {
        **company_data.dict(),
        "admin_ids": [str(current_user["_id"])],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.companies.insert_one(company_dict)
    company = await db.companies.find_one({"_id": result.inserted_id})
    
    return company_to_dict(company)

@router.get("", response_model=List[CompanyResponse])
async def get_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    name: Optional[str] = Query(None),
    industry: Optional[str] = Query(None)
):
    """Get list of companies"""
    db = get_database()
    query = {}
    
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if industry:
        query["industry"] = {"$regex": industry, "$options": "i"}
    
    companies = await db.companies.find(query).sort("name", 1).skip(skip).limit(limit).to_list(length=limit)
    
    return [company_to_dict(company) for company in companies]

@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: str):
    """Get company by ID"""
    db = get_database()
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    return company_to_dict(company)

@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    company_update: CompanyUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update company (admin only)"""
    db = get_database()
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    # Verify user is admin
    if str(current_user["_id"]) not in company.get("admin_ids", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this company"
        )
    
    update_data = company_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.companies.update_one(
        {"_id": ObjectId(company_id)},
        {"$set": update_data}
    )
    
    updated_company = await db.companies.find_one({"_id": ObjectId(company_id)})
    return company_to_dict(updated_company)

@router.post("/{company_id}/admins")
async def add_admin(
    company_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Add admin to company"""
    db = get_database()
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    # Verify user is admin
    if str(current_user["_id"]) not in company.get("admin_ids", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    await db.companies.update_one(
        {"_id": ObjectId(company_id)},
        {"$addToSet": {"admin_ids": user_id}}
    )
    
    return {"message": "Admin added"}

@router.get("/{company_id}/jobs", response_model=List)
async def get_company_jobs(company_id: str):
    """Get jobs posted by a company"""
    from app.routes.jobs import job_to_dict
    
    db = get_database()
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    jobs = await db.jobs.find({"company_id": company_id}).sort("created_at", -1).to_list(length=100)
    
    return [job_to_dict(job) for job in jobs]

def company_to_dict(company: dict) -> dict:
    """Convert company document to response dict"""
    if not company:
        return None
    company["id"] = str(company["_id"])
    company.pop("_id", None)
    return company

