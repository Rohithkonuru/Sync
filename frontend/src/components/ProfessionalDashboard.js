import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postService, userService, jobService } from '../services/api';
import { FiUsers, FiBriefcase, FiTrendingUp, FiUserPlus, FiHeart, FiMessageCircle, FiShare2, FiSend, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import PostComposer from './PostComposer';

const ProfessionalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [networkSuggestions, setNetworkSuggestions] = useState([]);
  const [industryJobs, setIndustryJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();

    // Set up real-time updates polling every 30 seconds
    const interval = setInterval(() => {
      loadPosts(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [postsData, suggestionsData, jobsData] = await Promise.all([
        postService.getPosts({ limit: 15 }),
        userService.getSuggestions(),
        jobService.getJobs({ limit: 5 })
      ]);
      setPosts(postsData);
      setNetworkSuggestions(suggestionsData);
      setIndustryJobs(jobsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const postsData = await postService.getPosts({ limit: 15 });
      setPosts(postsData);
    } catch (error) {
      if (!silent) toast.error('Failed to refresh posts');
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const handleCreatePost = async (content) => {
    try {
      const newPost = await postService.createPost({ content: content.trim() });
      setPosts((prev) => [newPost, ...prev]);
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleRefresh = () => {
    loadPosts(false);
  };

  const sortedAndFilteredPosts = posts
    .filter((post) => filterBy === 'all' || post.user_type === filterBy)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'popularity') {
        return (b.likes.length + b.comments.length) - (a.likes.length + a.comments.length);
      }
      return 0;
    });

  const handleLike = async (postId) => {
    try {
      await postService.likePost(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: post.likes.includes(user.id)
                  ? post.likes.filter((id) => id !== user.id)
                  : [...post.likes, user.id],
              }
            : post
        )
      );
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleConnect = async (userId) => {
    try {
      await userService.sendConnectionRequest(userId);
      toast.success('Connection request sent!');
      setNetworkSuggestions((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      toast.error('Failed to send connection request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.first_name}!</h1>
        <p className="text-gray-600 mt-2">Grow your network and advance your career</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Professional Tools</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/communities')}
                className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FiUserPlus className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-medium">Expand Network</div>
                  <div className="text-sm text-gray-600">Connect with professionals</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FiBriefcase className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-medium">Career Opportunities</div>
                  <div className="text-sm text-gray-600">Explore new roles</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/feed')}
                className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <FiTrendingUp className="w-6 h-6 text-purple-600" />
                <div>
                  <div className="font-medium">Industry Insights</div>
                  <div className="text-sm text-gray-600">Stay updated</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/communities')}
                className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <FiUsers className="w-6 h-6 text-orange-600" />
                <div>
                  <div className="font-medium">Mentorship</div>
                  <div className="text-sm text-gray-600">Find mentors & mentees</div>
                </div>
              </button>
            </div>
          </div>

          {/* Compose Post */}
          <PostComposer onSubmit={handleCreatePost} />

          {/* Industry Feed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Industry Feed</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Posts</option>
                    <option value="Student">Students</option>
                    <option value="JobSeeker">Job Seekers</option>
                    <option value="Professional">Professionals</option>
                    <option value="Recruiter">Recruiters</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="date">Latest</option>
                    <option value="popularity">Popular</option>
                  </select>
                </div>
              </div>
            </div>
            {sortedAndFilteredPosts.length === 0 ? (
              <p className="text-gray-500">No posts yet. Be the first to share!</p>
            ) : (
              <div className="space-y-6">
                {sortedAndFilteredPosts.slice(0, 8).map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={user}
                    onLike={handleLike}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Network Suggestions */}
          {networkSuggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">People You May Know</h3>
              <div className="space-y-4">
                {networkSuggestions.slice(0, 5).map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {suggestion.profile_picture ? (
                        <img
                          src={suggestion.profile_picture}
                          alt={suggestion.first_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                          {suggestion.first_name?.[0] || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {suggestion.first_name} {suggestion.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{suggestion.headline}</div>
                        <div className="text-xs text-gray-400">{suggestion.user_type}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConnect(suggestion.id)}
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Career Opportunities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Career Opportunities</h3>
            {industryJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No opportunities available right now.</p>
            ) : (
              <div className="space-y-4">
                {industryJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.company_name}</p>
                    <p className="text-sm text-gray-500">{job.location}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                        {job.job_type}
                      </span>
                      {(job.salary_min || job.salary_max) && (
                        <span className="text-xs text-gray-600">
                          {job.salary_min && job.salary_max
                            ? `$${Number(job.salary_min).toLocaleString()} - $${Number(job.salary_max).toLocaleString()}`
                            : job.salary_min
                            ? `$${Number(job.salary_min).toLocaleString()}+`
                            : `Up to $${Number(job.salary_max).toLocaleString()}`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/jobs/${job.id || job._id}`)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Professional Development */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Professional Development</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Certifications</span>
                <span className="text-sm text-green-600">2 Completed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Courses</span>
                <span className="text-sm text-blue-600">1 In Progress</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Conferences</span>
                <span className="text-sm text-purple-600">3 Attended</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/communities')}
              className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Explore Learning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, currentUser, onLike }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [postData, setPostData] = useState(post);
  const isLiked = postData.likes?.includes(currentUser?.id) || false;

  useEffect(() => {
    setPostData(post);
  }, [post]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setCommenting(true);
    try {
      const newCommentData = await postService.commentPost(postData.id, newComment.trim());
      setPostData({
        ...postData,
        comments: [...(postData.comments || []), newCommentData]
      });
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div className="border-b border-gray-100 pb-6 last:border-b-0">
      <div className="flex items-start space-x-4 mb-4">
        {postData.user_picture ? (
          <img
            src={postData.user_picture}
            alt={postData.user_name}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white">
            {postData.user_name?.[0] || 'U'}
          </div>
        )}
        <div className="flex-1">
          <div className="font-semibold">{postData.user_name}</div>
          <div className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(postData.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      <p className="mb-4 text-gray-800">{postData.content}</p>

      {/* Display images if present */}
      {postData.images && postData.images.length > 0 && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {postData.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Post ${index + 1}`}
              className="rounded-lg max-w-full h-auto"
            />
          ))}
        </div>
      )}

      <div className="flex items-center space-x-6 text-gray-600 mb-4">
        <button
          onClick={() => onLike(postData.id)}
          className={`flex items-center space-x-2 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
        >
          <FiHeart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span>{postData.likes?.length || 0}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 hover:text-primary-600"
        >
          <FiMessageCircle className="w-5 h-5" />
          <span>{postData.comments?.length || 0}</span>
        </button>
        <button 
          onClick={async () => {
            try {
              await postService.sharePost(postData.id);
              setPostData({ ...postData, shares: (postData.shares || 0) + 1 });
              toast.success('Post shared!');
            } catch (error) {
              toast.error('Failed to share post');
            }
          }}
          className="flex items-center space-x-2 hover:text-primary-600"
        >
          <FiShare2 className="w-5 h-5" />
          <span>{postData.shares || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 pt-4">
          {/* Add Comment */}
          <div className="flex items-start space-x-3 mb-4">
            {currentUser.profile_picture ? (
              <img
                src={currentUser.profile_picture}
                alt={currentUser.first_name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm">
                {currentUser.first_name?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || commenting}
                  className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {commenting ? '...' : 'Post'}
                </button>
              </div>
            </div>
          </div>

          {/* Display Comments */}
          {postData.comments && postData.comments.length > 0 && (
            <div className="space-y-3">
              {postData.comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  {comment.user_picture ? (
                    <img
                      src={comment.user_picture}
                      alt={comment.user_name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm">
                      {comment.user_name?.[0] || 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="font-medium text-sm">{comment.user_name}</div>
                      <p className="text-sm text-gray-800">{comment.content}</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalDashboard;
