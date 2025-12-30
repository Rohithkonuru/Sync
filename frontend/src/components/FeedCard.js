import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiMoreVertical, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const FeedCard = ({ 
  post, 
  onLike, 
  onComment, 
  onShare, 
  onSave, 
  currentUserId,
  showShareModal = false,
  onShareToMessage
}) => {
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUserId) || false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleLike = async () => {
    try {
      await onLike(post.id);
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      if (onComment) {
        await onComment(post.id, commentText);
        setCommentText('');
        setShowCommentInput(false);
      }
    } catch (error) {
      // Error handled by parent usually, but we can catch here too
    }
  };

  const handleSave = async () => {
    try {
      await onSave(post.id);
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Post unsaved' : 'Post saved');
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleShareClick = () => {
    if (onShareToMessage && showShareModal) {
      setShowShareOptions(true);
      onShareToMessage(post);
    } else if (onShare) {
      onShare(post.id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-soft hover:shadow-medium transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {post.user_picture ? (
              <img
                src={post.user_picture}
                alt={post.user_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <FiUser className="w-5 h-5 text-primary-600" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-neutral-900">{post.user_name}</h4>
              <p className="text-xs text-neutral-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <FiMoreVertical className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-neutral-900 whitespace-pre-wrap mb-4">{post.content}</p>
        
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {post.images.slice(0, 4).map((image, idx) => (
              <img
                key={idx}
                src={image}
                alt={`Post image ${idx + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {(likeCount > 0 || (post.comments?.length > 0) || post.shares > 0) && (
        <div className="px-4 pb-2 flex items-center space-x-4 text-sm text-neutral-600">
          {likeCount > 0 && <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>}
          {post.comments?.length > 0 && (
            <span>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</span>
          )}
          {post.shares > 0 && <span>{post.shares} shares</span>}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-neutral-100">
        <div className="flex items-center justify-around">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'text-error-600 hover:bg-error-50'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <FiHeart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Like</span>
          </button>

          <button
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="flex items-center space-x-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <FiMessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>

          <button
            onClick={handleShareClick}
            className="flex items-center space-x-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <FiShare2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isSaved
                ? 'text-primary-600 hover:bg-primary-50'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <FiBookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Save</span>
          </button>
        </div>
      </div>

      {/* Comment Input */}
      {showCommentInput && (
        <div className="px-4 py-3 border-t border-neutral-100 bg-gray-50">
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </form>
        </div>
      )}
      
      {/* Existing Comments */}
      {post.comments && post.comments.length > 0 && (
        <div className="px-4 py-3 border-t border-neutral-100 bg-gray-50 max-h-60 overflow-y-auto">
             {post.comments.map((comment, idx) => (
                 <div key={idx} className="mb-3 last:mb-0 text-sm">
                     <span className="font-semibold text-neutral-900 mr-2">{comment.user_name || 'User'}</span>
                     <span className="text-neutral-700">{comment.content}</span>
                 </div>
             ))}
        </div>
      )}
    </div>
  );
};

export default FeedCard;

