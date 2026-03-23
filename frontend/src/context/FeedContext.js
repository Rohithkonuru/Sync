import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { postService } from '../services/api';
import { createPost as createPostRequest, getFeed as getFeedRequest, normalizeFeed } from '../services/feedService';

const FeedContext = createContext(null);

export const FeedProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPostId = useCallback((post) => String(post?.id || post?._id || ''), []);

  const fetchFeed = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFeedRequest(params);
      const normalized = Array.isArray(data) ? data : [];
      setPosts((current) => {
        if ((params?.page || 1) > 1) {
          const seen = new Set(current.map(getPostId));
          const next = normalized.filter((post) => !seen.has(getPostId(post)));
          return [...current, ...next];
        }
        return normalized;
      });
      return normalized;
    } catch (requestError) {
      console.error(requestError);
      setError(requestError?.message || 'Failed to load feed data');
      setPosts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getPostId]);

  const addPost = useCallback(async (payload) => {
    try {
      const createdPost = await createPostRequest(payload);
      setPosts((current) => [createdPost, ...current]);
      return createdPost;
    } catch (requestError) {
      console.error(requestError);
      throw requestError;
    }
  }, []);

  const deletePost = useCallback(async (postId, syncRemote = false) => {
    const postKey = String(postId);
    if (syncRemote && postKey) {
      try {
        await postService.deletePost(postKey);
      } catch (requestError) {
        console.error(requestError);
      }
    }
    setPosts((current) => current.filter((post) => getPostId(post) !== postKey));
  }, [getPostId]);

  const upsertPost = useCallback((scopeOrPost, maybePost) => {
    const incomingPost = maybePost || scopeOrPost;
    if (!incomingPost) return;
    const incomingId = getPostId(incomingPost);
    if (!incomingId) return;

    setPosts((current) => {
      const exists = current.some((post) => getPostId(post) === incomingId);
      if (!exists) return [incomingPost, ...current];
      return current.map((post) => (getPostId(post) === incomingId ? { ...post, ...incomingPost } : post));
    });
  }, [getPostId]);

  // Backward-compatible helpers used by some existing components.
  const getFeed = useCallback(() => posts, [posts]);

  const setFeed = useCallback((scopeOrUpdater, dataOrUpdater) => {
    if (Array.isArray(scopeOrUpdater) || typeof scopeOrUpdater === 'function') {
      setPosts((current) => {
        const next = typeof scopeOrUpdater === 'function' ? scopeOrUpdater(current) : scopeOrUpdater;
        return normalizeFeed(next);
      });
      return;
    }

    const updater = dataOrUpdater;
    setPosts((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return normalizeFeed(next);
    });
  }, []);

  const removePost = useCallback((postId) => {
    deletePost(postId, false);
  }, [deletePost]);

  const value = useMemo(() => ({
    posts,
    loading,
    error,
    fetchFeed,
    addPost,
    deletePost,
    upsertPost,
    getFeed,
    setFeed,
    removePost,
  }), [posts, loading, error, fetchFeed, addPost, deletePost, upsertPost, getFeed, setFeed, removePost]);

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within FeedProvider');
  }
  return context;
};
