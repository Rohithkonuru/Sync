import asyncio
import os
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def migrate():
    """Run database migrations"""
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/sync")
    db_name = mongodb_uri.split("/")[-1].split("?")[0]
    
    print(f"Connecting to MongoDB: {mongodb_uri}")
    print(f"Database: {db_name}")
    
    try:
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully\n")
        
        # 1. Update job_applications collection
        print("1. Updating job_applications collection...")
        result = await db.job_applications.update_many(
            {},
            {
                "$set": {
                    "full_name": None,
                    "email": None,
                    "contact_number": None,
                    "address": None,
                    "custom_fields": {},
                    "status_history": [],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        print(f"   Updated {result.modified_count} applications")
        
        # Add status history for existing applications
        print("2. Adding status history to existing applications...")
        count = 0
        async for app in db.job_applications.find({}):
            status_history = app.get("status_history", [])
            if not status_history:
                status_history = [{
                    "status": app.get("status", "submitted"),
                    "updated_at": app.get("applied_at") or datetime.utcnow(),
                    "updated_by": app.get("applicant_id"),
                    "note": "Initial application"
                }]
                await db.job_applications.update_one(
                    {"_id": app["_id"]},
                    {"$set": {"status_history": status_history}}
                )
                count += 1
        print(f"   Added status history to {count} applications")
        
        # 3. Update users collection
        print("3. Updating users collection with experience_years...")
        result = await db.users.update_many(
            {},
            {"$set": {"experience_years": 0}}
        )
        print(f"   Updated {result.modified_count} users")
        
        # Calculate experience_years
        print("4. Calculating experience_years from experience array...")
        count = 0
        async for user in db.users.find({"experience": {"$exists": True, "$ne": []}}):
            total_years = 0
            for exp in user.get("experience", []):
                if exp.get("start_date") and (exp.get("end_date") or exp.get("current")):
                    try:
                        start = datetime.fromisoformat(str(exp["start_date"]).replace("Z", "+00:00"))
                        end = datetime.utcnow() if exp.get("current") else datetime.fromisoformat(str(exp["end_date"]).replace("Z", "+00:00"))
                        years = (end - start).days / 365.25
                        total_years += max(0, years)
                    except:
                        pass
            
            if total_years > 0:
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"experience_years": round(total_years)}}
                )
                count += 1
        print(f"   Calculated experience for {count} users")
        
        # 4. Update messages
        print("5. Updating messages collection...")
        result = await db.messages.update_many(
            {},
            {
                "$set": {
                    "attachment_url": None,
                    "attachment_type": None,
                    "attachment_name": None,
                    "read_at": None
                }
            }
        )
        print(f"   Updated {result.modified_count} messages")
        
        # 5. Update notifications
        print("6. Updating notifications collection...")
        result = await db.notifications.update_many(
            {},
            {"$set": {"read": False}}
        )
        print(f"   Updated {result.modified_count} notifications")
        
        # 6. Normalize job status
        print("7. Normalizing job status (active -> open)...")
        result = await db.jobs.update_many(
            {"status": "active"},
            {"$set": {"status": "open"}}
        )
        print(f"   Updated {result.modified_count} jobs")
        
        # 7. Ensure applicants array exists
        print("8. Ensuring applicants array exists in jobs...")
        result = await db.jobs.update_many(
            {"applicants": {"$exists": False}},
            {"$set": {"applicants": []}}
        )
        print(f"   Updated {result.modified_count} jobs")
        
        # 8. Create indexes
        print("9. Creating indexes...")
        try:
            await db.job_applications.create_index([("job_id", 1), ("status", 1)])
            await db.job_applications.create_index([("applicant_id", 1), ("status", 1)])
            await db.job_applications.create_index([("status", 1), ("updated_at", -1)])
            await db.job_applications.create_index([("job_id", 1), ("applicant_id", 1)], unique=True)
            print("   ✅ Created job_applications indexes")
        except Exception as e:
            print(f"   ⚠️  Index creation warning: {e}")
        
        try:
            await db.users.create_index([("user_type", 1), ("location", 1), ("skills", 1), ("experience_years", 1)])
            await db.users.create_index([("email", 1)], unique=True)
            await db.users.create_index([("connections", 1)])
            await db.users.create_index([("connection_requests", 1)])
            print("   ✅ Created users indexes")
        except Exception as e:
            print(f"   ⚠️  Index creation warning: {e}")
        
        try:
            await db.messages.create_index([("sender_id", 1), ("receiver_id", 1), ("created_at", -1)])
            await db.messages.create_index([("receiver_id", 1), ("read", 1)])
            await db.messages.create_index([("receiver_id", 1), ("read_at", 1)])
            print("   ✅ Created messages indexes")
        except Exception as e:
            print(f"   ⚠️  Index creation warning: {e}")
        
        try:
            await db.notifications.create_index([("user_id", 1), ("read", 1), ("created_at", -1)])
            await db.notifications.create_index([("user_id", 1), ("type", 1)])
            print("   ✅ Created notifications indexes")
        except Exception as e:
            print(f"   ⚠️  Index creation warning: {e}")
        
        try:
            await db.jobs.create_index([("posted_by", 1), ("status", 1)])
            await db.jobs.create_index([("status", 1), ("created_at", -1)])
            print("   ✅ Created jobs indexes")
        except Exception as e:
            print(f"   ⚠️  Index creation warning: {e}")
        
        print("\n✅ All migrations completed successfully!")
        client.close()
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(migrate())

