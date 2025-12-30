import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiCheckCircle, FiClock, FiEye, FiX, FiUser } from 'react-icons/fi';

const ApplicationTimeline = ({ history = [] }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <FiCheckCircle className="w-5 h-5 text-success-600" />;
      case 'rejected':
        return <FiX className="w-5 h-5 text-error-600" />;
      case 'seen':
      case 'in-processing':
        return <FiEye className="w-5 h-5 text-info-600" />;
      default:
        return <FiClock className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'border-success-500 bg-success-50';
      case 'rejected':
        return 'border-error-500 bg-error-50';
      case 'shortlisted':
        return 'border-primary-500 bg-primary-50';
      case 'in-processing':
        return 'border-warning-500 bg-warning-50';
      case 'seen':
        return 'border-info-500 bg-info-50';
      default:
        return 'border-neutral-300 bg-neutral-50';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'drafted': 'Drafted',
      'submitted': 'Submitted',
      'seen': 'Seen',
      'in-processing': 'In Processing',
      'shortlisted': 'Shortlisted',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
    };
    return labels[status] || status;
  };

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <FiClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No status history available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200"></div>
      
      <div className="space-y-6">
        {history.map((entry, index) => (
          <div key={index} className="relative flex items-start space-x-4">
            {/* Icon */}
            <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${getStatusColor(entry.status)}`}>
              {getStatusIcon(entry.status)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 pb-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-semibold capitalize ${getStatusColor(entry.status).includes('success') ? 'text-success-700' : getStatusColor(entry.status).includes('error') ? 'text-error-700' : 'text-neutral-700'}`}>
                    {getStatusLabel(entry.status)}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {formatDistanceToNow(new Date(entry.updated_at), { addSuffix: true })}
                </span>
              </div>
              
              {entry.updated_by && (
                <div className="flex items-center space-x-2 mb-2">
                  <FiUser className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">
                    Updated by {entry.updated_by.name || 'Unknown'}
                  </span>
                </div>
              )}
              
              {entry.note && (
                <div className="mt-2 p-3 bg-white border border-neutral-200 rounded-lg">
                  <p className="text-sm text-neutral-700">{entry.note}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicationTimeline;

