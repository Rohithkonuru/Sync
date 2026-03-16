import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { postService, eventService, subscriptionService, interviewService } from '../../services/api';
import { useFeed } from '../../context/FeedContext';
import { getFeedByTab } from '../../services/feedService';
import { TOAST_MESSAGES } from '../../utils/toastMessages';
import { Button, Card, Badge } from '../ui';
import FeedCard from '../common/FeedCard';
import PostCreationModal from '../PostCreationModal';
import {
  FiShare2, FiTrendingUp, FiUser, FiFileText, FiEye, FiSearch, FiUsers, FiUpload, FiVideo, FiCalendar, FiEdit2, FiBookmark
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const NEWS_ITEMS = [
  {
    id: 'leadership-trends',
    title: 'Executive Leadership Trends',
    source: 'Harvard Business Review',
    time: '2h ago',
    url: 'https://hbr.org/topic/leadership',
  },
  {
    id: 'salary-report',
    title: 'Tech Industry Salary Report',
    source: 'TechCrunch',
    time: '4h ago',
    url: 'https://techcrunch.com/tag/salaries/',
  },
  {
    id: 'ai-enterprise',
    title: 'AI Innovation in Enterprise',
    source: 'MIT Technology Review',
    time: '6h ago',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/',
  },
];

const INITIAL_INTERVIEW_INVITES = [
  {
    id: 'netflix-senior-ui-1',
    company: 'Netflix',
    role: 'Senior UI Engineer',
    schedule: 'Thu, 24 Aug 14:00',
  },
];

const ProfessionalDashboardEnhanced = () => {
  const { user, updateUser } = useAuth();
  const { setFeed, getFeed, removePost, upsertPost } = useFeed();
  const navigate = useNavigate();
  const userId = user?._id || user?.id;

  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    profileViews: 1247,
    postImpressions: 3892,
    connections: 1523,
    engagementRate: '+23%',
    searchAppearances: 156,
  });
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState('all');
  const [filteredPosts, setFilteredPosts] = useState([]);

  const [showPostModal, setShowPostModal] = useState(false);
  const [postType, setPostType] = useState('text');
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    event_title: '',
    event_date: '',
    event_description: '',
    location: '',
  });
  const [trialStarting, setTrialStarting] = useState(false);
  const [interviewInvites, setInterviewInvites] = useState(INITIAL_INTERVIEW_INVITES);

  const loadFeedByTab = useCallback(async (tab, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setFeedLoading(true);
      }

      const cached = getFeed(tab);
      if (Array.isArray(cached) && cached.length > 0 && !isInitial) {
        setPosts(cached);
        setFilteredPosts(cached);
      }

      const data = await getFeedByTab(tab, userId, { limit: 10, include_recommended: true });

      const nextPosts = Array.isArray(data) ? data : [];
      setFeed(tab, nextPosts);
      setPosts(nextPosts);
      setFilteredPosts(nextPosts);
    } catch (error) {
      console.error('Error loading feed:', error);
      toast.error(error?.message || TOAST_MESSAGES.FEED_LOAD_FAILED);
      setPosts([]);
      setFilteredPosts([]);
    } finally {
      setLoading(false);
      setFeedLoading(false);
    }
  }, [getFeed, setFeed, userId]);

  useEffect(() => {
    const initialize = async () => {
      await loadFeedByTab('all', true);
      setStats({
        profileViews: 1247,
        postImpressions: 3892,
        connections: 1523,
        engagementRate: '+23%',
        searchAppearances: 156,
      });
    };

    initialize();
  }, [loadFeedByTab]);

  const handleFeedTabChange = async (tab) => {
    setActiveFeedTab(tab);
    await loadFeedByTab(tab);
  };

  const openPostModal = (type = 'text') => {
    setPostType(type);
    setShowPostModal(true);
  };

  const handleCreatePost = async (postData) => {
    try {
      const payload = {
        content: postData.content || '',
        images: postData.images || [],
        media_url: postData.media_url,
        media_type: postType === 'video' ? 'video' : (postData.images?.length ? 'image' : undefined),
      };

      const newPost = await postService.createPost(payload);
      const nextPosts = [newPost, ...posts];
      setFeed(activeFeedTab, nextPosts);
      if (activeFeedTab !== 'all') {
        upsertPost('all', newPost);
      }
      setPosts(nextPosts);
      setFilteredPosts(nextPosts);
      setShowPostModal(false);
      setPostType('text');
      toast.success(TOAST_MESSAGES.POST_CREATED);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(TOAST_MESSAGES.POST_CREATE_FAILED);
      throw error;
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setEventSubmitting(true);
      await eventService.createEvent(eventForm);
      setShowEventModal(false);
      setEventForm({ event_title: '', event_date: '', event_description: '', location: '' });
      toast.success(TOAST_MESSAGES.EVENT_CREATED);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(TOAST_MESSAGES.EVENT_CREATE_FAILED);
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleOpenNews = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleStartTrial = async () => {
    try {
      setTrialStarting(true);
      const response = await subscriptionService.startTrial();
      updateUser({
        ...user,
        premium_status: true,
      });
      toast.success(response?.message || 'Premium trial activated!');
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error('Failed to start premium trial');
    } finally {
      setTrialStarting(false);
    }
  };

  const handleAcceptInterview = async (inviteId) => {
    try {
      await interviewService.acceptInvite(inviteId);
      setInterviewInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      toast.success('Interview accepted!');
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast.error('Failed to accept interview invite');
    }
  };

  const handleDeclineInterview = async (inviteId) => {
    try {
      await interviewService.declineInvite(inviteId);
      setInterviewInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      toast.success('Interview declined!');
    } catch (error) {
      console.error('Error declining invite:', error);
      toast.error('Failed to decline interview invite');
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
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full text-xs"
                    onClick={() => navigate('/network')}
                  >
                    Find Connections
                  </Button>
                </motion.div>
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
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm text-gray-700 hover:bg-gray-50 p-2 rounded cursor-pointer"
                  onClick={() => navigate('/saved')}
                >
                  <p className="font-medium text-xs">Leadership Course 2024</p>
                  <p className="text-xs text-gray-500">Saved 3 days ago</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm text-gray-700 hover:bg-gray-50 p-2 rounded cursor-pointer"
                  onClick={() => navigate('/saved')}
                >
                  <p className="font-medium text-xs">Executive Networking Guide</p>
                  <p className="text-xs text-gray-500">Saved 1 week ago</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" className="text-blue-600 w-full text-xs" onClick={() => navigate('/saved')}>View All Saved</Button>
                </motion.div>
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => openPostModal('text')}
                  className="flex-1 text-left text-gray-500 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition-colors"
                >
                  Start a post
                </motion.button>
              </div>
              <div className="flex items-center justify-around px-3 pb-3 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors"
                  onClick={() => openPostModal('photo')}
                >
                  <FiUpload className="w-5 h-5" />
                  <span className="text-sm">Photo</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors"
                  onClick={() => openPostModal('video')}
                >
                  <FiVideo className="w-5 h-5" />
                  <span className="text-sm">Video</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors"
                  onClick={() => setShowEventModal(true)}
                >
                  <FiCalendar className="w-5 h-5" />
                  <span className="text-sm">Event</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors"
                  onClick={() => navigate('/articles/create')}
                >
                  <FiEdit2 className="w-5 h-5" />
                  <span className="text-sm">Write article</span>
                </motion.button>
              </div>
            </Card>
            </motion.div>

            {/* Feed Tabs */}
            <motion.div variants={itemVariants} className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-2">
              {['all', 'network', 'saved'].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => handleFeedTabChange(tab)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeFeedTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </motion.button>
              ))}
            </motion.div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {feedLoading && (
                <div className="text-sm text-gray-500">Loading posts...</div>
              )}
              <AnimatePresence mode="popLayout">
                {filteredPosts && filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <FeedCard
                      key={post.id || post._id}
                      post={post}
                      currentUserId={user?._id || user?.id}
                      onPostUpdate={(postUpdate) => {
                        if (typeof postUpdate === 'string') {
                          removePost(postUpdate);
                          setPosts((prev) => prev.filter((p) => String(p.id || p._id) !== String(postUpdate)));
                          setFilteredPosts((prev) => prev.filter((p) => String(p.id || p._id) !== String(postUpdate)));
                          toast.success('Post deleted');
                          return;
                        }

                        if (postUpdate?.id || postUpdate?._id) {
                          upsertPost(activeFeedTab, postUpdate);
                          setPosts((prev) => prev.map((p) =>
                            String(p.id || p._id) === String(postUpdate.id || postUpdate._id) ? { ...p, ...postUpdate } : p
                          ));
                          setFilteredPosts((prev) => prev.map((p) =>
                            String(p.id || p._id) === String(postUpdate.id || postUpdate._id) ? { ...p, ...postUpdate } : p
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
                {NEWS_ITEMS.map((news, idx) => (
                  <div key={news.id} className={idx < NEWS_ITEMS.length - 1 ? 'border-b border-gray-100 pb-3' : 'pb-3'}>
                    <motion.h4
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer"
                      onClick={() => handleOpenNews(news.url)}
                    >
                      {news.title}
                    </motion.h4>
                    <p className="text-xs text-gray-500 mt-1">{news.source} • {news.time}</p>
                  </div>
                ))}
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
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="sm" className="bg-amber-600 text-white w-full text-xs" onClick={handleStartTrial} disabled={trialStarting}>
                    {trialStarting ? 'Starting...' : 'Start Free Trial'}
                  </Button>
                </motion.div>
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
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="sm" fullWidth className="mt-2 text-blue-600" onClick={() => navigate('/analytics/profile-views')}>See all views</Button>
              </motion.div>
            </Card>
            </motion.div>

            {/* Interview Invites */}
            <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Interview Invites</h3>
              {interviewInvites.length > 0 ? interviewInvites.map((invite) => (
                <div key={invite.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-2">
                  <p className="font-bold text-gray-900 text-sm">{invite.company}</p>
                  <p className="text-xs text-gray-600">{invite.role}</p>
                  <p className="text-xs text-blue-700 font-medium mt-1">{invite.schedule}</p>
                  <div className="flex gap-2 mt-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="sm" className="h-7 text-xs px-2 bg-blue-600 text-white" onClick={() => handleAcceptInterview(invite.id)}>Accept</Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white" onClick={() => handleDeclineInterview(invite.id)}>Decline</Button>
                    </motion.div>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-500">No pending interview invites.</p>
              )}
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

      <PostCreationModal
        isOpen={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setPostType('text');
        }}
        postType={postType}
        onSubmit={handleCreatePost}
      />

      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-lg w-full"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create Event</h3>
                <button type="button" onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600">x</button>
              </div>
              <form onSubmit={handleCreateEvent} className="p-4 space-y-3">
                <input
                  value={eventForm.event_title}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, event_title: e.target.value }))}
                  placeholder="Event title"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, event_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <textarea
                  value={eventForm.event_description}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, event_description: e.target.value }))}
                  placeholder="Event description"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={4}
                />
                <input
                  value={eventForm.location}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Location"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button type="button" variant="outline" onClick={() => setShowEventModal(false)}>Cancel</Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button type="submit" disabled={eventSubmitting}>{eventSubmitting ? 'Creating...' : 'Create Event'}</Button>
                  </motion.div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfessionalDashboardEnhanced;
