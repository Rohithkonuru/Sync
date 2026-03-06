"""
Analytics Service
Handles analytics data for recruiters including gender demographics and application metrics
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from bson import ObjectId
from app.database import get_database


class AnalyticsService:
    """Service for providing analytics data to recruiters"""
    
    def __init__(self):
        # Lazy initialization - don't get database here
        self.db = None
        self.users_collection = None
        self.applications_collection = None
        self.jobs_collection = None
        
    def _ensure_db_connection(self):
        """Ensure database connection is available"""
        if self.db is None:
            try:
                from app.database import get_database
                self.db = get_database()
                self.users_collection = self.db.users
                self.applications_collection = self.db.applications
                self.jobs_collection = self.db.jobs
            except Exception as e:
                print(f"Database not available: {e}")
                raise e
        
    async def get_gender_demographics(self, job_id: Optional[str] = None) -> Dict:
        """
        Get gender demographics for applicants
        Only accessible to recruiters
        """
        try:
            self._ensure_db_connection()
            # Build query based on job_id
            query = {}
            if job_id:
                query["job_id"] = job_id
            
            # Get all applications
            applications = await self.applications_collection.find(query).to_list(length=None)
            
            # Get applicant user IDs
            applicant_ids = []
            for app in applications:
                if "applicant_id" in app:
                    applicant_ids.append(ObjectId(app["applicant_id"]))
                elif "applicant" in app and isinstance(app["applicant"], dict):
                    applicant_ids.append(ObjectId(app["applicant"]["id"]))
            
            if not applicant_ids:
                return {"male": 0, "female": 0, "prefer_not_to_say": 0, "total": 0}
            
            # Get users with gender information
            users = await self.users_collection.find({
                "_id": {"$in": applicant_ids},
                "gender": {"$exists": True, "$ne": None}
            }).to_list(length=None)
            
            # Count genders
            gender_counts = {"male": 0, "female": 0, "prefer_not_to_say": 0}
            for user in users:
                gender = user.get("gender", "").lower().replace(" ", "_")
                if gender in gender_counts:
                    gender_counts[gender] += 1
            
            gender_counts["total"] = sum(gender_counts.values())
            
            return gender_counts
            
        except Exception as e:
            print(f"Error getting gender demographics: {e}")
            return {"male": 0, "female": 0, "prefer_not_to_say": 0, "total": 0}
    
    async def get_applications_over_time(self, job_id: Optional[str] = None, days: int = 30) -> Dict:
        """Get application trends over time"""
        try:
            self._ensure_db_connection()
            # Build query
            query = {}
            if job_id:
                query["job_id"] = job_id
            
            # Get applications from the last N days
            start_date = datetime.utcnow() - timedelta(days=days)
            query["created_at"] = {"$gte": start_date}
            
            applications = await self.applications_collection.find(query).to_list(length=None)
            
            # Group by date
            daily_counts = {}
            for app in applications:
                created_at = app.get("created_at", datetime.utcnow())
                date_key = created_at.strftime("%Y-%m-%d")
                daily_counts[date_key] = daily_counts.get(date_key, 0) + 1
            
            # Fill missing dates with 0
            result = []
            current_date = start_date.date()
            end_date = datetime.utcnow().date()
            
            while current_date <= end_date:
                date_key = current_date.strftime("%Y-%m-%d")
                result.append({
                    "date": date_key,
                    "count": daily_counts.get(date_key, 0)
                })
                current_date += timedelta(days=1)
            
            return {"data": result, "total_applications": len(applications)}
            
        except Exception as e:
            print(f"Error getting applications over time: {e}")
            return {"data": [], "total_applications": 0}
    
    async def get_application_status_breakdown(self, job_id: Optional[str] = None) -> Dict:
        """Get breakdown of application statuses"""
        try:
            self._ensure_db_connection()
            query = {}
            if job_id:
                query["job_id"] = job_id
            
            applications = await self.applications_collection.find(query).to_list(length=None)
            
            status_counts = {}
            for app in applications:
                status = app.get("status", "unknown")
                status_counts[status] = status_counts.get(status, 0) + 1
            
            # Standardize status names
            standardized_counts = {
                "submitted": status_counts.get("submitted", 0),
                "seen": status_counts.get("seen", 0),
                "in_processing": status_counts.get("in_processing", 0),
                "shortlisted": status_counts.get("shortlisted", 0),
                "accepted": status_counts.get("accepted", 0),
                "rejected": status_counts.get("rejected", 0)
            }
            
            return standardized_counts
            
        except Exception as e:
            print(f"Error getting application status breakdown: {e}")
            return {}
    
    async def get_sync_score_distribution(self, job_id: Optional[str] = None) -> Dict:
        """Get distribution of Sync Scores"""
        try:
            self._ensure_db_connection()
            # Get applicants
            query = {}
            if job_id:
                query["job_id"] = job_id
            
            applications = await self.applications_collection.find(query).to_list(length=None)
            
            # Get applicant user IDs
            applicant_ids = []
            for app in applications:
                if "applicant_id" in app:
                    applicant_ids.append(ObjectId(app["applicant_id"]))
                elif "applicant" in app and isinstance(app["applicant"], dict):
                    applicant_ids.append(ObjectId(app["applicant"]["id"]))
            
            if not applicant_ids:
                return {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
            
            # Get users with sync scores
            users = await self.users_collection.find({
                "_id": {"$in": applicant_ids},
                "sync_score": {"$exists": True}
            }).to_list(length=None)
            
            # Distribute into ranges
            ranges = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
            for user in users:
                sync_score = user.get("sync_score", 0)
                if sync_score <= 25:
                    ranges["0-25"] += 1
                elif sync_score <= 50:
                    ranges["26-50"] += 1
                elif sync_score <= 75:
                    ranges["51-75"] += 1
                else:
                    ranges["76-100"] += 1
            
            return ranges
            
        except Exception as e:
            print(f"Error getting sync score distribution: {e}")
            return {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
    
    async def get_ats_score_averages(self, job_id: Optional[str] = None) -> Dict:
        """Get average ATS scores per job"""
        try:
            self._ensure_db_connection()
            if job_id:
                # Get ATS scores for specific job
                applications = await self.applications_collection.find({"job_id": job_id}).to_list(length=None)
                
                applicant_ids = []
                for app in applications:
                    if "applicant_id" in app:
                        applicant_ids.append(ObjectId(app["applicant_id"]))
                    elif "applicant" in app and isinstance(app["applicant"], dict):
                        applicant_ids.append(ObjectId(app["applicant"]["id"]))
                
                if not applicant_ids:
                    return {"average_ats_score": 0, "total_applicants": 0}
                
                users = await self.users_collection.find({
                    "_id": {"$in": applicant_ids},
                    "ats_score": {"$exists": True}
                }).to_list(length=None)
                
                scores = []
                for user in users:
                    ats_score_data = user.get("ats_score", {})
                    if isinstance(ats_score_data, dict) and "score" in ats_score_data:
                        scores.append(ats_score_data["score"])
                    elif isinstance(ats_score_data, (int, float)):
                        scores.append(ats_score_data)
                
                average_score = sum(scores) / len(scores) if scores else 0
                
                return {
                    "average_ats_score": round(average_score, 2),
                    "total_applicants": len(applications),
                    "with_ats_score": len(scores)
                }
            else:
                # Get ATS scores for all jobs of the recruiter
                # This would require getting recruiter's jobs first
                return {"average_ats_score": 0, "total_applicants": 0}
                
        except Exception as e:
            print(f"Error getting ATS score averages: {e}")
            return {"average_ats_score": 0, "total_applicants": 0}
    
    async def get_recruiter_analytics_overview(self, recruiter_id: str) -> Dict:
        """Get comprehensive analytics overview for a recruiter"""
        try:
            self._ensure_db_connection()
            # Get all jobs posted by recruiter
            jobs = await self.jobs_collection.find({"posted_by": recruiter_id}).to_list(length=None)
            job_ids = [str(job["_id"]) for job in jobs]
            
            if not job_ids:
                return {
                    "total_jobs": 0,
                    "total_applications": 0,
                    "gender_demographics": {"male": 0, "female": 0, "prefer_not_to_say": 0, "total": 0},
                    "applications_over_time": {"data": [], "total_applications": 0},
                    "status_breakdown": {},
                    "sync_score_distribution": {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0},
                    "ats_score_averages": {"average_ats_score": 0, "total_applicants": 0}
                }
            
            # Get analytics for all jobs
            gender_demographics = {"male": 0, "female": 0, "prefer_not_to_say": 0, "total": 0}
            status_breakdown = {}
            sync_score_distribution = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
            total_applications = 0
            
            for job_id in job_ids:
                # Gender demographics
                job_gender = await self.get_gender_demographics(job_id)
                for key in gender_demographics:
                    gender_demographics[key] += job_gender.get(key, 0)
                
                # Status breakdown
                job_status = await self.get_application_status_breakdown(job_id)
                for key, value in job_status.items():
                    status_breakdown[key] = status_breakdown.get(key, 0) + value
                
                # Sync score distribution
                job_sync = await self.get_sync_score_distribution(job_id)
                for key in job_sync:
                    sync_score_distribution[key] += job_sync.get(key, 0)
            
            # Applications over time (last 30 days)
            applications_over_time = await self.get_applications_over_time(None, 30)
            
            # ATS score averages
            ats_score_averages = await self.get_ats_score_averages(None)
            
            return {
                "total_jobs": len(jobs),
                "total_applications": total_applications,
                "gender_demographics": gender_demographics,
                "applications_over_time": applications_over_time,
                "status_breakdown": status_breakdown,
                "sync_score_distribution": sync_score_distribution,
                "ats_score_averages": ats_score_averages
            }
            
        except Exception as e:
            print(f"Error getting recruiter analytics overview: {e}")
            return {
                "total_jobs": 0,
                "total_applications": 0,
                "gender_demographics": {"male": 0, "female": 0, "prefer_not_to_say": 0, "total": 0},
                "applications_over_time": {"data": [], "total_applications": 0},
                "status_breakdown": {},
                "sync_score_distribution": {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0},
                "ats_score_averages": {"average_ats_score": 0, "total_applicants": 0}
            }


# Lazy factory function instead of global instance
def get_analytics_service():
    """Get Analytics service instance (lazy initialization)"""
    return AnalyticsService()
