"""
Database utilities and helpers
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from fastapi import HTTPException, status

# Database configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "sync_app")

# Global database instance
_database = None
_client = None

def get_database():
    """Get database connection with lazy initialization"""
    global _database, _client
    
    if _database is None:
        try:
            _client = MongoClient(MONGODB_URI)
            # Test the connection
            _client.admin.command('ping')
            _database = _client[DATABASE_NAME]
            print(f"✅ Connected to MongoDB: {DATABASE_NAME}")
        except ConnectionFailure as e:
            print(f"❌ Database connection failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection is not available. Please ensure MongoDB is running."
            )
        except Exception as e:
            print(f"❌ Unexpected database error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database initialization failed."
            )
    
    return _database

def get_client():
    """Get MongoDB client"""
    global _client
    if _client is None:
        get_database()  # This will initialize the client
    return _client

def close_database():
    """Close database connection"""
    global _database, _client
    if _client:
        _client.close()
        _client = None
        _database = None
        print("Database connection closed")

# Database helper functions
def object_id_to_str(obj_id: ObjectId) -> str:
    """Convert ObjectId to string"""
    return str(obj_id)

def str_to_object_id(id_str: str) -> ObjectId:
    """Convert string to ObjectId"""
    if not ObjectId.is_valid(id_str):
        raise ValueError(f"Invalid ObjectId: {id_str}")
    return ObjectId(id_str)

def serialize_mongo_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize MongoDB document for JSON response"""
    if doc is None:
        return None
    
    # Convert ObjectId to string
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    
    # Convert datetime objects to ISO string
    def convert_datetime(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: convert_datetime(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_datetime(item) for item in obj]
        return obj
    
    return convert_datetime(doc)

def serialize_mongo_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Serialize list of MongoDB documents"""
    return [serialize_mongo_doc(doc) for doc in docs]

def create_pagination_pipeline(
    skip: int = 0,
    limit: int = 20,
    sort_field: str = "created_at",
    sort_direction: int = -1
) -> List[Dict[str, Any]]:
    """Create MongoDB aggregation pipeline for pagination"""
    return [
        {"$sort": {sort_field: sort_direction}},
        {"$skip": skip},
        {"$limit": limit}
    ]

def create_text_search_pipeline(
    search_text: str,
    search_fields: List[str],
    skip: int = 0,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """Create MongoDB aggregation pipeline for text search"""
    return [
        {
            "$match": {
                "$text": {
                    "$search": search_text
                }
            }
        },
        {
            "$addFields": {
                "score": {"$meta": "textScore"}
            }
        },
        {"$sort": {"score": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]

def build_filter_query(filters: Dict[str, Any]) -> Dict[str, Any]:
    """Build MongoDB filter query from filters dict"""
    query = {}
    
    for key, value in filters.items():
        if value is None:
            continue
            
        if key.endswith("_in") and isinstance(value, list):
            # Handle list filters (e.g., status_in)
            field_name = key[:-3]
            query[field_name] = {"$in": value}
        elif key.endswith("_nin") and isinstance(value, list):
            # Handle not-in filters
            field_name = key[:-4]
            query[field_name] = {"$nin": value}
        elif key.endswith("_gte"):
            # Handle greater than or equal
            field_name = key[:-4]
            query[field_name] = {"$gte": value}
        elif key.endswith("_lte"):
            # Handle less than or equal
            field_name = key[:-4]
            query[field_name] = {"$lte": value}
        elif key.endswith("_gt"):
            # Handle greater than
            field_name = key[:-3]
            query[field_name] = {"$gt": value}
        elif key.endswith("_lt"):
            # Handle less than
            field_name = key[:-3]
            query[field_name] = {"$lt": value}
        elif key.endswith("_regex"):
            # Handle regex search
            field_name = key[:-6]
            query[field_name] = {"$regex": value, "$options": "i"}
        else:
            # Handle exact match
            query[key] = value
    
    return query

def create_lookup_pipeline(
    from_collection: str,
    local_field: str,
    foreign_field: str,
    as_field: str,
    project_fields: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create MongoDB lookup stage for aggregation"""
    lookup = {
        "$lookup": {
            "from": from_collection,
            "localField": local_field,
            "foreignField": foreign_field,
            "as": as_field
        }
    }
    
    if project_fields:
        lookup["$project"] = project_fields
    
    return lookup

def unwind_field(field: str, preserve_null_and_empty: bool = False) -> Dict[str, Any]:
    """Create MongoDB unwind stage"""
    unwind = {"$unwind": f"${field}"}
    
    if preserve_null_and_empty:
        unwind["$unwind"] = {
            "path": f"${field}",
            "preserveNullAndEmptyArrays": preserve_null_and_empty
        }
    
    return unwind

def add_soft_delete_filter(query: Dict[str, Any], include_deleted: bool = False) -> Dict[str, Any]:
    """Add soft delete filter to query"""
    if not include_deleted:
        query["is_deleted"] = {"$ne": True}
    return query

def add_timestamp_filter(
    query: Dict[str, Any],
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """Add timestamp filter to query"""
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["created_at"] = date_filter
    
    return query

# Database health check
async def check_database_health() -> Dict[str, Any]:
    """Check database connection health"""
    try:
        db = get_database()
        # Test basic operations
        await db.command('ping')
        
        # Get collection stats
        collections = await db.list_collection_names()
        
        return {
            "status": "healthy",
            "database": DATABASE_NAME,
            "collections": len(collections),
            "connected_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "database": DATABASE_NAME,
            "connected_at": None
        }

# Database initialization
async def initialize_database():
    """Initialize database with indexes and default data"""
    try:
        db = get_database()
        
        # Create indexes for better performance
        await create_indexes(db)
        
        print("✅ Database initialized successfully")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise

async def create_indexes(db):
    """Create database indexes for optimal performance"""
    # User indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_type")
    await db.users.create_index("created_at")
    await db.users.create_index("is_active")
    await db.users.create_index("sync_score")
    await db.users.create_index("growth_score")
    
    # Job indexes
    await db.jobs.create_index("posted_by")
    await db.jobs.create_index("status")
    await db.jobs.create_index("created_at")
    await db.jobs.create_index("application_deadline")
    await db.jobs.create_index("is_active")
    await db.jobs.create_index("is_featured")
    await db.jobs.create_index([("location", "text"), ("title", "text"), ("description", "text")])
    
    # Application indexes
    await db.job_applications.create_index("job_id")
    await db.job_applications.create_index("applicant_id")
    await db.job_applications.create_index("recruiter_id")
    await db.job_applications.create_index("status")
    await db.job_applications.create_index("applied_at")
    await db.job_applications.create_index("is_seen")
    await db.job_applications.create_index([("job_id", "applicant_id"), ("status", -1)])
    
    # Message indexes
    await db.messages.create_index("sender_id")
    await db.messages.create_index("receiver_id")
    await db.messages.create_index("created_at")
    await db.messages.create_index("is_read")
    await db.messages.create_index([("sender_id", "receiver_id"), ("created_at", -1)])
    
    # Notification indexes
    await db.notifications.create_index("user_id")
    await db.notifications.create_index("type")
    await db.notifications.create_index("created_at")
    await db.notifications.create_index("is_read")
    await db.notifications.create_index([("user_id", "is_read"), ("created_at", -1)])
    
    # Connection indexes
    await db.connections.create_index("requester_id")
    await db.connections.create_index("recipient_id")
    await db.connections.create_index("status")
    await db.connections.create_index("created_at")
    await db.connections.create_index([("requester_id", "recipient_id"), ("status", -1)])
    
    # Post indexes
    await db.posts.create_index("author_id")
    await db.posts.create_index("created_at")
    await db.posts.create_index("is_deleted")
    await db.posts.create_index([("author_id", "created_at"), -1])
    
    # User activity indexes
    await db.user_activities.create_index("user_id")
    await db.user_activities.create_index("activity_type")
    await db.user_activities.create_index("created_at")
    await db.user_activities.create_index([("user_id", "created_at"), -1])
    
    print("✅ Database indexes created successfully")
