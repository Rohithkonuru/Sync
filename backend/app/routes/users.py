from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Query
from fastapi.responses import FileResponse
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import os
import uuid
from PIL import Image
import pillow_heif  # Enable HEIC/HEIF support for PIL
import io
from app.models.user import UserResponse, UserUpdate
from app.middleware.auth_middleware import get_current_user
from app.database import get_database
from app.services.auth import get_user_by_id, user_to_dict
from app.services.sync_score import SyncScoreService
from app.services.growth_score import get_growth_score_service

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return user_to_dict(current_user)

@router.get("/me/ats-score")
async def get_my_ats_score(current_user: dict = Depends(get_current_user)):
    """Get current user's ATS score"""
    return current_user.get("ats_score")

@router.get("/me/applications")
async def get_my_applications_alias(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Alias endpoint for /api/jobs/my-applications/list - returns applications for logged-in user"""
    from app.routes.jobs import get_my_applications
    return await get_my_applications(skip, limit, current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user profile"""
    db = get_database()
    update_data = user_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    # detect new skills for growth score activity
    new_skills = []
    if "skills" in update_data:
        old_skills = current_user.get("skills", []) or []
        for skill in update_data["skills"]:
            if skill not in old_skills:
                new_skills.append(skill)

    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data}
    )

    # record activities and update scores
    try:
        from app.services.sync_score import SyncScoreService
        from app.services.growth_score import get_growth_score_service
        uid = str(current_user["_id"])
        sync_service = SyncScoreService()
        growth_service = get_growth_score_service()
        await sync_service.record_activity(uid, "profile_update")
        await growth_service.record_activity(uid, "profile_updated")
        # skills added
        for _ in new_skills:
            await sync_service.record_activity(uid, "skill_added")
            await growth_service.record_activity(uid, "skill_added")
    except Exception:
        pass

    updated_user = await get_user_by_id(str(current_user["_id"]))
    return user_to_dict(updated_user)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str):
    """Get user profile by ID"""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user_to_dict(user)

@router.post("/{user_id}/connect")
async def send_connection_request(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Send connection request"""
    if user_id == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot connect to yourself"
        )
    
    db = get_database()
    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already connected
    if user_id in current_user.get("connections", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already connected"
        )
    
    # Check if request already sent
    if str(current_user["_id"]) in target_user.get("connection_requests", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connection request already sent"
        )
    
    # Add to connection requests
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"connection_requests": str(current_user["_id"])}}
    )
    
    # Create notification
    await create_notification(
        user_id=user_id,
        type="connection_request",
        title="New Connection Request",
        message=f"{current_user.get('first_name')} {current_user.get('last_name')} wants to connect",
        related_user_id=str(current_user["_id"])
    )
    
    return {"message": "Connection request sent"}

@router.post("/{user_id}/accept")
async def accept_connection_request(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Accept connection request"""
    db = get_database()
    
    # Remove from connection requests and add to connections
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {
            "$pull": {"connection_requests": user_id},
            "$addToSet": {"connections": user_id}
        }
    )
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"connections": str(current_user["_id"])}}
    )
    
    # Create notification
    await create_notification(
        user_id=user_id,
        type="connection_accepted",
        title="Connection Accepted",
        message=f"{current_user.get('first_name')} {current_user.get('last_name')} accepted your connection request",
        related_user_id=str(current_user["_id"])
    )
    
    return {"message": "Connection accepted"}

