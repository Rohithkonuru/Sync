import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { postService, userService, jobService } from '../../services/api';
import { Button, Card, Badge } from '../ui';
import ConnectButton from '../ConnectButton';
import { FiHeart, FiMessageCircle, FiShare2, FiTrendingUp, FiUser, FiAward, FiZap, FiFileText, FiBriefcase, FiPlus, FiEye, FiSearch, FiUsers, FiRefreshCw, FiUpload, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import PostComposer from '../PostComposer';
import JobRecommendationsWidget from './shared/JobRecommendationsWidget';

/**
 * Enhanced Professional Dashboard
 * Matches the green-themed design with feed, connections, and trending topics
 */
const ProfessionalDashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    profileViews: 1247,
    postImpressions: 3892,
    connections: 1523,
    engagementRate: '+23%',
    searchAppearances: 156,
  });
  const [activeFeedTab, setActiveFeedTab] = useState('all');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);

  // ATS Score State
  const [atsScore, setAtsScore] = useState(null);
  const [loadingAtsScore, setLoadingAtsScore] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeInputRef = React.useRef(null);

  const [experience, setExperience] = useState([
    { id: 1, role: 'Senior Software Engineer', company: 'TechCorp', duration: '2021 - Present', type: 'Full-time' },
    { id: 2, role: 'Software Engineer', company: 'InnovateInc', duration: '2019 - 2021', type: 'Full-time' },
  ]);

  const [skills, setSkills] = useState([
    { name: 'React', endorsements: 12 },
    { name: 'Node.js', endorsements: 8 },
    { name: 'System Design', endorsements: 5 },
  ]);

  const [salaryInsights, setSalaryInsights] = useState({
    current: '$120k',
    market: '$130k - $150k',
    trend: 'up'
  });

  const [recruiterVisits, setRecruiterVisits] = useState([
    { company: 'Google', date: '2 days ago' },
    { company: 'Amazon', date: '1 week ago' },
  ]);

  const [interviews, setInterviews] = useState([
    { company: 'Netflix', role: 'Senior UI Engineer', date: 'Thu, 24 Aug 14:00' }
  ]);

  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    loadData();
    loadAtsScore();
  }, []);

  useEffect(() => {
    filterPostsByTab();
  }, [posts]);

  const loadAtsScore = async () => {
    try {
      setLoadingAtsScore(true);
      const score = await userService.getAtsScore();
      setAtsScore(score);
    } catch (error) {
      console.error('Failed to load ATS score:', error);
    } finally {
      setLoadingAtsScore(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await userService.uploadResume(formData);
      toast.success('Resume uploaded successfully! ATS score updated.');

      if (response.ats_score) {
        setAtsScore(response.ats_score);
      } else {
        await loadAtsScore();
      }
    } catch (error) {
      let errorMessage = 'Failed to upload resume';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  const filterPostsByTab = () => {
    // Show all posts in single feed - no filtering by category for now
      setFilteredPosts(posts);
  };

  const handleCreatePost = async (postData) => {
    try {
      const newPost = await postService.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      setFilteredPosts(prev => [newPost, ...prev]);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      // toast.error('Failed to create post'); // Handled by PostComposer
      throw error;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load data with error handling - use demo data if API fails
      let postsData = [];
      let suggestionsData = [];
      let jobsData = [];

      try {
        const [postsResult, suggestionsResult, jobsResult] = await Promise.all([
          postService.getPosts({ limit: 10, include_demo: true }).catch(() => []),
          userService.getSuggestions().catch(() => []),
          jobService.getJobs({ limit: 5 }).catch(() => []),
        ]);
        postsData = postsResult || [];
        suggestionsData = suggestionsResult || [];
        jobsData = jobsResult || [];
      } catch (error) {
        console.error('Error loading data:', error);
        // Continue with demo data
      }

      // If no posts, use demo data (fallback if backend doesn't return any)
      if (postsData.length === 0) {
        // Backend should handle include_demo, but just in case
        postsData = [];
      }

      // If no suggestions, use demo data
      if (suggestionsData.length === 0) {
        suggestionsData = [
          {
            id: 'demo-sug-1',
            first_name: 'Alex',
            last_name: 'Thompson',
            headline: 'Data Scientist',
            company: 'DataCorp',
            profile_picture: null,
          },
          {
            id: 'demo-sug-2',
            first_name: 'Jessica',
            last_name: 'Williams',
            headline: 'UX Designer',
            company: 'DesignStudio',
            profile_picture: null,
          },
          {
            id: 'demo-sug-3',
            first_name: 'David',
            last_name: 'Lee',
            headline: 'Marketing Manager',
            company: 'BrandAgency',
            profile_picture: null,
          },
        ];
      }

      // If no jobs, use demo data
      if (jobsData.length === 0) {
        jobsData = [
          {
            id: 'demo-job-1',
            title: 'Senior Software Engineer',
            company: 'TechCorp',
            location: 'San Francisco, CA',
            salary_range: '$150k - $200k',
            type: 'Full-time',
            posted_at: new Date().toISOString(),
          },
          {
            id: 'demo-job-2',
            title: 'Product Manager',
            company: 'InnovateInc',
            location: 'Remote',
            salary_range: '$120k - $160k',
            type: 'Full-time',
            posted_at: new Date().toISOString(),
          },
        ];
      }

      setPosts(postsData);
      setSuggestions(suggestionsData);
      setRecommendedJobs(jobsData);
      setTrendingTopics([
        { tag: '#ArtificialIntelligence', count: '15.2k posts today' },
        { tag: '#RemoteWork', count: '8.7k posts today' },
        { tag: '#Sustainability', count: '6.3k posts today' },
      ]);

      // Set demo stats if needed
      setStats({
        profileViews: 1247,
        postImpressions: 3892,
        connections: 1523,
        engagementRate: '+23%',
        searchAppearances: 156,
      });
    } catch (error) {
      console.error('Error in loadData:', error);
      if (error.response?.status === 503) {
        toast.error('Service Unavailable: Database not connected');
      }
      // Set demo data on error
      setPosts([]);
      setSuggestions([]);
      setRecommendedJobs([]);
      setTrendingTopics([
        { tag: '#GettingStarted', count: 'Welcome!' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await postService.likePost(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: post.likes?.includes(user.id)
                  ? post.likes.filter((id) => id !== user.id)
                  : [...(post.likes || []), user.id],
              }
            : post
        )
      );
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleComment = (postId) => {
    navigate(`/posts/${postId}`);
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Stats Row - Professional Focused */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Profile Views</p>
                <h3 className="text-2xl font-bold mt-1">{stats.profileViews}</h3>
                <div className="flex items-center mt-2 text-xs text-green-100 bg-white/10 px-2 py-1 rounded w-fit">
                  <FiTrendingUp className="mr-1" /> +12% this week
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FiEye className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Search Appearances</h3>
              <FiSearch className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.searchAppearances}</p>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              5 Recruiters found you
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Post Impressions</h3>
              <FiShare2 className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.postImpressions}</p>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Connections</h3>
              <FiUsers className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.connections}</p>
            <p className="text-xs text-gray-500 mt-1">Grow your network</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN - Career & Profile (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* User Profile Card */}
            <Card className="text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-green-500 to-emerald-600"></div>
              <div className="relative pt-8">
                <div className="w-24 h-24 mx-auto bg-white p-1 rounded-full shadow-md">
                  <img 
                    src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}`} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <h3 className="mt-3 font-bold text-gray-900">{user?.first_name} {user?.last_name}</h3>
                <p className="text-sm text-gray-500">{user?.headline || 'Senior Professional'}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center gap-4 text-sm">
                  <div className="text-center">
                    <span className="block font-bold text-gray-900">{stats.connections}</span>
                    <span className="text-xs text-gray-500">Connections</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-gray-900">{stats.profileViews}</span>
                    <span className="text-xs text-gray-500">Views</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* ATS Score Card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FiTrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-gray-900">ATS Score</h3>
                </div>
                <div className="flex space-x-2">
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={uploadingResume}
                  />
                  <button
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                    title="Upload resume for ATS scoring"
                  >
                    {uploadingResume ? (
                      <FiRefreshCw className="w-3 h-3 animate-spin" />
                    ) : atsScore ? (
                      <FiRefreshCw className="w-3 h-3" />
                    ) : (
                      <FiUpload className="w-3 h-3" />
                    )}
                    <span>{uploadingResume ? 'Uploading...' : atsScore ? 'Update' : 'Upload'}</span>
                  </button>
                </div>
              </div>
              
              {loadingAtsScore ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : atsScore ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Resume Strength</span>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-green-600">{atsScore.score || 0}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div
                      className={`h-2.5 rounded-full ${
                        (atsScore.score || 0) >= 80
                          ? 'bg-green-500'
                          : (atsScore.score || 0) >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${atsScore.score || 0}%` }}
                    ></div>
                  </div>
                  {atsScore.verified && (
                    <div className="flex items-center space-x-1 text-xs text-green-600 mb-1">
                      <FiCheck className="w-3 h-3" />
                      <span>Verified Resume</span>
                    </div>
                  )}
                  {atsScore.last_updated && (
                    <p className="text-[10px] text-gray-400 mt-2">
                      Last updated: {new Date(atsScore.last_updated).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FiFileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Upload resume to get your ATS score</p>
                </div>
              )}
            </Card>

            {/* Experience Timeline */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FiBriefcase className="text-green-600" /> Experience
                </h3>
                <Button variant="ghost" size="sm" className="text-green-600"><FiPlus /></Button>
              </div>
              <div className="space-y-4">
                {experience.map((exp, idx) => (
                  <div key={exp.id} className="relative pl-4 border-l-2 border-gray-200 last:border-0">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-green-500"></div>
                    <h4 className="font-semibold text-gray-900 text-sm">{exp.role}</h4>
                    <p className="text-xs text-gray-600">{exp.company}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{exp.duration}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Salary Insights */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">Salary Insights</h3>
                <Badge variant="success" className="text-[10px]">Private</Badge>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-800 mb-1">Market Range for your role</p>
                <p className="text-lg font-bold text-green-900">{salaryInsights.market}</p>
                <div className="mt-2 flex items-center text-xs text-green-700">
                  <FiTrendingUp className="mr-1" /> Trending {salaryInsights.trend}
                </div>
              </div>
            </Card>

          </div>

          {/* MIDDLE COLUMN - Feed & Networking (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Create Post */}
            <PostComposer onSubmit={handleCreatePost} placeholder="Share your professional insights..." />

            {/* Feed Tabs */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-2">
              {['all', 'network', 'saved'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFeedTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeFeedTab === tab
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredPosts.map((post) => (
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
                          <p className="text-xs text-gray-500">{post.user_headline}</p>
                          <p className="text-[10px] text-gray-400">
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
                        <button 
                          className={`flex items-center gap-1 hover:text-green-600 ${post.likes?.includes(user.id) ? 'text-green-600' : ''}`}
                          onClick={() => handleLike(post.id)}
                        >
                          <FiHeart className={post.likes?.includes(user.id) ? 'fill-current' : ''} /> 
                          {post.likes?.length || 0}
                        </button>
                        <button 
                          className="flex items-center gap-1 hover:text-green-600"
                          onClick={() => handleComment(post.id)}
                        >
                          <FiMessageCircle /> Comment
                        </button>
                        <button 
                          className="flex items-center gap-1 hover:text-green-600"
                          onClick={() => handleShare(post.id)}
                        >
                          <FiShare2 /> Share
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiFileText className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900">No posts found</h3>
                  <p className="text-neutral-500 mt-2">Be the first to share something with your network!</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Insights & Recommendations (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Recruiter Visits (Private) */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">Who viewed your profile</h3>
                <Badge variant="secondary" className="text-[10px]">Private</Badge>
              </div>
              <div className="space-y-3">
                {recruiterVisits.map((visit, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">
                        {visit.company[0]}
                      </div>
                      <span className="font-medium text-gray-700">{visit.company}</span>
                    </div>
                    <span className="text-xs text-gray-400">{visit.date}</span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" fullWidth className="mt-2 text-green-600">See all views</Button>
            </Card>

            {/* Interview Invites */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Interview Invites</h3>
              {interviews.map((interview, idx) => (
                <div key={idx} className="p-3 bg-green-50 border border-green-100 rounded-lg mb-2">
                  <p className="font-bold text-gray-900 text-sm">{interview.company}</p>
                  <p className="text-xs text-gray-600">{interview.role}</p>
                  <p className="text-xs text-green-700 font-medium mt-1">{interview.date}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-7 text-xs px-2 bg-green-600 text-white">Accept</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white">Decline</Button>
                  </div>
                </div>
              ))}
            </Card>

            {/* Skills & Endorsements */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">Skills</h3>
                <Button variant="ghost" size="sm" className="text-green-600">Edit</Button>
              </div>
              <div className="space-y-3">
                {skills.map((skill, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{skill.name}</span>
                      <span className="text-gray-500 text-xs">{skill.endorsements} endorsements</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[70%] rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Job Switch Recommendations */}
            <JobRecommendationsWidget jobs={recommendedJobs} />

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboardEnhanced;