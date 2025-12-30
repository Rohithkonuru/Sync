import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import Messages from './pages/Messages';
import Companies from './pages/Companies';
import Communities from './pages/Communities';
import Settings from './pages/Settings';
import JobApplications from './pages/JobApplications';
import MyConnections from './pages/MyConnections';
import MyApplications from './pages/MyApplications';
import RecruiterJobApplications from './pages/RecruiterJobApplications';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Navbar />
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/profile/:userId?" element={<Profile />} />
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/jobs/:jobId" element={<Jobs />} />
                      <Route path="/jobs/:jobId/applications" element={<JobApplications />} />
                      <Route path="/jobs/my-jobs" element={<RecruiterJobApplications />} />
                      <Route path="/applications" element={<MyApplications />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/companies" element={<Companies />} />
                      <Route path="/communities" element={<Communities />} />
                      <Route path="/connections" element={<MyConnections />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </PrivateRoute>
                }
              />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

