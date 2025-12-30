import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import ApplicationsList from '../components/ApplicationsList';
import ApplicationTimeline from '../components/ApplicationTimeline';
import { FiBriefcase, FiCheckCircle, FiX, FiEye, FiClock, FiFileText } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const getStatusColor = (status) => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'shortlisted':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'in-processing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'seen':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'submitted':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'accepted':
      return <FiCheckCircle className="w-5 h-5" />;
    case 'rejected':
      return <FiX className="w-5 h-5" />;
    case 'seen':
      return <FiEye className="w-5 h-5" />;
    default:
      return <FiClock className="w-5 h-5" />;
  }
};

const MyApplications = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState(new Set());

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for application status updates
      socket.on('application_status_update', (data) => {
        const { application_id, status } = data;
        setApplications((prev) =>
          prev.map((app) => {
            if (app.id === application_id) {
              // Flash highlight for recently updated
              setRecentlyUpdated((prevSet) => {
                const newSet = new Set(prevSet);
                newSet.add(application_id);
                setTimeout(() => {
                  newSet.delete(application_id);
                  setRecentlyUpdated(new Set(newSet));
                }, 5000);
                return newSet;
              });
              toast.success(`Application status updated to ${status}`);
              return { ...app, status, updated_at: new Date().toISOString() };
            }
            return app;
          })
        );
      });

      return () => {
        socket.off('application_status_update');
      };
    }
  }, [socket, isConnected]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await jobService.getApplications({ limit: 50 });
      setApplications(data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-gray-600 mt-2">Track the status of your job applications</p>
      </div>

      <ApplicationsList
        applications={applications}
        onDownloadResume={async (applicationId) => {
          try {
            const blob = await jobService.downloadResume(applicationId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `resume_${applicationId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Resume downloaded');
          } catch (error) {
            toast.error('Failed to download resume');
          }
        }}
        showTimeline={true}
      />

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </div>
  );
};

const ApplicationCard = ({ application, isHighlighted, onView }) => {
  const navigate = useNavigate();
  const job = application.job || {};

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all ${
        isHighlighted ? 'border-primary-500 shadow-lg animate-pulse' : 'border-transparent'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h3 className="text-xl font-semibold text-gray-900">{job.title || 'Unknown Job'}</h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${getStatusColor(
                application.status
              )}`}
            >
              {getStatusIcon(application.status)}
              <span className="capitalize">{application.status.replace('-', ' ')}</span>
            </span>
          </div>

          <div className="text-gray-600 mb-2">
            <span className="font-medium">{job.company_name || 'Unknown Company'}</span>
            {job.location && <span className="mx-2">•</span>}
            {job.location && <span>{job.location}</span>}
          </div>

          {application.applied_at && (
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <FiClock className="w-4 h-4 mr-1" />
              Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
            </div>
          )}

          {application.status_history && application.status_history.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Latest Update:</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Status changed to <span className="font-medium capitalize">{application.status.replace('-', ' ')}</span>
                  </span>
                  {application.status_history[application.status_history.length - 1].updated_at && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(
                        new Date(application.status_history[application.status_history.length - 1].updated_at),
                        { addSuffix: true }
                      )}
                    </span>
                  )}
                </div>
                {application.status_history[application.status_history.length - 1].note && (
                  <p className="text-sm text-gray-600 mt-2">
                    {application.status_history[application.status_history.length - 1].note}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={onView}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm transition"
          >
            View Details
          </button>
          {job.id && (
            <button
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition"
            >
              View Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ApplicationDetailModal = ({ application, onClose }) => {
  const navigate = useNavigate();
  const job = application.job || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Application Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Job Info */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{job.title || 'Unknown Job'}</h3>
            <p className="text-gray-600">{job.company_name || 'Unknown Company'}</p>
            {job.location && <p className="text-gray-600">{job.location}</p>}
          </div>

          {/* Status */}
          <div>
            <h4 className="font-semibold mb-2">Current Status</h4>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-medium border inline-flex items-center space-x-2 ${getStatusColor(
                application.status
              )}`}
            >
              {getStatusIcon(application.status)}
              <span className="capitalize">{application.status.replace('-', ' ')}</span>
            </span>
          </div>

          {/* Status History Timeline */}
          {application.status_history && application.status_history.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Status History</h4>
              <div className="space-y-3">
                {application.status_history
                  .slice()
                  .reverse()
                  .map((history, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-3 h-3 rounded-full border-2 ${
                            idx === 0 ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'
                          }`}
                        ></div>
                        {idx < application.status_history.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 mx-auto"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(history.status)}`}
                          >
                            {history.status.replace('-', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(history.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Application Details */}
          <div>
            <h4 className="font-semibold mb-2">Application Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {application.full_name && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Name:</span>{' '}
                  <span className="text-sm text-gray-600">{application.full_name}</span>
                </div>
              )}
              {application.email && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Email:</span>{' '}
                  <span className="text-sm text-gray-600">{application.email}</span>
                </div>
              )}
              {application.contact_number && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Contact:</span>{' '}
                  <span className="text-sm text-gray-600">{application.contact_number}</span>
                </div>
              )}
              {application.experience_years !== null && application.experience_years !== undefined && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Experience:</span>{' '}
                  <span className="text-sm text-gray-600">{application.experience_years} years</span>
                </div>
              )}
            </div>
          </div>

          {/* Cover Letter */}
          {application.cover_letter && (
            <div>
              <h4 className="font-semibold mb-2">Cover Letter</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{application.cover_letter}</p>
              </div>
            </div>
          )}

          {/* Resume */}
          {application.resume_file_url && (
            <div>
              <h4 className="font-semibold mb-2">Resume</h4>
              <a
                href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${application.resume_file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <FiFileText className="w-5 h-5" />
                <span>View Resume</span>
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            {job.id && (
              <button
                onClick={() => {
                  navigate(`/jobs/${job.id}`);
                  onClose();
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                View Job Posting
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyApplications;

