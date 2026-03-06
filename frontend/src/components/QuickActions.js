import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiSearch, FiMessageSquare, FiCalendar, FiBriefcase, 
  FiUser, FiTrendingUp, FiSettings, FiUpload, FiRefreshCw, FiX
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const QuickActions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);

  const isRecruiter = user?.user_type === 'recruiter';
  const isJobSeeker = ['student', 'job_seeker', 'professional'].includes(user?.user_type);

  const getActions = () => {
    if (isRecruiter) {
      return [
        { icon: FiPlus, label: 'Create Job', color: 'blue', action: () => navigate('/jobs?action=post') },
        { icon: FiSearch, label: 'Find Candidates', color: 'green', action: () => navigate('/connections?action=search') },
        { icon: FiCalendar, label: 'Schedule Interviews', color: 'purple', action: () => navigate('/jobs?action=interviews') },
      ];
    } else {
      return [
        { icon: FiBriefcase, label: 'Find Jobs', color: 'blue', action: () => navigate('/jobs') },
        { icon: FiSearch, label: 'Update Profile', color: 'green', action: () => navigate('/profile?action=edit') },
        { icon: FiMessageSquare, label: 'Messages', color: 'purple', action: () => navigate('/messages') },
        { icon: FiTrendingUp, label: 'Skills Assessment', color: 'orange', action: () => navigate('/profile?action=skills') },
        { icon: FiUpload, label: 'Upload Resume', color: 'red', action: () => navigate('/profile?action=resume') },
      ];
    }
  };

  const actions = getActions();

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="relative">
      {/* Quick Actions Button - Plus Symbol */}
      <motion.button
        onClick={() => setShowQuickActions(!showQuickActions)}
        className="flex items-center space-x-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-full font-medium transition-colors cursor-pointer relative z-10"
        aria-label="Quick Actions"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FiPlus className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">Quick Actions</span>
      </motion.button>

      {/* Quick Actions Dropdown */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                Quick Actions
                <button
                  onClick={() => setShowQuickActions(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </h3>
              
              <div className="space-y-2">
                {actions.map((action, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      action.action();
                      setShowQuickActions(false);
                    }}
                    className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 hover:shadow-lg ${getColorClasses(action.color)}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <action.icon className="w-6 h-5 text-gray-900 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-base font-semibold text-gray-900">{action.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {showQuickActions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowQuickActions(false)}
        />
      )}
    </div>
  );
};

export default QuickActions;
