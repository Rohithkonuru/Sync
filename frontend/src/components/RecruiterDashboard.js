import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobService, userService, companyService } from '../services/api';
import { getErrorMessage } from '../utils/errorHelpers';
import { FiPlus, FiUsers, FiSearch, FiBarChart, FiBriefcase, FiX, FiEdit, FiTrash2, FiEye, FiTrendingUp, FiCheckCircle, FiClock, FiUserCheck } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    hiredThisMonth: 0,
    pendingApplications: 0,
    shortlistedCandidates: 0
  });
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCandidateSearch, setShowCandidateSearch] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jobsData, applicationsData, companiesData] = await Promise.all([
        jobService.getMyJobs().catch(() => []),
        jobService.getMyApplications().catch(() => []),
        companyService.getCompanies().catch(() => [])
      ]);

      setJobs(jobsData || []);
      setApplications(applicationsData || []);
      setCompanies(companiesData || []);

      // Calculate stats
      const activeJobs = (jobsData || []).filter(job => job.status === 'active').length;
      const totalApplications = (applicationsData || []).length;
      const pendingApplications = (applicationsData || []).filter(app => app.status === 'submitted').length;
      const shortlistedCandidates = (applicationsData || []).filter(app => app.status === 'shortlisted').length;

      setStats({
        totalJobs: (jobsData || []).length,
        activeJobs,
        totalApplications,
        hiredThisMonth: 2, // This would come from backend
        pendingApplications,
        shortlistedCandidates
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;

    try {
      await jobService.deleteJob(jobId);
      toast.success('Job deleted successfully');
      await loadData();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await jobService.updateApplicationStatus(applicationId, newStatus);
      toast.success('Application status updated');
      await loadData();
    } catch (error) {
      toast.error('Failed to update application status');
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
      case 'shortlisted':
        return <FiUserCheck className="w-4 h-4" />;
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
        <p className="text-gray-600 mt-2">Manage your job postings and find top talent</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <FiBriefcase className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <FiTrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <FiUsers className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <FiUserCheck className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shortlisted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.shortlistedCandidates}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recruiter Tools</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowJobModal(true)}
                className="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors border-2 border-primary-200"
              >
                <FiPlus className="w-6 h-6 text-primary-600" />
                <div>
                  <div className="font-medium text-primary-900">Post New Job</div>
                  <div className="text-sm text-primary-700">Create job listing</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/jobs/my-jobs')}
                className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FiUsers className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-medium">Manage Applications</div>
                  <div className="text-sm text-gray-600">Review & manage applications</div>
                </div>
              </button>
              <button
                onClick={() => setShowCandidateSearch(true)}
                className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FiSearch className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-medium">Search Candidates</div>
                  <div className="text-sm text-gray-600">Find qualified talent</div>
                </div>
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <FiBarChart className="w-6 h-6 text-orange-600" />
                <div>
                  <div className="font-medium">Analytics</div>
                  <div className="text-sm text-gray-600">Track performance</div>
                </div>
              </button>
            </div>
          </div>

          {/* Active Job Postings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Job Postings</h2>
              <button
                onClick={() => navigate('/jobs/my-jobs')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </button>
            </div>
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <FiBriefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No job postings yet</p>
                <button
                  onClick={() => setShowJobModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Post Your First Job
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-gray-600">{job.location}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status === 'active' ? 'Active' : 'Closed'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <span>{job.applications?.length || 0} applications</span>
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                      >
                        <FiEye className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => setEditingJob(job)}
                        className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        <FiEdit className="w-4 h-4 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="px-3 py-1 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50"
                      >
                        <FiTrash2 className="w-4 h-4 inline mr-1" />
                        Delete
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
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Applications</h3>
              {applications.length > 0 && (
                <button
                  onClick={() => navigate('/jobs/my-jobs')}
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
                  onClick={() => setShowJobModal(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Post a Job
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="border-l-4 border-primary-500 pl-4 pb-4 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{app.job?.title || 'Job Title'}</h4>
                        <p className="text-xs text-gray-600 mt-1">{app.applicant?.first_name} {app.applicant?.last_name}</p>
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
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => navigate(`/profile/${app.applicant?.id}`)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        View Profile
                      </button>
                      {app.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, 'shortlisted')}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Company Profile */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Company Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Profile Completion</span>
                <span className="text-sm text-green-600">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <button
                onClick={() => navigate('/companies')}
                className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Complete Profile
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Jobs Posted</span>
                <span className="text-sm font-semibold">{stats.totalJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Applications Received</span>
                <span className="text-sm font-semibold">{stats.totalApplications}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Candidates Hired</span>
                <span className="text-sm font-semibold text-green-600">{stats.hiredThisMonth}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Posting Modal */}
      {showJobModal && (
        <CreateJobModal
          companies={companies}
          onClose={() => setShowJobModal(false)}
          onSuccess={async () => {
            setShowJobModal(false);
            await loadData();
          }}
        />
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <EditJobModal
          job={editingJob}
          companies={companies}
          onClose={() => setEditingJob(null)}
          onSuccess={async () => {
            setEditingJob(null);
            await loadData();
          }}
        />
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <AnalyticsModal
          stats={stats}
          jobs={jobs}
          applications={applications}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Candidate Search Modal */}
      {showCandidateSearch && (
        <CandidateSearchModal
          onClose={() => setShowCandidateSearch(false)}
        />
      )}
    </div>
  );
};

const CreateJobModal = ({ companies, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    company_id: '',
    company_name: '',
    location: '',
    job_type: 'full-time',
    salary_min: '',
    salary_max: '',
    description: '',
    requirements: [],
    benefits: [],
    status: 'active'
  });
  const [newRequirement, setNewRequirement] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'company_id') {
      const company = companies.find(c => c.id === value);
      setFormData({
        ...formData,
        company_id: value,
        company_name: company?.name || '',
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()],
      });
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()],
      });
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (index) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await jobService.createJob({
        ...formData,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
      });
      toast.success('Job posted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Post New Job</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company (Optional)
              </label>
              <select
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Company (or leave blank)</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type *
              </label>
              <select
                name="job_type"
                required
                value={formData.job_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Salary
              </label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Salary
              </label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requirements
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                placeholder="Add requirement"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.requirements.map((req, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{req}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    className="hover:text-primary-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benefits
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                placeholder="Add benefit"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.benefits.map((benefit, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{benefit}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(idx)}
                    className="hover:text-green-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditJobModal = ({ job, companies, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: job.title,
    company_id: job.company_id,
    location: job.location,
    job_type: job.job_type,
    salary_min: job.salary_min || '',
    salary_max: job.salary_max || '',
    description: job.description,
    requirements: job.requirements || [],
    benefits: job.benefits || [],
    status: job.status,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await jobService.updateJob(job.id || job._id, {
        ...formData,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
      });
      toast.success('Job updated successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Edit Job</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
              <select
                name="job_type"
                required
                value={formData.job_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows="5"
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
              {loading ? 'Updating...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AnalyticsModal = ({ stats, jobs, applications, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recruitment Analytics</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Jobs Posted</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalJobs}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Active Jobs</div>
            <div className="text-3xl font-bold text-green-600">{stats.activeJobs}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Applications</div>
            <div className="text-3xl font-bold text-purple-600">{stats.totalApplications}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Shortlisted Candidates</div>
            <div className="text-3xl font-bold text-orange-600">{stats.shortlistedCandidates}</div>
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Top Performing Jobs</h3>
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{job.title}</div>
                  <div className="text-sm text-gray-600">{job.company_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{job.applications?.length || 0} applications</div>
                  <div className="text-xs text-gray-500">{job.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CandidateSearchModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Search Candidates</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <div className="text-center py-8">
          <FiSearch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Candidate search functionality coming soon</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
