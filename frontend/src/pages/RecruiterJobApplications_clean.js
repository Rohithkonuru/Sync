/**
 * Clean RecruiterJobApplications component with job-wise applicant display
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService, applicationService } from '../services/api_clean';
import { cn } from '../utils/helpers';
import { formatRelativeTime } from '../utils/helpers';
import { Card, CardHeader, CardBody, CardFooter } from '../components/BaseComponents';
import { Button } from '../components/Button';
import { Badge } from '../components/BaseComponents';
import { Avatar } from '../components/Avatar';
import { SyncScore } from '../components/SyncScore_clean';
import { GrowthScore } from '../components/GrowthScore_clean';
import { Loading } from '../components/BaseComponents';
import { EmptyState } from '../components/BaseComponents';
import { Tooltip } from '../components/BaseComponents';
import toast from 'react-hot-toast';

/**
 * RecruiterJobApplications component props
 * @typedef {Object} RecruiterJobApplicationsProps
 * @property {string} [jobId] - Job ID from URL params
 * @property {boolean} [showFilters=true] - Show filters and sorting
 * @property {boolean} [showStats=true] - Show statistics
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Enhanced RecruiterJobApplications component
 * @param {RecruiterJobApplicationsProps} props - Component props
 * @returns {JSX.Element} RecruiterJobApplications component
 */
