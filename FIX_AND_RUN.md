# Fix and Run Guide - UI Design Implementation

## Overview
This document describes all changes made to match the uploaded UI screenshots exactly for all four role-based dashboards (Student, Recruiter, Professional, Job Seeker), including fixes, migrations, and how to run the application.

## What Was Changed

### 1. Design Tokens & Configuration
**File**: `frontend/tailwind.config.js`
- Added color themes matching screenshots:
  - Orange (`#f97316`) for Job Seeker
  - Purple (`#a855f7`) for Recruiter  
  - Green (`#22c55e`) for Professional
  - Blue (`#3b82f6`) for Student
- All themes include full palette (50-900 shades)

### 2. Navbar Component
**File**: `frontend/src/components/Navbar.js`
- Updated to match screenshot design exactly:
  - Logo with colored square icon (theme-based)
  - "Professional Network" text
  - Centered search bar with icon
  - Navigation icons with labels below (Home, Network, Jobs, Messages, Notifications)
  - Notification bell with red badge showing unread count
  - Profile dropdown with "Me [Role]" label
  - Theme colors adapt based on user role

### 3. Enhanced Dashboards Created

#### Job Seeker Dashboard (Orange Theme)
**File**: `frontend/src/components/dashboards/JobSeekerDashboardEnhanced.js`
- Profile completion banner (75% progress) at top
- Three-column layout:
  - Left: Profile card, Job Preferences, Profile Stats
  - Middle: Job Search, Recommended Jobs (with match percentages)
  - Right: Application Status, Career Resources
- All UI elements match screenshot exactly

#### Recruiter Dashboard (Purple Theme)
**File**: `frontend/src/components/dashboards/RecruiterDashboardEnhanced.js`
- Four metric cards at top (Active Jobs, Total Applicants, Interviews, Profile Views)
- Two-column layout:
  - Left: Candidate Search, Top Matching Candidates
  - Right: Recent Activity timeline
- Purple theme throughout

#### Professional Dashboard (Green Theme)
**File**: `frontend/src/components/dashboards/ProfessionalDashboardEnhanced.js`
- Three-column layout:
  - Left: Profile card with analytics
  - Center: Post composer, Feed posts
  - Right: People You May Know, Trending Topics
- Green theme throughout

#### Student Dashboard (Blue Theme)
**File**: `frontend/src/components/dashboards/StudentDashboardEnhanced.js`
- Three-column layout:
  - Left: Profile card, Campus Events
  - Center: Post composer, Feed posts
  - Right: Your Courses (with progress bars), Internship Opportunities
- Blue theme throughout

### 4. Reusable UI Components
**Directory**: `frontend/src/components/ui/`
- `Button.js` - Multi-variant, themed buttons with animations
- `Card.js` - Flexible cards with hover/click states
- `ProgressBar.js` - Animated progress bars
- `Badge.js` - Status badges
- `Input.js` - Form inputs with icons and validation
- `Modal.js` - Accessible modals
- `FileUploader.js` - Drag & drop file upload

### 5. Home Page Router
**File**: `frontend/src/pages/Home.js`
- Updated to use all enhanced dashboards
- Routes based on user type:
  - `student` → StudentDashboardEnhanced
  - `job_seeker` → JobSeekerDashboardEnhanced
  - `professional` → ProfessionalDashboardEnhanced
  - `recruiter` → RecruiterDashboardEnhanced

## Database Migrations

**No database migrations required.** The application uses existing MongoDB collections and fields. All new features use existing schema.

### Optional Performance Indexes

If you want to add indexes for better performance, run these MongoDB commands:

```javascript
// Connect to MongoDB
use your_database_name

// Create indexes
db.users.createIndex({ "user_type": 1 });
db.users.createIndex({ "connections": 1 });
db.users.createIndex({ "connection_requests": 1 });
db.jobs.createIndex({ "status": 1, "created_at": -1 });
db.jobs.createIndex({ "posted_by": 1 });
db.job_applications.createIndex({ "applicant_id": 1, "created_at": -1 });
db.job_applications.createIndex({ "job_id": 1, "status": 1 });
db.messages.createIndex({ "sender_id": 1, "receiver_id": 1, "created_at": -1 });
db.notifications.createIndex({ "user_id": 1, "read": 1, "created_at": -1 });
db.posts.createIndex({ "user_id": 1, "created_at": -1 });
```

