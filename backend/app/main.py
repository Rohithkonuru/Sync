from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv
from datetime import datetime
from app.routes import (
    auth,
    users,
    posts,
    jobs,
    messages,
    companies,
    notifications,
    connections,
    analytics,
    events,
    subscriptions,
    interviews,
    realtime,
)
from app.services.socket_manager import sio
from app.database import connect_to_mongo, close_mongo_connection, ensure_indexes, get_database
from socketio import ASGIApp

load_dotenv()

app = FastAPI(title="Sync API", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    await connect_to_mongo()  # Will print warnings but not crash if MongoDB unavailable
    await ensure_indexes()

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_mongo_connection()

# CORS Configuration
# In production, allow all origins to support multiple users from different domains
# The frontend will handle authentication via JWT tokens
cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()

if cors_origins_env:
    # If CORS_ORIGINS is explicitly set, use those origins
    origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    # In production (no CORS_ORIGINS set), allow all origins
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else "*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose all headers for client access
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Static files for uploads
upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(connections.router, prefix="/api/connections", tags=["Connections"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["Interviews"])
app.include_router(realtime.router, tags=["Realtime"])

# Socket.io integration
# Wrap FastAPI app with Socket.io
socket_app = ASGIApp(sio, app)

@app.get("/")
async def read_root():
    return {"message": "Sync API is running", "version": "1.0.0", "frontend": "Running on http://localhost:3000"}

@app.get("/api/health")
def health_check():
    """Basic health check"""
    return {"status": "healthy"}

@app.get("/api/health/detailed")
async def detailed_health_check():
    """Detailed health check with database connection status"""
    try:
        db = get_database()
        await db.client.admin.command('ping')
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    
    return {
        "status": "healthy",
        "api": "running",
        "database": db_status,
        "timestamp": str(datetime.utcnow()),
        "version": "1.0.0",
        "cors": "enabled"
    }

# Serve React Frontend (Production) - Disabled for development
# current_dir = os.path.dirname(os.path.abspath(__file__))
# Navigate: backend/app -> backend -> Sync -> frontend/build
# current_dir is .../backend/app
# dirname(current_dir) is .../backend
# dirname(dirname(current_dir)) is .../Sync
# frontend_build_dir = os.path.join(os.path.dirname(os.path.dirname(current_dir)), "frontend", "build")

# if os.path.exists(frontend_build_dir):
#     static_dir = os.path.join(frontend_build_dir, "static")
#     if os.path.exists(static_dir):
#         app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
#     # Catch-all route for SPA
#     @app.get("/{full_path:path}")
#     async def serve_react_app(full_path: str):
#         # Allow API routes to pass through if they weren't caught (shouldn't happen for valid APIs)
#         if full_path.startswith("api/") or full_path.startswith("uploads/"):
#              raise HTTPException(status_code=404, detail="Not Found")
        
#         # Check if file exists in build root (e.g. favicon.ico, manifest.json)
#         file_path = os.path.join(frontend_build_dir, full_path)
#         if os.path.exists(file_path) and os.path.isfile(file_path):
#             return FileResponse(file_path)
            
#         # Return index.html for all other routes (SPA)
#         return FileResponse(os.path.join(frontend_build_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)

