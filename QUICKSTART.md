# Sync - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+
- **MongoDB** (local installation or MongoDB Atlas account)

### Step 1: Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/sync
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:3000
UPLOAD_DIR=./uploads
```

5. Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

### Step 2: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

### Step 3: MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/sync`

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in backend `.env` file

## 📱 Using the Application

1. **Register**: Create a new account at `/register`
2. **Login**: Sign in at `/login`
3. **Create Profile**: Complete your profile with education, experience, and skills
4. **Connect**: Find and connect with other professionals
5. **Post**: Share updates, articles, and achievements
6. **Apply**: Browse and apply for jobs
7. **Message**: Chat with your connections in real-time

## 🎯 Key Features

- ✅ User Authentication (JWT-based)
- ✅ User Profiles (Education, Experience, Certifications)
- ✅ Social Feed (Posts, Likes, Comments)
- ✅ Job Postings and Applications
- ✅ Real-time Messaging
- ✅ Notifications System
- ✅ Company Profiles
- ✅ Settings and Privacy Controls

## 🐛 Troubleshooting

### Backend Issues
- **Port already in use**: Change port in `uvicorn` command or kill the process using port 8000
- **MongoDB connection error**: Check MongoDB is running and connection string is correct
- **Import errors**: Make sure virtual environment is activated and all dependencies are installed

### Frontend Issues
- **Port already in use**: React will prompt to use a different port
- **API connection errors**: Check backend is running and `REACT_APP_API_URL` is correct
- **Build errors**: Delete `node_modules` and reinstall with `npm install`

## 📚 Next Steps

- Set up file uploads for profile pictures and certificates
- Configure email service for password reset
- Deploy to production (Vercel for frontend, Render/Railway for backend)
- Add Google OAuth authentication
- Implement advanced search features

## 💡 Tips

- Use MongoDB Compass to view and manage your database
- Check browser console and network tab for debugging
- Use Postman or similar tool to test API endpoints
- Enable CORS for your production domain

Happy coding! 🎉

