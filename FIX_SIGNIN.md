# Fix: Cannot Sign In - Step by Step Guide

## The Problem
You can't sign in because the **backend server is not running**. The frontend needs the backend API to handle authentication.

## Solution: Start the Backend Server

### Step 1: Open a New Terminal Window
- Keep your frontend terminal running
- Open a **new** terminal/command prompt window

### Step 2: Start the Backend

**Option A - Using Command Line (Recommended):**

```bash
# Navigate to backend folder
cd E:\Sync\backend

# Activate virtual environment
venv\Scripts\activate

# Start the server
uvicorn app.main:app --reload --port 8000
```

**Option B - Using the Batch File (Windows):**

```bash
cd E:\Sync\backend
start_server.bat
```

### Step 3: What You Should See

**If successful, you'll see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
⚠️  MongoDB connection failed: [No connection could be made...]
⚠️  The server will start but database operations will fail.
INFO:     Application startup complete.
```

**Or if MongoDB is running:**
```
✅ Connected to MongoDB successfully
INFO:     Application startup complete.
```

### Step 4: Verify Backend is Running

1. Open your browser
2. Go to: `http://localhost:8000/api/health`
3. You should see: `{"status":"healthy"}`

### Step 5: Test Sign In

1. Go back to your frontend: `http://localhost:3000`
2. Try to register a new account or sign in
3. It should work now!

## Common Issues

### Issue 1: MongoDB Not Running

**Error:** `MongoDB connection failed`

**Solution:**
- The server will still start, but you need MongoDB for registration/login
- **Option A:** Install MongoDB locally
  - Download from: https://www.mongodb.com/try/download/community
  - Install and start the service
  
- **Option B:** Use MongoDB Atlas (Cloud - Free)
  1. Go to: https://www.mongodb.com/cloud/atlas
  2. Create free account
  3. Create a cluster
  4. Get connection string
  5. Update `backend/.env`:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sync
     ```
  6. Restart backend server

### Issue 2: Port 8000 Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use a different port
uvicorn app.main:app --reload --port 8001
# Then update frontend/.env: REACT_APP_API_URL=http://localhost:8001
```

### Issue 3: Import Errors

**Error:** `ModuleNotFoundError` or `ImportError`

**Solution:**
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Issue 4: Virtual Environment Not Activated

**Error:** `uvicorn: command not found`

**Solution:**
```bash
cd backend
venv\Scripts\activate
# You should see (venv) in your prompt
```

## Quick Test

After starting backend, test it:

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Or open in browser:
# http://localhost:8000/api/health
```

## Summary

1. ✅ Frontend is running on port 3000
2. ❌ Backend needs to be running on port 8000
3. 🔧 Start backend: `cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000`
4. ✅ Test: Open `http://localhost:8000/api/health`
5. ✅ Try signing in again!

## Need More Help?

Check these files:
- `TROUBLESHOOTING.md` - Detailed troubleshooting guide
- `backend/START_BACKEND.md` - Backend startup guide
- `QUICKSTART.md` - Complete setup guide

