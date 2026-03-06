import React from 'react';
import { FiUser, FiMapPin, FiMail, FiPhone, FiBriefcase, FiBookOpen, FiInfo } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import SyncScore from './SyncScore';
import GrowthScore from './GrowthScore';

const ProfileCard = () => {
  const { user } = useAuth();

  const getUserTypeLabel = () => {
    switch (user?.user_type) {
      case 'student':
        return 'Student';
      case 'job_seeker':
        return 'Job Seeker';
      case 'professional':
        return 'Professional';
      case 'recruiter':
        return 'Recruiter';
      default:
        return 'User';
    }
  };

  const getUserTypeColor = () => {
    switch (user?.user_type) {
      case 'student':
        return 'bg-blue-50 text-blue-700';
      case 'job_seeker':
        return 'bg-green-50 text-green-700';
      case 'professional':
        return 'bg-purple-50 text-purple-700';
      case 'recruiter':
        return 'bg-orange-50 text-orange-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getUserTypeIcon = () => {
    switch (user?.user_type) {
      case 'student':
        return FiBookOpen;
      case 'job_seeker':
      case 'professional':
        return FiBriefcase;
      case 'recruiter':
        return FiUser;
      default:
        return FiUser;
    }
  };

  const UserIcon = getUserTypeIcon();

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Profile Picture */}
      <div className="text-center mb-4">
        <div className="relative inline-block">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={`${user?.first_name} ${user?.last_name}`}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-sm">
              <FiUser className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* Name and Role */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {user?.first_name} {user?.last_name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{user?.headline || 'No headline'}</p>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor()}`}>
          <UserIcon className="w-3 h-3" />
          {getUserTypeLabel()}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        {user?.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiMail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{user.email}</span>
          </div>
        )}

        {user?.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiPhone className="w-4 h-4 text-gray-400" />
            <span>{user.phone}</span>
          </div>
        )}

        {user?.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiMapPin className="w-4 h-4 text-gray-400" />
            <span>{user.location}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-center mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500">Connections</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500">Applications</div>
          </div>
        </div>

        {/* Sync Score - Self View Only */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Sync Score</span>
            <div className="relative group">
              <FiInfo className="w-3 h-3 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Sync Score reflects profile completeness and activity on Sync
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <SyncScore userId={user?.id} compact={true} />
        </div>

        {/* Growth Score - Self View Only */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Growth Score</span>
            <div className="relative group">
              <FiInfo className="w-3 h-3 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Growth Score reflects your improvement and engagement over time
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <GrowthScore userId={user?.id} compact={true} />
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
