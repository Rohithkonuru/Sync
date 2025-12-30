import React from 'react';
import { Card, Button } from '../../ui';
import { FiBriefcase } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ApplicationStatusWidget = ({ applications = [] }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'shortlisted': return 'bg-green-50 text-green-700';
      case 'rejected': return 'bg-red-50 text-red-700';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'interview': return 'bg-purple-50 text-purple-700';
      default: return 'bg-blue-50 text-blue-700';
    }
  };

  return (
    <Card>
      <h3 className="font-bold text-gray-900 mb-4">Application Status</h3>
      <div className="space-y-4">
        {applications.length > 0 ? applications.slice(0, 5).map((app) => (
          <div key={app.id || app._id} className="border-l-2 border-gray-200 pl-3 py-1">
            <p className="font-medium text-sm text-gray-900 truncate">{app.job_title || app.job?.title}</p>
            <p className="text-xs text-gray-500 truncate">{app.company_name || app.job?.company?.name}</p>
            <div className="mt-1 flex justify-between items-center">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getStatusColor(app.status)}`}>
                {app.status}
              </span>
            </div>
          </div>
        )) : (
          <p className="text-sm text-gray-500">No active applications.</p>
        )}
      </div>
      <Button 
        variant="ghost" 
        fullWidth 
        className="mt-2 text-sm text-gray-600"
        onClick={() => navigate('/applications')}
      >
        View All Applications
      </Button>
    </Card>
  );
};

export default ApplicationStatusWidget;
