import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService } from '../../services/api';
import { Button, Card, Badge } from '../ui';
import { FiBriefcase, FiUsers, FiTrendingUp, FiPlus, FiEdit2, FiTrash2, FiEye, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const RecruiterDashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplicants: 0,
    shortlisted: 0,
    interviews: 0,
    avgSyncScore: 0,
    avgAtsScore: 0
  });
  const [error, setError] = useState(null);

  // Load jobs on mount and when returning from job creation
  useEffect(() => {
    loadJobs();
  }, []);

  // Handle refresh when returning from job creation
  useEffect(() => {
    if (location.state?.refreshJobs) {
      loadJobs();
      // Clear the state from URL
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.refreshJobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobsData = await jobService.getMyJobs();

      const getJobId = (job) => job?.id || job?._id;
      const parseScore = (value) => {
        if (typeof value === 'number') return value;
        if (value && typeof value.score === 'number') return value.score;
        return 0;
      };

      const allJobs = (jobsData || []).map((job) => ({
        ...job,
        id: getJobId(job)
      }));

      // Calculate stats
      const activeJobs = allJobs.filter(job => ['active', 'open'].includes((job.status || '').toLowerCase()));

      // Fetch applications for active jobs to compute accurate recruiter metrics.
      const applicationsByJob = await Promise.all(
        activeJobs.map(async (job) => {
          try {
            const applications = await jobService.getRecruiterJobApplications(job.id);
            return Array.isArray(applications) ? applications : [];
          } catch (_) {
            return [];
          }
        })
      );

      const allApplications = applicationsByJob.flat();
      const totalApplicants = allApplications.length;
      const shortlisted = allApplications.filter((a) => ['shortlisted', 'accepted'].includes((a.status || '').toLowerCase())).length;
      const interviews = allApplications.filter((a) => ['interview', 'interview_scheduled', 'in-processing', 'in_processing'].includes((a.status || '').toLowerCase())).length;

      const syncScoreTotal = allApplications.reduce((sum, app) => {
        return sum + parseScore(app.sync_score ?? app.applicant?.sync_score);
      }, 0);
      const atsScoreTotal = allApplications.reduce((sum, app) => {
        return sum + parseScore(app.ats_score ?? app.applicant?.ats_score);
      }, 0);

      const avgSyncScore = totalApplicants > 0 ? Math.round(syncScoreTotal / totalApplicants) : 0;
      const avgAtsScore = totalApplicants > 0 ? Math.round(atsScoreTotal / totalApplicants) : 0;

      setJobs(activeJobs);
      setStats({
        activeJobs: activeJobs.length,
        totalApplicants,
        shortlisted,
        interviews,
        avgSyncScore,
        avgAtsScore
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load job postings. Please try again.');
      toast.error('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      setDeleting(jobId);
      await jobService.deleteJob(jobId);
      toast.success('Job deleted successfully');
      setConfirmDelete(null);
      await loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FiBriefcase className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your job postings and candidates</p>
              </div>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              onClick={() => navigate('/jobs/create')}
            >
              <FiPlus className="w-4 h-4" />
              Post New Job
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">

            {/* Profile Card */}
            <Card>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiUsers className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</h3>
                <p className="text-sm text-gray-600">Recruiter</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Active Postings</p>
                  <p className="text-lg font-bold text-blue-600">{stats.activeJobs}</p>
                </div>
              </div>
            </Card>

            {/* Job Statistics */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Job Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Jobs</span>
                  <span className="font-bold text-blue-600">{stats.activeJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Applicants</span>
                  <span className="font-bold text-green-600">{stats.totalApplicants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shortlisted</span>
                  <span className="font-bold text-purple-600">{stats.shortlisted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Interviews</span>
                  <span className="font-bold text-orange-600">{stats.interviews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Sync Score</span>
                  <span className="font-bold text-indigo-600">{stats.avgSyncScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg ATS Score</span>
                  <span className="font-bold text-emerald-600">{stats.avgAtsScore}%</span>
                </div>
              </div>
            </Card>

            {/* Refresh Button */}
            <Card>
              <Button
                onClick={loadJobs}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh Job List
              </Button>
            </Card>

          </div>

          {/* Middle Column */}
          <div className="lg:col-span-6 space-y-6">

            {/* Error Message */}
            {error && (
              <Card className="bg-red-50 border-red-200">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              </Card>
            )}

            {/* Active Jobs */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Active Job Postings</h3>
                <Badge variant="secondary">{jobs.length} active</Badge>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <FiBriefcase className="text-gray-400 w-8 h-8" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">No jobs posted yet</p>
                  <p className="text-sm text-gray-500 mb-4">Create your first job posting to start hiring</p>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => navigate('/jobs/create')}
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Post a Job
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-600">{job.company_name} • {job.location}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiUsers className="w-3 h-3" />
                              {job.applicants?.length || 0} applicants
                            </span>
                            {job.job_type && <span>{job.job_type}</span>}
                            <span>Posted {formatDate(job.created_at)}</span>
                          </div>
                        </div>
                        <div>
                          <Badge
                            variant={(job.status || '').toLowerCase() === 'active' ? 'success' : 'neutral'}
                            className="mb-2"
                          >
                            {job.status || 'active'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/recruiter/jobs/${job.id}/applicants`)}
                          className="flex items-center gap-1"
                        >
                          <FiEye className="w-4 h-4" />
                          View Applications
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="flex items-center gap-1"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirmDelete === job.id) {
                              handleDeleteJob(job.id);
                            } else {
                              setConfirmDelete(job.id);
                            }
                          }}
                          disabled={deleting === job.id}
                          className={`flex items-center gap-1 ${
                            confirmDelete === job.id
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : 'text-red-600 hover:text-red-700'
                          }`}
                        >
                          <FiTrash2 className="w-4 h-4" />
                          {deleting === job.id
                            ? 'Deleting...'
                            : confirmDelete === job.id
                            ? 'Confirm Delete'
                            : 'Delete'}
                        </Button>
                        {confirmDelete === job.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDelete(null)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-6">

            {/* Quick Actions */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/jobs/create')}
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Post New Job
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/jobs/my-jobs')}
                >
                  <FiUsers className="w-4 h-4 mr-2" />
                  Manage Applicants
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiTrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">Posted {formatDate(job.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </Card>

          </div>

        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboardEnhanced;
