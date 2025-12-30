import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiBriefcase, FiClock, FiCheckCircle, FiX, FiEye, FiDownload, FiChevronRight } from 'react-icons/fi';
import ApplicationTimeline from './ApplicationTimeline';

const ApplicationsList = ({ applications = [], onDownloadResume, showTimeline = false }) => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-success-100 text-success-800 border-success-300';
      case 'shortlisted':
        return 'bg-primary-100 text-primary-800 border-primary-300';
      case 'rejected':
        return 'bg-error-100 text-error-800 border-error-300';
      case 'in-processing':
        return 'bg-warning-100 text-warning-800 border-warning-300';
      case 'seen':
        return 'bg-info-100 text-info-800 border-info-300';
      case 'submitted':
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <FiX className="w-4 h-4" />;
      case 'seen':
        return <FiEye className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
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

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <FiBriefcase className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Applications</h3>
        <p className="text-neutral-500">You haven't applied to any jobs yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div
          key={application.id}
          className="bg-white rounded-xl border border-neutral-200 shadow-soft hover:shadow-medium transition-all duration-200 overflow-hidden"
        >
          {/* Main Card */}
          <div
            className="p-6 cursor-pointer hover:bg-neutral-50 transition-colors"
            onClick={() => setExpandedId(expandedId === application.id ? null : application.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  {application.job?.company_name && (
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                        <FiBriefcase className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1 truncate">
                      {application.job?.title || 'Job Application'}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {application.job?.company_name || 'Company'}
                      {application.job?.location && ` • ${application.job.location}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span>{getStatusLabel(application.status)}</span>
                  </span>
                  <span className="text-xs text-neutral-500">
                    Applied {formatDistanceToNow(new Date(application.applied_at || application.created_at), { addSuffix: true })}
                  </span>
                </div>

                {application.skills && application.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {application.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                    {application.skills.length > 3 && (
                      <span className="px-2 py-1 text-neutral-500 text-xs">
                        +{application.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {application.resume_file_url && onDownloadResume && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadResume(application.id);
                    }}
                    className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Download Resume"
                  >
                    <FiDownload className="w-5 h-5" />
                  </button>
                )}
                <FiChevronRight
                  className={`w-5 h-5 text-neutral-400 transition-transform ${
                    expandedId === application.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedId === application.id && (
            <div className="border-t border-neutral-200 bg-neutral-50 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-2">Application Details</h4>
                  <div className="space-y-2 text-sm">
                    {application.full_name && (
                      <div>
                        <span className="text-neutral-600">Full Name:</span>
                        <span className="ml-2 text-neutral-900">{application.full_name}</span>
                      </div>
                    )}
                    {application.email && (
                      <div>
                        <span className="text-neutral-600">Email:</span>
                        <span className="ml-2 text-neutral-900">{application.email}</span>
                      </div>
                    )}
                    {application.contact_number && (
                      <div>
                        <span className="text-neutral-600">Contact:</span>
                        <span className="ml-2 text-neutral-900">{application.contact_number}</span>
                      </div>
                    )}
                    {application.experience_years !== null && application.experience_years !== undefined && (
                      <div>
                        <span className="text-neutral-600">Experience:</span>
                        <span className="ml-2 text-neutral-900">{application.experience_years} years</span>
                      </div>
                    )}
                  </div>
                </div>

                {application.cover_letter && (
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-700 mb-2">Cover Letter</h4>
                    <p className="text-sm text-neutral-700 line-clamp-4">{application.cover_letter}</p>
                  </div>
                )}
              </div>

              {showTimeline && application.status_history && application.status_history.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-4">Status History</h4>
                  <ApplicationTimeline history={application.status_history} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ApplicationsList;

