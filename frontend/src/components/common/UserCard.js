import React from 'react';
import { FiMapPin, FiUserPlus, FiUserCheck } from 'react-icons/fi';

const UserCard = ({ user, status, onConnect, connecting = false }) => {
  const userId = user?._id || user?.id;
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-3 w-full">
      <div className="flex items-center gap-3">
        {user?.profile_picture ? (
          <img src={user.profile_picture} alt={`${user?.first_name || ''} ${user?.last_name || ''}`} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">{initials || 'U'}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-neutral-900 truncate">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-neutral-600 truncate">{user?.headline || 'Sync member'}</p>
          {user?.location && (
            <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1">
              <FiMapPin className="w-3 h-3" />
              <span className="truncate">{user.location}</span>
            </p>
          )}
        </div>
      </div>
      <button
        disabled={status === 'pending' || connecting}
        onClick={() => onConnect?.(userId)}
        className="mt-3 w-full min-h-[44px] rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-blue-600 text-white disabled:bg-neutral-200 disabled:text-neutral-600"
      >
        {status === 'pending' ? (
          <>
            <FiUserCheck className="w-4 h-4" /> Pending
          </>
        ) : (
          <>
            <FiUserPlus className="w-4 h-4" /> {connecting ? 'Sending...' : 'Connect'}
          </>
        )}
      </button>
    </div>
  );
};

export default UserCard;