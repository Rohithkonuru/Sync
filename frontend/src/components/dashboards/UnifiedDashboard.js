import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService, userService, notificationService, postService } from '../../services/api';
import { Button, Card, Badge, Input, Modal, ProgressBar } from '../ui';
import { 
  FiBriefcase, FiUsers, FiTrendingUp, FiEye, FiSearch, FiFilter, FiUser, 
  FiMessageSquare, FiClock, FiPlus, FiX, FiMapPin, FiDollarSign, FiCalendar, 
  FiCheckCircle, FiMoreVertical, FiEdit2, FiTrash2, FiBookOpen, FiAward, FiUpload, FiRefreshCw, FiCheck, FiXCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import PostComposer from '../PostComposer';
import FeedCard from '../FeedCard';
import { useSocket } from '../../context/SocketContext';

/**
 * Unified Dashboard
 * Single dashboard component that adapts based on user role.
 * Merges Recruiter, Student, and Job Seeker functionalities.
 */
const UnifiedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // -- Common State --
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // -- Recruiter Specific State --
  const [jobs, setJobs] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [recruiterStats, setRecruiterStats] = useState({
    activeJobs: 0, totalApplicants: 0, shortlisted: 0, interviews: 0
  });

  // -- Student/Job Seeker Specific State --
  const [internships, setInternships] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [learningResources, setLearningResources] = useState([
    { id: 1, title: 'Data Structures & Algorithms', progress: 65 },
    { id: 2, title: 'React.js Fundamentals', progress: 30 },
  ]);
  const [atsScore, setAtsScore] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // -- Job Creation State (Recruiter Only) --
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobFormData, setJobFormData] = useState({
    title: '', description: '', location: '', job_type: 'full-time',
    salary_min: '', salary_max: '', skills: [], requirements: [], benefits: [], experience_level: 'mid',
  });

  // -- Tab State --
  const [activeTab, setActiveTab] = useState('overview');

  // -- Helpers --
  const isRecruiter = user?.user_type === 'recruiter';
  const isProfessional = user?.user_type === 'professional';
  const isStudent = user?.user_type === 'student' || user?.user_type === 'job_seeker';
  const { notifications, socket } = useSocket();

  // -- Tab Configuration --
  const getTabs = () => {
    if (isRecruiter) {
      return [
        { id: 'active_jobs', title: 'Active Jobs', value: recruiterStats.activeJobs, icon: FiBriefcase, color: 'blue', trend: '+2 this week' },
        { id: 'applicants', title: 'Total Applicants', value: recruiterStats.totalApplicants, icon: FiUsers, color: 'indigo', trend: '+12 this week' },
        { id: 'shortlisted', title: 'Shortlisted', value: recruiterStats.shortlisted, icon: FiCheckCircle, color: 'emerald', trend: '4 candidates' },
        { id: 'interviews', title: 'Interviews', value: recruiterStats.interviews, icon: FiCalendar, color: 'purple', trend: '2 scheduled' },
      ];
    } else if (isProfessional) {
       return [
        { id: 'profile_views', title: 'Profile Views', value: '1.2k', icon: FiEye, color: 'blue', trend: '+12%' },
        { id: 'impressions', title: 'Post Impressions', value: '3.8k', icon: FiTrendingUp, color: 'indigo', trend: '+24%' },
        { id: 'connections', title: 'Connections', value: '1,523', icon: FiUsers, color: 'emerald', trend: '+15' },
        { id: 'search_appearances', title: 'Search Appearances', value: '156', icon: FiSearch, color: 'purple', trend: '+5%' },
      ];
    } else {
      return [
        { id: 'applied', title: 'Jobs Applied', value: myApplications.length, icon: FiBriefcase, color: 'blue' },
        { id: 'interviews', title: 'Interviews', value: myApplications.filter(a => a.status === 'interview').length, icon: FiUsers, color: 'indigo' },
        { id: 'profile_views', title: 'Profile Views', value: 24, icon: FiEye, color: 'emerald' },
        { id: 'learning', title: 'Learning Hours', value: 12, icon: FiBookOpen, color: 'purple' },
      ];
    }
  };

  const tabs = getTabs();

  // -- Load Data --
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isRecruiter) {
        await loadRecruiterData();
      } else {
        await loadStudentData();
      }
      
      // Common Data
      const notifications = await notificationService.getNotifications({ limit: 5 }).catch(() => []);
      setRecentActivity(notifications.map(n => ({
        id: n.id, message: n.message, time: n.created_at
      })));

    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecruiterData = async () => {
    // 1. Fetch Jobs
    const jobsData = await jobService.getMyJobs().catch(() => []);
    setJobs(jobsData);

    // 2. Fetch Applications (for stats)
    let allApps = [];
    if (jobsData.length > 0) {
      const appsPromises = jobsData.map(job => 
        jobService.getJobApplications(job.id).catch(() => [])
      );
      const results = await Promise.all(appsPromises);
      allApps = results.flat().map(app => {
        const job = jobsData.find(j => j.id === app.job_id);
        return { ...app, jobTitle: job ? job.title : 'Unknown' };
      });
      setAllApplications(allApps);
    }

    // 3. Stats
    setRecruiterStats({
      activeJobs: jobsData.filter(j => j.status === 'active' || j.status === 'open').length,
      totalApplicants: allApps.length,
      shortlisted: allApps.filter(a => a.status === 'shortlisted').length,
      interviews: allApps.filter(a => a.status === 'interview').length,
    });
  };

  const loadStudentData = async () => {
    const [jobsData, appsData, postsData, suggestionsData] = await Promise.all([
      jobService.getJobs({ limit: 5 }).catch(() => []),
      jobService.getApplications({ limit: 5 }).catch(() => []),
      postService.getPosts({ limit: 10 }).catch(() => []),
      userService.getSuggestions().catch(() => [])
    ]);
    setInternships(jobsData); // Using internships state for general jobs preview
    setMyApplications(appsData);
    setFeedPosts(postsData);
    setSuggestions(suggestionsData || []);
    
    // Mock ATS Score check
    if (user.resume) {
        setAtsScore({ score: 75, verified: true });
    }
  };

  // -- Handlers --

  const handleCreateJob = async () => {
    // Validation
    const errors = [];
    if (!jobFormData.title) errors.push('Job Title');
    if (!jobFormData.description) errors.push('Description');
    if (!jobFormData.location) errors.push('Location');
    if (!jobFormData.job_type) errors.push('Job Type');
    if (!jobFormData.skills || jobFormData.skills.length === 0) errors.push('Required Skills');
    if (!jobFormData.experience_level) errors.push('Experience Level');
    
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
        required_skills: jobFormData.skills,
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
      resetJobForm();
      loadData();
    } catch (error) {
      console.error('Create job error:', error);
      const msg = error.response?.data?.detail || 'Failed to save job';
      toast.error(typeof msg === 'string' ? msg : 'Operation failed');
    } finally {
      setCreatingJob(false);
    }
  };

  const resetJobForm = () => {
    setJobFormData({
      title: '', description: '', location: '', job_type: 'full-time',
      salary_min: '', salary_max: '', skills: [], requirements: [], benefits: [], experience_level: 'mid',
    });
    setIsEditing(false);
    setCurrentJobId(null);
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
        loadData();
      } catch (error) {
        toast.error('Failed to delete job');
      }
    }
  };

  const handleCloseJob = async (jobId) => {
    if (window.confirm('Are you sure you want to close this job?')) {
      try {
        await jobService.updateJob(jobId, { status: 'closed' });
        toast.success('Job closed successfully');
        loadData();
      } catch (error) {
        console.error('Close job error:', error);
        toast.error('Failed to close job');
      }
    }
  };

  const handleCreatePost = async (postData) => {
      try {
        const newPost = await postService.createPost(postData);
        setFeedPosts(prev => [newPost, ...prev]);
        toast.success('Post created successfully!');
      } catch (error) {
        console.error('Error creating post:', error);
        throw error;
      }
  };

  const handleLikePost = async (postId) => {
    try {
      await postService.likePost(postId);
      // Optimistic update
      setFeedPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const isLiked = p.likes?.includes(user.id);
          const newLikes = isLiked 
            ? p.likes.filter(id => id !== user.id)
            : [...(p.likes || []), user.id];
          return { ...p, likes: newLikes };
        }
        return p;
      }));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleCommentPost = async (postId, content) => {
    try {
      const comment = await postService.commentPost(postId, content);
      setFeedPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments: [...(p.comments || []), comment] }
          : p
      ));
      return comment;
    } catch (error) {
      toast.error('Failed to add comment');
      throw error;
    }
  };

  const handleSharePost = async (postId) => {
    try {
      await postService.sharePost(postId);
      toast.success('Post shared!');
      setFeedPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, shares: (p.shares || 0) + 1 }
          : p
      ));
    } catch (error) {
      toast.error('Failed to share post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postService.deletePost(postId);
        setFeedPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post deleted successfully');
      } catch (error) {
        const msg = error?.response?.data?.detail || 'Failed to delete post';
        toast.error(typeof msg === 'string' ? msg : 'Failed to delete post');
      }
    }
  };

  const handleConnectSuggestion = async (userId) => {
    try {
      await userService.sendConnectionRequestNew(userId);
      toast.success('Connection request sent');
      setSuggestions(prev => prev.map(u => u.id === userId ? { ...u, requested: true } : u));
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  // -- Real-time application status updates for non-recruiters --
  useEffect(() => {
    if (!isRecruiter && socket) {
      const handler = async () => {
        try {
          const apps = await jobService.getApplications({ limit: 5 });
          setMyApplications(apps || []);
        } catch {}
      };
      socket.on('application_status_update', handler);
      return () => socket.off('application_status_update', handler);
    }
  }, [socket, isRecruiter]);

  useEffect(() => {
    if (!isRecruiter && notifications && notifications.length > 0) {
      // If a new status update notification arrives, refresh applications
      const hasStatusUpdate = notifications.some(n => n.type === 'application_status_update' && n.read === false);
      if (hasStatusUpdate) {
        jobService.getApplications({ limit: 5 }).then((apps) => setMyApplications(apps || [])).catch(() => {});
      }
    }
  }, [notifications, isRecruiter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Removed internal top bar to prevent duplicate header with global Navbar */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- Welcome Section --- */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Welcome back, {user?.first_name}</h2>
              <p className="text-slate-500 mt-1">
                {isRecruiter 
                    ? "Here's what's happening with your job postings today." 
                    : "Explore new opportunities and connect with your community."}
              </p>
            </div>
            {isRecruiter && (
              <Button theme="blue" size="sm" onClick={() => setShowCreateJobModal(true)}>
                Post New Job
              </Button>
            )}
          </div>
        </div>

        {/* --- Stats Grid (Role Based - Clickable Tabs) --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {tabs.map((tab) => (
              <div key={tab.id} onClick={() => setActiveTab(activeTab === tab.id ? 'overview' : tab.id)} className="cursor-pointer">
                 <StatsCard 
                    title={tab.title} 
                    value={tab.value} 
                    icon={tab.icon} 
                    color={tab.color} 
                    trend={tab.trend} 
                    isActive={activeTab === tab.id}
                 />
              </div>
            ))}
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/CENTER: Main Content (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* --- RECRUITER CONTENT --- */}
            {isRecruiter && (
                <>
                    {/* Active Jobs Tab (Default) */}
                    {(activeTab === 'overview' || activeTab === 'active_jobs') && (
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
                                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {jobs.slice(0, 5).map((job) => (
                                                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-slate-900">{job.title}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1"><FiMapPin className="w-3 h-3"/> {job.location}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={job.status === 'active' || job.status === 'open' ? 'success' : 'neutral'}>{job.status}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-700">{job.applicants?.length || 0}</span>
                                                            {(job.applicants?.length || 0) > 0 && (
                                                                <span className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/jobs/${job.id}/applications`)}>View</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => navigate(`/jobs/${job.id}/applications`)} className="text-blue-600 p-1 hover:bg-blue-50 rounded" title="View Applications"><FiUsers /></button>
                                                            <button onClick={() => handleEditJob(job)} className="text-slate-400 p-1 hover:bg-slate-100 rounded" title="Edit Job"><FiEdit2 /></button>
                                                            <button onClick={() => handleCloseJob(job.id)} className="text-orange-400 p-1 hover:bg-orange-50 rounded" title="Close Job"><FiXCircle /></button>
                                                            <button onClick={() => handleDeleteJob(job.id)} className="text-red-400 p-1 hover:bg-red-50 rounded" title="Delete Job"><FiTrash2 /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <p className="text-slate-500 mb-4">No active jobs found</p>
                                    <Button theme="blue" size="sm" onClick={() => setShowCreateJobModal(true)}>Create Job</Button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Applicants / Shortlisted / Interviews Tabs */}
                    {(activeTab === 'applicants' || activeTab === 'shortlisted' || activeTab === 'interviews') && (
                        <Card className="border-t-4 border-t-indigo-500">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FiUsers className="text-indigo-500" />
                                {activeTab === 'applicants' ? 'All Applicants' : 
                                 activeTab === 'shortlisted' ? 'Shortlisted Candidates' : 'Scheduled Interviews'}
                            </h3>
                            <div className="space-y-3">
                                {allApplications
                                    .filter(app => {
                                        if (activeTab === 'applicants') return true;
                                        if (activeTab === 'shortlisted') return app.status === 'shortlisted';
                                        if (activeTab === 'interviews') return app.status === 'interview';
                                        return true;
                                    })
                                    .length > 0 ? (
                                        allApplications
                                        .filter(app => {
                                            if (activeTab === 'applicants') return true;
                                            if (activeTab === 'shortlisted') return app.status === 'shortlisted';
                                            if (activeTab === 'interviews') return app.status === 'interview';
                                            return true;
                                        })
                                        .map(app => (
                                            <div key={app.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">{app.candidate_name || 'Candidate'}</h4>
                                                    <p className="text-sm text-slate-600">Applied for: <span className="font-medium text-blue-600">{app.jobTitle}</span></p>
                                                    <p className="text-xs text-slate-500 mt-1">Status: {app.status}</p>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => navigate(`/jobs/${app.job_id}/applications`)}>View Details</Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <p>No candidates found in this category.</p>
                                        </div>
                                    )
                                }
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* --- STUDENT / JOB SEEKER CONTENT --- */}
            {!isRecruiter && (
                <>
                    {/* Default Overview (Feed) */}
                    {activeTab === 'overview' && (
                        <>
                            <PostComposer onSubmit={handleCreatePost} placeholder="Share with your network..." />
                            
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800">Community Feed</h3>
                                {feedPosts.map((post) => (
                                    <FeedCard 
                                        key={post.id} 
                                        post={post}
                                        currentUserId={user?.id}
                                        onLike={handleLikePost}
                                        onComment={handleCommentPost}
                                        onShare={handleSharePost}
                                        onDelete={handleDeletePost}
                                        className="mb-4"
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Applications Tab */}
                    {(activeTab === 'applied' || activeTab === 'interviews') && (
                        <Card className="border-t-4 border-t-blue-500">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FiBriefcase className="text-blue-500" />
                                {activeTab === 'applied' ? 'My Applications' : 'Upcoming Interviews'}
                            </h3>
                            <div className="space-y-3">
                                {myApplications
                                    .filter(app => activeTab === 'interviews' ? app.status === 'interview' : true)
                                    .length > 0 ? (
                                    myApplications
                                        .filter(app => activeTab === 'interviews' ? app.status === 'interview' : true)
                                        .map((app) => (
                                        <div key={app.id} className="p-4 border border-slate-100 rounded-lg hover:border-blue-200 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{app.job?.title || 'Job Role'}</h4>
                                                    <p className="text-sm text-slate-600">{app.job?.company_name || 'Company Name'}</p>
                                                </div>
                                                <Badge variant={app.status === 'submitted' ? 'secondary' : app.status === 'shortlisted' ? 'success' : app.status === 'interview' ? 'success' : app.status === 'rejected' ? 'danger' : 'neutral'}>
                                                    {app.status}
                                                </Badge>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                                    <FiClock /> Applied {formatDistanceToNow(new Date(app.applied_at || Date.now()), { addSuffix: true })}
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => navigate(`/jobs/${app.job?.id}`)}>View Job</Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                                        <p>No applications found.</p>
                                        <Button size="sm" theme="blue" className="mt-2" onClick={() => navigate('/jobs')}>Find Jobs</Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Learning Tab */}
                    {activeTab === 'learning' && (
                        <Card className="border-t-4 border-t-purple-500">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FiBookOpen className="text-purple-500" /> Learning Progress
                            </h3>
                            <div className="space-y-6">
                                {learningResources.map((res) => (
                                    <div key={res.id} className="bg-slate-50 p-4 rounded-lg">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-bold text-slate-700">{res.title}</span>
                                            <span className="font-bold text-blue-600">{res.progress}%</span>
                                        </div>
                                        <ProgressBar value={res.progress} color="blue" showLabel={false} className="h-2" />
                                        <div className="mt-2 flex justify-end">
                                            <Button size="sm" variant="outline">Continue Learning</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Professional Analytics Tabs */}
                    {(activeTab === 'impressions' || activeTab === 'connections' || activeTab === 'search_appearances') && (
                         <Card className="border-t-4 border-t-indigo-500">
                             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                 <FiTrendingUp className="text-indigo-500" /> Analytics
                             </h3>
                             <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg">
                                 <FiTrendingUp className="w-12 h-12 mx-auto mb-3 text-indigo-200" />
                                 <h4 className="font-semibold text-slate-700">
                                    {activeTab === 'impressions' ? 'Post Impressions' : 
                                     activeTab === 'connections' ? 'Connections Growth' : 'Search Appearances'}
                                 </h4>
                                 <p className="text-sm mt-1">Detailed analytics and charts coming soon.</p>
                                 <Button size="sm" variant="outline" className="mt-4" onClick={() => setActiveTab('overview')}>Back to Feed</Button>
                             </div>
                         </Card>
                    )}

                    {/* Profile Views Tab */}
                    {activeTab === 'profile_views' && (
                        <Card className="border-t-4 border-t-emerald-500">
                             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FiEye className="text-emerald-500" /> Profile Analytics
                             </h3>
                             <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg">
                                 <FiTrendingUp className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
                                 <h4 className="font-semibold text-slate-700">Analytics Dashboard</h4>
                                 <p className="text-sm mt-1">Detailed profile insights and visitor stats coming soon.</p>
                             </div>
                        </Card>
                    )}
                </>
            )}
          </div>

          {/* RIGHT: Sidebar (1 col) */}
          <div className="space-y-8">
            
            {/* Recruiter: Recent Activity */}
            {isRecruiter && (
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
            )}

            {/* Student: Opportunities & Learning */}
            {!isRecruiter && (
                <>
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Recommended Jobs</h3>
                            <a href="#" className="text-sm text-blue-600 hover:underline" onClick={(e) => { e.preventDefault(); navigate('/jobs'); }}>View All</a>
                        </div>
                        <div className="space-y-3">
                            {internships.slice(0, 3).map((job) => (
                                <div key={job.id} className="p-3 border border-slate-100 rounded-lg hover:border-blue-200 cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                                    <h4 className="font-semibold text-slate-900 text-sm">{job.title}</h4>
                                    <p className="text-xs text-slate-600 mt-1">{job.company_name}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">{job.job_type}</Badge>
                                        <span className="text-[10px] text-slate-400">{job.location}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Recommended Friends</h3>
                        <a href="#" className="text-sm text-blue-600 hover:underline" onClick={(e) => { e.preventDefault(); navigate('/connections'); }}>View All</a>
                      </div>
                      <div className="space-y-3">
                        {(suggestions || []).slice(0, 5).map((u) => (
                          <div key={u.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                            <div className="flex items-center gap-3">
                              <img src={u.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent((u.first_name||'') + ' ' + (u.last_name||''))}&background=random`} alt="" className="w-10 h-10 rounded-full object-cover" />
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.user_name || 'User'}</div>
                                <div className="text-xs text-slate-500">{u.headline || 'Connect and grow your network'}</div>
                              </div>
                            </div>
                            <Button size="sm" theme="blue" disabled={u.requested} onClick={() => handleConnectSuggestion(u.id)}>
                              {u.requested ? 'Requested' : 'Connect'}
                            </Button>
                          </div>
                        ))}
                        {(!suggestions || suggestions.length === 0) && (
                          <p className="text-sm text-slate-500">No suggestions right now.</p>
                        )}
                      </div>
                    </Card>

                    {/* Submitted Applications with real-time status */}
                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">Submitted Applications</h3>
                        <button className="text-sm text-blue-600 hover:underline" onClick={() => navigate('/applications')}>View All</button>
                      </div>
                      <div className="space-y-3">
                        {myApplications.length > 0 ? myApplications.map((app) => (
                          <div key={app.id} className="p-3 border border-slate-100 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-slate-900 text-sm">{app.job?.title || 'Job'}</h4>
                                <p className="text-xs text-slate-600 mt-1">{app.job?.company_name || 'Company'}</p>
                              </div>
                              <Badge variant={app.status === 'submitted' ? 'secondary' : app.status === 'shortlisted' ? 'success' : app.status === 'interview' ? 'success' : app.status === 'rejected' ? 'danger' : 'neutral'}>
                                {app.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-slate-400">Applied {formatDistanceToNow(new Date(app.applied_at || Date.now()), { addSuffix: true })}</span>
                              <button className="text-[12px] text-blue-600 hover:underline" onClick={() => navigate(`/jobs/${app.job?.id}`)}>View Job</button>
                            </div>
                          </div>
                        )) : (
                          <p className="text-sm text-slate-500">No submitted applications.</p>
                        )}
                      </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-slate-900 mb-4">Learning Progress</h3>
                        <div className="space-y-4">
                            {learningResources.map((res) => (
                                <div key={res.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">{res.title}</span>
                                        <span className="text-slate-500">{res.progress}%</span>
                                    </div>
                                    <ProgressBar value={res.progress} color="blue" showLabel={false} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </>
            )}

          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      
      {/* Create Job Modal (Recruiter) */}
      {isRecruiter && (
          <Modal
            isOpen={showCreateJobModal}
            onClose={() => { setShowCreateJobModal(false); resetJobForm(); }}
            title={isEditing ? "Edit Job Opportunity" : "Post a New Job Opportunity"}
            size="2xl"
          >
            <div className="space-y-6 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                        <Input placeholder="e.g. Senior Frontend Developer" value={jobFormData.title} onChange={(e) => setJobFormData({...jobFormData, title: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                        <textarea className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500" rows={4} placeholder="Describe the role and responsibilities..." value={jobFormData.description} onChange={(e) => setJobFormData({...jobFormData, description: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                        <Input placeholder="e.g. Remote, New York, NY" value={jobFormData.location} onChange={(e) => setJobFormData({...jobFormData, location: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
                        <select className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500" value={jobFormData.job_type} onChange={(e) => setJobFormData({...jobFormData, job_type: e.target.value})}>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                            <option value="freelance">Freelance</option>
                        </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range ($)</label>
                       <div className="flex items-center gap-2">
                          <Input type="number" placeholder="Min" value={jobFormData.salary_min} onChange={(e) => setJobFormData({...jobFormData, salary_min: e.target.value})} />
                          <span className="text-slate-400">-</span>
                          <Input type="number" placeholder="Max" value={jobFormData.salary_max} onChange={(e) => setJobFormData({...jobFormData, salary_max: e.target.value})} />
                       </div>
                    </div>
                    <div className="col-span-2">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (Comma separated)</label>
                       <Input placeholder="e.g. React, Node.js, Python" value={jobFormData.skills.join(', ')} onChange={(e) => setJobFormData({...jobFormData, skills: e.target.value.split(',').map(s => s.trim())})} />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <Button variant="ghost" onClick={() => setShowCreateJobModal(false)}>Cancel</Button>
                    <Button theme="blue" onClick={handleCreateJob} loading={creatingJob} disabled={creatingJob}>{isEditing ? "Update Job" : "Post Job"}</Button>
                </div>
            </div>
          </Modal>
      )}

    </div>
  );
};

// Helper Component for Stats
const StatsCard = ({ title, value, icon: Icon, color, trend, isActive }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className={`bg-white p-6 rounded-xl border transition-all duration-200 ${
        isActive 
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20 bg-blue-50/50' 
          : 'border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium mb-1 ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>{title}</p>
          <h3 className={`text-2xl font-bold ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color] || 'bg-slate-100 text-slate-600'} ${isActive ? 'shadow-sm' : ''}`}>
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

export default UnifiedDashboard;
