import React from 'react';
import { Card, Badge, Button } from '../../ui';
import { FiUser, FiMapPin, FiBriefcase } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ProfileCard = ({ user, badges = [], completionPercentage = null, showEdit = true }) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <div className="text-center">
        <div className="relative inline-block">
          {user?.profile_picture ? (
            <img 
              src={user.profile_picture} 
              alt={user.first_name} 
              className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-sm" 
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto border-4 border-white shadow-sm">
              <FiUser className="w-10 h-10 text-blue-500" />
            </div>
          )}
          <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
        </div>
        
        <h3 className="mt-4 text-lg font-bold text-gray-900">
          {user?.first_name} {user?.last_name}
        </h3>
        <p className="text-sm text-gray-500 mb-2">{user?.headline || user?.user_type}</p>
        
        {user?.location && (
          <div className="flex items-center justify-center text-xs text-gray-500 mb-3">
            <FiMapPin className="mr-1" /> {user.location}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {badges.map((badge, idx) => (
            <Badge key={idx} variant="neutral" className={badge.className}>
              {badge.label}
            </Badge>
          ))}
        </div>

        {completionPercentage !== null && (
          <div className="mt-4 text-left">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Profile Completion</span>
              <span className="font-medium text-blue-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {showEdit && (
          <Button 
            variant="outline" 
            fullWidth 
            className="mt-4"
            onClick={() => navigate('/profile')}
          >
            Edit Profile
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProfileCard;
