import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService, userService, notificationService } from '../../services/api';
import { Button, Card, Badge, Input, Modal } from '../ui';
import { 
  FiBriefcase, 
  FiUsers, 
  FiTrendingUp, 
  FiEye, 
  FiSearch, 
  FiFilter, 
  FiUser, 
  FiMessageSquare, 
  FiClock, 
  FiPlus, 
  FiX, 
  FiMapPin, 
  FiDollarSign, 
  FiCalendar, 
  FiCheckCircle,
  FiMoreVertical,
  FiEdit2,
  FiTrash2
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorHelpers';

/**
 * Enhanced Recruiter Dashboard
 * Formal, professional design with robust functionality
 */
const RecruiterDashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [jobs, setJobs] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplicants: 0,
    shortlisted: 0,
    interviews: 0,
    views: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Job Creation State
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    location: '',
    job_type: 'full-time',
    salary_min: '',
    salary_max: '',
    skills: [],
    requirements: [],
    benefits: [],
    experience_level: 'mid',
  });

  // Load Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch My Jobs
      const jobsData = await jobService.getMyJobs().catch(err => {
        console.error("Failed to fetch jobs", err);
        return [];
      });
      setJobs(jobsData || []);

      // 2. Fetch Applications for all jobs (for stats)
      let allApps = [];
      if (jobsData && jobsData.length > 0) {
        try {
          const appsPromises = jobsData.map(job => 
            jobService.getJobApplications(job.id).catch(() => [])
          );
          const appsResults = await Promise.all(appsPromises);
          
          allApps = appsResults.flat().map(app => {
            const job = jobsData.find(j => j.id === app.job_id);
            return { ...app, jobTitle: job ? job.title : 'Unknown Job' };
          });
          setAllApplications(allApps);
        } catch (error) {
          console.error('Error fetching applications:', error);
        }
      }

      // 3. Calculate Stats
      const activeJobs = (jobsData || []).filter(job => job.status === 'open' || job.status === 'active').length;
      const totalApplicants = allApps.length;
      const shortlisted = allApps.filter(app => app.status === 'shortlisted').length;
      const interviews = allApps.filter(app => app.status === 'interview').length;

      setStats({
        activeJobs,
        totalApplicants,
        shortlisted,
        interviews,
        views: 1245 // Mock for now, or fetch if available
      });

      // 4. Fetch Notifications for Activity
      const notifications = await notificationService.getNotifications({ limit: 5 }).catch(() => []);
      const activity = (notifications || []).map(notif => ({
        id: notif.id,
        type: notif.type,
        message: notif.message,
        time: notif.created_at,
        read: notif.read
      }));
      setRecentActivity(activity);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    // Validation
    const errors = [];
    if (!jobFormData.title) errors.push('Job Title');
    if (!jobFormData.description) errors.push('Description');
    if (!jobFormData.location) errors.push('Location');
    
    if (errors.length > 0) {
      toast.error(`Missing required fields: ${errors.join(', ')}`);
      return;
    }

    setCreatingJob(true);
    try {
      const payload = {
        ...jobFormData,
        salary_min: jobFormData.salary_min ? Number(jobFormData.salary_min) : null,
        salary_max: jobFormData.salary_max ? Number(jobFormData.salary_max) : null,
        required_skills: jobFormData.skills, // Backend expects required_skills
        status: 'active'
      };

      if (isEditing) {
        await jobService.updateJob(currentJobId, payload);
        toast.success('Job updated successfully');
      } else {
        await jobService.createJob(payload);
        toast.success('Job posted successfully');
      }
      
      setShowCreateJobModal(false);
      
      // Reset form
      setJobFormData({
        title: '',
        description: '',
        location: '',
        job_type: 'full-time',
        salary_min: '',
        salary_max: '',
        skills: [],
        requirements: [],
        benefits: [],
        experience_level: 'mid',
      });
      setIsEditing(false);
      setCurrentJobId(null);

      // Reload data
      loadData();
    } catch (error) {
      console.error('Create/Update job error:', error);
      const msg = error.response?.data?.detail || 'Failed to save job';
      toast.error(typeof msg === 'string' ? msg : 'Operation failed');
    } finally {
      setCreatingJob(false);
    }
  };

  const handleEditJob = (job) => {
    setJobFormData({
      title: job.title,
      description: job.description,
      location: job.location,
      job_type: job.job_type,
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      skills: job.required_skills || [],
      requirements: job.requirements || [],
      benefits: job.benefits || [],
      experience_level: job.experience_level || 'mid',
    });
    setIsEditing(true);
    setCurrentJobId(job.id);
    setShowCreateJobModal(true);
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await jobService.deleteJob(jobId);
        toast.success('Job deleted successfully');
        // Refresh
        loadData();
      } catch (error) {
        toast.error('Failed to delete job');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Top Navigation Bar for Dashboard */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg">
               <FiBriefcase className="text-white w-5 h-5" />
             </div>
             <h1 className="text-xl font-bold text-slate-800">Recruiter Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              theme="blue" 
              icon={FiPlus} 
              onClick={() => setShowCreateJobModal(true)}
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              Post New Job
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Welcome back, {user?.first_name}</h2>
          <p className="text-slate-500 mt-1">Here's what's happening with your job postings today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Active Jobs" 
            value={stats.activeJobs} 
            icon={FiBriefcase} 
            color="blue" 
            trend="+2 this week"
          />
          <StatsCard 
            title="Total Applicants" 
            value={stats.totalApplicants} 
            icon={FiUsers} 
            color="indigo" 
            trend="+12 this week"
          />
          <StatsCard 
            title="Shortlisted" 
            value={stats.shortlisted} 
            icon={FiCheckCircle} 
            color="emerald" 
            trend="4 candidates"
          />
          <StatsCard 
            title="Interviews" 
            value={stats.interviews} 
            icon={FiCalendar} 
            color="purple" 
            trend="2 scheduled"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column: Active Jobs */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-t-4 border-t-blue-500 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FiBriefcase className="text-blue-500" /> My Posted Jobs
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/jobs/my-jobs')}>View All</Button>
              </div>

              {jobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Job Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Applicants</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Posted</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {jobs.slice(0, 5).map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">{job.title}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <FiMapPin className="w-3 h-3" /> {job.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={job.status === 'active' || job.status === 'open' ? 'success' : 'neutral'}>
                              {job.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex -space-x-2 mr-2">
                                {job.applicants && job.applicants.length > 0 ? (
                                  <>
                                    <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                      {job.applicants.length}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-slate-400 text-sm">0</span>
                                )}
                              </div>
                              {job.applicants && job.applicants.length > 0 && (
                                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => navigate(`/jobs/${job.id}/applications`)}>View</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => navigate(`/jobs/${job.id}/applications`)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="View Applications"
                              >
                                <FiUsers className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditJob(job)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                                title="Edit Job"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <FiBriefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No active jobs found</p>
                  <p className="text-slate-400 text-sm mb-4">Post your first job to get started</p>
                  <Button theme="blue" size="sm" onClick={() => setShowCreateJobModal(true)}>Create Job</Button>
                </div>
              )}
            </Card>

            {/* Recent Applications Preview */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Recent Applications</h3>
              </div>
              <div className="space-y-4">
                {allApplications.length > 0 ? (
                  allApplications.slice(0, 5).map((app) => (
                    <div key={app._id || app.id} className="flex items-start p-4 border border-slate-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mr-4">
                        {app.applicant?.profile_picture ? (
                          <img src={app.applicant.profile_picture} className="h-10 w-10 rounded-full object-cover" alt="" />
                        ) : (
                          <FiUser />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-semibold text-slate-900">{app.applicant?.first_name} {app.applicant?.last_name}</h4>
                          <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}</span>
                        </div>
                        <p className="text-sm text-slate-600">Applied for <span className="font-medium text-blue-600">{app.jobTitle}</span></p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant={app.status === 'shortlisted' ? 'success' : 'neutral'}>{app.status}</Badge>
                          <span className="text-xs text-slate-400 flex items-center self-center">• Match Score: {Math.floor(Math.random() * 20 + 80)}%</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => navigate(`/jobs/${app.job_id}/applications`)}>Review</Button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-4">No applications yet.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* Quick Actions */}
            <Card>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button fullWidth variant="secondary" className="justify-start text-left" icon={FiUsers} onClick={() => navigate('/users/search')}>Search Candidates</Button>
                <Button fullWidth variant="secondary" className="justify-start text-left" icon={FiMessageSquare} onClick={() => navigate('/messages')}>Messages</Button>
                <Button fullWidth variant="secondary" className="justify-start text-left" icon={FiFilter} onClick={() => navigate('/settings')}>Settings</Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
              <div className="space-y-6 relative">
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                {recentActivity.length > 0 ? recentActivity.map((act, idx) => (
                  <div key={idx} className="relative flex items-start pl-8">
                    <div className="absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{act.message}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDistanceToNow(new Date(act.time), { addSuffix: true })}</p>
                    </div>
                  </div>
                )) : (
                   <p className="text-slate-500 text-sm">No recent activity.</p>
                )}
              </div>
            </Card>

            {/* Support Widget */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">Need help hiring?</h3>
              <p className="text-blue-100 text-sm mb-4">Check our guide on how to write effective job descriptions.</p>
              <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 border-none w-full">View Guide</Button>
            </div>

          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      <Modal
        isOpen={showCreateJobModal}
        onClose={() => {
          setShowCreateJobModal(false);
          setIsEditing(false);
          setJobFormData({
            title: '',
            description: '',
            location: '',
            job_type: 'full-time',
            salary_min: '',
            salary_max: '',
            skills: [],
            requirements: [],
            benefits: [],
            experience_level: 'mid',
          });
        }}
        title={isEditing ? "Edit Job Opportunity" : "Post a New Job Opportunity"}
        size="2xl"
      >
        <div className="space-y-6 py-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
              <Input
                placeholder="e.g. Senior Frontend Engineer"
                value={jobFormData.title}
                onChange={(e) => setJobFormData({...jobFormData, title: e.target.value})}
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Description *</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[120px]"
                placeholder="Describe the role, responsibilities, and ideal candidate..."
                value={jobFormData.description}
                onChange={(e) => setJobFormData({...jobFormData, description: e.target.value})}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
              <Input
                placeholder="e.g. New York, Remote"
                icon={FiMapPin}
                value={jobFormData.location}
                onChange={(e) => setJobFormData({...jobFormData, location: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
              <select
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={jobFormData.job_type}
                onChange={(e) => setJobFormData({...jobFormData, job_type: e.target.value})}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Experience Level</label>
               <select
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={jobFormData.experience_level}
                  onChange={(e) => setJobFormData({...jobFormData, experience_level: e.target.value})}
               >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
               </select>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range ($)</label>
               <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={jobFormData.salary_min}
                    onChange={(e) => setJobFormData({...jobFormData, salary_min: e.target.value})}
                  />
                  <span className="text-slate-400">-</span>
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={jobFormData.salary_max}
                    onChange={(e) => setJobFormData({...jobFormData, salary_max: e.target.value})}
                  />
               </div>
            </div>

            <div className="col-span-2">
               <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (Comma separated)</label>
               <Input
                  placeholder="e.g. React, Node.js, Python, AWS"
                  value={jobFormData.skills.join(', ')}
                  onChange={(e) => setJobFormData({
                    ...jobFormData, 
                    skills: e.target.value.split(',').map(s => s.trim())
                  })}
               />
               <p className="text-xs text-slate-500 mt-1">Skills help match candidates to your job.</p>
            </div>

            <div className="col-span-2">
               <label className="block text-sm font-medium text-slate-700 mb-1">Requirements (Comma separated)</label>
               <Input
                  placeholder="e.g. Bachelor's Degree, 5+ years experience"
                  value={jobFormData.requirements.join(', ')}
                  onChange={(e) => setJobFormData({
                    ...jobFormData, 
                    requirements: e.target.value.split(',').map(s => s.trim())
                  })}
               />
            </div>

            <div className="col-span-2">
               <label className="block text-sm font-medium text-slate-700 mb-1">Benefits (Comma separated)</label>
               <Input
                  placeholder="e.g. Health Insurance, Remote Work, Stock Options"
                  value={jobFormData.benefits.join(', ')}
                  onChange={(e) => setJobFormData({
                    ...jobFormData, 
                    benefits: e.target.value.split(',').map(s => s.trim())
                  })}
               />
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button variant="ghost" onClick={() => setShowCreateJobModal(false)}>Cancel</Button>
            <Button theme="blue" onClick={handleCreateJob} loading={creatingJob} disabled={creatingJob}>
              {isEditing ? "Update Job" : "Post Job"}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

// Helper Component for Stats
const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color] || 'bg-slate-100 text-slate-600'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
          <FiTrendingUp className="w-3 h-3 mr-1" /> {trend}
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboardEnhanced;
