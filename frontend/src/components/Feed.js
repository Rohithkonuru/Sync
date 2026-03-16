import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/api';
import { FaHeart, FaComment, FaShare, FaUser, FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const observerRef = useRef(null);
  const PAGE_SIZE = 10;
  const currentUserId = user?.id || user?._id;

  const resolveImageUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      return `${base}${url}`;
    }
    return url;
  };

  const fetchPosts = useCallback((opts = { append: false }) => {
    const controller = new AbortController();
    const skip = opts.append ? posts.length : 0;
    const limit = PAGE_SIZE;
    if (!opts.append) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    postService
      .getPosts({ skip, limit, signal: controller.signal })
      .then((response = []) => {
        const safeArray = Array.isArray(response) ? response : [];
        setPosts((prev) => (opts.append ? [...prev, ...safeArray] : safeArray));
        setHasMore(safeArray.length === limit);
      })
      .catch((fetchError) => {
        if (fetchError.name === 'AbortError') return;
        console.error('Error fetching posts:', fetchError);
        setError('Failed to load posts');
        toast.error('Failed to load posts');
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });

    return () => controller.abort();
  }, [PAGE_SIZE, posts.length]);

  useEffect(() => {
    const abort = fetchPosts();
    return () => abort?.();
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const sentinel = observerRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchPosts({ append: true });
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPosts, hasMore, loadingMore]);

  const handleCreatePost = useCallback(async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const response = await postService.createPost({ content: newPost });
      setPosts((prev) => [response, ...prev]);
      setNewPost('');
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  }, [newPost]);

  const handleLike = useCallback(async (postId) => {
    // Optimistic update for snappier UI
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const isLiked = post.likes?.includes(currentUserId);
        const nextLikes = isLiked
          ? (post.likes || []).filter((id) => id !== currentUserId)
          : [...(post.likes || []), currentUserId];
        return { ...post, likes: nextLikes };
      })
    );

    try {
      const response = await postService.likePost(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: response.liked
                  ? [...(post.likes || []), currentUserId]
                  : (post.likes || []).filter((id) => id !== currentUserId),
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
      // Revert optimistic update on error
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const isLiked = post.likes?.includes(currentUserId);
          const nextLikes = isLiked
            ? (post.likes || []).filter((id) => id !== currentUserId)
            : [...(post.likes || []), currentUserId];
          return { ...post, likes: nextLikes };
        })
      );
    }
  }, [currentUserId]);

  const handleComment = useCallback(async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const response = await postService.commentPost(postId, content);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, response] }
            : post
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error commenting on post:', error);
      toast.error('Failed to add comment');
    }
  }, [commentInputs]);

  const handleShare = useCallback(async (postId) => {
    try {
      await postService.sharePost(postId);
      toast.success('Post shared!');
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post');
    }
  }, []);

  const handleDelete = useCallback(async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      const msg = error?.response?.data?.detail || 'Failed to delete post';
      toast.error(msg);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => fetchPosts({ append: false })}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Create Post */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post
          </motion.button>
        </form>
      </motion.div>

      {/* Posts Feed */}
      <AnimatePresence>
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            {/* Post Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {post.user_picture ? (
                  <img src={post.user_picture} alt={post.user_name} className="w-10 h-10 rounded-full" />
                ) : (
                  <FaUser className="text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{post.user_name}</h3>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
              {post.user_id === currentUserId && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(post.id)}
                  className="ml-auto text-sm text-red-600 hover:text-red-700 flex items-center space-x-2"
                >
                  <FaTrash />
                  <span>Delete</span>
                </motion.button>
              )}
            </div>

            {/* Post Content */}
            <p className="text-gray-800 mb-4">{post.content}</p>

            {/* Post Media */}
            {post.media_url && post.media_type === 'image' && (
              <div className="mb-4">
                <motion.img
                  src={resolveImageUrl(post.media_url)}
                  alt="Post media"
                  className="w-full rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                />
              </div>
            )}
            {post.media_url && post.media_type === 'video' && (
              <div className="mb-4">
                <motion.video
                  controls
                  className="w-full rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <source src={resolveImageUrl(post.media_url)} />
                </motion.video>
              </div>
            )}
            {!post.media_url && post.images && post.images.length > 0 && (
              <div className="mb-4">
                {post.images.map((image, imgIndex) => (
                  <motion.img
                    key={imgIndex}
                    src={resolveImageUrl(image)}
                    alt="Post image"
                    className="w-full rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + imgIndex * 0.1 }}
                  />
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center space-x-6 pt-4 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleLike(post.id)}
                className={`flex items-center space-x-2 ${
                  post.likes?.includes(currentUserId) ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                } transition-colors`}
              >
                <FaHeart />
                <span>{post.likes?.length || 0}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
              >
                <FaComment />
                <span>{post.comments?.length || 0}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleShare(post.id)}
                className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors"
              >
                <FaShare />
                <span>{post.shares || 0}</span>
              </motion.button>
            </div>

            {/* Comments Section */}
            {post.comments && post.comments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-2"
              >
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      {comment.user_picture ? (
                        <img src={comment.user_picture} alt={comment.user_name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <FaUser className="text-gray-600 text-sm" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{comment.user_name}</p>
                      <p className="text-gray-800">{comment.content}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Add Comment */}
            <div className="mt-4 flex space-x-3">
              <input
                type="text"
                value={commentInputs[post.id] || ''}
                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                placeholder="Write a comment..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleComment(post.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Comment
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {posts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500"
        >
          No posts yet. Be the first to share something!
        </motion.div>
      )}

      <div ref={observerRef} className="h-1" />
      {loadingMore && (
        <div className="text-center text-sm text-gray-500 py-4">Loading more...</div>
      )}
    </motion.div>
  );
};

export default Feed;