If you need to add indexes for performance:

```javascript
// MongoDB indexes (optional, for performance)
db.users.createIndex({ "user_type": 1 });
db.users.createIndex({ "connections": 1 });
db.jobs.createIndex({ "status": 1, "created_at": -1 });
db.job_applications.createIndex({ "applicant_id": 1, "created_at": -1 });
db.job_applications.createIndex({ "job_id": 1, "status": 1 });
db.messages.createIndex({ "sender_id": 1, "receiver_id": 1, "created_at": -1 });
db.notifications.createIndex({ "user_id": 1, "read": 1, "created_at": -1 });
```

## How to Run the Application

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- MongoDB running locally or connection string
- Virtual environment for Python (recommended)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (if using)
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:socket_app --host 0.0.0.0 --port 8000 --reload
```

Backend will run on: http://localhost:8000

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies (if not already installed)
npm install

# Install framer-motion if missing
npm install framer-motion

# Start frontend development server
npm start
```

Frontend will run on: http://localhost:3000

### 3. Verify Installation

**Backend Health Check:**
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{"status": "healthy"}
```

**Frontend:**
Open http://localhost:3000 in your browser

## Testing the Application

### 1. Create Test Users

Register users with different roles:
- Student
- Job Seeker
- Professional
- Recruiter

### 2. Test Each Dashboard

**Job Seeker Dashboard:**
1. Login as job_seeker
2. Verify orange theme
3. Check profile completion banner
4. Test job search
5. View recommended jobs with match percentages
6. Check application status

**Recruiter Dashboard:**
1. Login as recruiter
2. Verify purple theme
3. Check metrics cards
4. Test candidate search
5. View top matching candidates
6. Check recent activity

**Professional Dashboard:**
1. Login as professional
2. Verify green theme
3. Create a post
4. View feed
5. Check "People You May Know"
6. View trending topics

**Student Dashboard:**
1. Login as student
2. Verify blue theme
3. View courses with progress
4. Check campus events
5. View internship opportunities
6. Create posts

### 3. Test Features

- **Connections**: Send request → Accept → Message
- **Job Applications**: Apply → Recruiter views → Status update
- **Notifications**: Real-time updates via WebSocket
- **Search**: Test search functionality
- **Responsive**: Test on mobile/tablet/desktop

## API Endpoints Used

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Jobs
- `GET /api/jobs` - Get jobs (with filters)
- `GET /api/jobs/{job_id}` - Get job details
- `POST /api/jobs/{job_id}/apply` - Apply for job
- `GET /api/jobs/my-applications/list` - Get user's applications
- `GET /api/jobs/my-jobs/list` - Get recruiter's jobs
- `POST /api/jobs/{job_id}/save` - Save job

### Users
- `GET /api/users/search` - Search users/candidates
- `GET /api/users/suggestions/list` - Get connection suggestions
- `GET /api/users/{user_id}` - Get user profile

### Connections
- `POST /api/connections/request` - Send connection request
- `POST /api/connections/{user_id}/accept` - Accept request
- `GET /api/connections/me/connections` - Get connections
- `GET /api/connections/me/status/{user_id}` - Get connection status

### Posts
- `GET /api/posts/feed` - Get feed posts
- `POST /api/posts` - Create post
- `POST /api/posts/{post_id}/like` - Like post
- `POST /api/posts/{post_id}/comment` - Comment on post

### Messages
- `GET /api/messages/conversations/list` - Get conversations
- `POST /api/messages` - Send message
- `GET /api/messages/conversations/{user_id}` - Get conversation

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/{id}/mark-read` - Mark as read

## Example API Calls (cURL)

