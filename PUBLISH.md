# Publishing / Deployment Guide

This application has been configured to run as a single unit (Monolith) where the Python Backend serves the React Frontend.

## 1. Build the Frontend
To update the frontend, you must build it. This creates a `build` folder with optimized static files.

```bash
cd frontend
npm run build
```

## 2. Run the Production Server
The backend is configured to serve the contents of `frontend/build` at the root URL (`/`).

Simply run the production start script:
```bash
./start_production.bat
```

Or manually:
```bash
cd backend
# Activate virtual environment
venv\Scripts\activate
# Run server
python run_server.py
```

## 3. Access the Application
Open your browser to: **http://localhost:8000**

## Deployment
To deploy to a cloud provider (e.g., Render, Railway, AWS):
1. Ensure `frontend/build` is committed or built during the deployment pipeline.
2. Configure the start command to run `python backend/run_server.py` (or use `gunicorn` with `uvicorn` workers for better performance).
3. Set environment variables (MONGO_URI, JWT_SECRET, etc.).

**Note:** The `backend/run_server.py` script uses `reload=True` which is not recommended for high-load production environments. For production deployment, consider using:
```bash
uvicorn app.main:socket_app --host 0.0.0.0 --port 8000 --workers 4
```
