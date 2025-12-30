# Sync - Professional Networking Platform

A modern professional networking platform inspired by LinkedIn, designed to connect students, job seekers, professionals, and companies.

## 🚀 Features

- **Authentication**: Email/password registration, Google sign-in, JWT-based sessions
- **User Profiles**: Complete profiles with education, experience, certifications, and skills
- **Home Feed**: Create posts, like, comment, and share
- **Jobs Section**: Post jobs, apply, and filter opportunities
- **Messaging**: Real-time chat between users
- **Notifications**: Real-time updates for likes, comments, and connections
- **Companies**: Public company profiles with job listings
- **Settings**: Profile and privacy management

## 🛠️ Technology Stack

### Frontend
- React 18
- Tailwind CSS
- React Router
- Axios
- Socket.io-client

### Backend
- Python FastAPI
- MongoDB
- JWT Authentication
- Socket.io (WebSocket)
- Python-multipart (file uploads)

## 📁 Project Structure

```
Sync/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── utils/
│   └── package.json
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set environment variables (create `.env` file):
```
MONGODB_URI=mongodb://localhost:27017/sync
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
CORS_ORIGINS=http://localhost:3000
```

5. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/connect` - Send connection request
- `GET /api/users/connections` - Get connections

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts` - Get feed
- `POST /api/posts/:id/like` - Like post
- `POST /api/posts/:id/comment` - Add comment
- `DELETE /api/posts/:id` - Delete post

### Jobs
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - Get job listings
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/applications` - Get applications

### Messages
- `GET /api/messages` - Get conversations
- `GET /api/messages/:userId` - Get conversation with user
- `POST /api/messages` - Send message

### Companies
- `GET /api/companies` - Get companies
- `GET /api/companies/:id` - Get company profile
- `POST /api/companies` - Create company (admin)

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🔐 Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/sync
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
CORS_ORIGINS=http://localhost:3000
UPLOAD_DIR=./uploads
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:8000
```

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Backend (Render/Railway)
1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy

## 📄 License

MIT License

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

