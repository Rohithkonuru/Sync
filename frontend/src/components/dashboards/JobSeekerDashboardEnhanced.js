import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService, postService } from '../../services/api';
import { Button, Card, Badge, ProgressBar, Input } from '../ui';
import { 
  FiBriefcase, 
  FiSearch, 
  FiMapPin, 
  FiBookmark, 
  FiFileText, 
  FiTrendingUp, 
  FiBell,
  FiUser,
  FiRefreshCw,
  FiUpload,
  FiCheck
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import PostComposer from '../PostComposer';

/**
 * Job Seeker Dashboard
 * Focused on: Job Applications, Career Growth, Resume Management
 */
const JobSeekerDashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  
  // Mock Data
  const [profileStrength, setProfileStrength] = useState(85);
  const [interviewSchedule, setInterviewSchedule] = useState([
    { id: 1, company: 'Innovate Tech', role: 'Frontend Dev', date: 'Tomorrow, 10:00 AM', type: 'Video' }
  ]);

  useEffect(() => {
    loadData();
    loadAtsScore();
  }, []);

  const loadAtsScore = async () => {
    try {
      setLoadingAtsScore(true);
      const scoreData = await jobService.getAtsScore();
      setAtsScore(scoreData);
    } catch (error) {
      console.error('Error loading ATS score:', error);
      // Don't show toast error on initial load to avoid noise if no resume exists
    } finally {
      setLoadingAtsScore(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    try {
      setUploadingResume(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await jobService.uploadResume(formData);
      
      toast.success('Resume uploaded successfully!');
      
      // Update ATS score immediately from response if available, or fetch it
      if (response.ats_score) {
        setAtsScore(response.ats_score);
      } else {
        await loadAtsScore();
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume. Please try again.');
    } finally {
      setUploadingResume(false);
      // Reset input
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [jobsData, appsData, savedData, postsData] = await Promise.all([
        jobService.getJobs({ limit: 5 }).catch(() => []),
        jobService.getApplications({ limit: 5 }).catch(() => []),
        jobService.getSavedJobs?.().catch(() => []) || [], // Safe call if method exists
        postService.getPosts({ limit: 10, include_demo: true }).catch(() => [])
      ]);

      setRecommendedJobs(jobsData);
      setApplications(appsData);
      setSavedJobs(savedData);
      setFeedPosts(postsData);
      
    } catch (error) {
      console.error('Error loading job seeker dashboard:', error);
      if (error.response?.status === 503) {
        toast.error('Service Unavailable: Database not connected');
      }
    } finally {
      setLoading(false);
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

  const handleSearch = () => {
    navigate(`/jobs?search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Strength & Resume Action Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Profile Strength</h2>
              <span className="text-orange-600 font-bold">{profileStrength}%</span>
            </div>
            <ProgressBar value={profileStrength} color="orange" showLabel={false} className="h-3" />
            <p className="text-sm text-gray-500 mt-2">Add 2 more projects to reach All-Star status.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={FiFileText} onClick={() => navigate('/profile')}>
              Manage Resume
            </Button>
            <Button variant="primary" theme="orange" onClick={() => navigate('/profile/edit')}>
              Update Skills
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN - Job Search & Filters (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Quick Search */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Find Jobs</h3>
              <div className="space-y-3">
                <Input 
                  placeholder="Job title, keywords..." 
                  icon={FiSearch} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Input 
                  placeholder="Location" 
                  icon={FiMapPin} 
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
                <Button fullWidth theme="orange" onClick={handleSearch}>Search</Button>
              </div>
            </Card>

            {/* Saved Jobs */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiBookmark className="text-orange-500" /> Saved Jobs
                </h3>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {savedJobs.length}
                </span>
              </div>
              <div className="space-y-3">
                {savedJobs.slice(0, 3).map((job, idx) => (
                  <div key={idx} className="flex gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center shrink-0">
                      <FiBriefcase className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{job.title}</p>
                      <p className="text-xs text-gray-500 truncate">{job.company}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" fullWidth className="text-orange-600">View All Saved</Button>
              </div>
            </Card>

            {/* Upcoming Interviews */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Interviews</h3>
              <div className="space-y-3">
                {interviewSchedule.map((interview) => (
                  <div key={interview.id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <p className="font-bold text-gray-900 text-sm">{interview.company}</p>
                    <p className="text-xs text-gray-600 mb-2">{interview.role}</p>
                    <div className="flex justify-between text-xs text-orange-700 font-medium">
                      <span>{interview.date}</span>
                      <span>{interview.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* MIDDLE COLUMN - Feed & Recommendations (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Create Post */}
            <PostComposer onSubmit={handleCreatePost} placeholder="Share an update or ask for referrals..." />

            {/* Job Recommendations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Recommended for You</h3>
                <Button variant="ghost" size="sm" className="text-orange-600">View All</Button>
              </div>
              
              {recommendedJobs.slice(0, 3).map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <img src={`https://ui-avatars.com/api/?name=${job.company_name}&background=random`} alt="" className="rounded-lg" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{job.title}</h4>
                      <p className="text-sm text-gray-600">{job.company_name} • {job.location || 'Remote'}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">{job.type || 'Full-time'}</Badge>
                        <Badge variant="secondary" className="bg-green-50 text-green-700">High Match</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button className="text-gray-400 hover:text-orange-500"><FiBookmark /></button>
                      <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(job.created_at || Date.now()))}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Community Feed */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-gray-900">Professional Network</h3>
              <AnimatePresence>
                {feedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={post.user_picture || `https://ui-avatars.com/api/?name=${post.user_name}&background=random`} 
                          alt={post.user_name} 
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{post.user_name}</h4>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(post.created_at || Date.now()), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>
                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {post.images.map((img, i) => (
                            <img key={i} src={img} alt="Post" className="rounded-lg w-full h-48 object-cover" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm text-gray-500">
                        <button className="hover:text-orange-600">Like ({post.likes?.length || 0})</button>
                        <button className="hover:text-orange-600">Comment</button>
                        <button className="hover:text-orange-600">Share</button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN - Application Status (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Application Status</h3>
              <div className="space-y-4">
                {applications.length > 0 ? applications.map((app) => (
                  <div key={app.id} className="border-l-2 border-gray-200 pl-3 py-1">
                    <p className="font-medium text-sm text-gray-900">{app.job_title}</p>
                    <p className="text-xs text-gray-500">{app.company_name}</p>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {app.status}
                      </span>
                      <span className="text-[10px] text-gray-400">2d ago</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No active applications.</p>
                )}
              </div>
              <Button variant="ghost" fullWidth className="mt-2 text-sm text-gray-600">View All Applications</Button>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FiBell className="text-orange-500" />
                <h3 className="font-bold text-gray-900">Notifications</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm p-2 bg-gray-50 rounded">
                  <p className="text-gray-900"><strong>Google</strong> viewed your application.</p>
                  <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                </div>
                <div className="text-sm p-2 bg-gray-50 rounded">
                  <p className="text-gray-900">New job alert: <strong>Senior React Dev</strong></p>
                  <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboardEnhanced;
