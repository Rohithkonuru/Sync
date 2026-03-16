import os
import uuid
import random
from fastapi import APIRouter, HTTPException, status, Depends, Query, File, UploadFile
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId
from app.models.post import PostCreate, PostResponse, Comment
from app.middleware.auth_middleware import get_current_user
from app.database import get_database
from app.services.auth import get_user_by_id, user_to_dict
from app.services.notifications import create_notification
from app.services.sync_score import SyncScoreService
from app.services.socket_manager import broadcast_post

router = APIRouter()


def _as_list(value):
    if isinstance(value, list):
        return value
    return []


def _count_items(value):
    if isinstance(value, list):
        return len(value)
    if isinstance(value, (int, float)):
        return int(value)
    return 0

def post_to_dict(post: dict) -> dict:
    if not post:
        return None
    media_url = post.get("media_url")
    media_type = post.get("media_type")
    if not media_url and post.get("images"):
        media_url = post["images"][0]
        media_type = media_type or "image"
    elif media_url and not media_type:
        media_url_lower = media_url.lower()
        if media_url_lower.endswith((".mp4", ".mov", ".webm", ".avi", ".mkv")):
            media_type = "video"
        else:
            media_type = "image"

    likes = _as_list(post.get("likes", []))
    comments = _as_list(post.get("comments", []))

    return {
        "id": str(post["_id"]),
        "user_id": post.get("user_id"),
        "user_name": post.get("user_name"),
        "user_picture": post.get("user_picture") or post.get("user_avatar"),
        "user_role": post.get("user_role", "professional"),
        "user_headline": post.get("user_headline", ""),
        "content": post.get("content", ""),
        "images": post.get("images", []),
        "media_url": media_url,
        "media_type": media_type,
        "likes": likes,
        "comments": comments,
        "likes_count": _count_items(post.get("likes", [])),
        "comments_count": _count_items(post.get("comments", [])),
        "shares": post.get("shares", 0),
        "created_at": post.get("created_at") or datetime.utcnow(),
        "updated_at": post.get("updated_at") or post.get("created_at") or datetime.utcnow()
    }

async def enrich_post_with_user_data(post: dict) -> dict:
    """Enrich post with up-to-date user data"""
    try:
        user = await get_user_by_id(post["user_id"])
        if user:
            post["user_name"] = f"{user.get('first_name')} {user.get('last_name')}"
            post["user_picture"] = user.get("profile_picture")
            post["user_headline"] = user.get("headline", "")
            post["user_role"] = user.get("user_type", "professional")
    except Exception:
        pass # Keep original data if user fetch fails
    return post

