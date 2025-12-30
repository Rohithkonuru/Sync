# Troubleshooting Guide - Sign In Issues

## Problem: Cannot Sign In to Website

### Common Causes and Solutions

#### 1. Backend Server Not Running
**Symptoms:** Frontend loads but login/register doesn't work, API calls fail

**Solution:**
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Start the server
uvicorn app.main:app --reload --port 8000
```

**Verify:** Open `http://localhost:8000/api/health` in browser - should return `{"status": "healthy"}`

#### 2. MongoDB Not Running
**Symptoms:** Backend starts but returns errors when trying to register/login

**Solution A - Local MongoDB:**
```bash
# Start MongoDB service
# Windows (if installed as service):
net start MongoDB

# Or check if MongoDB is running:
mongod --version
```

**Solution B - Use MongoDB Atlas (Cloud):**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `backend/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sync
```

#### 3. Port Conflicts
**Symptoms:** Backend won't start, "port already in use" error

**Solution:**
```bash
# Windows - Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
uvicorn app.main:app --reload --port 8001
# Then update frontend/.env: REACT_APP_API_URL=http://localhost:8001
```

#### 4. CORS Issues
**Symptoms:** API calls fail in browser console with CORS errors

**Solution:**
- Check `backend/.env` has: `CORS_ORIGINS=http://localhost:3000`
- Restart backend server after changing .env

#### 5. Missing Dependencies
**Symptoms:** Import errors when starting backend

**Solution:**
```bash
cd backend
venv\Scripts\activate  # or source venv/bin/activate
pip install -r requirements.txt
```

#### 6. Environment Variables Not Set
**Symptoms:** Database connection fails, JWT errors

**Solution:**
- Ensure `backend/.env` exists with:
```
MONGODB_URI=mongodb://localhost:27017/sync
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:3000
UPLOAD_DIR=./uploads
```

#### 7. Frontend API URL Incorrect
**Symptoms:** Frontend can't connect to backend

**Solution:**
- Check `frontend/.env` has:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:8000
```
- Restart frontend after changing .env (npm start)

## Quick Diagnostic Steps

1. **Check Backend:**
   ```bash
   curl http://localhost:8000/api/health
   # Should return: {"status":"healthy"}
   ```

2. **Check Frontend:**
   - Open browser console (F12)
   - Look for errors in Console and Network tabs
   - Check if API calls are being made to `http://localhost:8000`

3. **Check MongoDB:**
   ```bash
   # Try to connect
   mongosh mongodb://localhost:27017/sync
   # Or
   mongo mongodb://localhost:27017/sync
   ```

## Still Having Issues?

1. Check browser console for specific error messages
2. Check backend terminal for error logs
3. Verify both servers are running:
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:3000`
4. Try registering a new account first (don't assume login works)
5. Check network tab in browser DevTools to see API request/response

## Test Backend API Directly

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test registration (replace with your data)
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","first_name":"Test","last_name":"User","user_type":"professional"}'
```