### Register User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jobseeker@example.com",
    "password": "password123",
    "first_name": "Taylor",
    "last_name": "Brown",
    "user_type": "job_seeker"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jobseeker@example.com",
    "password": "password123"
  }'
```

### Get Jobs (with token)
```bash
curl -X GET "http://localhost:8000/api/jobs?limit=10&status=open" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Apply for Job
```bash
curl -X POST http://localhost:8000/api/jobs/{job_id}/apply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "full_name=Taylor Brown" \
  -F "email=taylor@example.com" \
  -F "cover_letter=Interested in this position" \
  -F "resume_file=@/path/to/resume.pdf"
```

### Get My Applications
```bash
curl -X GET http://localhost:8000/api/jobs/my-applications/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search Candidates (Recruiter)
```bash
curl -X GET "http://localhost:8000/api/users/search?skills=React&location=San Francisco" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send Connection Request
```bash
curl -X POST http://localhost:8000/api/connections/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_ID"}'
```

### Get Feed Posts
```bash
curl -X GET "http://localhost:8000/api/posts/feed?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Running Tests

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v --tb=short
```

### Test Specific Features
```bash
# Test job applications
python -m pytest tests/test_job_applications.py -v

# Test connections and messaging
python -m pytest tests/test_connections_messaging.py -v

# Test feed
python -m pytest tests/test_connections_feed.py -v
```

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Windows: Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8000 | xargs kill -9
```

**MongoDB connection error:**
- Verify MongoDB is running
- Check connection string in `.env` file
- Ensure database name is correct

**Import errors:**
- Verify virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Frontend Issues

**Port 3000 already in use:**
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

**Module not found errors:**
- Run `npm install` in frontend directory
- Verify `framer-motion` is installed: `npm install framer-motion`

**Build errors:**
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check for syntax errors in component files

**Components not showing:**
- Clear browser cache
- Check browser console for errors
- Verify API endpoints are accessible

### Common Runtime Errors

**"Cannot read property of undefined":**
- Check that user object is loaded before rendering
- Add null checks in components

**"Network Error":**
- Verify backend is running
- Check CORS settings in backend
- Verify API base URL in frontend

**"401 Unauthorized":**
- Check JWT token is valid
- Verify token is included in requests
- Re-login if token expired

## File Structure

### New Files Created
```
frontend/src/components/ui/
├── Button.js
├── Card.js
├── ProgressBar.js
├── Badge.js
├── Input.js
├── Modal.js
├── FileUploader.js
└── index.js

frontend/src/components/dashboards/
├── JobSeekerDashboardEnhanced.js
├── RecruiterDashboardEnhanced.js
├── ProfessionalDashboardEnhanced.js
└── StudentDashboardEnhanced.js
```

### Modified Files
```
frontend/tailwind.config.js
frontend/src/components/Navbar.js
frontend/src/pages/Home.js
```

## Design Assumptions

When design details were ambiguous, the following assumptions were made:

1. **Profile Progress Calculation**: Based on completed fields (headline, skills, experience, resume)
2. **Match Percentages**: Calculated based on skills overlap and job requirements (mock for now)
3. **Course Progress**: Stored in user profile or separate courses collection (mock data used)
4. **Campus Events**: Stored in events collection (mock data used)
5. **Trending Topics**: Based on hashtag usage in posts (mock data used)
6. **Recent Activity**: Aggregated from notifications and application updates

## Next Steps

1. **Real Match Algorithm**: Implement actual job matching algorithm
2. **Course Management**: Add backend endpoints for courses
3. **Event Management**: Add backend endpoints for campus events
4. **Trending Topics**: Implement hashtag tracking
5. **Analytics**: Add real analytics tracking
6. **Performance**: Add caching for frequently accessed data

## Support

For issues or questions:
1. Check browser console for frontend errors
2. Check backend terminal for server errors
3. Verify all dependencies are installed
4. Ensure MongoDB is running
5. Check network tab for API call failures

---

**All dashboards now match the uploaded screenshots exactly!** 🎉
