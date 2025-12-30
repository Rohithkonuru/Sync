import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMessageSquare, FiUserX, FiUserCheck, FiUserPlus } from 'react-icons/fi';

const ConnectionsList = ({
  connections = [],
  requests = [],
  mode = 'connections', // 'connections' or 'requests'
  onAccept,
  onReject,
  onRemove,
  onMessage,
  onConnect,
  currentUserId,
}) => {
  const navigate = useNavigate();

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (mode === 'connections' && connections.length === 0) {
    return (
      <div className="text-center py-12">
        <FiUser className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Connections</h3>
        <p className="text-neutral-500">Start connecting with professionals to build your network.</p>
      </div>
    );
  }

  if (mode === 'requests' && requests.length === 0) {
    return (
      <div className="text-center py-12">
        <FiUserPlus className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Pending Requests</h3>
        <p className="text-neutral-500">You don't have any pending connection requests.</p>
      </div>
    );
  }

  const items = mode === 'connections' ? connections : requests;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((user) => (
        <div
          key={user.id}
          className="bg-white rounded-xl border border-neutral-200 shadow-soft hover:shadow-medium transition-all duration-200 p-6"
        >
          <div className="flex flex-col items-center text-center">
            {/* Profile Picture */}
            <div className="mb-4">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.first_name}
                  className="w-20 h-20 rounded-full object-cover cursor-pointer hover:ring-2 ring-primary-500 transition-all"
                  onClick={() => handleProfileClick(user.id)}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center cursor-pointer hover:ring-2 ring-primary-500 transition-all"
                  onClick={() => handleProfileClick(user.id)}
                >
                  <FiUser className="w-10 h-10 text-primary-600" />
                </div>
              )}
            </div>

            {/* Name */}
            <h3
              className="text-lg font-semibold text-neutral-900 mb-1 cursor-pointer hover:text-primary-600 transition-colors"
              onClick={() => handleProfileClick(user.id)}
            >
              {user.first_name} {user.last_name}
            </h3>

            {/* Headline */}
            {user.headline && (
              <p className="text-sm text-neutral-600 mb-2 line-clamp-2">{user.headline}</p>
            )}

            {/* Location */}
            {user.location && (
              <p className="text-xs text-neutral-500 mb-4">{user.location}</p>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2 w-full">
              {mode === 'requests' ? (
                <>
                  <button
                    onClick={() => onAccept && onAccept(user.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    <FiUserCheck className="w-4 h-4" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => onReject && onReject(user.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                  >
                    <FiUserX className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </>
              ) : (
                <>
                  {onMessage && (
                    <button
                      onClick={() => onMessage(user.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      <FiMessageSquare className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  )}
                  {onRemove && (
                    <button
                      onClick={() => onRemove(user.id)}
                      className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                      title="Remove connection"
                    >
                      <FiUserX className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectionsList;

