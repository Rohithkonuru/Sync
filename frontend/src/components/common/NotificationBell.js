import React from 'react';
import { FiBell } from 'react-icons/fi';

const NotificationBell = ({ count = 0, onClick }) => {
  return (
    <button type="button" onClick={onClick} className="relative">
      <FiBell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full">
          {count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
