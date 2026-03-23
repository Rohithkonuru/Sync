import api, { postService } from './api';
import { handleApiError } from '../utils/errorHandler';

const asArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeFeedPost = (post = {}) => {
  const likes = Array.isArray(post?.likes) ? post.likes : [];
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const shares = Number(post?.shares || 0);

  return {
    ...post,
    id: post?.id || post?._id,
    _id: post?._id || post?.id,
    likes,
    comments,
    likes_count: Number(post?.likes_count ?? likes.length),
    comments_count: Number(post?.comments_count ?? comments.length),
    shares,
    media_url: post?.media_url || null,
    media_type: post?.media_type || null,
  };
};

export const normalizeFeed = (payload) => asArray(payload).map(normalizeFeedPost);

const toFeedError = (error, fallback) => {
  const info = handleApiError(error, fallback);
  const err = new Error(info.message);
  err.status = info.status;
  err.raw = info.raw;
  return err;
};

export const getFeed = async (params = {}) => {
  try {
    const data = await api.get('/api/posts/feed', { params });
    return normalizeFeed(data);
  } catch (error) {
    throw toFeedError(error, 'Failed to load feed data');
  }
};

export const createPost = async (payload = {}) => {
  try {
    const formData = new FormData();
    formData.append('content', payload?.content || '');

    if (payload?.media instanceof File) {
      formData.append('media', payload.media);
    }

    if (payload?.media_url) {
      formData.append('media_url', payload.media_url);
    }

    if (payload?.media_type) {
      formData.append('media_type', payload.media_type);
    }

    if (Array.isArray(payload?.images) && payload.images.length > 0 && !payload?.media_url) {
      formData.append('media_url', payload.images[0]);
      formData.append('media_type', payload?.media_type || 'image');
    }

    const data = await api.post('/api/posts/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return normalizeFeedPost(data);
  } catch (error) {
    throw toFeedError(error, 'Failed to create post');
  }
};

export const getNetworkFeed = async (userId, params = {}) => {
  try {
    if (!userId) return [];
    const data = await postService.getNetworkFeed(userId, params);
    return normalizeFeed(data);
  } catch (error) {
    throw toFeedError(error, 'Failed to load feed data');
  }
};

export const getSavedFeed = async (userId, params = {}) => {
  try {
    if (!userId) return [];
    const data = await postService.getSavedPostsByUser(userId, params);
    return normalizeFeed(data);
  } catch (error) {
    throw toFeedError(error, 'Failed to load feed data');
  }
};

export const getDashboardFeed = async (params = {}) => {
  return getFeed(params);
};

export const getFeedByTab = async (tab, userId, params = {}) => {
  if (tab === 'network') return getFeed(params);
  if (tab === 'saved') return getFeed(params);
  return getFeed(params);
};
