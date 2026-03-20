import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFeed } from '../../context/FeedContext';
import { postService } from '../../services/api';
import { 
  FiSearch, 
  FiHome, 
  FiBriefcase, 
  FiUsers, 
  FiMessageSquare, 
  FiBell,
  FiPlus,
  FiRefreshCw,
  FiX,
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import FeedCard from '../common/FeedCard';
import PostComposer from '../PostComposer';
import { motion, AnimatePresence } from 'framer-motion';

const MobileOptimizedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getFeed, removePost, upsertPost } = useFeed();
  
  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [likedPosts, setLikedPosts] = useState({});
  const [activeTab, setActiveTab] = useState('home');
  const feedEndRef = useRef(null);

  useEffect(() => {
    loadFeed();
    checkUnreadCounts();
  }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (feedEndRef.current) {
      observer.observe(feedEndRef.current);
    }

    return () => {
      if (feedEndRef.current) {
        observer.unobserve(feedEndRef.current);
      }
    };
  }, [hasMore, loading]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const feed = await getFeed({ page: 1, limit: 20 });
      setFeedPosts(feed || []);
      setPage(1);
      setHasMore((feed || []).length >= 20);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const checkUnreadCounts = async () => {
    try {
      // You can implement this based on your API
      setUnreadMessages(0); // Placeholder
      setUnreadNotifications(0); // Placeholder
    } catch (error) {
      console.error('Error checking unread counts:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadFeed();
      toast.success('Feed refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    try {
      const nextPage = page + 1;
      const morePosts = await getFeed({ page: nextPage, limit: 20 });
      setFeedPosts([...feedPosts, ...(morePosts || [])]);
      setPage(nextPage);
      setHasMore((morePosts || []).length >= 20);
    } catch (error) {
      toast.error('Failed to load more');
    }
  };

  const handlePostCreated = (newPost) => {
    setFeedPosts([newPost, ...feedPosts]);
    setShowPostComposer(false);
  };

  const handleDeletePost = (postId) => {
    setFeedPosts(feedPosts.filter(p => p._id !== postId));
    removePost(postId);
  };

  const handleLike = async (postId) => {
    try {
      await postService.likePost(postId);
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    
    switch(tab) {
      case 'connect':
        navigate('/search-connections');
        break;
      case 'jobs':
        navigate('/jobs');
        break;
      case 'messages':
        navigate('/messages');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="text-lg font-bold text-neutral-900">SyncHub</div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
              title="Refresh feed"
            >
              <FiRefreshCw className={`w-5 h-5 text-neutral-700 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => handleTabClick('messages')}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors relative"
              title="Messages"
            >
              <FiMessageSquare className="w-5 h-5 text-neutral-700" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors relative"
              title="Notifications"
            >
              <FiBell className="w-5 h-5 text-neutral-700" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <button
            onClick={() => navigate('/search-connections')}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-600 text-sm transition-colors"
          >
            <FiSearch className="w-4 h-4" />
            <span>Find people...</span>
          </button>
        </div>
      </div>

      {/* Feed Content (with top padding for fixed header) */}
      <div className="pt-24 max-w-2xl mx-auto">
        {/* Post Composer Button */}
        <motion.button
          onClick={() => setShowPostComposer(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mx-4 mb-4 w-[calc(100%-2rem)] p-4 bg-white rounded-lg border border-neutral-200 hover:shadow-md transition-shadow flex items-center gap-3 text-neutral-600"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-neutral-600 text-sm">What's on your mind?</span>
          <FiPlus className="w-5 h-5 ml-auto text-blue-600" />
        </motion.button>

        {/* Feed Posts */}
        {loading && feedPosts.length === 0 ? (
          <div className="space-y-4 px-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-neutral-200 animate-pulse h-64 rounded-lg"></div>
            ))}
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FiHome className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">No posts yet</h2>
            <p className="text-neutral-600 text-sm">Connect with people to see their posts</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4 px-4">
              {feedPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FeedCard
                    post={post}
                    onDelete={() => handleDeletePost(post._id)}
                    onUpdate={(updatedPost) => {
                      setFeedPosts(feedPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
                    }}
                    onLike={() => handleLike(post._id)}
                    isLiked={likedPosts[post._id]}
                  />
                </motion.div>
              ))}

              {/* Infinite Scroll Sentinel */}
              <div ref={feedEndRef} className="py-8">
                {hasMore && feedPosts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-neutral-500"
                  >
                    <div className="animate-pulse">Loading more posts...</div>
                  </motion.div>
                )}
              </div>
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Floating Action Button - Post */}
      <motion.button
        onClick={() => setShowPostComposer(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow z-30"
      >
        <FiPlus className="w-6 h-6" />
      </motion.button>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex items-center justify-around shadow-lg">
        <motion.button
          onClick={() => handleTabClick('home')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'home' ? 'text-blue-600' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <FiHome className="w-6 h-6" />
          <span className="text-xs font-semibold">Home</span>
          {activeTab === 'home' && (
            <motion.div
              layoutId="activeTab"
              className="h-0.5 w-8 bg-blue-600 rounded-full"
            />
          )}
        </motion.button>

        <motion.button
          onClick={() => handleTabClick('connect')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'connect' ? 'text-blue-600' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <FiUsers className="w-6 h-6" />
          <span className="text-xs font-semibold">Connect</span>
          {activeTab === 'connect' && (
            <motion.div
              layoutId="activeTab"
              className="h-0.5 w-8 bg-blue-600 rounded-full"
            />
          )}
        </motion.button>

        <motion.button
          onClick={() => handleTabClick('jobs')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'jobs' ? 'text-blue-600' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <FiBriefcase className="w-6 h-6" />
          <span className="text-xs font-semibold">Jobs</span>
          {activeTab === 'jobs' && (
            <motion.div
              layoutId="activeTab"
              className="h-0.5 w-8 bg-blue-600 rounded-full"
            />
          )}
        </motion.button>

        <motion.button
          onClick={() => handleTabClick('messages')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors relative ${
            activeTab === 'messages' ? 'text-blue-600' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <FiMessageSquare className="w-6 h-6" />
          <span className="text-xs font-semibold">Messages</span>
          {unreadMessages > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
          {activeTab === 'messages' && (
            <motion.div
              layoutId="activeTab"
              className="h-0.5 w-8 bg-blue-600 rounded-full"
            />
          )}
        </motion.button>

        <motion.button
          onClick={() => handleTabClick('profile')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'profile' ? 'text-blue-600' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <FiUser className="w-6 h-6" />
          <span className="text-xs font-semibold">Profile</span>
          {activeTab === 'profile' && (
            <motion.div
              layoutId="activeTab"
              className="h-0.5 w-8 bg-blue-600 rounded-full"
            />
          )}
        </motion.button>
      </div>

      {/* Post Composer Modal */}
      <AnimatePresence>
        {showPostComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-white rounded-t-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">Create Post</h2>
                <button onClick={() => setShowPostComposer(false)}>
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4">
                <PostComposer onSubmit={handlePostCreated} maxLength={2000} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileOptimizedDashboard;