@router.get("/connections/list", response_model=List[UserResponse])
async def get_connections(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get user's connections with pagination"""
    db = get_database()
    connection_ids = current_user.get("connections", [])
    
    if not connection_ids:
        return []
    
    # Convert to ObjectIds and filter valid ones
    valid_ids = [ObjectId(cid) for cid in connection_ids if ObjectId.is_valid(cid)]
    
    if not valid_ids:
        return []
    
    # Fetch users with pagination
    users_cursor = db.users.find({"_id": {"$in": valid_ids}}).skip(skip).limit(limit)
    users = await users_cursor.to_list(length=limit)
    
    return [user_to_dict(user) for user in users]

@router.delete("/connections/{user_id}")
async def remove_connection(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove/unfriend a connection"""
    db = get_database()
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    if user_id == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself as a connection"
        )
    
    # Check if connection exists
    if user_id not in current_user.get("connections", []):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    # Remove from both users' connections
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$pull": {"connections": user_id}}
    )
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"connections": str(current_user["_id"])}}
    )
    
    return {"message": "Connection removed successfully"}

@router.get("/suggestions/list", response_model=List[UserResponse])
async def get_suggestions(current_user: dict = Depends(get_current_user)):
    """Get suggested connections"""
    db = get_database()
    current_connections = current_user.get("connections", [])
    current_connections.append(str(current_user["_id"]))
    pending_requests = current_user.get("connection_requests", [])
    
    # Get users not in connections or pending requests
    exclude_ids = current_connections + pending_requests
    suggestions = await db.users.find({
        "_id": {"$nin": [ObjectId(cid) for cid in exclude_ids if ObjectId.is_valid(cid)]},
        "user_type": {"$ne": "recruiter"}
    }).limit(10).to_list(length=10)
    
    return [user_to_dict(user) for user in suggestions]

@router.get("/connection-requests/list", response_model=List[UserResponse])
async def get_connection_requests(current_user: dict = Depends(get_current_user)):
    """Get pending connection requests"""
    db = get_database()
    request_ids = current_user.get("connection_requests", [])
    
    users = []
    for req_id in request_ids:
        if ObjectId.is_valid(req_id):
            user = await db.users.find_one({"_id": ObjectId(req_id)})
            if user:
                users.append(user_to_dict(user))
    
    return users

@router.post("/{user_id}/reject")
async def reject_connection_request(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject connection request"""
    db = get_database()
    
    # Remove from connection requests
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$pull": {"connection_requests": user_id}}
    )
    
    return {"message": "Connection request rejected"}

@router.post("/{user_id}/decline")
async def decline_connection_request(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Decline connection request (alias for reject)"""
    return await reject_connection_request(user_id, current_user)

@router.delete("/{user_id}/cancel-request")
async def cancel_connection_request(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a connection request you sent"""
    db = get_database()
    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if request was sent
    if str(current_user["_id"]) not in target_user.get("connection_requests", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending connection request found"
        )
    
    # Remove from target user's connection requests
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"connection_requests": str(current_user["_id"])}}
    )
    
    return {"message": "Connection request cancelled"}

@router.get("/search", response_model=List[UserResponse])
async def search_users(
    query: Optional[str] = Query(None),
    user_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),
    experience_years_min: Optional[int] = Query(None, ge=0),
    experience_years_max: Optional[int] = Query(None, ge=0),
    role: Optional[str] = Query(None),  # For filtering by role/headline
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Search candidates/users by various criteria with advanced filters"""
    db = get_database()
    search_query = {}
    
    # Exclude current user
    search_query["_id"] = {"$ne": ObjectId(current_user["_id"])}
    
    # Filter by user type (for candidate search, typically job_seeker or professional)
    if user_type:
        valid_types = ["student", "job_seeker", "professional", "recruiter"]
        if user_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid user_type. Must be one of: {', '.join(valid_types)}"
            )
        search_query["user_type"] = user_type
    
    # Location filter (case-insensitive partial match)
    if location:
        search_query["location"] = {"$regex": location, "$options": "i"}
    
    # Skills filter (match any of the provided skills)
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
        if skill_list:
            search_query["skills"] = {
                "$in": [{"$regex": skill, "$options": "i"} for skill in skill_list]
            }
            # Better approach: check if any skill in array matches
            search_query["skills"] = {
                "$elemMatch": {
                    "$regex": "|".join(skill_list),
                    "$options": "i"
                }
            }
            # Actually, simpler approach:
            search_query["$or"] = search_query.get("$or", [])
            for skill in skill_list:
                search_query["$or"].append({"skills": {"$regex": skill, "$options": "i"}})
    
    # Experience years filter
    if experience_years_min is not None or experience_years_max is not None:
        exp_query = {}
        if experience_years_min is not None:
            exp_query["$gte"] = experience_years_min
        if experience_years_max is not None:
            exp_query["$lte"] = experience_years_max
        if exp_query:
            search_query["experience_years"] = exp_query
    
    # Role/headline filter
    if role:
        if "$or" not in search_query:
            search_query["$or"] = []
        search_query["$or"].append({"headline": {"$regex": role, "$options": "i"}})
    
    # Text search (name, headline, bio)
    if query:
        text_search = {
            "$or": [
                {"first_name": {"$regex": query, "$options": "i"}},
                {"last_name": {"$regex": query, "$options": "i"}},
                {"headline": {"$regex": query, "$options": "i"}},
                {"bio": {"$regex": query, "$options": "i"}}
            ]
        }
        if "$or" in search_query:
            # Combine with existing $or conditions
            search_query["$and"] = [
                {"$or": search_query.pop("$or")},
                text_search
            ]
        else:
            search_query.update(text_search)
    
    # Execute search with pagination
    users_cursor = db.users.find(search_query).skip(skip).limit(limit)
    users = await users_cursor.to_list(length=limit)
    
    return [user_to_dict(user) for user in users]

def optimize_image(image_bytes: bytes, max_width: int = 500, max_height: int = 500, quality: int = 85) -> bytes:
    """Optimize image by resizing and compressing"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert RGBA/LA/P to RGB if necessary
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            img = background
        elif img.mode == 'P':
            img = img.convert('RGB')
        elif img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')
        
        # Resize if needed (maintain aspect ratio)
        if img.width > max_width or img.height > max_height:
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # Save optimized image
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)
        optimized_bytes = output.read()
        
        # Only return optimized if it's smaller, otherwise return original
        if len(optimized_bytes) < len(image_bytes):
            return optimized_bytes
        return image_bytes
    except Exception as e:
        # If optimization fails, return original
        return image_bytes

