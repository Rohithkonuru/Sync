import sys
sys.path.append('backend')
import asyncio
from app.database import connect_to_mongo, get_database

async def test():
    await connect_to_mongo()
    db = get_database()
    try:
        jobs = await db.jobs.find().to_list(length=10)
        print(f'Jobs in DB: {len(jobs)}')
        for job in jobs:
            print(f'Job: {job.get("title")}, company_id: {job.get("company_id")}, company_name: {job.get("company_name")}')
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(test())
