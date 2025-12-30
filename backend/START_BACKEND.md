# How to Start the Backend Server

## Quick Start

1. **Open a new terminal/command prompt**

2. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

3. **Activate virtual environment:**
   ```bash
   # Windows:
   venv\Scripts\activate
   
   # Mac/Linux:
   source venv/bin/activate
   ```

4. **Start the server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **Verify it's running:**
   - Open browser: `http://localhost:8000/api/health`
   - Should see: `{"status":"healthy"}`

## Using the Batch File (Windows)

```bash
cd backend
start_server.bat
```

## Troubleshooting

### MongoDB Not Running?
The server will start even if MongoDB is not running, but database operations (like registration/login) will fail.

**To fix:**
- Install MongoDB locally, OR
- Use MongoDB Atlas (cloud) and update `MONGODB_URI` in `.env`

### Port 8000 Already in Use?
```bash
# Use a different port:
uvicorn app.main:app --reload --port 8001

# Then update frontend/.env:
# REACT_APP_API_URL=http://localhost:8001
```

### Import Errors?
```bash
# Make sure virtual environment is activated and dependencies are installed:
pip install -r requirements.txt
```

## What You Should See

When the server starts successfully, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
✅ Connected to MongoDB successfully
INFO:     Application startup complete.
```

If MongoDB is not available:
```
⚠️  MongoDB connection failed: [error message]
⚠️  The server will start but database operations will fail.
```

