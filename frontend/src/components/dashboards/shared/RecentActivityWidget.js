import React from 'react';
import { Card } from '../../ui';
import { formatDistanceToNow } from 'date-fns';

const RecentActivityWidget = ({ activities = [] }) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, idx) => (
            <div key={idx} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'application' ? 'bg-blue-500' : 
                  activity.type === 'message' ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {activity.name} <span className="font-normal text-gray-600">{activity.role}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-neutral-500 py-4">No recent activity.</p>
        )}
      </div>
    </Card>
  );
};

export default RecentActivityWidget;