const RecruiterJobApplications = ({ jobId, showFilters = true, showStats = true, className = '' }) => {
  const navigate = useNavigate();
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Debug: Component loaded
  console.log('🚀 Enhanced Recruiter Dashboard loaded!');

  // Load recruiter's jobs
  const loadMyJobs = useCallback(async () => {
    try {
      console.log('🔄 Loading recruiter jobs...');
      setLoading(true);
      const data = await jobService.getMyJobs();
      console.log('✅ Jobs loaded:', data);
      setMyJobs(data.data || []);
      
      // Auto-select first job if available
      if (data.data && data.data.length > 0) {
        console.log('🎯 Auto-selecting first job:', data.data[0].title);
        setSelectedJob(data.data[0]);
      } else {
        console.log('⚠️ No jobs found for this recruiter');
      }
    } catch (error) {
      console.error('❌ Error loading jobs:', error);
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load applications for selected job
  const loadApplications = useCallback(async (jobId) => {
    try {
      console.log('📋 Loading applications for job ID:', jobId);
      setApplicationsLoading(true);
      const data = await applicationService.getMyApplications();
      console.log('✅ Applications loaded:', data);
      setApplications(data.data || []);
    } catch (error) {
      console.error('❌ Error loading applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  // Handle job selection
  const handleJobSelect = (job) => {
    console.log('🎯 Selecting job:', job.title);
    setSelectedJob(job);
    loadApplications(job.id);
  };

  // Handle view profile
  const handleViewProfile = async (application) => {
    try {
      // Mark as seen if not already seen
      if (!application.is_seen) {
        await applicationService.markApplicationAsSeen(application.id);
        // Update local state
        setApplications(prev => 
          prev.map(app => 
            app.id === application.id 
              ? { ...app, is_seen: true, seen_at: new Date().toISOString() }
              : app
          )
        );
      }
      
      // Navigate to applicant profile
      navigate(`/profile/${application.applicant_id}`);
    } catch (error) {
      console.error('❌ Error marking as seen:', error);
      toast.error('Failed to mark application as seen');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (applicationId, status) => {
    try {
      setUpdatingStatus(true);
      await applicationService.updateApplicationStatus(applicationId, { status });
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { 
                ...app, 
                status,
                updated_at: new Date().toISOString(),
                status_history: [
                  ...app.status_history,
                  {
                    status,
                    updated_at: new Date().toISOString(),
                    updated_by: 'recruiter',
                    note: `Status changed to ${status}`
                  }
                ]
              }
              : app
        )
      );
      
      toast.success(`Application ${status} successfully`);
    } catch (error) {
      console.error('❌ Error updating status:', error);
      toast.error('Failed to update application status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter and sort applications
  const getFilteredAndSortedApplications = useCallback(() => {
    let filtered = applications;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort applications
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.applied_at) - new Date(a.applied_at);
        case 'oldest':
          return new Date(a.applied_at) - new Date(b.applied_at);
        case 'sync_score':
          return (b.applicant?.sync_score || 0) - (a.applicant?.sync_score || 0);
        case 'growth_score':
          return (b.applicant?.growth_score || 0) - (a.applicant?.growth_score || 0);
        case 'ats_score':
          return (b.applicant?.ats_score?.score || 0) - (a.applicant?.ats_score?.score || 0);
        default:
          return new Date(b.applied_at) - new Date(a.applied_at);
      }
    });

    return sorted;
  }, [applications, sortBy, filterStatus, searchTerm]);

  // Get applicant count for a job
  const getApplicantCount = (jobId) => {
    const count = applications.filter(app => app.job_id === jobId).length;
    console.log(`📊 Job ${jobId} has ${count} applications`);
    return count;
  };

  // Get status statistics
  const getStatusStats = () => {
    const stats = {
      total: applications.length,
      submitted: applications.filter(app => app.status === 'submitted').length,
      seen: applications.filter(app => app.status === 'seen').length,
      in_processing: applications.filter(app => app.status === 'in_processing').length,
      shortlisted: applications.filter(app => app.status === 'shortlisted').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    };
    return stats;
  };

  // Initialize component
  useEffect(() => {
    loadMyJobs();
  }, []);

  // Load applications when job is selected
  useEffect(() => {
    if (selectedJob) {
      loadApplications(selectedJob.id);
    }
  }, [selectedJob]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" message="Loading your jobs..." />
      </div>
    );
  }

  // No jobs state
  if (myJobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          title="No Jobs Posted Yet"
          description="You haven't posted any job opportunities yet. Create your first job posting to start receiving applications."
          icon={
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002 2v6a2 2 0 002-2H9a2 2 0 00-2-2v-6a2 2 0 00-2-2H9a2 2 0 00-2-2v-6a2 2 0 00-2-2H9a2 2 0 00-2-2v-6a2 2 0 00-2-2H9a2 2 0 00-2-2v-6a2 2 0 00-2-2H9a2 2 0 00-2-2v-6a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 11V6a2 2 0 002-2v6a2 2 0 002 2h6a2 2 0 002 2v-6a2 2 0 002 2h-5.586a2.5 2.5 0 001.424 0H16a2 2 0 002-2V8a2 2 0 002 2h-5.586a2.5 2.5 0 001.424 0H16a2 2 0 002-2V8a2 2 0 002 2h-5.586a2.5 2.5 0 001.424 0z"
              />
            </svg>
          }
          action={
            <Button onClick={() => navigate('/jobs/post')} className="mt-4">
              Post Your First Job
            </Button>
          }
        />
      </div>
    );
  }

  const filteredApplications = getFilteredAndSortedApplications();
  const stats = getStatusStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your job applications and track candidate progress</p>
        </div>

        {/* Job Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Job Postings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myJobs.map((job) => (
              <Card
                key={job.id}
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
                  selectedJob?.id === job.id ? 'ring-2 ring-blue-500' : ''
                )}
                onClick={() => handleJobSelect(job)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{job.company_name}</p>
                      <p className="text-sm text-gray-500">{job.location}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge
                        variant={job.status === 'active' ? 'success' : 'secondary'}
                        size="small"
                      >
                        {job.status}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        {getApplicantCount(job.id)} applicants
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Posted {formatRelativeTime(job.created_at)}</span>
                    <span>{job.views} views</span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Selected Job Details */}
        {selectedJob && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedJob.title}
                    </h2>
                    <p className="text-gray-600">{selectedJob.company_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="success" size="small">
                      {selectedJob.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {getApplicantCount(selectedJob.id)} applicants
                    </span>
                  </div>
                </div>
              </CardHeader>

              {/* Stats */}
              {showStats && (
                <CardBody>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
                      <div className="text-sm text-gray-600">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.shortlisted}</div>
                      <div className="text-sm text-gray-600">Shortlisted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                      <div className="text-sm text-gray-600">Accepted</div>
                    </div>
                  </div>
                </CardBody>
              )}
            </Card>
          </div>
        )}

        {/* Applications */}
        {selectedJob && (
          <div>
            {/* Filters */}
            {showFilters && (
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search applicants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="submitted">Submitted</option>
                        <option value="seen">Seen</option>
                        <option value="in_processing">In Process</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="sync_score">Sync Score</option>
                        <option value="growth_score">Growth Score</option>
                        <option value="ats_score">ATS Score</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Applications List */}
            {applicationsLoading ? (
              <div className="flex justify-center py-12">
                <Loading size="large" message="Loading applications..." />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200">
                <EmptyState
                  title="No Applications Yet"
                  description="No applications have been submitted for this job yet."
                  icon={
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h9.5a2.5 2.5 0 001.969 2.5 2.5 0 001.969-2.5H12A2.5 2.5 0 0014.531 2.5 2.5 0 001.969-2.5H20z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 10H5a2 2 0 00-2 2v5a2 2 0 002 2h5.586a2.5 2.5 0 001.424 0H16a2 2 0 002-2V8a2 2 0 00-2-2h-5.586a2.5 2.5 0 00-1.424 0z"
                      />
                    </svg>
                  />
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredApplications.map((application) => (
                  <Card
                    key={application.id}
                    className={cn(
                      'transition-all duration-200 hover:shadow-lg',
                      !application.is_seen && 'ring-2 ring-blue-100'
                    )}
                  >
                    <CardBody>
                      {/* Applicant Info */}
                      <div className="flex items-start space-x-4">
                        <Avatar
                          src={application.applicant?.profile_picture}
                          name={application.full_name}
                          size="large"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.full_name}
                              </h3>
                              <p className="text-sm text-gray-600">{application.email}</p>
                              <p className="text-sm text-gray-500">
                                {application.applicant?.headline || 'No headline'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge
                                variant={application.status === 'submitted' ? 'info' : 
                                          application.status === 'seen' ? 'warning' :
                                          application.status === 'in_processing' ? 'info' :
                                          application.status === 'shortlisted' ? 'success' :
                                          application.status === 'accepted' ? 'success' :
                                          application.status === 'rejected' ? 'danger' : 'secondary'}
                                size="small"
                              >
                                {application.status.replace('_', ' ')}
                              </Badge>
                              {application.is_seen ? (
                                <span className="text-xs text-gray-500">⚪ Seen</span>
                              ) : (
                                <span className="text-xs text-blue-500">🔵 New</span>
                              )}
                            </div>
                          </div>

                          {/* Scores */}
                          <div className="mt-3 flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-600">Sync:</span>
                              <SyncScore
                                userId={application.applicant?.id}
                                compact={true}
                              />
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-600">Growth:</span>
                              <GrowthScore
                                userId={application.applicant?.id}
                                compact={true}
                              />
                            </div>
                            {application.applicant?.ats_score && (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-600">ATS:</span>
                                <span className="font-medium">
                                  {application.applicant.ats_score.score}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Applied Date */}
                          <div className="mt-3 text-sm text-gray-500">
                            Applied {formatRelativeTime(application.applied_at)}
                          </div>

                          {/* Skills */}
                          {application.skills && application.skills.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-1">
                                {application.skills.slice(0, 4).map((skill, index) => (
                                  <Badge
                                    key={index}
                                    variant="info"
                                    size="small"
                                    className="text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {application.skills.length > 4 && (
                                  <Badge
                                    variant="ghost"
                                    size="small"
                                    className="text-xs"
                                  >
                                    +{application.skills.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => handleViewProfile(application)}
                            className="flex-1"
                          >
                            <svg
                              className="h-4 w-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S4.732 16.057 3.458 12z"
                              />
                            </svg>
                            View Profile
                          </Button>
                          <Button
                            variant="success"
                            size="small"
                            onClick={() => handleStatusUpdate(application.id, 'shortlisted')}
                            disabled={updatingStatus}
                            loading={updatingStatus}
                            className="flex-1"
                          >
                            <svg
                              className="h-4 w-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7l-7-7"
                              />
                            </svg>
                            Shortlist
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={updatingStatus}
                            loading={updatingStatus}
                            className="flex-1"
                          >
                            <svg
                              className="h-4 w-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterJobApplications;
