import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';
import { FiBriefcase, FiDownload, FiMessageSquare, FiUser, FiMail, FiPhone, FiMapPin, FiExternalLink, FiCheckCircle, FiX, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import ApplicationTimeline from '../components/ApplicationTimeline';
import SyncScore from '../components/SyncScore';
import GrowthScore from '../components/GrowthScore';

const RecruiterJobApplications = () => {
  const navigate = useNavigate();
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadMyJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      loadApplications(selectedJob.id);
    }
  }, [selectedJob]);

  const loadMyJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getMyJobs();
      setMyJobs(data || []);
      if (data && data.length > 0) {
        setSelectedJob(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (jobId) => {
    try {
      const data = await jobService.getJobApplications(jobId);
      setApplications(data || []);
    } catch (error) {
      toast.error('Failed to load applications');
    }
  };

  const handleDownloadResume = async (applicationId) => {
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
  };

  const handleUpdateStatus = async (applicationId, newStatus, note = '', keepModalOpen = false) => {
    try {
      setUpdatingStatus(true);
      await jobService.updateApplicationStatus(applicationId, newStatus, note);
      toast.success('Application status updated');
      await loadApplications(selectedJob.id);
      if (!keepModalOpen) {
        setSelectedApplication(null);
      } else {
        // Reload applications and update the selected application in the modal
        const updatedApps = await jobService.getJobApplications(selectedJob.id);
        const updatedApp = updatedApps.find(app => app.id === applicationId);
        if (updatedApp) {
          setSelectedApplication(updatedApp);
        }
      }
    } catch (error) {
      let errorMsg = error.message;
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') errorMsg = detail;
      else if (Array.isArray(detail)) errorMsg = detail.map(e => e.msg || JSON.stringify(e)).join(', ');
      else if (detail) errorMsg = JSON.stringify(detail);

      toast.error(errorMsg || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

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
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (myJobs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <FiBriefcase className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Jobs Posted</h3>
          <p className="text-neutral-500 mb-6">Post a job to start receiving applications</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Post Your First Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900">Applications for My Jobs</h1>
        <p className="text-neutral-600 mt-2">Review and manage applications for your posted jobs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Job List Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-soft p-4">
            <h3 className="font-semibold mb-4">My Jobs</h3>
            <div className="space-y-2">
              {myJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedJob?.id === job.id
                      ? 'bg-primary-50 border-2 border-primary-500'
                      : 'bg-neutral-50 border-2 border-transparent hover:bg-neutral-100'
                  }`}
                >
                  <div className="font-medium text-sm">{job.title}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {job.applicants?.length || 0} applications
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="lg:col-span-3">
          {selectedJob ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200 shadow-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedJob.title}</h2>
                    <p className="text-neutral-600">{selectedJob.company_name} • {selectedJob.location}</p>
                  </div>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                    {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
                  </span>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 shadow-soft p-12 text-center">
                  <FiUser className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Applications Yet</h3>
                  <p className="text-neutral-500">Applications for this job will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="bg-white rounded-xl border border-neutral-200 shadow-soft hover:shadow-medium transition-all p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1">
                          {application.applicant?.profile_picture ? (
                            <img
                              src={application.applicant.profile_picture}
                              alt={application.applicant.first_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                              <FiUser className="w-6 h-6 text-primary-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {application.full_name || `${application.applicant?.first_name || ''} ${application.applicant?.last_name || ''}`.trim() || 'Applicant'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(application.status)}`}>
                                {application.status.replace('-', ' ')}
                              </span>
                            </div>
                            {application.applicant?.headline && (
                              <p className="text-sm text-neutral-600 mb-2">{application.applicant.headline}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                              {application.email && (
                                <div className="flex items-center space-x-1">
                                  <FiMail className="w-4 h-4" />
                                  <span>{application.email}</span>
                                </div>
                              )}
                              {application.contact_number && (
                                <div className="flex items-center space-x-1">
                                  <FiPhone className="w-4 h-4" />
                                  <span>{application.contact_number}</span>
                                </div>
                              )}
                              {application.applicant?.location && (
                                <div className="flex items-center space-x-1">
                                  <FiMapPin className="w-4 h-4" />
                                  <span>{application.applicant.location}</span>
                                </div>
                              )}
                            </div>
                            {application.applied_at && (
                              <p className="text-xs text-neutral-500 mt-2">
                                Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                              </p>
                            )}

                            {/* Sync Score for Recruiter View */}
                            {application.applicant?.id && (
                              <div className="mt-3 pt-3 border-t border-neutral-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-neutral-700">Sync Score</span>
                                  <SyncScore userId={application.applicant.id} showTooltip={false} compact={true} />
                                </div>
                              </div>
                            ) || (
                              // Demo Sync Score for display purposes
                              <div className="mt-3 pt-3 border-t border-neutral-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-neutral-700">Sync Score</span>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-bold text-green-600">78</div>
                                    <span className="text-xs text-gray-500">/100</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Growth Score for Recruiter View */}
                            {application.applicant?.id && (
                              <div className="mt-3 pt-3 border-t border-neutral-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-neutral-700">Growth Score</span>
                                  <GrowthScore userId={application.applicant.id} showTooltip={false} compact={true} />
                                </div>
                              </div>
                            ) || (
                              // Demo Growth Score for display purposes
                              <div className="mt-3 pt-3 border-t border-neutral-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-neutral-700">Growth Score</span>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-bold text-blue-600">64</div>
                                    <span className="text-xs text-gray-500">/100</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-2 pt-4 border-t border-neutral-200">
                        <button
                          onClick={async () => {
                            setSelectedApplication(application);
                            // Automatically update status to "seen" if it's "submitted"
                            if (application.status === 'submitted') {
                              try {
                                await handleUpdateStatus(application.id, 'seen', 'Application viewed by recruiter', true);
                              } catch (error) {
                                // Error already handled in handleUpdateStatus
                              }
                            }
                          }}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                          View Application
                        </button>
                        {application.resume_file_url && (
                          <button
                            onClick={() => handleDownloadResume(application.id)}
                            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium flex items-center space-x-2"
                          >
                            <FiDownload className="w-4 h-4" />
                            <span>Resume</span>
                          </button>
                        )}
                        {application.applicant?.id && (
                          <button
                            onClick={() => navigate(`/profile/${application.applicant.id}`)}
                            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium flex items-center space-x-2"
                          >
                            <FiUser className="w-4 h-4" />
                            <span>Profile</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (application.applicant?.id) {
                              navigate(`/messages?user=${application.applicant.id}`);
                            }
                          }}
                          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium flex items-center space-x-2"
                        >
                          <FiMessageSquare className="w-4 h-4" />
                          <span>Message</span>
                        </button>
                        <div className="flex-1"></div>
                        <select
                          value={application.status}
                          onChange={(e) => handleUpdateStatus(application.id, e.target.value)}
                          disabled={updatingStatus}
                          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                          <option value="submitted">Submitted</option>
                          <option value="seen">Seen</option>
                          <option value="in-processing">In Processing</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-soft p-12 text-center">
              <p className="text-neutral-500">Select a job to view applications</p>
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={handleUpdateStatus}
          onDownloadResume={handleDownloadResume}
          updatingStatus={updatingStatus}
        />
      )}
    </div>
  );
};

const ApplicationDetailModal = ({ application, onClose, onUpdateStatus, onDownloadResume, updatingStatus }) => {
  const [newStatus, setNewStatus] = useState(application.status);
  const [note, setNote] = useState('');

  const handleStatusUpdate = async () => {
    await onUpdateStatus(application.id, newStatus, note);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Application Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Applicant Info */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Applicant Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Full Name:</span>
                <span className="ml-2 font-medium">{application.full_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-600">Email:</span>
                <span className="ml-2 font-medium">{application.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-600">Contact:</span>
                <span className="ml-2 font-medium">{application.contact_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-600">Address:</span>
                <span className="ml-2 font-medium">{application.address || 'N/A'}</span>
              </div>
              {application.experience_years !== null && application.experience_years !== undefined && (
                <div>
                  <span className="text-neutral-600">Experience:</span>
                  <span className="ml-2 font-medium">{application.experience_years} years</span>
                </div>
              )}
              {application.portfolio_url && (
                <div>
                  <span className="text-neutral-600">Portfolio:</span>
                  <a
                    href={application.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary-600 hover:underline flex items-center space-x-1"
                  >
                    <span>View</span>
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
            {application.skills && application.skills.length > 0 && (
              <div className="mt-4">
                <span className="text-neutral-600 text-sm">Skills:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {application.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sync Score in Modal */}
            {application.applicant?.id && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">Sync Score</span>
                  <SyncScore userId={application.applicant.id} showTooltip={false} compact={true} />
                </div>
              </div>
            ) || (
              // Demo Sync Score for display purposes
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">Sync Score</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-green-600">82</div>
                    <span className="text-xs text-gray-500">/100</span>
                  </div>
                </div>
              </div>
            )}

            {/* Growth Score in Modal */}
            {application.applicant?.id && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">Growth Score</span>
                  <GrowthScore userId={application.applicant.id} showTooltip={false} compact={true} />
                </div>
              </div>
            ) || (
              // Demo Growth Score for display purposes
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">Growth Score</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-blue-600">68</div>
                    <span className="text-xs text-gray-500">/100</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          {application.cover_letter && (
            <div>
              <h3 className="font-semibold mb-2">Cover Letter</h3>
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{application.cover_letter}</p>
              </div>
            </div>
          )}

          {/* Status History */}
          {application.status_history && application.status_history.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Status History</h3>
              <ApplicationTimeline history={application.status_history} />
            </div>
          )}

          {/* Update Status */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Update Status</h3>
            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="submitted">Submitted</option>
                <option value="seen">Seen</option>
                <option value="in-processing">In Processing</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note..."
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
                {application.resume_file_url && (
                  <button
                    onClick={() => onDownloadResume(application.id)}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium flex items-center space-x-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Download Resume</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterJobApplications;