@router.post("/upload/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload and store profile picture in MongoDB (survives deployments)"""
    import base64
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, GIF, WebP, and mobile formats (HEIC/HEIF) are allowed."
        )

    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB."
        )

    try:
        # Optimize image
        optimized_content = optimize_image(file_content, max_width=500, max_height=500, quality=85)
        
        # Convert to Base64 for MongoDB storage
        base64_image = base64.b64encode(optimized_content).decode('utf-8')
        
        # Store in MongoDB with metadata
        db = get_database()
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": {
                "profile_picture_base64": base64_image,
                "profile_picture_type": file.content_type,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Return API URL instead of data URL (much more efficient)
        return {"url": f"/api/users/me/profile-picture", "type": file.content_type}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {str(e)}"
        )

@router.get("/me/profile-picture")
async def get_profile_picture(
    current_user: dict = Depends(get_current_user)
):
    """Get current user's profile picture as inline image"""
    base64_image = current_user.get("profile_picture_base64")
    content_type = current_user.get("profile_picture_type", "image/jpeg")
    
    if not base64_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile picture not found"
        )
    
    try:
        import base64
        image_data = base64.b64decode(base64_image)
        return FileResponse(
            io.BytesIO(image_data),
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=31536000",  # Cache for 1 year
                "Content-Disposition": "inline"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving profile picture: {str(e)}"
        )

@router.get("/{user_id}/profile-picture")
async def get_user_profile_picture(user_id: str):
    """Get any user's profile picture"""
    try:
        user = await get_user_by_id(user_id)
        if not user or not user.get("profile_picture_base64"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile picture not found"
            )
        
        import base64
        base64_image = user.get("profile_picture_base64")
        content_type = user.get("profile_picture_type", "image/jpeg")
        
        image_data = base64.b64decode(base64_image)
        return FileResponse(
            io.BytesIO(image_data),
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=31536000",
                "Content-Disposition": "inline"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving profile picture: {str(e)}"
        )

from app.services.ats_scorer import calculate_ats_score

@router.post("/upload/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload resume file for ATS scoring"""
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF, DOC, and DOCX files are allowed."
        )

    # Validate file size (max 10MB for resume)
    max_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 10MB."
        )

    try:
        # Generate unique filename
        unique_filename = f"resume_{uuid.uuid4()}_{file.filename}"
        upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)

        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)

        # Update user's resume URL
        file_url = f"/uploads/{unique_filename}"
        db = get_database()
        
        # Update user with resume_url
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": {"resume_url": file_url, "updated_at": datetime.utcnow()}}
        )
        
        # Calculate ATS score immediately
        try:
            # Update current_user dict with new resume_url for calculation
            current_user["resume_url"] = file_url
            ats_result = await calculate_ats_score(current_user)

            # determine if score improved
            old_ats = (current_user.get("ats_score") or {}).get("score", 0)
            new_score_val = ats_result.get("score", 0)

            # Save ATS score to user profile
            await db.users.update_one(
                {"_id": ObjectId(current_user["_id"])},
                {"$set": {"ats_score": ats_result}}
            )

            # record sync and growth activity
            try:
                from app.services.sync_score import SyncScoreService
                from app.services.growth_score import get_growth_score_service
                uid = str(current_user["_id"])
                sync_service = SyncScoreService()
                growth_service = get_growth_score_service()
                await sync_service.record_activity(uid, "ats_score_generated")
                if new_score_val > old_ats:
                    await growth_service.record_activity(uid, "ats_score_improved", amount=new_score_val - old_ats)
            except Exception:
                pass
        except Exception as e:
            print(f"Error calculating ATS score during upload: {e}")
            # Fallback ATS result so upload doesn't fail
            ats_result = {
                "score": 0,
                "verified": True, # We just uploaded it
                "breakdown": {"keywords": 0, "skills": 0, "experience": 0, "education": 0, "completeness": 0},
                "last_updated": datetime.utcnow().isoformat()
            }

        return {
            "url": file_url, 
            "message": "Resume uploaded successfully and ATS score calculated",
            "ats_score": ats_result
        }
    except Exception as e:
        print(f"Upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload resume: {str(e)}"
        )



@router.delete("/me/profile-picture")
async def delete_profile_picture(
    current_user: dict = Depends(get_current_user)
):
    """Delete profile picture"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Get current profile picture URL
    profile_picture = current_user.get("profile_picture")
    
    if profile_picture:
        # Delete file from storage if it exists
        try:
            upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
            # Extract filename from URL
            filename = profile_picture.split("/")[-1]
            file_path = os.path.join(upload_dir, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log error but continue with database update
            print(f"Error deleting file: {e}")
    
    # Remove profile picture from user record
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$unset": {"profile_picture": ""}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Profile picture deleted successfully"}

@router.post("/upload/banner-picture")
async def upload_banner_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload and store banner picture in MongoDB (survives deployments)"""
    import base64
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, GIF, WebP, and mobile formats (HEIC/HEIF) are allowed."
        )
    max_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 10MB."
        )

    try:
        # Optimize banner image (larger dimensions)
        optimized_content = optimize_image(file_content, max_width=1920, max_height=600, quality=85)
        
        # Convert to Base64 for MongoDB storage
        base64_image = base64.b64encode(optimized_content).decode('utf-8')
        
        # Store in MongoDB with metadata
        db = get_database()
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": {
                "banner_picture_base64": base64_image,
                "banner_picture_type": file.content_type,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Return API URL instead of data URL
        return {"url": f"/api/users/me/banner-picture", "type": file.content_type}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {str(e)}"
        )

@router.get("/me/banner-picture")
async def get_banner_picture(
    current_user: dict = Depends(get_current_user)
):
    """Get current user's banner picture as inline image"""
    base64_image = current_user.get("banner_picture_base64")
    content_type = current_user.get("banner_picture_type", "image/jpeg")
    
    if not base64_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner picture not found"
        )
    
    try:
        import base64
        image_data = base64.b64decode(base64_image)
        return FileResponse(
            io.BytesIO(image_data),
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=31536000",
                "Content-Disposition": "inline"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving banner picture: {str(e)}"
        )

@router.get("/me/ats-score")
async def get_ats_score(
    current_user: dict = Depends(get_current_user)
):
    """Get ATS score for current user's resume"""
    from app.services.ats_scorer import calculate_ats_score
    
    user_type = current_user.get("user_type")
    if user_type not in ["student", "professional", "job_seeker"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ATS score is only available for students, professionals, and job seekers"
        )
    
    resume_url = current_user.get("resume_url")
    if not resume_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found. Please upload a resume first."
        )
    
    try:
        # Calculate ATS score
        score_data = await calculate_ats_score(current_user)
        # optionally persist and record activity
        try:
            db = get_database()
            uid = str(current_user["_id"])
            old_ats = (current_user.get("ats_score") or {}).get("score", 0)
            new_score = score_data.get("score", 0)
            if new_score != old_ats:
                await db.users.update_one(
                    {"_id": ObjectId(uid)},
                    {"$set": {"ats_score": score_data, "updated_at": datetime.utcnow()}}
                )
            from app.services.sync_score import SyncScoreService
            from app.services.growth_score import get_growth_score_service
            sync = SyncScoreService()
            growth = get_growth_score_service()
            await sync.record_activity(uid, "ats_score_generated")
            if new_score > old_ats:
                await growth.record_activity(uid, "ats_score_improved", amount=new_score-old_ats)
        except Exception:
            pass
        return score_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate ATS score: {str(e)}"
        )

