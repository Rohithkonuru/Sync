import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiMoreVertical, FiTrash2, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { postService } from '../services/api';

const FeedCard = ({ 
  post: initialPost, 
  currentUserId,
  onPostUpdate
}) => {
  const normalizePost = (postData, fallbackPost = {}) => ({
    ...fallbackPost,
    ...postData,
    id: postData?.id || fallbackPost?.id || postData?._id || fallbackPost?._id,
    _id: postData?._id || fallbackPost?._id || postData?.id || fallbackPost?.id,
    likes: postData?.likes || fallbackPost?.likes || [],
    comments: postData?.comments || fallbackPost?.comments || [],
    shares: postData?.shares ?? fallbackPost?.shares ?? 0,
    images: postData?.images || fallbackPost?.images || [],
    media_url: postData?.media_url || fallbackPost?.media_url,
    media_type: postData?.media_type || fallbackPost?.media_type,
    user_name: postData?.user_name || fallbackPost?.user_name,
    user_picture: postData?.user_picture || fallbackPost?.user_picture,
    created_at: postData?.created_at || fallbackPost?.created_at,
  });

  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(initialPost.likes?.includes(currentUserId) || false);
  const [likeCount, setLikeCount] = useState(initialPost.likes?.length || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState(initialPost.comments || []);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [sharePressed, setSharePressed] = useState(false);
  const postId = post?.id || post?._id;

  useEffect(() => {
    const nextPost = normalizePost(initialPost, post);
    setPost(nextPost);
    setLikeCount(nextPost.likes?.length || 0);
    setComments(nextPost.comments || []);
    setIsLiked(nextPost.likes?.includes(currentUserId) || false);
  }, [initialPost, currentUserId]);

  const resolveImageUrl = (url) => {
    if (!url) return url;
    const apiBase = process.env.REACT_APP_API_URL || 'https://sync-backend-production.up.railway.app';
    if (url.startsWith('/api/')) {
      return `${apiBase}${url}`;
    }
    if (url.startsWith('/uploads/')) {
      return `${apiBase}${url}`;
    }
    return url;
  };

  const handleLike = async () => {
    if (!postId) {
      toast.error('Post is unavailable');
      return;
    }

    try {
      setLikeAnimating(true);
      setIsLiked(!isLiked);
      const newCount = isLiked ? likeCount - 1 : likeCount + 1;
      setLikeCount(newCount);
      
      const updatedPost = normalizePost(await postService.likePost(postId), post);
      setPost(updatedPost);
      setLikeCount(updatedPost.likes?.length || 0);
      setIsLiked(updatedPost.likes?.includes(currentUserId) || false);
      
      setTimeout(() => setLikeAnimating(false), 300);
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
      setLikeAnimating(false);
      toast.error('Failed to like post');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!postId) {
      toast.error('Post is unavailable');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const updatedPost = normalizePost(await postService.commentPost(postId, commentText), post);
      setPost(updatedPost);
      setComments(updatedPost.comments || []);
      setCommentText('');
      setShowCommentInput(false);
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    if (!postId) {
      toast.error('Post is unavailable');
      return;
    }

    try {
      setSharePressed(true);
      const postUrl = `${window.location.origin}/posts/${postId}`;
      await navigator.clipboard.writeText(postUrl);
      const updatedPost = normalizePost(await postService.sharePost(postId), post);
      setPost(updatedPost);
      toast.success('Post link copied and shared!');
      setTimeout(() => setSharePressed(false), 300);
    } catch (error) {
      setSharePressed(false);
      toast.error('Failed to share post');
    }
  };

  const handleSave = async () => {
    try {
      await postService.savePost(postId);
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Post unsaved' : 'Post saved');
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postService.deletePost(postId);
      
      toast.success('Post deleted successfully');
      if (onPostUpdate) {
        onPostUpdate(postId);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You can only delete your own posts');
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete post');
      }
    }
  };

  const isOwner = String(currentUserId) === String(post.user_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-neutral-200 shadow-soft hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={post.user_picture || `https://ui-avatars.com/api/?name=${post.user_name}&background=random`}
              alt={post.user_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold text-neutral-900">{post.user_name}</h4>
              <p className="text-xs text-neutral-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <FiMoreVertical className="w-5 h-5 text-neutral-500" />
            </motion.button>
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-20"
                >
                  {isOwner && (
                    <motion.button
                      whileHover={{ backgroundColor: '#fef2f2' }}
                      onClick={() => {
                        setShowOptions(false);
                        handleDelete();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete Post</span>
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-neutral-900 whitespace-pre-wrap break-words mb-4 leading-relaxed text-sm sm:text-base">{post.content}</p>
        {post.media_url && post.media_type === 'image' && (
          <div className="mb-4">
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={resolveImageUrl(post.media_url)}
              alt="Post media"
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>
        )}

        {post.media_url && post.media_type === 'video' && (
          <div className="mb-4">
            <motion.video
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              controls
              className="w-full rounded-lg"
            >
              <source src={resolveImageUrl(post.media_url)} />
            </motion.video>
          </div>
        )}

        {!post.media_url && post.images && post.images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <AnimatePresence>
              {post.images.slice(0, 4).map((image, idx) => (
                <motion.img
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  src={resolveImageUrl(image)}
                  alt={`Post image ${idx + 1}`}
                  className="w-full h-32 sm:h-48 object-cover rounded-lg"
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Stats - Always present to prevent layout shifts */}
      <div className="px-4 py-2 flex items-center space-x-4 text-sm text-neutral-600 border-b border-neutral-100 min-h-[40px]">
        {(likeCount > 0 || comments.length > 0 || post.shares > 0) ? (
          <>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">
              {likeCount > 0 && `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`}
            </span>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">
              {comments.length > 0 && `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
            </span>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">
              {post.shares > 0 && `${post.shares} ${post.shares === 1 ? 'share' : 'shares'}`}
            </span>
          </>
        ) : (
          <div className="text-neutral-400 text-xs">
            Be the first to engage with this post
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            className={`flex items-center justify-center px-2 sm:px-4 py-2 rounded-xl border transition-all font-medium text-xs sm:text-sm ${
              isLiked
                ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
                : 'text-neutral-600 bg-white border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <motion.div
              animate={likeAnimating ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <FiHeart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
            </motion.div>
            <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium inline-block min-w-[32px] text-center">
              {likeCount === 0 ? 'Like' : likeCount}
            </span>
          </motion.button>

          {/* Comment Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCommentInput(!showCommentInput)}
            className={`flex items-center justify-center px-2 sm:px-4 py-2 rounded-xl border transition-colors text-xs sm:text-sm ${
              showCommentInput ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-neutral-600 bg-white border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <FiMessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium inline-block min-w-[32px] text-center">
              {comments.length === 0 ? 'Comment' : comments.length}
            </span>
          </motion.button>

          {/* Share Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className={`flex items-center justify-center px-2 sm:px-4 py-2 rounded-xl border transition-all font-medium text-xs sm:text-sm ${
              sharePressed ? 'text-green-700 bg-green-50 border-green-200' : 'text-neutral-600 bg-white border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <motion.div
              animate={sharePressed ? { rotate: 20 } : {}}
              transition={{ duration: 0.3 }}
            >
              <FiShare2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
            <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium inline-block min-w-[32px] text-center">
              {post.shares === 0 ? 'Share' : post.shares}
            </span>
          </motion.button>

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className={`flex items-center justify-center px-2 sm:px-4 py-2 rounded-xl border transition-all font-medium text-xs sm:text-sm ${
              isSaved
                ? 'text-blue-700 bg-blue-50 border-blue-200'
                : 'text-neutral-600 bg-white border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <FiBookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved ? 'fill-current' : ''}`} />
            <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium inline-block min-w-[32px] text-center">
              Save
            </span>
          </motion.button>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {comments && comments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 border-b border-neutral-100 bg-gray-50 max-h-80 overflow-y-auto"
          >
            {comments.map((comment, idx) => (
              <motion.div
                key={comment.id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="mb-3 last:mb-0 text-sm"
              >
                <div className="flex items-start space-x-2">
                  <img
                    src={comment.user_picture || `https://ui-avatars.com/api/?name=${comment.user_name}&background=random`}
                    alt={comment.user_name}
                    className="w-6 h-6 rounded-full object-cover mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-neutral-900">{comment.user_name || 'User'}</span>
                    <span className="text-neutral-700 ml-2">{comment.content}</span>
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Input */}
      <AnimatePresence>
        {showCommentInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCommentInput(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-lg border border-neutral-200 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-neutral-900">Add Comment</h4>
                <button
                  type="button"
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                  onClick={() => setShowCommentInput(false)}
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  <FiSend className="w-4 h-4" />
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FeedCard;

