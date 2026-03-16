import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFeed } from '../../context/FeedContext';
import { jobService, postService } from '../../services/api';
import { getDashboardFeed } from '../../services/feedService';
import { TOAST_MESSAGES } from '../../utils/toastMessages';
import { Button, Card, Badge, ProgressBar, Input } from '../ui';
import FeedCard from '../common/FeedCard';
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
  FiCheck,
  FiVideo,
  FiCalendar,
  FiEdit2
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
  const { getFeed, setFeed, removePost, upsertPost } = useFeed();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  
  // ATS Score State
  const [atsScore, setAtsScore] = useState(null);
  const [loadingAtsScore, setLoadingAtsScore] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeInputRef = React.useRef(null);
  
  // Mock Data
  const [profileStrength, setProfileStrength] = useState(85);
  const [interviewSchedule, setInterviewSchedule] = useState([
    { id: 1, company: 'Innovate Tech', role: 'Frontend Dev', date: 'Tomorrow, 10:00 AM', type: 'Video' }
  ]);

  const resolveImageUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      return `${base}${url}`;
    }
    return url;
  };

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
        getDashboardFeed({ limit: 10, include_demo: true }).catch(() => getFeed('all'))
      ]);

      setRecommendedJobs(jobsData);
      setApplications(appsData);
      setSavedJobs(savedData);
      const normalizedPosts = Array.isArray(postsData) ? postsData : [];
      setFeedPosts(normalizedPosts);
      setFeed('all', normalizedPosts);
      
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
      setFeedPosts(prev => {
        const next = [newPost, ...prev];
        setFeed('all', next);
        return next;
      });
      toast.success(TOAST_MESSAGES.POST_CREATED);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ATS Score & Resume Action Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 shadow-lg text-white mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="text-blue-200 w-5 h-5" />
                <h2 className="text-lg font-bold text-white">ATS Friendly Score</h2>
              </div>
              <span className={`font-bold text-2xl ${
                (atsScore?.score || 0) >= 80 ? 'text-green-300' : 
                (atsScore?.score || 0) >= 60 ? 'text-yellow-300' : 'text-red-300'
              }`}>
                {loadingAtsScore ? '...' : atsScore ? `${atsScore.score}%` : '0%'}
              </span>
            </div>
            {loadingAtsScore ? (
               <div className="h-3 w-full bg-blue-500/30 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-full bg-blue-900/30 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    (atsScore?.score || 0) >= 80 ? 'bg-green-400' : 
                    (atsScore?.score || 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${atsScore?.score || 0}%` }}
                ></div>
              </div>
            )}
            <p className="text-sm text-blue-100 mt-2">
              {atsScore ? (
                atsScore.score >= 80 ? 'Great job! Your resume is ATS optimized.' : 
                'Upload an improved resume based on the blueprint to boost your score.'
              ) : 'Upload your resume to see your ATS score.'}
            </p>
          </div>
          <div className="flex gap-3">
             <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
                disabled={uploadingResume}
              />
            <Button variant="white" icon={uploadingResume ? FiRefreshCw : FiUpload} onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}>
              {uploadingResume ? 'Uploading...' : atsScore ? 'Update Resume' : 'Upload Resume'}
            </Button>
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50" onClick={() => navigate('/profile/edit')}>
              Update Profile
            </Button>
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          
          {/* LEFT COLUMN - Profile & Quick Actions (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Profile Summary */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-3">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.first_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <FiUser className="text-gray-500 w-8 h-8" />
                  )}
                </div>
                <h3 className="font-bold text-gray-900">{user.first_name} {user.last_name}</h3>
                <p className="text-sm text-gray-500 mb-3">{user.headline || 'Job Seeker'}</p>
                <div className="space-y-2">
                  <div className="text-center">
                    <span className="block font-bold text-gray-900">{user.projects?.length || 0}</span>
                    <span className="text-xs text-gray-500">Projects</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-gray-900">{user.skills?.length || 0}</span>
                    <span className="text-xs text-gray-500">Skills</span>
                  </div>
                </div>
                <Button fullWidth variant="outline" size="sm" onClick={() => navigate('/profile')} className="mt-3">
                  View Full Profile
                </Button>
              </div>
            </Card>
            </motion.div>

            {/* Connections Count */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="text-center">
n                <h3 className="font-bold text-gray-900">Connections</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">342</p>
                <p className="text-sm text-gray-500">Expand your network</p>
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('/network')}>
                  Find Connections
                </Button>
              </div>
            </Card>
            </motion.div>

            {/* Premium Offer */}
            <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="text-center">
                <div className="text-2xl mb-2">⭐</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Try Premium Free</h3>
                <p className="text-xs text-gray-600 mb-3">Get priority job applications and career insights</p>
                <Button size="sm" className="bg-amber-600 text-white w-full">Start Free Trial</Button>
              </div>
            </Card>
            </motion.div>

            {/* Saved Jobs */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiBookmark className="text-blue-500" /> Saved Jobs
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
                      <p className="text-xs text-black truncate">{job.company}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" fullWidth className="text-blue-600">View All Saved</Button>
              </div>
            </Card>
            </motion.div>

            {/* Upcoming Interviews */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Interviews</h3>
              <div className="space-y-3">
                {interviewSchedule.map((interview) => (
                  <div key={interview.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="font-bold text-gray-900 text-sm">{interview.company}</p>
                    <p className="text-xs text-gray-600 mb-2">{interview.role}</p>
                    <div className="flex justify-between text-xs text-blue-700 font-medium">
                      <span>{interview.date}</span>
                      <span>{interview.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            </motion.div>
          </div>

          {/* MIDDLE COLUMN - Feed & Content Creation (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Start a Post - LinkedIn Style */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.first_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <FiUser className="text-gray-500" />
                  )}
                </div>
                <button 
                  onClick={() => {}}
                  className="flex-1 text-left text-gray-500 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition-colors"
                >
                  Start a post
                </button>
              </div>
              <div className="flex items-center justify-around px-3 pb-3 border-t border-gray-100">
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors">
                  <FiUpload className="w-5 h-5" />
                  <span className="text-sm">Photo</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors">
                  <FiVideo className="w-5 h-5" />
                  <span className="text-sm">Video</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors">
                  <FiCalendar className="w-5 h-5" />
                  <span className="text-sm">Event</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors">
                  <FiEdit2 className="w-5 h-5" />
                  <span className="text-sm">Write article</span>
                </button>
              </div>
            </Card>
            </motion.div>

            {/* Job Search Bar */}
            <motion.div variants={itemVariants}>
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
                <Button fullWidth theme="blue" onClick={handleSearch}>Search</Button>
              </div>
            </Card>
            </motion.div>

            {/* Job Recommendations */}
            <motion.div variants={itemVariants}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Recommended for You</h3>
                <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
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
                      <button className="text-gray-400 hover:text-blue-500"><FiBookmark /></button>
                      <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(job.created_at || Date.now()))}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            </motion.div>

            {/* Community Feed */}
            <motion.div variants={itemVariants}>
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-bold text-gray-900">Professional Network</h3>
                <AnimatePresence mode="popLayout">
                  {feedPosts && feedPosts.length > 0 ? (
                    feedPosts.map((post) => (
                      <FeedCard
                        key={post.id || post._id}
                        post={post}
                        currentUserId={user?._id || user?.id}
                        onPostUpdate={(postUpdate) => {
                          if (typeof postUpdate === 'string') {
                            removePost(postUpdate);
                            setFeedPosts((prev) => prev.filter((p) => (p.id || p._id) !== postUpdate));
                            toast.success('Post deleted');
                            return;
                          }

                          if (postUpdate?.id || postUpdate?._id) {
                            upsertPost('all', postUpdate);
                            setFeedPosts((prev) => prev.map((p) =>
                              String(p.id || p._id) === String(postUpdate.id || postUpdate._id)
                                ? { ...p, ...postUpdate }
                                : p
                            ));
                          }
                        }}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <FiFileText className="text-gray-400 w-8 h-8" />
                      </div>
                      <p className="text-gray-600 mb-2">No posts yet</p>
                      <p className="text-sm text-gray-500">Be the first to share your ideas with the network!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN - News & Opportunities (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Today's News & Views */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Today's news and views</h3>
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">Job Market Trends for 2024</h4>
                  <p className="text-xs text-gray-500 mt-1">Forbes • 1h ago</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">Remote Work Salary Guide</h4>
                  <p className="text-xs text-gray-500 mt-1">Remote.co • 3h ago</p>
                </div>
                <div className="pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">AI Skills in High Demand</h4>
                  <p className="text-xs text-gray-500 mt-1">Tech News • 5h ago</p>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Dream Job Advertisement */}
            <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">Your dream job is closer than you think</h3>
                <p className="text-xs text-gray-600 mb-4">Top companies are looking for talent like you</p>
                <Button size="sm" className="bg-blue-600 text-white w-full">See jobs</Button>
              </div>
            </Card>
            </motion.div>

            {/* Application Status */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Application Status</h3>
              <div className="space-y-4">
                {applications.length > 0 ? applications.map((app) => (
                  <div key={app.id} className="border-l-4 border-blue-500 pl-3 py-2">
                    <p className="text-xs text-gray-600 mb-1">{app.job?.title || 'Job Application'}</p>
                    <p className="font-semibold text-sm text-black mb-2">{app.job?.company_name || 'Company'}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {app.status}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No active applications.</p>
                )}
              </div>
              <Button variant="ghost" fullWidth className="mt-2 text-sm text-gray-600">View All Applications</Button>
            </Card>
            </motion.div>

            {/* Upcoming Interviews */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Interviews</h3>
              <div className="space-y-3">
                {interviewSchedule.map((interview) => (
                  <div key={interview.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="font-bold text-gray-900 text-sm">{interview.company}</p>
                    <p className="text-xs text-gray-600 mb-2">{interview.role}</p>
                    <div className="flex justify-between text-xs text-blue-700 font-medium">
                      <span>{interview.date}</span>
                      <span>{interview.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default JobSeekerDashboardEnhanced;