@router.post("/upload/image")
async def upload_post_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload media (image/video) for a post"""
    content_type = file.content_type or ""
    if not (content_type.startswith("image/") or content_type.startswith("video/")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only images or videos are allowed."
        )

    # Validate file size (images <=5MB, videos <=25MB)
    file_content = await file.read()
    max_size = 25 * 1024 * 1024 if content_type.startswith("video/") else 5 * 1024 * 1024
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size exceeded."
        )

    try:
        unique_filename = f"post_{uuid.uuid4()}_{file.filename}"
        upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)

        with open(file_path, "wb") as buffer:
            buffer.write(file_content)

        media_type = "video" if content_type.startswith("video/") else "image"
        return {"url": f"/uploads/{unique_filename}", "media_type": media_type}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload media: {str(e)}"
        )


@router.post("", response_model=PostResponse)
async def create_post(post_data: PostCreate, current_user: dict = Depends(get_current_user)):
    """Create a new post"""
    try:
        db = get_database()
        
        post_dict = {
            "user_id": str(current_user["_id"]),
            "user_name": f"{current_user.get('first_name')} {current_user.get('last_name')}",
            "user_picture": current_user.get("profile_picture"),
            "user_avatar": current_user.get("profile_picture"),
            "user_role": current_user.get("user_type", "professional"),
            "user_headline": current_user.get("headline", ""),
            "content": post_data.content,
            "images": post_data.images,
            "media_url": post_data.media_url,
            "media_type": post_data.media_type,
            "likes": [],
            "comments": [],
            "shares": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.posts.insert_one(post_dict)
        
        # Fetch the created post
        post = await db.posts.find_one({"_id": result.inserted_id})
        post_response = post_to_dict(post)
        
        # Broadcast the new post
        await broadcast_post(post_response)
        
        # Record sync score activity
        try:
            sync_score_service = SyncScoreService()
            await sync_score_service.record_activity(str(current_user["_id"]), "post_created")
        except Exception as e:
            print(f"Warning: Failed to record post creation activity: {str(e)}")
        
        return post_response
    except Exception as e:
        print(f"Error creating post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create post: {str(e)}")

@router.get("", response_model=List[PostResponse])
async def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("recent", regex="^(recent|relevance)$"),
    include_demo: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """Get feed posts (from connections and self) with relevance ranking"""
    db = get_database()
    connections = current_user.get("connections", [])
    connections.append(str(current_user["_id"]))

    # Fetch posts from connections
    posts = await db.posts.find({
        "user_id": {"$in": connections}
    }).to_list(length=None)

    # If no posts and demo is requested, get demo data
    if (not posts or len(posts) == 0) and include_demo:
        from app.services.demo_feed import get_demo_feed
        user_type = current_user.get("user_type", "professional")
        demo_posts = get_demo_feed(user_type, limit)
        # Convert demo posts to the expected format
        posts = []
        for i, demo_post in enumerate(demo_posts):
            demo_post["_id"] = demo_post.get("id", f"demo-{uuid.uuid4()}")
            demo_post["user_id"] = demo_post.get("user_id", f"user-{i}")
            demo_post["user_name"] = demo_post["user_name"]
            demo_post["user_picture"] = demo_post.get("user_picture")
            
            # Add headline if missing
            if not demo_post.get("user_headline"):
                demo_post["user_headline"] = f"{demo_post.get('user_type', 'Professional')} at Demo Corp"
            
            demo_post["content"] = demo_post["content"]
            demo_post["images"] = demo_post.get("images", [])
            demo_post["likes"] = demo_post.get("likes", [])
            demo_post["comments"] = demo_post.get("comments", [])
            demo_post["shares"] = demo_post.get("shares", 0)
            
            # Stagger timestamps (random hours ago within last 3 days)
            hours_ago = random.randint(1, 72)
            created_at = datetime.utcnow() - timedelta(hours=hours_ago)
            demo_post["created_at"] = created_at
            demo_post["updated_at"] = created_at
            
            posts.append(demo_post)

    # Calculate relevance score for each post
    if sort_by == "relevance":
        for post in posts:
            # Relevance score = (likes * 2) + comments + (shares * 3) + recency_factor
            likes_count = _count_items(post.get("likes", []))
            comments_count = _count_items(post.get("comments", []))
            shares_count = post.get("shares", 0)

            # Recency factor: more recent = higher score (decay over 7 days)
            from datetime import timedelta
            days_old = (datetime.utcnow() - post.get("created_at", datetime.utcnow())).days
            recency_factor = max(0, 10 - days_old)  # Decay over 10 days

            post["_relevance_score"] = (likes_count * 2) + comments_count + (shares_count * 3) + recency_factor

        # Sort by relevance score (descending)
        posts.sort(key=lambda x: x.get("_relevance_score", 0), reverse=True)
    else:
        # Sort by created_at (most recent first)
        posts.sort(key=lambda x: x.get("created_at", datetime.utcnow()), reverse=True)

    # Apply pagination
    paginated_posts = posts[skip:skip + limit]

    # Remove relevance score and enrich with user data before returning
    enriched_posts = []
    for post in paginated_posts:
        post.pop("_relevance_score", None)
        enriched_post = await enrich_post_with_user_data(post)
        enriched_posts.append(enriched_post)

    return [post_to_dict(post) for post in enriched_posts]

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    """Get post by ID"""
    db = get_database()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    return post_to_dict(post)

@router.post("/{post_id}/like", response_model=PostResponse)
async def like_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Like or unlike a post"""
    db = get_database()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    user_id = str(current_user["_id"])
    likes = post.get("likes", [])
    
    if user_id in likes:
        # Unlike
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"likes": user_id}, "$set": {"updated_at": datetime.utcnow()}}
        )
    else:
        # Like
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$addToSet": {"likes": user_id}, "$set": {"updated_at": datetime.utcnow()}}
        )
        
        # Create notification if not own post
        if post["user_id"] != user_id:
            await create_notification(
                user_id=post["user_id"],
                type="like",
                title="New Like",
                message=f"{current_user.get('first_name')} {current_user.get('last_name')} liked your post",
                related_user_id=user_id,
                related_post_id=post_id
            )
        # record like activity
        try:
            from app.services.sync_score import SyncScoreService
            from app.services.growth_score import get_growth_score_service
            sync_service = SyncScoreService()
            growth_service = get_growth_score_service()
            await sync_service.record_activity(user_id, "like")
            await growth_service.record_activity(user_id, "like")
        except Exception:
            pass
    
    # Return updated post
    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return post_to_dict(updated_post)

@router.post("/{post_id}/comment", response_model=PostResponse)
async def add_comment(
    post_id: str,
    content: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a post"""
    db = get_database()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    comment = {
        "id": str(ObjectId()),
        "user_id": str(current_user["_id"]),
        "user_name": f"{current_user.get('first_name')} {current_user.get('last_name')}",
        "user_picture": current_user.get("profile_picture"),
        "content": content,
        "created_at": datetime.utcnow()
    }
    
    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$push": {"comments": comment}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    # Create notification if not own post
    if post["user_id"] != str(current_user["_id"]):
        await create_notification(
            user_id=post["user_id"],
            type="comment",
            title="New Comment",
            message=f"{current_user.get('first_name')} {current_user.get('last_name')} commented on your post",
            related_user_id=str(current_user["_id"]),
            related_post_id=post_id
        )
    # record comment activity
    try:
        from app.services.sync_score import SyncScoreService
        from app.services.growth_score import get_growth_score_service
        sync_service = SyncScoreService()
        growth_service = get_growth_score_service()
        await sync_service.record_activity(str(current_user["_id"]), "comment")
        await growth_service.record_activity(str(current_user["_id"]), "comment")
    except Exception:
        pass
    
    # Return updated post
    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return post_to_dict(updated_post)

@router.post("/{post_id}/share", response_model=PostResponse)
async def share_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Share a post"""
    db = get_database()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {"shares": 1}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    # Create notification if not own post
    if post["user_id"] != str(current_user["_id"]):
        await create_notification(
            user_id=post["user_id"],
            type="share",
            title="Post Shared",
            message=f"{current_user.get('first_name')} {current_user.get('last_name')} shared your post",
            related_user_id=str(current_user["_id"]),
            related_post_id=post_id
        )
    
    # Return updated post
    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return post_to_dict(updated_post)

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a post (only the creator can delete)"""
    db = get_database()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Check if user is the creator
    if post["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own posts")
    
    # Delete the post
    await db.posts.delete_one({"_id": ObjectId(post_id)})
    
    return {"message": "Post deleted successfully", "post_id": post_id}

@router.post("/{post_id}/save")
async def save_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Save a post to user's saved posts"""
    db = get_database()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    user_id = str(current_user["_id"])
    saved_posts = current_user.get("saved_posts", [])
    
    if post_id in saved_posts:
        # Unsave
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"saved_posts": post_id}}
        )
        return {"saved": False, "message": "Post unsaved"}
    else:
        # Save
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"saved_posts": post_id}}
        )
        return {"saved": True, "message": "Post saved"}

@router.get("/saved/list", response_model=List[PostResponse])
async def get_saved_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get user's saved posts"""
    db = get_database()
    saved_post_ids = current_user.get("saved_posts", [])
    
    if not saved_post_ids:
        return []
    
    # Convert to ObjectIds
    valid_ids = [ObjectId(pid) for pid in saved_post_ids if ObjectId.is_valid(pid)]
    
    if not valid_ids:
        return []
    
    posts = await db.posts.find({
        "_id": {"$in": valid_ids}
    }).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    return [post_to_dict(post) for post in posts]

@router.get("/saved/{user_id}", response_model=List[PostResponse])
async def get_saved_posts_by_user(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get saved posts for the current authenticated user.

    The path includes user_id to support frontend routing needs, but data is
    always scoped to the authenticated user for safety.
    """
    db = get_database()
    _ = user_id
    saved_post_ids = current_user.get("saved_posts", [])

    if not saved_post_ids:
        return []

    valid_ids = [ObjectId(pid) for pid in saved_post_ids if ObjectId.is_valid(pid)]
    if not valid_ids:
        return []

    posts = await db.posts.find({
        "_id": {"$in": valid_ids}
    }).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

    return [post_to_dict(post) for post in posts]

@router.get("/network/{user_id}", response_model=List[PostResponse])
async def get_network_feed(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get network-only posts (connections + self) sorted by recency."""
    db = get_database()
    _ = user_id

    connections = current_user.get("connections", [])
    owner_id = str(current_user.get("_id"))
    if owner_id not in connections:
        connections.append(owner_id)

    posts = await db.posts.find({
        "user_id": {"$in": connections}
    }).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

    enriched_posts = []
    for post in posts:
        enriched_post = await enrich_post_with_user_data(post)
        enriched_posts.append(enriched_post)

    return [post_to_dict(post) for post in enriched_posts]

@router.get("/feed", response_model=List[PostResponse])
async def get_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("recent", regex="^(recent|relevance)$"),
    include_recommended: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """Get personalized feed with connections' posts and recommended posts"""
    db = get_database()
    user_id = str(current_user["_id"])
    connections = current_user.get("connections", [])
    connections.append(user_id)
    
    # Fetch posts from connections
    connection_posts = await db.posts.find({
        "user_id": {"$in": connections}
    }).to_list(length=None)
    
    # Add recommended posts if enabled
    all_posts = list(connection_posts)
    if include_recommended:
        # Get popular posts from non-connections (posts with high engagement)
        recommended_posts = await db.posts.find({
            "user_id": {"$nin": connections}
        }).to_list(length=50)  # Get more to filter
        
        # Filter by engagement (likes + comments + shares)
        for post in recommended_posts:
            engagement = _count_items(post.get("likes", [])) + _count_items(post.get("comments", [])) + post.get("shares", 0)
            if engagement >= 5:  # Only show posts with at least 5 total engagements
                all_posts.append(post)
    
    # Calculate relevance score for each post
    if sort_by == "relevance":
        for post in all_posts:
            likes_count = _count_items(post.get("likes", []))
            comments_count = _count_items(post.get("comments", []))
            shares_count = post.get("shares", 0)
            
            # Recency factor: more recent = higher score (decay over 7 days)
            from datetime import timedelta
            days_old = (datetime.utcnow() - post.get("created_at", datetime.utcnow())).days
            recency_factor = max(0, 10 - days_old)
            
            # Boost connection posts
            is_connection = post.get("user_id") in connections
            connection_boost = 5 if is_connection else 0
            
            post["_relevance_score"] = (likes_count * 2) + comments_count + (shares_count * 3) + recency_factor + connection_boost
        
        # Sort by relevance score (descending)
        all_posts.sort(key=lambda x: x.get("_relevance_score", 0), reverse=True)
    else:
        # Sort by created_at (most recent first)
        all_posts.sort(key=lambda x: x.get("created_at", datetime.utcnow()), reverse=True)
    
    # Apply pagination
    paginated_posts = all_posts[skip:skip + limit]
    
    # Remove relevance score and enrich with user data before returning
    enriched_posts = []
    for post in paginated_posts:
        post.pop("_relevance_score", None)
        enriched_post = await enrich_post_with_user_data(post)
        enriched_posts.append(enriched_post)
    
    return [post_to_dict(post) for post in enriched_posts]


