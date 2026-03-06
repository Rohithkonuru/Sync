import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { postService, userService, jobService } from '../../services/api';
import { Button, Card, Badge } from '../ui';
import FeedCard from '../FeedCard';
import {
  FiHeart, FiMessageCircle, FiShare2, FiTrendingUp, FiUser, FiAward, FiZap, FiFileText, FiBriefcase, FiPlus, FiEye, FiSearch, FiUsers, FiRefreshCw, FiUpload, FiCheck, FiBookOpen, FiVideo, FiCalendar, FiEdit2, FiBookmark
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ProfessionalDashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    profileViews: 1247,
    postImpressions: 3892,
    connections: 1523,
    engagementRate: '+23%',
    searchAppearances: 156,
  });
  const [loading, setLoading] = useState(true);
  const [activeFeedTab, setActiveFeedTab] = useState('all');
  const [filteredPosts, setFilteredPosts] = useState([]);

  const [recommendedJobs, setRecommendedJobs] = useState([]);

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
  }, []);

  useEffect(() => {
    filterPostsByTab();
  }, [posts, activeFeedTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Parallel data fetching
      const [postsData, suggestionsData, jobsData] = await Promise.all([
        postService.getPosts({ limit: 10, include_demo: true }).catch(() => []),
        userService.getSuggestions().catch(() => []),
        jobService.getJobs({ limit: 5 }).catch(() => []),
      ]);

      setPosts(postsData);
      setRecommendedJobs(jobsData);

      // Set demo stats
      setStats({
        profileViews: 1247,
        postImpressions: 3892,
        connections: 1523,
        engagementRate: '+23%',
        searchAppearances: 156,
      });

    } catch (error) {
      console.error('Error loading professional dashboard:', error);
      if (error.response?.status === 503) {
        toast.error('Service Unavailable: Database not connected');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterPostsByTab = () => {
    setFilteredPosts(posts);
  };

  const handleCreatePost = async (postData) => {
    try {
      const newPost = await postService.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
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

        {/* Top Stats Row - Professional Focused */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Profile Views</p>
                <h3 className="text-2xl font-bold mt-1">{stats.profileViews}</h3>
                <div className="flex items-center mt-2 text-xs text-blue-100 bg-white/10 px-2 py-1 rounded w-fit">
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
              <FiSearch className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.searchAppearances}</p>
            <p className="text-xs text-blue-600 mt-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
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

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >

          {/* LEFT COLUMN - Profile & Quick Actions (3 cols) */}
          <div className="lg:col-span-3 space-y-4">

            {/* User Profile Card */}
            <motion.div variants={itemVariants}>
            <Card className="text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="relative pt-8">
                <div className="w-20 h-20 mx-auto bg-white p-1 rounded-full shadow-md">
                  <img
                    src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}`}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <h3 className="mt-3 font-bold text-gray-900 text-sm">{user?.first_name} {user?.last_name}</h3>
                <p className="text-xs text-gray-500">{user?.headline || 'Senior Professional'}</p>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center gap-4 text-xs">
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
            </motion.div>

            {/* Connections Count */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-sm">Connections</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.connections}</p>
                <p className="text-sm text-gray-500">Grow your network</p>
                <Button variant="outline" size="sm" className="mt-3 w-full text-xs" onClick={() => {}}>Find Connections</Button>
              </div>
            </Card>
            </motion.div>

            {/* Premium Offer */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <FiBookmark className="text-blue-500" /> Saved Items
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-700 hover:bg-gray-50 p-2 rounded cursor-pointer">
                  <p className="font-medium text-xs">Leadership Course 2024</p>
                  <p className="text-xs text-gray-500">Saved 3 days ago</p>
                </div>
                <div className="text-sm text-gray-700 hover:bg-gray-50 p-2 rounded cursor-pointer">
                  <p className="font-medium text-xs">Executive Networking Guide</p>
                  <p className="text-xs text-gray-500">Saved 1 week ago</p>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 w-full text-xs" onClick={() => {}}>View All Saved</Button>
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
                  {user?.profile_picture ? (
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
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors" onClick={() => {}}>
                  <FiUpload className="w-5 h-5" />
                  <span className="text-sm">Photo</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors" onClick={() => {}}>
                  <FiVideo className="w-5 h-5" />
                  <span className="text-sm">Video</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors" onClick={() => {}}>
                  <FiCalendar className="w-5 h-5" />
                  <span className="text-sm">Event</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors" onClick={() => {}}>
                  <FiEdit2 className="w-5 h-5" />
                  <span className="text-sm">Write article</span>
                </button>
              </div>
            </Card>
            </motion.div>

            {/* Feed Tabs */}
            <motion.div variants={itemVariants} className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-2">
              {['all', 'network', 'saved'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFeedTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeFeedTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </motion.div>

            {/* Posts Feed */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredPosts && filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <FeedCard
                      key={post.id || post._id}
                      post={post}
                      currentUserId={user._id}
                      onPostUpdate={(postId) => {
                        setPosts(prev => prev.filter(p => (p.id || p._id) !== postId));
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
                    <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiFileText className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900">No posts found</h3>
                    <p className="text-neutral-500 mt-2">Be the first to share something with your network!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN - Insights & Recommendations (3 cols) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Today's News & Views */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Today's news and views</h3>
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">Executive Leadership Trends</h4>
                  <p className="text-xs text-gray-500 mt-1">Harvard Business Review • 2h ago</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">Tech Industry Salary Report</h4>
                  <p className="text-xs text-gray-500 mt-1">TechCrunch • 4h ago</p>
                </div>
                <div className="pb-3">
                  <h4 className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">AI Innovation in Enterprise</h4>
                  <p className="text-xs text-gray-500 mt-1">MIT Review • 6h ago</p>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Dream Job Advertisement */}
            <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">Your next career move awaits</h3>
                <p className="text-xs text-gray-600 mb-4">Top opportunities for senior professionals</p>
                <Button size="sm" className="bg-amber-600 text-white w-full text-xs" onClick={() => {}}>Start Free Trial</Button>
              </div>
            </Card>
            </motion.div>

            {/* Who Viewed Your Profile */}
            <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">Who viewed your profile</h3>
                <Badge variant="secondary" className="text-[10px]">Private</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">
                      G
                    </div>
                    <span className="font-medium text-gray-700">Google</span>
                  </div>
                  <span className="text-xs text-gray-400">2 days ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">
                      A
                    </div>
                    <span className="font-medium text-gray-700">Amazon</span>
                  </div>
                  <span className="text-xs text-gray-400">1 week ago</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" fullWidth className="mt-2 text-blue-600" onClick={() => {}}>See all views</Button>
            </Card>
            </motion.div>

            {/* Interview Invites */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Interview Invites</h3>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-2">
                <p className="font-bold text-gray-900 text-sm">Netflix</p>
                <p className="text-xs text-gray-600">Senior UI Engineer</p>
                <p className="text-xs text-blue-700 font-medium mt-1">Thu, 24 Aug 14:00</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-7 text-xs px-2 bg-blue-600 text-white" onClick={() => toast.success('Interview accepted!')}>Accept</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white" onClick={() => {}}>Decline</Button>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Skills & Endorsements */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Skills</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">React.js</span>
                    <span className="text-gray-500 text-xs">12 endorsements</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Node.js</span>
                    <span className="text-gray-500 text-xs">8 endorsements</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </Card>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfessionalDashboardEnhanced;
