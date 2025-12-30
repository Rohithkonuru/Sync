# How to Start Both Servers

## Quick Start Commands

### Option 1: Start Both Servers Manually

**Terminal 1 - Backend:**
```bash
cd E:\Sync\backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd E:\Sync\frontend
npm start
```

### Option 2: Using Batch Files (Windows)

**Backend:**
```bash
cd E:\Sync\backend
start_server.bat
```

**Frontend:**
```bash
cd E:\Sync\frontend
npm start
```

## Verify Servers Are Running

### Backend Check:
- Open browser: `http://localhost:8000/api/health`
- Should see: `{"status":"healthy"}`

### Frontend Check:
- Open browser: `http://localhost:3000`
- Should see the Sync login page

## Expected Output

### Backend Terminal:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
✅ Connected to MongoDB successfully
INFO:     Application startup complete.
```

### Frontend Terminal:
```
Compiled successfully!

You can now view sync-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
```

## Troubleshooting

### Backend Won't Start
- Check if port 8000 is available
- Ensure virtual environment is activated
- Check MongoDB is running (or use MongoDB Atlas)

### Frontend Won't Start
- Check if port 3000 is available
- Ensure node_modules is installed: `npm install`
- Check .env file exists with correct API URL

### Can't Sign In
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify API URL in frontend/.env matches backend port

## Ports Used

- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000
- **MongoDB:** mongodb://localhost:27017 (if local)

## Environment Variables

### Backend (.env):
```
MONGODB_URI=mongodb://localhost:27017/sync
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env):
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:8000
```

