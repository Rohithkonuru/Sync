import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  FiHome,
  FiBriefcase,
  FiMessageSquare,
  FiBell,
  FiUser,
  FiSettings,
  FiLogOut,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';
import { notificationService } from '../services/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications({ limit: 10 });
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      loadNotifications();
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await notificationService.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  // Get role-based theme color
  const getThemeColor = () => {
    const role = user?.user_type?.toLowerCase();
    if (role === 'job_seeker') return 'orange';
    if (role === 'recruiter') return 'purple';
    if (role === 'professional') return 'green';
    if (role === 'student') return 'blue';
    return 'primary';
  };

  const themeColor = getThemeColor();
  const themeClasses = {
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    primary: 'bg-primary-500',
  };

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className={`w-8 h-8 ${themeClasses[themeColor]} rounded`}></div>
            <span className="text-lg font-semibold text-neutral-900">Sync</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500"
                aria-label="Search"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className="flex flex-col items-center px-3 py-2 text-neutral-600 hover:text-neutral-900 transition"
              title="Home"
            >
              <FiHome className="w-5 h-5" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link
              to="/connections"
              className="flex flex-col items-center px-3 py-2 text-neutral-600 hover:text-neutral-900 transition"
              title="Network"
            >
              <FiUsers className="w-5 h-5" />
              <span className="text-xs mt-1">Network</span>
            </Link>
            <Link
              to="/jobs"
              className="flex flex-col items-center px-3 py-2 text-neutral-600 hover:text-neutral-900 transition"
              title="Jobs"
            >
              <FiBriefcase className="w-5 h-5" />
              <span className="text-xs mt-1">Jobs</span>
            </Link>
            <Link
              to="/messages"
              className="flex flex-col items-center px-3 py-2 text-neutral-600 hover:text-neutral-900 transition relative"
              title="Messages"
            >
              <FiMessageSquare className="w-5 h-5" />
              <span className="text-xs mt-1">Messages</span>
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="flex flex-col items-center px-3 py-2 text-neutral-600 hover:text-neutral-900 transition relative"
                title="Notifications"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <FiBell className="w-5 h-5" />
                <span className="text-xs mt-1">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${
                            !notif.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleMarkRead(notif.id)}
                        >
                          <div className="font-semibold text-sm">{notif.title}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {notif.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-neutral-100 transition"
                aria-label="Profile menu"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.first_name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full ${themeClasses[themeColor]} flex items-center justify-center text-white`}>
                    {user?.first_name?.[0] || 'U'}
                  </div>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200">
                  <Link
                    to={`/profile/${user?.id}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FiUser className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FiSettings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

