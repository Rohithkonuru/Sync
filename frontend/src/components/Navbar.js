import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import {
  FiHome,
  FiBriefcase,
  FiMessageSquare,
  FiBell,
  FiUser,
  FiSettings,
  FiLogOut,
  FiUsers,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { notificationService } from '../services/api';
import toast from 'react-hot-toast';
import QuickActions from './QuickActions';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
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

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 border-b border-blue-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white text-blue-600 rounded flex items-center justify-center font-bold shadow-sm">S</div>
            <span className="text-xl font-bold text-white tracking-tight">Sync</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/home"
              className="flex flex-col items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
              title="Home"
            >
              <FiHome className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">Home</span>
            </Link>
            
            {/* Quick Actions */}
            <QuickActions />
            
            <Link
              to="/connections"
              className="flex flex-col items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
              title="Network"
            >
              <FiUsers className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">Network</span>
            </Link>
            <Link
              to="/jobs"
              className="flex flex-col items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
              title="Jobs"
            >
              <FiBriefcase className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">Jobs</span>
            </Link>
            <Link
              to="/messages"
              className="flex flex-col items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition relative"
              title="Messages"
            >
              <FiMessageSquare className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">Messages</span>
            </Link>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                onClick={handleNotificationClick}
                className="flex flex-col items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition relative"
                title="Notifications"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiBell className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>

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
              <motion.button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center p-1 rounded-full hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Profile menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.first_name}
                    className="w-9 h-9 rounded-full border-2 border-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold shadow-sm">
                    {user?.first_name?.[0] || 'U'}
                  </div>
                )}
              </motion.button>

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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Notifications */}
            <motion.button
              onClick={handleNotificationClick}
              className="p-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition relative"
              title="Notifications"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>

            {/* Mobile Profile */}
            <motion.button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 rounded-full hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Profile menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.first_name}
                  className="w-8 h-8 rounded-full border-2 border-white/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold shadow-sm">
                  {user?.first_name?.[0] || 'U'}
                </div>
              )}
            </motion.button>

            {/* Hamburger Menu */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
              aria-label="Toggle mobile menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-blue-800 bg-blue-700/95 backdrop-blur-sm"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/home"
                className="flex items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiHome className="w-5 h-5 mr-3" />
                <span className="font-medium">Home</span>
              </Link>
              
              {/* Mobile Quick Actions */}
              <div className="px-3 py-2">
                <QuickActions />
              </div>
              
              <Link
                to="/connections"
                className="flex items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiUsers className="w-5 h-5 mr-3" />
                <span className="font-medium">Network</span>
              </Link>
              <Link
                to="/jobs"
                className="flex items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiBriefcase className="w-5 h-5 mr-3" />
                <span className="font-medium">Jobs</span>
              </Link>
              <Link
                to="/messages"
                className="flex items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiMessageSquare className="w-5 h-5 mr-3" />
                <span className="font-medium">Messages</span>
              </Link>
              
              <div className="border-t border-blue-800 mt-2 pt-2">
                <Link
                  to={`/profile/${user?.id}`}
                  className="flex items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowDropdown(false);
                  }}
                >
                  <FiUser className="w-5 h-5 mr-3" />
                  <span className="font-medium">My Profile</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowDropdown(false);
                  }}
                >
                  <FiSettings className="w-5 h-5 mr-3" />
                  <span className="font-medium">Settings</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md transition"
                >
                  <FiLogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile Notifications Dropdown */}
        {showNotifications && (
          <div className="md:hidden absolute top-16 right-4 left-4 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
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

        {/* Mobile Profile Dropdown */}
        {showDropdown && (
          <div className="md:hidden absolute top-16 right-4 bg-white rounded-lg shadow-xl border border-gray-200 w-48 z-50">
            <Link
              to={`/profile/${user?.id}`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              onClick={() => {
                setShowDropdown(false);
                setMobileMenuOpen(false);
              }}
            >
              <FiUser className="w-4 h-4" />
              <span>My Profile</span>
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              onClick={() => {
                setShowDropdown(false);
                setMobileMenuOpen(false);
              }}
            >
              <FiSettings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setShowDropdown(false);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

