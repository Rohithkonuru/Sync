# How to Start Both Backend and Frontend Servers

## ⚠️ Important: You Need TWO Terminal Windows

You must run the backend and frontend in **separate terminal windows**.

---

## Step 1: Start Backend Server

### Open Terminal 1 (Backend)

```bash
# Navigate to backend folder
cd E:\Sync\backend

# Activate virtual environment
venv\Scripts\activate

# Start the server
python run_server.py
```

**OR use uvicorn directly:**
```bash
cd E:\Sync\backend
venv\Scripts\activate
uvicorn app.main:socket_app --host 0.0.0.0 --port 8000 --reload
```

### What You Should See:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
⚠️  MongoDB connection failed: [error if MongoDB not running]
INFO:     Application startup complete.
```

### Verify Backend is Running:

1. Open browser: `http://localhost:8000/api/health`
2. Should see: `{"status":"healthy"}`

---

## Step 2: Start Frontend Server

### Open Terminal 2 (Frontend)

```bash
# Navigate to frontend folder
cd E:\Sync\frontend

# Start the development server
npm start
```

### What You Should See:

```
Compiled successfully!

You can now view sync-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Verify Frontend is Running:

1. Browser should automatically open to `http://localhost:3000`
2. You should see the Sync login page

---

## ✅ Both Servers Running?

- **Backend:** http://localhost:8000 ✅
- **Frontend:** http://localhost:3000 ✅

## 🎉 Now You Can:

1. **Register a new account** at http://localhost:3000/register
2. **Sign in** at http://localhost:3000/login
3. **Start using Sync!**

---

## 🔧 Troubleshooting

### Backend Won't Start

**Error: Port 8000 already in use**
```bash
# Find what's using the port
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**Error: MongoDB connection failed**
- This is OK! The server will start but database operations won't work
- To fix: Install MongoDB or use MongoDB Atlas (see TROUBLESHOOTING.md)

**Error: Module not found**
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Won't Start

**Error: Port 3000 already in use**
- React will ask to use a different port (usually 3001)
- Press `Y` to confirm

**Error: npm command not found**
```bash
# Make sure Node.js is installed
node --version

# Install dependencies
npm install
```

### Can't Sign In

1. ✅ Check backend is running: `http://localhost:8000/api/health`
2. ✅ Check frontend is running: `http://localhost:3000`
3. ✅ Check browser console (F12) for errors
4. ✅ Verify `.env` files are correct:
   - `backend/.env`: `MONGODB_URI=...`
   - `frontend/.env`: `REACT_APP_API_URL=http://localhost:8000`

---

## 📝 Quick Reference

### Backend Commands:
```bash
cd backend
venv\Scripts\activate
python run_server.py
```

### Frontend Commands:
```bash
cd frontend
npm start
```

### Check Server Status:
- Backend: http://localhost:8000/api/health
- Frontend: http://localhost:3000

---

## 🚀 That's It!

Once both servers are running, you're ready to use Sync!

For more help, see:
- `TROUBLESHOOTING.md` - Detailed troubleshooting
- `FIX_SIGNIN.md` - Sign in issues
- `QUICKSTART.md` - Complete setup guide

