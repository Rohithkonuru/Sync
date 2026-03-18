import React, { useState, useEffect } from 'react';
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
  FiX
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

  useEffect(() => {
    loadFeed();
  }, []);

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

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-50">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Search */}
          <button
            onClick={() => navigate('/search-connections')}
            className="flex-1 flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-full text-neutral-600 text-sm"
          >
            <FiSearch className="w-4 h-4" />
            <span className="text-neutral-500">Find people...</span>
          </button>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`w-5 h-5 text-neutral-700 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors relative"
            >
              <FiMessageSquare className="w-5 h-5 text-neutral-700" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Feed Content (with top padding for fixed header) */}
      <div className="pt-16 max-w-2xl mx-auto">
        {/* Post Composer Button */}
        <motion.button
          onClick={() => setShowPostComposer(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mx-4 mb-4 w-[calc(100%-2rem)] p-4 bg-white rounded-lg border border-neutral-200 hover:shadow-md transition-shadow flex items-center gap-3 text-neutral-600"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
            {user?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-neutral-600">What's on your mind?</span>
          <FiPlus className="w-5 h-5 ml-auto text-blue-600" />
        </motion.button>

        {/* Feed Posts */}
        {loading ? (
          <div className="space-y-4 px-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-neutral-200 animate-pulse h-64 rounded-lg"></div>
            ))}
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FiHome className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">No posts yet</h2>
            <p className="text-neutral-600 text-sm">Start following people to see their posts</p>
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
                  transition={{ delay: index * 0.1 }}
                >
                  <FeedCard
                    post={post}
                    onDelete={() => handleDeletePost(post._id)}
                    onUpdate={(updatedPost) => {
                      setFeedPosts(feedPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
                    }}
                  />
                </motion.div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <motion.button
                  onClick={handleLoadMore}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 text-blue-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Load more posts
                </motion.button>
              )}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Floating Action Button - Post */}
      <motion.button
        onClick={() => setShowPostComposer(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700"
      >
        <FiPlus className="w-6 h-6" />
      </motion.button>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex items-center justify-around">
        <button
          onClick={() => navigate('/home')}
          className="flex-1 py-3 flex flex-col items-center gap-1 text-blue-600 border-t-2 border-blue-600"
        >
          <FiHome className="w-5 h-5" />
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => navigate('/search-connections')}
          className="flex-1 py-3 flex flex-col items-center gap-1 text-neutral-600 hover:text-blue-600"
        >
          <FiUsers className="w-5 h-5" />
          <span className="text-xs font-medium">Connect</span>
        </button>

        <button
          onClick={() => navigate('/jobs')}
          className="flex-1 py-3 flex flex-col items-center gap-1 text-neutral-600 hover:text-blue-600"
        >
          <FiBriefcase className="w-5 h-5" />
          <span className="text-xs font-medium">Jobs</span>
        </button>

        <button
          onClick={() => navigate('/messages')}
          className="flex-1 py-3 flex flex-col items-center gap-1 text-neutral-600 hover:text-blue-600 relative"
        >
          <FiMessageSquare className="w-5 h-5" />
          <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="text-xs font-medium">Messages</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex-1 py-3 flex flex-col items-center gap-1 text-neutral-600 hover:text-blue-600"
        >
          <div className="w-5 h-5 rounded-full bg-neutral-300"></div>
          <span className="text-xs font-medium">Profile</span>
        </button>
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
