import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobService, userService } from '../services/api';
import { FiSearch, FiFileText, FiTrendingUp, FiBookmark, FiX, FiCheckCircle, FiEye, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHelpers';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jobsData, savedData, applicationsData] = await Promise.all([
        jobService.getJobs({ limit: 10 }).catch(() => []),
        jobService.getSavedJobs().catch(() => []),
        jobService.getApplications().catch(() => [])
      ]);
      setJobs(jobsData || []);
      setSavedJobs((savedData || [])?.map(job => job.id) || []);
      setApplications(applicationsData || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      const response = await jobService.saveJob(jobId);
      if (response.saved) {
        setSavedJobs([...savedJobs, jobId]);
        toast.success('Job saved!');
      } else {
        setSavedJobs(savedJobs.filter(id => id !== jobId));
        toast.success('Job unsaved!');
      }
    } catch (error) {
      toast.error('Failed to save job');
    }
  };

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
        return <FiCheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <FiX className="w-4 h-4" />;
      case 'seen':
        return <FiEye className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.first_name}!</h1>
        <p className="text-gray-600 mt-2">Find your dream job and track your applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/jobs')}
                className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FiSearch className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-medium">Search Jobs</div>
                  <div className="text-sm text-gray-600">Find new opportunities</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FiFileText className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-medium">Update Resume</div>
                  <div className="text-sm text-gray-600">Keep it current</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/applications')}
                className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <FiTrendingUp className="w-6 h-6 text-purple-600" />
                <div>
                  <div className="font-medium">Submitted Applications</div>
                  <div className="text-sm text-gray-600">View all your applications</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <FiBookmark className="w-6 h-6 text-orange-600" />
                <div>
                  <div className="font-medium">Saved Jobs</div>
                  <div className="text-sm text-gray-600">View saved positions</div>
                </div>
              </button>
            </div>
          </div>

          {/* Job Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recommended Jobs</h2>
            {jobs.length === 0 ? (
              <p className="text-gray-500">No jobs available right now.</p>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-gray-600">{job.company_name}</p>
                        <p className="text-sm text-gray-500">{job.location}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded capitalize">
                            {job.job_type}
                          </span>
                          {(job.salary_min || job.salary_max) && (
                            <span className="text-sm text-gray-600">
                              {job.salary_min && job.salary_max
                                ? `$${Number(job.salary_min).toLocaleString()} - $${Number(job.salary_max).toLocaleString()}`
                                : job.salary_min
                                ? `$${Number(job.salary_min).toLocaleString()}+`
                                : `Up to $${Number(job.salary_max).toLocaleString()}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSaveJob(job.id)}
                        className="p-2 text-gray-400 hover:text-primary-600"
                      >
                        <FiBookmark className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => setShowApplyModal({ jobId: job.id, jobTitle: job.title })}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Apply Now
                      </button>
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Application Status</h3>
              {applications.length > 0 && (
                <button
                  onClick={() => navigate('/applications')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All
                </button>
              )}
            </div>
            {applications.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-3">No applications yet.</p>
                <button
                  onClick={() => navigate('/jobs')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="border-l-4 border-primary-500 pl-4 pb-4 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{app.job?.title || 'Job Title'}</h4>
                        <p className="text-xs text-gray-600 mt-1">{app.job?.company_name || 'Company'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        <span className="capitalize">{app.status.replace('-', ' ')}</span>
                      </span>
                    </div>
                    {app.applied_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                ))}
                {applications.length > 5 && (
                  <button
                    onClick={() => navigate('/applications')}
                    className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium pt-2 border-t"
                  >
                    View All {applications.length} Applications →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Completion */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Profile Completion</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Resume Uploaded</span>
                <span className="text-sm text-green-600">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Skills Added</span>
                <span className="text-sm text-green-600">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Experience Listed</span>
                <span className="text-sm text-yellow-600">In Progress</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Portfolio Added</span>
                <span className="text-sm text-gray-400">✗</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">75% Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Job Modal */}
      {showApplyModal && (
        <ApplyJobModal
          jobId={showApplyModal.jobId}
          jobTitle={showApplyModal.jobTitle}
          onClose={() => setShowApplyModal(null)}
          onSuccess={async () => {
            setShowApplyModal(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
};

const ApplyJobModal = ({ jobId, jobTitle, onClose, onSuccess }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await jobService.applyJob(jobId, coverLetter);
      toast.success('Application submitted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Apply for {jobTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter (Optional)
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows="6"
              placeholder="Tell the employer why you're a great fit for this position..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
