from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import HTTPException, status
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None

database = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        database.client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        # Test connection
        await database.client.admin.command('ping')
        logger.info("Connected to MongoDB")
        print("✅ Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        print(f"⚠️  MongoDB connection failed: {e}")
        print("⚠️  The server will start but database operations will fail.")
        print("⚠️  Please ensure MongoDB is running or update MONGODB_URI in .env")
        database.client = None

async def close_mongo_connection():
    """Close database connection"""
    if database.client:
        database.client.close()
        logger.info("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    if database.client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available. Please ensure MongoDB is running."
        )
    db_name = settings.mongodb_uri.split("/")[-1].split("?")[0]
    return database.client[db_name]

