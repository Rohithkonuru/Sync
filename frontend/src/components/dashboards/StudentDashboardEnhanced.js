import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService, postService } from '../../services/api';
import { Button, Card, Badge, ProgressBar } from '../ui';
import FeedCard from '../FeedCard';
import { 
  FiBriefcase, 
  FiBookOpen, 
  FiAward, 
  FiFileText, 
  FiEdit2, 
  FiPlus, 
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiRefreshCw,
  FiUpload,
  FiTrendingUp,
  FiCheck,
  FiZap,
  FiVideo,
  FiCalendar,
  FiBookmark,
  FiUser
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import PostComposer from '../PostComposer';
import ProfileCard from '../ProfileCard';

/**
 * Student Dashboard
 * Focused on: Learning, Career Preparation, Internships
 */
const StudentDashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State - moved to top for ESLint recognition
  const [loading, setLoading] = useState(true);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  
  // ATS Score State
  const [atsScore, setAtsScore] = useState(null);
  const [loadingAtsScore, setLoadingAtsScore] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postMode, setPostMode] = useState('text');
  const resumeInputRef = React.useRef(null);
  const postComposerRef = React.useRef(null);

  const resolveImageUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      return `${base}${url}`;
    }
    return url;
  };
  
  // Handlers - moved for ESLint recognition
  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    setUploadingResume(true);
    try {
      // Mock ATS score calculation
      setTimeout(() => {
        const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
        setAtsScore({
          score: mockScore,
          verified: true,
          last_updated: new Date().toISOString()
        });
        setLoadingAtsScore(false);
        setUploadingResume(false);
        toast.success('Resume analyzed successfully!');
      }, 2000);
    } catch (error) {
      console.error('Resume upload error:', error);
      toast.error('Failed to analyze resume');
      setUploadingResume(false);
    }
  };

  const scrollToPostComposer = () => {
    postComposerRef.current?.scrollIntoView({ behavior: 'smooth' });
    setPostMode('text');
    setShowCreatePostModal(true);
  };

  const handleLike = async (postId) => {
    try {
      // Optimistic update - immediately update UI
      setFeedPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const isLiked = post.likes?.includes(user?.id);
          const newLikes = isLiked 
            ? (post.likes || []).filter(id => id !== user?.id)
            : [...(post.likes || []), user?.id];
          return { ...post, likes: newLikes };
        }
        return post;
      }));

      // Here you would make an API call
      // await postService.likePost(postId);
      
      toast.success('Post liked!');
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to like post');
      // Revert optimistic update on error
      setFeedPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const isLiked = post.likes?.includes(user?.id);
          const newLikes = isLiked 
            ? (post.likes || []).filter(id => id !== user?.id)
            : [...(post.likes || []), user?.id];
          return { ...post, likes: newLikes };
        }
        return post;
      }));
    }
  };

  const handleComment = (postId) => {
    // Navigate to post detail page for commenting
    navigate(`/posts/${postId}`);
  };

  const handleShare = async (postId) => {
    try {
      const postUrl = `${window.location.origin}/posts/${postId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          url: postUrl
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success('Post link copied to clipboard!');
      }
      
      // Update share count optimistically
      setFeedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, shares: (post.shares || 0) + 1 }
          : post
      ));
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share post');
    }
  };
  const [education, setEducation] = useState([
    {
      school: 'University of Technology',
      degree: 'Bachelor of Science in Computer Science',
      year: '2022 - 2026',
      gpa: '3.8/4.0'
    }
  ]);
  
  const [learningResources, setLearningResources] = useState([
    { id: 1, title: 'Data Structures & Algorithms', provider: 'Internal', progress: 65 },
    { id: 2, title: 'React.js Fundamentals', provider: 'Internal', progress: 30 },
    { id: 3, title: 'Interview Preparation Guide', provider: 'Internal', progress: 0 },
  ]);

  const [skills, setSkills] = useState(['JavaScript', 'Python', 'React', 'HTML/CSS']);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const [certifications, setCertifications] = useState([
    { id: 1, name: 'AWS Cloud Practitioner', date: '2023', issuer: 'Amazon' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Parallel data fetching
      const [internshipData, applicationData, postsData] = await Promise.all([
        jobService.getJobs({ job_type: 'internship', limit: 5 }).catch(() => []),
        jobService.getApplications({ limit: 5 }).catch(() => []),
        postService.getPosts({ limit: 10, include_demo: true }).catch(() => [])
      ]);

      setInternships(internshipData);
      setApplications(applicationData);
      
      // Add demo images to some posts for better UX
      const postsWithImages = postsData.map((post, index) => {
        if (index % 3 === 0 && !post.images) { // Add images to every 3rd post
          return {
            ...post,
            images: [
              'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop'
            ]
          };
        }
        return post;
      });
      
      setFeedPosts(postsWithImages);
      
    } catch (error) {
      console.error('Error loading student dashboard:', error);
      if (error.response?.status === 503) {
        toast.error('Service Unavailable: Database not connected');
      } else {
        toast.error('Failed to load some dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
      toast.success('Skill added');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'shortlisted': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'accepted': return 'text-green-700 bg-green-100';
      default: return 'text-blue-600 bg-blue-50';
    }
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
        
        {/* ATS Score & Resume Launchpad */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Student Career Launchpad</h2>
              </div>
              
              {loadingAtsScore ? (
                <div className="w-full max-w-md h-2 bg-blue-500/30 rounded-full animate-pulse my-4"></div>
              ) : atsScore ? (
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-blue-100">Resume Strength:</span>
                    <span className={`font-bold text-xl ${
                      (atsScore.score || 0) >= 80 ? 'text-green-300' : 
                      (atsScore.score || 0) >= 60 ? 'text-yellow-300' : 'text-red-300'
                    }`}>
                      {atsScore.score || 0}%
                    </span>
                    {atsScore.verified && (
                      <div className="flex items-center gap-1 text-xs text-green-300 border border-green-300/30 px-2 py-0.5 rounded-full">
                        <FiCheck className="w-3 h-3" /> Verified
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            (atsScore.score || 0) >= 80 ? 'bg-green-400' : 
                            (atsScore.score || 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} 
                          style={{ width: `${atsScore.score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-blue-100 mb-4">Upload your resume to unlock your ATS score and exclusive internship opportunities.</p>
              )}
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
              <Button 
                variant="white" 
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
                className="flex items-center gap-2"
              >
                {uploadingResume ? (
                  <>
                    <FiRefreshCw className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload /> {atsScore ? 'Update Resume' : 'Upload Resume'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                onClick={() => navigate('/profile')}
              >
                Complete Profile
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          
          {/* LEFT COLUMN - Profile & Quick Actions (3 cols on desktop, full on mobile/tablet) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Profile Card */}
            <motion.div variants={itemVariants}>
              <ProfileCard />
            </motion.div>
            
            {/* Connections Count */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="text-center">
                <h3 className="font-bold text-gray-900">Connections</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">247</p>
                <p className="text-sm text-gray-500">Grow your network</p>
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('/connections')}>Find Connections</Button>
              </div>
            </Card>
            </motion.div>

            {/* Premium Offer */}
            <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="text-center">
                <div className="text-2xl mb-2">⭐</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Try Premium Free</h3>
                <p className="text-xs text-gray-600 mb-3">Get access to exclusive internships and career coaching</p>
                <Button size="sm" className="bg-amber-600 text-white w-full" onClick={() => toast.success('Premium trial started!')}>Start Free Trial</Button>
              </div>
            </Card>
            </motion.div>

            {/* Saved Items */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiBookmark className="text-blue-500 flex-shrink-0" /> Saved Items
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-700 hover:bg-gray-50 p-2 rounded cursor-pointer">
                  <p className="font-medium">React Development Guide</p>
                  <p className="text-xs text-gray-500">Saved 2 days ago</p>
                </div>
                <div className="text-sm text-gray-700 hover:bg-gray-50 p-2 rounded cursor-pointer">
                  <p className="font-medium">Interview Tips 2024</p>
                  <p className="text-xs text-gray-500">Saved 1 week ago</p>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 w-full" onClick={() => navigate('/saved')}>View All Saved</Button>
              </div>
            </Card>
            </motion.div>

            {/* Skills */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiAward className="text-purple-500 flex-shrink-0" /> Skills
                </h3>
                <button 
                  onClick={() => navigate('/profile/edit')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Edit
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {(user?.skills && user.skills.length > 0) ? (
                  user.skills.map((skill, idx) => {
                     const skillName = typeof skill === 'string' ? skill : skill.name;
                     return (
                      <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700">
                        {skillName}
                      </Badge>
                     );
                  })
                ) : (
                  skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700">
                      {skill}
                      {isEditingSkills && (
                        <button onClick={() => handleRemoveSkill(skill)} className="ml-1 text-gray-400 hover:text-red-500">
                          ×
                        </button>
                      )}
                    </Badge>
                  ))
                )}
              </div>
            </Card>
            </motion.div>

            {/* Certifications Upload */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiAward className="text-yellow-500 flex-shrink-0" /> Certifications
                </h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm" onClick={scrollToPostComposer}>
                  <FiPlus />
                </button>
              </div>
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="bg-white p-1.5 rounded shadow-sm flex-shrink-0">
                      <FiAward className="text-yellow-600 w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{cert.name}</p>
                      <p className="text-xs text-gray-500 truncate">{cert.issuer} • {cert.date}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" fullWidth className="text-gray-500 text-xs border-dashed border">
                  + Upload Certificate
                </Button>
              </div>
            </Card>
            </motion.div>

          </div>

          {/* MIDDLE COLUMN - Feed & Content Creation (6 cols on desktop, full on mobile/tablet) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Start a Post - LinkedIn Style */}
            <motion.div variants={itemVariants} ref={postComposerRef}>
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
                  onClick={() => setShowCreatePostModal(true)}
                  className="flex-1 text-left text-gray-500 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition-colors"
                >
                  Start a post
                </button>
              </div>
              <div className="flex items-center justify-around px-3 pb-3 border-t border-gray-100">
                <button 
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors" 
                  onClick={() => { setPostMode('text'); setShowCreatePostModal(true); }}
                >
                  <FiUpload className="w-5 h-5" />
                  <span className="text-sm">Photo</span>
                </button>
                <button 
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors" 
                  onClick={() => { setPostMode('video'); setShowCreatePostModal(true); }}
                >
                  <FiVideo className="w-5 h-5" />
                  <span className="text-sm">Video</span>
                </button>
                <button 
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors" 
                  onClick={() => { setPostMode('event'); setShowCreatePostModal(true); }}
                >
                  <FiCalendar className="w-5 h-5" />
                  <span className="text-sm">Event</span>
                </button>
                <button 
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors" 
                  onClick={() => { setPostMode('article'); setShowCreatePostModal(true); }}
                >
                  <FiEdit2 className="w-5 h-5" />
                  <span className="text-sm">Write article</span>
                </button>
              </div>
            </Card>
            </motion.div>

            {/* Learning Resources */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Learning Progress</h3>
                <a href="#" className="text-sm text-blue-600 hover:underline">View Library</a>
              </div>
              <div className="space-y-4">
                {learningResources.map((res) => (
                  <div key={res.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{res.title}</span>
                      <span className="text-gray-500">{res.progress}%</span>
                    </div>
                    <ProgressBar value={res.progress} color="blue" showLabel={false} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
            </motion.div>

            {/* Feed */}
            <motion.div variants={itemVariants}>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Student Community</h3>
                <AnimatePresence mode="popLayout">
                  {feedPosts && feedPosts.length > 0 ? (
                    feedPosts.map((post) => (
                      <FeedCard
                        key={post.id || post._id}
                        post={post}
                        currentUserId={user._id}
                        onPostUpdate={(postId) => {
                          setFeedPosts(prev => prev.filter(p => (p.id || p._id) !== postId));
                          toast.success('Post deleted');
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
                      <p className="text-sm text-gray-500">Be the first to share your ideas with the community!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN - News & Opportunities (3 cols on desktop, full on mobile/tablet) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Today's News & Views */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Today's news and views</h3>
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">Tech Giants Announce AI Internships</h4>
                  <p className="text-xs text-gray-500 mt-1">Silicon Valley Times • 2h ago</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">Student Startup Wins $100K Funding</h4>
                  <p className="text-xs text-gray-500 mt-1">TechCrunch • 4h ago</p>
                </div>
                <div className="pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">Remote Work Trends for 2024</h4>
                  <p className="text-xs text-gray-500 mt-1">Business Insider • 6h ago</p>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Dream Job Advertisement */}
            <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="text-center">
                <div className="text-3xl mb-2">💼</div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">Your dream job is closer than you think</h3>
                <p className="text-xs text-gray-600 mb-4">Top companies are hiring students like you</p>
                <Button size="sm" className="bg-blue-600 text-white w-full" onClick={() => navigate('/jobs')}>See jobs</Button>
              </div>
            </Card>
            </motion.div>

            {/* Internship Opportunities */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Internships</h3>
                <a href="#" className="text-sm text-blue-600 hover:underline">View All</a>
              </div>
              <div className="space-y-4">
                {internships.length > 0 ? internships.map((job) => (
                  <div key={job.id} className="p-3 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <h4 className="font-semibold text-gray-900 text-sm">{job.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{job.company_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Internship</Badge>
                      <span className="text-[10px] text-gray-400">{job.location || 'Remote'}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No internships found.</p>
                )}
              </div>
            </Card>
            </motion.div>

            {/* Application Status */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">My Applications</h3>
              </div>
              <div className="space-y-3">
                {applications.length > 0 ? applications.map((app) => {
                  console.log('Application data:', app);
                  return (
                    <div key={app.id} className="flex items-start p-3 rounded hover:bg-gray-50 border border-gray-100">
                      <div className="w-full">
                        <p className="text-xs text-gray-600 truncate mb-1">{app.job?.title || 'Job Application'}</p>
                        <p className="text-sm font-semibold text-black mb-2 break-words">{app.job?.company_name || 'Company Name Not Available'}</p>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full inline-block ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-6">
                    <div className="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <FiFileText className="text-gray-400" />
                    </div>
                    <p className="text-sm text-black">No active applications</p>
                    <Button variant="text" size="sm" className="text-blue-600 mt-1" onClick={() => navigate('/jobs')}>Start Applying</Button>
                  </div>
                )}
              </div>
            </Card>
            </motion.div>

          </div>
        </motion.div>
      </div>

      {/* Post Creation Modal */}
      {showCreatePostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {postMode === 'article' ? 'Write Article' : postMode === 'event' ? 'Create Event' : postMode === 'video' ? 'Share Video' : 'Create Post'}
              </h3>
              <button 
                onClick={() => {
                  setShowCreatePostModal(false);
                  setPostMode('text');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <PostComposer 
                mode={postMode}
                onSubmit={async (postData) => {
                  try {
                    console.log('Creating post with data:', postData);
                    const newPost = await postService.createPost(postData);
                    console.log('Post created response:', newPost);
                    
                    // Ensure the post has all required fields for display
                    const processedPost = {
                      id: newPost.id || newPost._id || new Date().getTime().toString(),
                      user_id: newPost.user_id,
                      user_name: newPost.user_name || `${user.first_name} ${user.last_name}`,
                      user_picture: newPost.user_picture || user.profile_picture,
                      content: newPost.content,
                      images: newPost.images || [],
                      likes: newPost.likes || [],
                      comments: newPost.comments || [],
                      shares: newPost.shares || 0,
                      created_at: newPost.created_at || new Date().toISOString(),
                      updated_at: newPost.updated_at || new Date().toISOString()
                    };
                    
                    setFeedPosts(prev => [processedPost, ...prev]);
                    setShowCreatePostModal(false);
                    setPostMode('text');
                    toast.success('Post created successfully!');
                  } catch (error) {
                    console.error('Error creating post:', error);
                    console.error('Error details:', error.response?.data || error.message);
                    toast.error(error.response?.data?.detail || 'Failed to create post');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboardEnhanced;
