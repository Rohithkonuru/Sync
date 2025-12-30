# Quick Start Guide

## 🚀 Getting Started

### Step 1: Run Database Migrations

```bash
cd backend
python migrate_database.py
```

This will:
- Add new fields to `job_applications` collection
- Add `experience_years` to `users` collection
- Create indexes for performance
- Normalize job statuses

### Step 2: Start Backend Server

```bash
cd backend
python run_server.py
```

Or:
```bash
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Start Frontend

```bash
cd frontend
npm start
```

### Step 4: Test the Application

1. **Create Test Accounts**:
   - Register as Recruiter
   - Register as Job Seeker

2. **Test Job Application Flow**:
   - Recruiter: Create a job
   - Job Seeker: Apply with enhanced form (upload resume)
   - Recruiter: View applications, download resume, update status

3. **Test Candidate Search**:
   - Recruiter: Click "Search Candidates" in dashboard
   - Use filters to search

4. **Test Connections**:
   - Navigate to `/connections`
   - Send/accept/reject connection requests

---

## 📝 Key Files to Review

### Backend
- `backend/app/routes/jobs.py` - All job/application endpoints
- `backend/app/models/job.py` - Application models
- `backend/migrate_database.py` - Run this first!

### Frontend
- `frontend/src/components/EnhancedApplicationForm.js` - Application form
- `frontend/src/pages/JobApplications.js` - Recruiter view
- `frontend/src/pages/MyConnections.js` - Connections page
- `frontend/src/components/CandidateSearch.js` - Search component

### Documentation
- `COMPLETE_IMPLEMENTATION_SUMMARY.md` - Full summary
- `API_EXAMPLES.md` - API usage examples
- `QA_CHECKLIST.md` - Testing guide
- `WEBSOCKET_INTEGRATION.md` - WebSocket setup

---

## 🔍 Quick Test Commands

### Test Apply for Job (cURL)
```bash
TOKEN="your_jwt_token"
JOB_ID="job_id_here"

curl -X POST "http://localhost:8000/api/jobs/$JOB_ID/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -F "full_name=John Doe" \
  -F "email=john@example.com" \
  -F "cover_letter=Test application" \
  -F "resume_file=@resume.pdf"
```

### Test Get Applications (cURL)
```bash
curl -X GET "http://localhost:8000/api/jobs/$JOB_ID/applications" \
  -H "Authorization: Bearer $TOKEN"
```

### Test Update Status (cURL)
```bash
APPLICATION_ID="application_id_here"

curl -X PUT "http://localhost:8000/api/jobs/applications/$APPLICATION_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "shortlisted", "note": "Great candidate"}'
```

---

## ⚠️ Common Issues & Solutions

### Issue: Applications not loading
**Solution**: Run database migrations and restart server

### Issue: Resume upload fails
**Solution**: 
- Check file size (< 5MB)
- Check file type (PDF, DOC, DOCX)
- Verify `uploads/resumes` directory exists

### Issue: WebSocket not connecting
**Solution**: 
- Check CORS settings
- Verify token is valid
- Check browser console for errors
- Polling will work as fallback

### Issue: Notifications not appearing
**Solution**:
- Check WebSocket connection
- Verify notification service is creating notifications
- Check browser console

---

## 📚 Next Steps

1. ✅ Run migrations
2. ✅ Test all features
3. ✅ Review error handling
4. ✅ Configure S3 for production (if needed)
5. ✅ Deploy

---

## 🎯 Feature Checklist

- [x] Recruiter can view applications
- [x] Enhanced application form
- [x] Resume upload/download
- [x] Status updates with history
- [x] Delete applications
- [x] Candidate search
- [x] My Connections page
- [x] Notifications with WebSocket
- [x] Database migrations
- [x] Tests and documentation

---

**Ready to use!** 🎉

