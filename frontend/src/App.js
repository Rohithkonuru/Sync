import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Sync from './pages/Sync';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import Messages from './pages/Messages';
import Companies from './pages/Companies';
import Communities from './pages/Communities';
import MyConnections from './pages/MyConnections';
import Settings from './pages/Settings';
import JobApplications from './pages/JobApplications';
import RecruiterJobApplicationsEnhanced from './pages/RecruiterJobApplicationsEnhanced';
import RecruiterJobApplicants from './pages/RecruiterJobApplicants';
import JobCreate from './pages/JobCreate';
import MyApplications from './pages/MyApplications';
import SavedPostsPage from './pages/SavedPostsPage';
import ArticleCreatePage from './pages/ArticleCreatePage';
import ProfileViewsPage from './pages/ProfileViewsPage';
import SearchConnections from './pages/SearchConnections';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/navigation/MobileBottomNav';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { FeedProvider } from './context/FeedContext';
import { UserProvider } from './context/UserContext';
import './App.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              The application encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserProvider>
          <SocketProvider>
            <FeedProvider>
              <Router>
              <div className="App min-h-screen bg-gray-50 overflow-x-hidden">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#4ade80',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Sync />} />

                {/* Protected Routes */}
                <Route
                  path="/*"
                  element={
                    <PrivateRoute>
                      <div className="hidden md:block">
                        <Navbar />
                      </div>
                      <Routes>
                        <Route path="/home" element={<Home />} />
                        <Route path="/feed" element={<Home />} />
                        <Route path="/profile/:userId?" element={<Profile />} />
                        <Route path="/jobs" element={<Jobs />} />
                        <Route path="/jobs/create" element={<JobCreate />} />
                        <Route path="/jobs/:jobId" element={<Jobs />} />
                        <Route path="/jobs/:jobId/applications" element={<JobApplications />} />
                        <Route path="/recruiter/jobs/:jobId/applicants" element={<RecruiterJobApplicants />} />
                        <Route path="/jobs/my-jobs" element={<RecruiterJobApplicationsEnhanced />} />
                        <Route path="/applications" element={<MyApplications />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/companies" element={<Companies />} />
                        <Route path="/communities" element={<Communities />} />
                        <Route path="/connections" element={<MyConnections />} />
                        <Route path="/network" element={<MyConnections />} />
                        <Route path="/search-connections" element={<SearchConnections />} />
                        <Route path="/saved" element={<SavedPostsPage />} />
                        <Route path="/articles/create" element={<ArticleCreatePage />} />
                        <Route path="/analytics/profile-views" element={<ProfileViewsPage />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/home" replace />} />
                      </Routes>
                      <MobileBottomNav />
                    </PrivateRoute>
                  }
                />
              </Routes>
              </div>
              </Router>
            </FeedProvider>
          </SocketProvider>
        </UserProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

