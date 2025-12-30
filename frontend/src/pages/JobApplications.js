import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService, userService } from '../services/api';
import { FiUser, FiMail, FiFileText, FiCheck, FiX, FiClock, FiDownload, FiTrash2 } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const getStatusColor = (status) => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'shortlisted':
      return 'bg-blue-100 text-blue-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'seen':
    case 'in-processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'submitted':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const JobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      const [jobData, applicationsData] = await Promise.all([
        jobService.getJob(jobId),
        jobService.getJobApplications(jobId)
      ]);
      setJob(jobData);
      setApplications(applicationsData);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus, note = '') => {
    try {
      await jobService.updateApplicationStatus(applicationId, newStatus, note);
      toast.success(`Application status updated to ${newStatus}`);
      await loadData();
    } catch (error) {
      let errorMsg = 'Failed to update application status';
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') errorMsg = detail;
      else if (Array.isArray(detail)) errorMsg = detail.map(e => e.msg || JSON.stringify(e)).join(', ');
      else if (detail) errorMsg = JSON.stringify(detail);
      
      toast.error(errorMsg);
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }
    try {
      await jobService.deleteApplication(applicationId);
      toast.success('Application deleted successfully');
      await loadData();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to delete application';
      toast.error(errorMsg);
    }
  };

  const handleDownloadResume = async (applicationId) => {
    try {
      const blob = await jobService.downloadResume(applicationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Resume downloaded');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to download resume';
      toast.error(errorMsg);
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
        <button
          onClick={() => navigate(-1)}
          className="text-primary-600 hover:text-primary-700 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold">Applications for {job?.title}</h1>
        <p className="text-gray-600 mt-2">{job?.company_name} • {job?.location}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {applications.length} Application{applications.length !== 1 ? 's' : ''}
          </h2>
          <div className="flex space-x-2">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No applications yet for this job posting.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id || application._id}
                application={application}
                onView={() => setSelectedApplication(application)}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteApplication}
                onDownloadResume={handleDownloadResume}
              />
            ))}
          </div>
        )}
      </div>

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={handleUpdateStatus}
          onDownloadResume={handleDownloadResume}
        />
      )}
    </div>
  );
};

const ApplicationCard = ({ application, onView, onUpdateStatus, onDelete, onDownloadResume }) => {
  // Use applicant data from application if available, otherwise load it
  const applicant = application.applicant || null;

  const applicantName = application.full_name || (applicant ? `${applicant.first_name} ${applicant.last_name}` : 'Unknown');
  const applicantEmail = application.email || application.contact_email || applicant?.email || 'N/A';
  const applicantLocation = applicant?.location || application.address || 'N/A';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {applicant?.profile_picture ? (
            <img
              src={applicant.profile_picture}
              alt={applicantName}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl">
              {applicantName[0] || 'U'}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{applicantName}</h3>
            <p className="text-gray-600">{applicant?.headline || 'No headline'}</p>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <FiMail className="w-4 h-4 mr-1" />
              {applicantEmail}
            </div>
            <p className="text-sm text-gray-500">{applicantLocation}</p>
            {application.skills && application.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {application.skills.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <FiClock className="w-4 h-4 mr-1" />
              Applied {application.applied_at ? formatDistanceToNow(new Date(application.applied_at), { addSuffix: true }) : 'Recently'}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
            {application.status}
          </span>
          <div className="flex space-x-2">
            {application.resume_file_url && (
              <button
                onClick={() => onDownloadResume(application.id || application._id)}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center space-x-1"
                title="Download Resume"
              >
                <FiDownload className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onView}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
            >
              View Details
            </button>
            <button
              onClick={() => onDelete(application.id || application._id)}
              className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
              title="Delete Application"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationDetailModal = ({ application, onClose, onUpdateStatus, onDownloadResume }) => {
  const navigate = useNavigate();
  const [newStatus, setNewStatus] = useState(application.status);
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const applicant = application.applicant || null;
  const applicantName = application.full_name || (applicant ? `${applicant.first_name} ${applicant.last_name}` : 'Unknown');

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
            {/* Candidate Info */}
            <div className="flex items-start space-x-4">
              {applicant?.profile_picture ? (
                <img
                  src={applicant.profile_picture}
                  alt={applicantName}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl">
                  {applicantName[0] || 'U'}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{applicantName}</h3>
                <p className="text-gray-600">{applicant?.headline || 'No headline'}</p>
                <p className="text-sm text-gray-500">{applicant?.location || application.address || 'N/A'}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    <FiMail className="w-4 h-4 inline mr-1" />
                    {application.email || application.contact_email || applicant?.email || 'N/A'}
                  </p>
                  {application.contact_number && (
                    <p className="text-sm text-gray-600">
                      <FiUser className="w-4 h-4 inline mr-1" />
                      {application.contact_number}
                    </p>
                  )}
                </div>
                {applicant?.id && (
                  <button
                    onClick={() => {
                      navigate(`/profile/${applicant.id}`);
                      onClose();
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                  >
                    View Full Profile →
                  </button>
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
                <button
                  onClick={() => onDownloadResume(application.id || application._id)}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 px-4 py-2 border border-primary-300 rounded-lg hover:bg-primary-50"
                >
                  <FiDownload className="w-5 h-5" />
                  <span>Download Resume</span>
                </button>
              </div>
            )}

            {/* Portfolio */}
            {application.portfolio_url && (
              <div>
                <h4 className="font-semibold mb-2">Portfolio</h4>
                <a
                  href={application.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  {application.portfolio_url}
                </a>
              </div>
            )}

            {/* Skills */}
            {application.skills && application.skills.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {application.experience_years !== null && application.experience_years !== undefined && (
              <div>
                <h4 className="font-semibold mb-2">Experience</h4>
                <p className="text-gray-700">{application.experience_years} years</p>
              </div>
            )}

            {/* Status History */}
            {application.status_history && application.status_history.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Status History</h4>
                <div className="space-y-2">
                  {application.status_history.map((history, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(history.status)}`}>
                            {history.status}
                          </span>
                          {history.note && (
                            <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {history.updated_at ? formatDistanceToNow(new Date(history.updated_at), { addSuffix: true }) : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Update Status */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Update Status</h4>
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="submitted">Submitted</option>
                  <option value="seen">Seen</option>
                  <option value="in-processing">In Processing</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional note..."
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={async () => {
                    setUpdating(true);
                    await onUpdateStatus(application.id || application._id, newStatus, statusNote);
                    setUpdating(false);
                    setStatusNote('');
                  }}
                  disabled={updating || newStatus === application.status}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplications;

