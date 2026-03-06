import React, { useState, useEffect } from 'react';
import { jobService } from '../services/api';
import { FiDownload, FiUser, FiMail, FiPhone, FiMapPin, FiCheckCircle, FiX, FiClock, FiEye, FiFilter } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import SyncScore from '../components/SyncScore';
import GrowthScore from '../components/GrowthScore';

const RecruiterJobApplications = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');

  // Debug: Component loaded
  useEffect(() => {
    console.log('🚀 Enhanced Recruiter Dashboard loaded!');
    console.log('Current URL:', window.location.pathname);
    loadMyJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      console.log('📋 Loading applications for job:', selectedJob.title);
      loadApplications(selectedJob.id);
    }
  }, [selectedJob, sortBy, filterStatus]);

  const loadMyJobs = async () => {
    try {
      console.log('🔄 Loading recruiter jobs...');
      setLoading(true);
      const data = await jobService.getMyJobs();
      console.log('✅ Jobs loaded:', data);
      setMyJobs(data || []);
      if (data && data.length > 0) {
        console.log('🎯 Auto-selecting first job:', data[0].title);
        setSelectedJob(data[0]);
      } else {
        console.log('⚠️ No jobs found for this recruiter');
        // Don't show error toast for no jobs - this is normal
      }
    } catch (error) {
      console.error('❌ Error loading jobs:', error);
      // Only show toast if it's a real error, not just no jobs
      if (error.message && !error.message.includes('404')) {
        toast.error('Failed to load your jobs');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (jobId) => {
    try {
      console.log('📋 Loading applications for job ID:', jobId);
      const data = await jobService.getJobApplications(jobId);
      console.log('✅ Applications loaded:', data);
      setApplications(data || []);
    } catch (error) {
      console.error('❌ Error loading applications:', error);
      // Don't show toast for every error - console logging is enough for debugging
      if (error.response?.status !== 404) {
        toast.error('Failed to load applications');
      }
    }
  };

  const handleJobSelect = (job) => {
    console.log('🎯 Selecting job:', job.title);
    setSelectedJob(job);
    // Don't navigate - just load applications for the selected job
    loadApplications(job.id);
  };

  const handleViewProfile = async (application) => {
    try {
      // Mark as seen if not already seen
      if (!application.is_seen) {
        await jobService.markApplicationAsSeen(application.id);
        // Update local state
        setApplications(prev => 
          prev.map(app => 
            app.id === application.id 
              ? { ...app, is_seen: true, status: app.status === 'submitted' ? 'seen' : app.status }
              : app
          )
        );
      }
      setSelectedApplication(application);
    } catch (error) {
      toast.error('Failed to view profile');
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus, note = '') => {
    try {
      setUpdatingStatus(true);
      await jobService.updateApplicationStatus(applicationId, newStatus, note);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      );
      
      toast.success(`Application status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'bg-blue-100 text-blue-800',
      'seen': 'bg-gray-100 text-gray-800',
      'in-processing': 'bg-yellow-100 text-yellow-800',
      'shortlisted': 'bg-green-100 text-green-800',
      'accepted': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'submitted': <FiClock className="w-4 h-4" />,
      'seen': <FiEye className="w-4 h-4" />,
      'in-processing': <FiClock className="w-4 h-4" />,
      'shortlisted': <FiCheckCircle className="w-4 h-4" />,
      'accepted': <FiCheckCircle className="w-4 h-4" />,
      'rejected': <FiX className="w-4 h-4" />
    };
    return icons[status] || <FiClock className="w-4 h-4" />;
  };

  const getSortedApplications = () => {
    let filtered = [...applications];
    
    // Apply filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }
    
    // Apply sort
    switch (sortBy) {
      case 'sync_score':
        return filtered.sort((a, b) => (b.applicant?.sync_score || 0) - (a.applicant?.sync_score || 0));
      case 'ats_score':
        return filtered.sort((a, b) => (b.applicant?.ats_score?.score || 0) - (a.applicant?.ats_score?.score || 0));
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.applied_at) - new Date(b.applied_at));
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));
    }
  };

  const getApplicantCount = (jobId) => {
    const count = applications.filter(app => app.job_id === jobId).length;
    console.log(`📊 Job ${jobId} has ${count} applications`);
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sortedApplications = getSortedApplications();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your job postings and review applications</p>
      </div>

      {/* Job Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Job Postings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => handleJobSelect(job)}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedJob?.id === job.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  job.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {job.company_name} • {job.location}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  {getApplicantCount(job.id)} applicants
                </span>
                <span className="text-gray-500">
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedJob && (
        <>
          {/* Selected Job Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                <p className="text-gray-600 mt-1">{selectedJob.company_name} • {selectedJob.location}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{sortedApplications.length}</div>
                <div className="text-sm text-gray-500">Total Applications</div>
              </div>
            </div>
          </div>

          {/* Sorting and Filtering */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">New</option>
                  <option value="seen">Seen</option>
                  <option value="in-processing">In Process</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="sync_score">Sync Score</option>
                  <option value="ats_score">ATS Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {sortedApplications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-gray-500">No applications found</div>
              </div>
            ) : (
              sortedApplications.map((application) => (
                <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Profile Photo */}
                      <div className="relative">
                        {application.applicant?.profile_picture ? (
                          <img
                            src={application.applicant.profile_picture}
                            alt={`${application.applicant.first_name} ${application.applicant.last_name}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
                            <FiUser className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        {!application.is_seen && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* Applicant Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.full_name}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            {application.status}
                          </span>
                          {!application.is_seen && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              🔵 New
                            </span>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <FiMail className="w-4 h-4" />
                            {application.email}
                          </div>
                          {application.contact_number && (
                            <div className="flex items-center gap-1">
                              <FiPhone className="w-4 h-4" />
                              {application.contact_number}
                            </div>
                          )}
                          {application.applicant?.location && (
                            <div className="flex items-center gap-1">
                              <FiMapPin className="w-4 h-4" />
                              {application.applicant.location}
                            </div>
                          )}
                        </div>

                        {/* Scores */}
                        <div className="flex items-center gap-6 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Sync:</span>
                            <SyncScore userId={application.applicant?.id} showTooltip={false} compact={true} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Growth:</span>
                            <GrowthScore userId={application.applicant?.id} showTooltip={false} compact={true} />
                          </div>
                          {application.applicant?.ats_score?.score && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">ATS:</span>
                              <span className="text-sm font-bold text-green-600">
                                {application.applicant.ats_score.score}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Applied Date */}
                        <div className="text-sm text-gray-500">
                          Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleViewProfile(application)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <FiEye className="w-4 h-4" />
                        View Profile
                      </button>
                      
                      <div className="flex gap-2">
                        {application.status !== 'shortlisted' && application.status !== 'accepted' && (
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'shortlisted')}
                            disabled={updatingStatus}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium"
                          >
                            Shortlist
                          </button>
                        )}
                        
                        {application.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={updatingStatus}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium"
                          >
                            Reject
                          </button>
                        )}
                        
                        {application.status === 'submitted' && (
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'in-processing')}
                            disabled={updatingStatus}
                            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-xs font-medium"
                          >
                            In Process
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">Application Details</h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Applicant Information */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Full Name:</span>
                    <span className="ml-2 font-medium">{selectedApplication.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedApplication.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <span className="ml-2 font-medium">{selectedApplication.contact_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Applied:</span>
                    <span className="ml-2 font-medium">
                      {formatDistanceToNow(new Date(selectedApplication.applied_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scores Section */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Candidate Scores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {selectedApplication.applicant?.sync_score || 0}
                    </div>
                    <div className="text-sm text-gray-600">Sync Score</div>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {selectedApplication.applicant?.growth_score || 0}
                    </div>
                    <div className="text-sm text-gray-600">Growth Score</div>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {selectedApplication.applicant?.ats_score?.score || 0}
                    </div>
                    <div className="text-sm text-gray-600">ATS Score</div>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Cover Letter</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {/* Skills */}
              {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => jobService.downloadResume(selectedApplication.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiDownload className="w-4 h-4" />
                  Download Resume
                </button>
                <button
                  onClick={() => jobService.updateApplicationStatus(selectedApplication.id, 'shortlisted')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => jobService.updateApplicationStatus(selectedApplication.id, 'rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterJobApplications;
