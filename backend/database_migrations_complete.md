# Database Migrations - Complete Guide

## Overview

This document provides step-by-step instructions for running database migrations for the LinkedIn-style application. Since we're using MongoDB, migrations are handled through application code and scripts.

## Prerequisites

- MongoDB running (local or remote)
- Python 3.8+ installed
- Access to MongoDB database

## Migration Script

### Option 1: Python Migration Script (Recommended)

Create and run the migration script:

```bash
cd backend
python migrate_database.py
```

The script is provided below.

### Option 2: MongoDB Shell Scripts

Run these commands in MongoDB shell or MongoDB Compass:

```javascript
// Connect to your database
use your_database_name;

// 1. Update job_applications collection with new fields
db.job_applications.updateMany(
  {},
  {
    $set: {
      full_name: null,
      email: null,
      contact_number: null,
      address: null,
      custom_fields: {},
      status_history: [],
      updated_at: new Date()
    }
  }
);

// 2. Add status history for existing applications
db.job_applications.find({}).forEach(function(app) {
  db.job_applications.updateOne(
    { _id: app._id },
    {
      $set: {
        status_history: [{
          status: app.status || "submitted",
          updated_at: app.applied_at || new Date(),
          updated_by: app.applicant_id || null,
          note: "Initial application"
        }]
      }
    }
  );
});

// 3. Update users collection with experience_years
db.users.updateMany(
  {},
  {
    $set: {
      experience_years: 0
    }
  }
);

// Calculate experience_years from experience array
db.users.find({ "experience": { $exists: true, $ne: [] } }).forEach(function(user) {
  let totalYears = 0;
  user.experience.forEach(function(exp) {
    if (exp.start_date && (exp.end_date || exp.current)) {
      const start = new Date(exp.start_date);
      const end = exp.current ? new Date() : new Date(exp.end_date);
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      totalYears += Math.max(0, years);
    }
  });
  db.users.updateOne(
    { _id: user._id },
    { $set: { experience_years: Math.round(totalYears) } }
  );
});

// 4. Update messages collection
db.messages.updateMany(
  {},
  {
    $set: {
      attachment_url: null,
      attachment_type: null,
      attachment_name: null,
      read_at: null
    }
  }
);

// 5. Update notifications collection
db.notifications.updateMany(
  {},
  {
    $set: {
      read: false
    }
  }
);

// 6. Normalize job status (active -> open)
db.jobs.updateMany(
  { "status": "active" },
  {
    $set: {
      "status": "open"
    }
  }
);

// 7. Ensure applicants array exists in jobs
db.jobs.updateMany(
  { "applicants": { $exists: false } },
  {
    $set: {
      "applicants": []
    }
  }
);

// 9. Add saved_posts to users collection
db.users.updateMany(
  { "saved_posts": { $exists: false } },
  {
    $set: {
      "saved_posts": []
    }
  }
);

// 10. Create indexes for performance
db.job_applications.createIndex({ "job_id": 1, "status": 1 });
db.job_applications.createIndex({ "applicant_id": 1, "status": 1 });
db.job_applications.createIndex({ "status": 1, "updated_at": -1 });
db.job_applications.createIndex({ "job_id": 1, "applicant_id": 1 }, { unique: true });

db.users.createIndex({ "user_type": 1, "location": 1, "skills": 1, "experience_years": 1 });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "connections": 1 });
db.users.createIndex({ "connection_requests": 1 });
db.users.createIndex({ "saved_posts": 1 });

db.posts.createIndex({ "user_id": 1, "created_at": -1 });
db.posts.createIndex({ "likes": 1, "comments": 1, "shares": 1 });

db.messages.createIndex({ "sender_id": 1, "receiver_id": 1, "created_at": -1 });
db.messages.createIndex({ "receiver_id": 1, "read": 1 });
db.messages.createIndex({ "receiver_id": 1, "read_at": 1 });

db.notifications.createIndex({ "user_id": 1, "read": 1, "created_at": -1 });
db.notifications.createIndex({ "user_id": 1, "type": 1 });

db.jobs.createIndex({ "posted_by": 1, "status": 1 });
db.jobs.createIndex({ "status": 1, "created_at": -1 });

print("✅ Migrations completed successfully!");
```

## Python Migration Script

Create `backend/migrate_database.py`:

```python
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
        
        # 9. Add saved_posts to users
        print("9. Adding saved_posts field to users...")
        result = await db.users.update_many(
            {"saved_posts": {"$exists": False}},
            {"$set": {"saved_posts": []}}
        )
        print(f"   Updated {result.modified_count} users")
        
        # 10. Create indexes
        print("10. Creating indexes...")
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
        
        try:
            await db.posts.create_index([("user_id", 1), ("created_at", -1)])
            await db.posts.create_index([("likes", 1), ("comments", 1), ("shares", 1)])
            print("   ✅ Created posts indexes")
        except Exception as e:
            print(f"   ⚠️  Index creation warning: {e}")
        
        print("\n✅ All migrations completed successfully!")
        client.close()
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(migrate())
```

## Running Migrations

### Step 1: Set Environment Variables

Ensure your `.env` file has the correct MongoDB URI:

```bash
MONGODB_URI=mongodb://localhost:27017/sync
# Or for remote:
# MONGODB_URI=mongodb://username:password@host:port/database
```

### Step 2: Run Migration Script

```bash
cd backend
python migrate_database.py
```

### Step 3: Verify Migrations

Check that the collections have been updated:

```bash
# Using MongoDB shell
mongo your_database_name

# Check job_applications
db.job_applications.findOne()

# Check users
db.users.findOne()

# Check indexes
db.job_applications.getIndexes()
```

## Rollback (if needed)

If you need to rollback, you can manually remove the new fields:

```javascript
// Remove new fields from job_applications
db.job_applications.updateMany(
  {},
  {
    $unset: {
      full_name: "",
      email: "",
      contact_number: "",
      address: "",
      custom_fields: "",
      status_history: ""
    }
  }
);
```

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running
- Check MongoDB URI in `.env`
- Verify network connectivity for remote databases

### Index Creation Errors
- Indexes may already exist (this is OK)
- Check MongoDB user permissions
- Some indexes may fail if data doesn't match schema

### Migration Script Errors
- Ensure all dependencies are installed: `pip install motor python-dotenv`
- Check Python version (3.8+)
- Review error messages for specific issues

## Post-Migration Checklist

- [ ] All collections updated
- [ ] Indexes created successfully
- [ ] Test application creation
- [ ] Test application retrieval
- [ ] Verify status history is working
- [ ] Check experience_years calculation

## Support

For issues or questions, check:
- MongoDB logs
- Application logs
- Database connection status
