import sys
sys.path.append('backend')
import asyncio
from app.database import connect_to_mongo, get_database

async def access_jobs_data():
    await connect_to_mongo()
    db = get_database()
    try:
        # Access all jobs
        jobs = await db.jobs.find().to_list(length=None)
        print(f'Total jobs in DB: {len(jobs)}')

        # Display job details
        for job in jobs:
            print(f'Job ID: {job.get("_id")}, Title: {job.get("title")}, Company: {job.get("company_name")}, Status: {job.get("status")}')

        # Access specific job by ID (example)
        if jobs:
            first_job_id = jobs[0]['_id']
            specific_job = await db.jobs.find_one({"_id": first_job_id})
            print(f'Specific job details: {specific_job}')

        # Access jobs by status
        open_jobs = await db.jobs.find({"status": "open"}).to_list(length=None)
        print(f'Open jobs: {len(open_jobs)}')

        # Access jobs by company
        company_jobs = await db.jobs.find({"company_name": {"$regex": "example", "$options": "i"}}).to_list(length=None)
        print(f'Jobs from example company: {len(company_jobs)}')

    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(access_jobs_data())
