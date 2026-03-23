import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { postService } from '../services/api';

const FeedContext = createContext(null);

const initialFeeds = {
  all: [],
  network: [],
  saved: [],
};

export const FeedProvider = ({ children }) => {
  const [feeds, setFeeds] = useState(initialFeeds);

  const normalizePostsPayload = useCallback((payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.posts)) return payload.posts;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }, []);

  const setFeed = useCallback((scope, dataOrUpdater) => {
    setFeeds((prev) => {
      const current = prev[scope] || [];
      const nextValue = typeof dataOrUpdater === 'function' ? dataOrUpdater(current) : dataOrUpdater;
      return {
        ...prev,
        [scope]: Array.isArray(nextValue) ? nextValue : [],
      };
    });
  }, []);

  const getFeed = useCallback((scope = 'all') => {
    return feeds[scope] || [];
  }, [feeds]);

  const fetchFeed = useCallback(async (params = {}) => {
    let data;
    try {
      data = await postService.getFeed(params);
    } catch (primaryError) {
      // Keep app functional if /feed has transient or version mismatch issues.
      data = await postService.getPosts(params);
    }

    const posts = normalizePostsPayload(data);

    setFeed('all', (current) => {
      if ((params?.page || 1) > 1) {
        const seen = new Set(current.map((post) => String(post.id || post._id)));
        const next = posts.filter((post) => !seen.has(String(post.id || post._id)));
        return [...current, ...next];
      }
      return posts;
    });
    return posts;
  }, [setFeed, normalizePostsPayload]);

  const removePost = useCallback((postId) => {
    const postKey = String(postId);
    setFeeds((prev) => {
      const next = {};
      Object.keys(prev).forEach((scope) => {
        next[scope] = (prev[scope] || []).filter((post) => String(post.id || post._id) !== postKey);
      });
      return next;
    });
  }, []);

  const upsertPost = useCallback((scope, incomingPost) => {
    if (!incomingPost) return;
    const incomingId = String(incomingPost.id || incomingPost._id || '');
    if (!incomingId) return;

    setFeed(scope, (current) => {
      const exists = current.some((post) => String(post.id || post._id) === incomingId);
      if (!exists) {
        return [incomingPost, ...current];
      }
      return current.map((post) =>
        String(post.id || post._id) === incomingId ? { ...post, ...incomingPost } : post
      );
    });
  }, [setFeed]);

  const value = useMemo(() => ({
    feeds,
    setFeed,
    getFeed,
    fetchFeed,
    removePost,
    upsertPost,
  }), [feeds, setFeed, getFeed, fetchFeed, removePost, upsertPost]);

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within FeedProvider');
  }
  return context;
};