# Sync Score Endpoints
@router.get("/me/sync-score")
async def get_my_sync_score(current_user: dict = Depends(get_current_user)):
    """Get current user's sync score"""
    sync_score_service = SyncScoreService()
    return await sync_score_service.get_sync_score(current_user["_id"], current_user["_id"], current_user.get("user_type"))

@router.get("/{user_id}/sync-score")
async def get_user_sync_score(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get another user's sync score (only visible to recruiters)"""
    # Check if current user is a recruiter
    if current_user.get("user_type") != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view other users' sync scores"
        )

    sync_score_service = SyncScoreService()
    result = await sync_score_service.get_sync_score(user_id, current_user["_id"], current_user.get("user_type"))

    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"]
        )

    return result

@router.post("/activity/{activity_type}")
async def record_user_activity(
    activity_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Record user activity and update sync score"""
    valid_activities = [
        "profile_completion", "resume_uploaded", "ats_score_generated",
        "post_created", "like_or_comment", "job_application",
        "profile_update", "daily_active"
    ]

    if activity_type not in valid_activities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid activity type. Valid types: {', '.join(valid_activities)}"
        )

    sync_score_service = SyncScoreService()
    new_score = await sync_score_service.record_activity(current_user["_id"], activity_type)

    return {
        "message": f"Activity '{activity_type}' recorded successfully",
        "new_sync_score": new_score
    }

@router.post("/sync-score/update")
async def update_sync_score(current_user: dict = Depends(get_current_user)):
    """Manually update sync score (for testing/admin purposes)"""
    sync_score_service = SyncScoreService()
    new_score = await sync_score_service.update_sync_score(current_user["_id"])

    return {
        "message": "Sync score updated successfully",
        "sync_score": new_score
    }

# Growth Score endpoints
@router.get("/me/growth-score")
async def get_my_growth_score(current_user: dict = Depends(get_current_user)):
    """Get current user's Growth Score"""
    try:
        growth_score_service = get_growth_score_service()
        growth_score_data = await growth_score_service.get_growth_score(
            current_user["_id"], 
            current_user["_id"], 
            current_user.get("user_type", "")
        )
        
        if not growth_score_data:
            return {"growth_score": 0, "growth_score_updated": None}
        
        return growth_score_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching growth score: {str(e)}"
        )

@router.get("/{user_id}/growth-score")
async def get_user_growth_score(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get another user's Growth Score (recruiter access)"""
    try:
        # Check if requester has access
        requester_id = current_user["_id"]
        requester_role = current_user.get("user_type", "")
        
        growth_score_service = get_growth_score_service()
        growth_score_data = await growth_score_service.get_growth_score(
            user_id, 
            requester_id, 
            requester_role
        )
        
        if not growth_score_data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied or growth score not found"
            )
        
        return growth_score_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching growth score: {str(e)}"
        )

@router.post("/growth-score/update")
async def update_growth_score(current_user: dict = Depends(get_current_user)):
    """Manually update growth score (for testing/admin purposes)"""
    try:
        growth_score_service = get_growth_score_service()
        new_score = await growth_score_service.update_growth_score(current_user["_id"])
        
        return {
            "message": "Growth score updated successfully",
            "growth_score": new_score
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating growth score: {str(e)}"
        )

@router.post("/activity/{activity_type}")
async def record_user_activity(
    activity_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Record user activity for Growth Score calculation"""
    try:
        growth_score_service = get_growth_score_service()
        await growth_score_service.record_activity(current_user["_id"], activity_type)
        
        return {"message": f"Activity {activity_type} recorded successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error recording activity: {str(e)}"
        )

