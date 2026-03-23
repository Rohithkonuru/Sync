import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { feedService } from '../services/feedService';

const CACHE_KEY = 'feed_data_cache';
const CACHE_TIMESTAMP_KEY = 'feed_cache_timestamp';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const useFeedCache = () => {
  const [cache, setCache] = useState(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveToCache = (posts) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(posts));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
      setCache(posts);
    } catch (e) {
      console.warn('Failed to cache feed data:', e);
    }
  };

  const isStale = () => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return true;
    return new Date().getTime() - parseInt(timestamp) > CACHE_TTL;
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    setCache([]);
  };

  return { cache, saveToCache, isStale, clearCache };
};

const useFeedInfiniteScroll = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('recent');

  const { cache, saveToCache, isStale, clearCache } = useFeedCache();

  const fetchPosts = async (pageNum) => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const params = {
        skip: (pageNum - 1) * 10,
        limit: 10,
        sort_by: sortBy,
      };

      const data = await feedService.getFeed(params);
      const normalizedPosts = Array.isArray(data) ? data : [];

      if (pageNum === 1) {
        setPosts(normalizedPosts);
        saveToCache(normalizedPosts);
      } else {
        setPosts((prev) => {
          const existing = new Set(prev.map((p) => p.id || p._id));
          const newPosts = normalizedPosts.filter((p) => !existing.has(p.id || p._id));
          const updated = [...prev, ...newPosts];
          saveToCache(updated);
          return updated;
        });
      }

      setHasMore(normalizedPosts.length === 10);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err?.message || 'Failed to load feed');
      if (pageNum === 1 && cache.length > 0) {
        setPosts(cache);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadNextPage = async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPosts(nextPage);
  };

  const reload = async () => {
    setPage(1);
    clearCache();
    await fetchPosts(1);
  };

  useEffect(() => {
    if (!isStale() && cache.length > 0) {
      setPosts(cache);
    } else {
      fetchPosts(1);
    }
  }, [sortBy]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadNextPage,
    reload,
    sortBy,
    setSortBy,
  };
};

export { useFeedCache, useFeedInfiniteScroll };
