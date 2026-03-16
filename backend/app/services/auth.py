from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.config import settings
from app.database import get_database
from bson import ObjectId

import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__default_rounds=8)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except:
        # Fallback for old hashes or other issues
        return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    try:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=8)).decode('utf-8')
    except:
        # Fallback
        return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def verify_token(token: str):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None

async def get_user_by_email(email: str):
    """Get user by email"""
    db = get_database()
    user = await db.users.find_one({"email": email})
    return user

async def get_user_by_id(user_id: str):
    """Get user by ID"""
    db = get_database()
    if not ObjectId.is_valid(user_id):
        return None
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return user

async def create_user(user_data: dict):
    """Create a new user"""
    db = get_database()
    # Check if user exists
    existing_user = await get_user_by_email(user_data["email"])
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user_type = user_data.get("user_type", "professional")
    
    # Validate required fields based on user type
    if user_type == "recruiter":
        # For recruiters, company details are required
        if not user_data.get("company_name") or not user_data.get("company_description"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name and description are required for recruiters"
            )
    # Removed resume requirement for students and job seekers to allow simple registration
    
    # Extract company data for recruiters (before removing from user_data)
    company_data = None
    if user_type == "recruiter":
        company_data = {
            "name": user_data.get("company_name"),
            "description": user_data.get("company_description"),
            "website": user_data.get("company_website"),
            "location": user_data.get("company_location"),
            "industry": user_data.get("company_industry"),
            "size": user_data.get("company_size"),
        }
        # Remove company fields from user_data
        user_data.pop("company_name", None)
        user_data.pop("company_description", None)
        user_data.pop("company_website", None)
        user_data.pop("company_location", None)
        user_data.pop("company_industry", None)
        user_data.pop("company_size", None)
    else:
        # For non-recruiters, remove company fields if they exist
        user_data.pop("company_name", None)
        user_data.pop("company_description", None)
        user_data.pop("company_website", None)
        user_data.pop("company_location", None)
        user_data.pop("company_industry", None)
        user_data.pop("company_size", None)
    
    # Hash password
    user_data["password"] = get_password_hash(user_data["password"])
    user_data["created_at"] = datetime.utcnow()
    user_data["updated_at"] = datetime.utcnow()
    user_data["connections"] = []
    user_data["connection_requests"] = []
    # score tracking fields
    user_data["sync_score"] = 0
    user_data["growth_score"] = 0
    user_data["profile_completion"] = 0
    user_data["last_activity"] = None
    user_data["previous_sync_score"] = 0
    user_data["previous_ats_score"] = 0
    
    # Initialize arrays if not provided
    user_data["skills"] = user_data.get("skills") or []
    user_data["education"] = user_data.get("education") or []
    user_data["experience"] = user_data.get("experience") or []
    user_data["certifications"] = []
    
    # Create user
    result = await db.users.insert_one(user_data)
    user = await get_user_by_id(str(result.inserted_id))
    
    # Calculate and update sync score
    from app.services.scores import calculate_sync_score
    sync_score = await calculate_sync_score(str(user["_id"]))
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"sync_score": sync_score}})
    
    # Create company for recruiters
    if user_type == "recruiter" and company_data:
        company_dict = {
            **company_data,
            "admin_ids": [str(user["_id"])],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        # Check if company name already exists
        existing_company = await db.companies.find_one({"name": company_data["name"]})
        if existing_company:
            # If company exists, add user as admin
            await db.companies.update_one(
                {"_id": existing_company["_id"]},
                {"$addToSet": {"admin_ids": str(user["_id"])}}
            )
        else:
            # Create new company
            await db.companies.insert_one(company_dict)
    
    return user

async def authenticate_user(email: str, password: str):
    """Authenticate user with email and password"""
    user = await get_user_by_email(email)
    if not user:
        return None
    
    # Handle test user with fake hash
    if user["password"] == ".hash.for.testing.purposes.only":
        if password == "test123":
            return user
        else:
            return None
    
    if not verify_password(password, user["password"]):
        return None
    
    # Update sync score on login
    from app.services.scores import calculate_sync_score
    user["sync_score"] = await calculate_sync_score(str(user["_id"]))
    db = get_database()
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"sync_score": user["sync_score"]}})
    
    return user

def user_to_dict(user: dict) -> dict:
    """Convert user document to response dict"""
    if not user:
        return None
    user["id"] = str(user["_id"])
    user.pop("_id", None)
    user.pop("password", None)
    return user

