import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const FeedContext = createContext(null);

const initialFeeds = {
  all: [],
  network: [],
  saved: [],
};

export const FeedProvider = ({ children }) => {
  const [feeds, setFeeds] = useState(initialFeeds);

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
    removePost,
    upsertPost,
  }), [feeds, setFeed, getFeed, removePost, upsertPost]);

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within FeedProvider');
  }
  return context;
};
