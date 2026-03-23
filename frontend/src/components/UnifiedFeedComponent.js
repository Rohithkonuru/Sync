import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FeedCard from '../common/FeedCard';
import SkeletonLoader from '../SkeletonLoader';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { useFeedInfiniteScroll } from '../../hooks/useFeedInfiniteScroll';
import useRealtime from '../../hooks/useRealtime';
import { useAuth } from '../../context/AuthContext';
import { FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const UnifiedFeedComponent = ({ onPostDelete }) => {
  const { user } = useAuth();
  const {
    posts,
    loading,
    error,
    hasMore,
    loadNextPage,
    reload,
    sortBy,
    setSortBy,
  } = useFeedInfiniteScroll();

  const { connected, lastMessage, sendMessage } = useRealtime();
  const [realtimePosts, setRealtimePosts] = useState([]);

  const observerTarget = useInfiniteScroll(() => {
    if (hasMore && !loading) {
      loadNextPage();
    }
  });

  useEffect(() => {
    if (!lastMessage) return;

    const { type, payload } = lastMessage;

    if (type === 'new_post' && payload?.id) {
      setRealtimePosts((prev) => {
        const existing = prev.some((p) => p.id === payload.id || p._id === payload.id);
        if (!existing) {
          toast.success('New post in your feed');
          return [payload, ...prev];
        }
        return prev;
      });
    } else if (type === 'new_notification') {
      // Handle notification updates
      console.log('New notification:', payload);
    }
  }, [lastMessage]);

  const allPosts = [...realtimePosts, ...posts];
  const seenIds = new Set(allPosts.map((p) => p.id || p._id));
  const uniquePosts = allPosts.filter((p) => {
    const id = p.id || p._id;
    if (seenIds.has(id)) {
      seenIds.delete(id);
      return true;
    }
    return false;
  });

  if (error && posts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={reload}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="mr-2 w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-semibold text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Recent</option>
            <option value="relevance">Relevant</option>
            <option value="ranked">Best (AI Ranked)</option>
          </select>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Post Stream */}
      <AnimatePresence mode="popLayout">
        {loading && posts.length === 0 ? (
          <SkeletonLoader count={3} variant="card" />
        ) : uniquePosts.length > 0 ? (
          uniquePosts.map((post) => (
            <FeedCard
              key={post.id || post._id}
              post={post}
              currentUserId={user?.id || user?._id}
              onPostUpdate={onPostDelete}
            />
          ))
        ) : (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-2">No posts yet</p>
            <p className="text-sm text-gray-400">Start following people to see their posts</p>
          </div>
        )}
      </AnimatePresence>

      {/* Infinite Scroll Trigger */}
      {hasMore && !loading && (
        <div ref={observerTarget} className="py-8">
          <SkeletonLoader count={1} variant="card" />
        </div>
      )}

      {/* End State */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          You've reached the end of your feed
        </div>
      )}

      {/* Connection Status */}
      {connected && (
        <div className="fixed bottom-4 right-4 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live updates enabled</span>
        </div>
      )}
    </div>
  );
};

export default UnifiedFeedComponent;
