import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useFeed } from '../../context/FeedContext';
import FeedCard from '../common/FeedCard';
import PostComposer from '../PostComposer';

const PAGE_SIZE = 10;

const MobileOptimizedDashboard = () => {
  const navigate = useNavigate();
  const { getFeed, removePost } = useFeed();

  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showPostComposer, setShowPostComposer] = useState(false);

  const feedEndRef = useRef(null);

  const loadInitialFeed = async () => {
    try {
      setLoading(true);
      const feed = await getFeed({ page: 1, limit: PAGE_SIZE });
      const normalized = feed || [];
      setFeedPosts(normalized);
      setPage(1);
      setHasMore(normalized.length >= PAGE_SIZE);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const morePosts = await getFeed({ page: nextPage, limit: PAGE_SIZE });
      const normalized = morePosts || [];
      setFeedPosts((prev) => [...prev, ...normalized]);
      setPage(nextPage);
      setHasMore(normalized.length >= PAGE_SIZE);
    } catch (error) {
      toast.error('Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadInitialFeed();
  }, []);

  useEffect(() => {
    const node = feedEndRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  const handlePostCreated = (newPost) => {
    setFeedPosts((prev) => [newPost, ...prev]);
    setShowPostComposer(false);
  };

  const handleDeletePost = (postId) => {
    setFeedPosts((prev) => prev.filter((p) => p._id !== postId));
    removePost(postId);
  };

  return (
    <div className="block md:hidden min-h-screen bg-neutral-50 overflow-x-hidden pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-semibold text-neutral-900">Feed</h1>
          <button
            onClick={() => navigate('/network')}
            className="min-h-[44px] px-3 rounded-full bg-neutral-100 text-neutral-700 text-sm flex items-center gap-2"
          >
            <FiSearch className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      <div className="p-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPostComposer(true)}
          className="w-full min-h-[44px] px-4 py-3 bg-white border border-neutral-200 rounded-xl text-left text-sm text-neutral-600 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <FiPlus className="w-4 h-4 text-blue-600" />
            Start a post
          </span>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full overflow-x-hidden"
      >
        {loading ? (
          <div className="space-y-3 px-3 pb-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 rounded-xl bg-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <h2 className="text-sm font-semibold text-neutral-900">No posts yet</h2>
            <p className="text-xs text-neutral-600 mt-1">Connect with people to see activity in your feed.</p>
          </div>
        ) : (
          <div className="space-y-3 px-3 pb-4">
            {feedPosts.map((post) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <FeedCard
                  post={post}
                  onDelete={() => handleDeletePost(post._id)}
                  onUpdate={(updatedPost) => {
                    setFeedPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
                  }}
                />
              </motion.div>
            ))}
            <div ref={feedEndRef} className="h-8 flex items-center justify-center">
              {loadingMore && <span className="text-xs text-neutral-500">Loading more...</span>}
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showPostComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-3 py-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Create Post</h2>
              <button
                onClick={() => setShowPostComposer(false)}
                className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center text-neutral-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3">
              <PostComposer onSubmit={handlePostCreated} maxLength={2000} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileOptimizedDashboard;
