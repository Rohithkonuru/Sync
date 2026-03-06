/**
 * Custom hooks for React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for API calls with loading and error states
 * @param {Function} apiCall - The API function to call
 * @returns {UseApiResult} API result with loading and error states
 */
export const useApi = (apiCall) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return { data, loading, error, execute };
};

/**
 * Hook for pagination
 * @param {Function} fetchFunction - Function to fetch data
 * @param {number} initialLimit - Initial page size
 * @returns {UsePaginationResult} Pagination result
 */
export const usePagination = (fetchFunction, initialLimit = 20) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction({ skip, limit });
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, skip, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;
  const hasNext = skip + limit < total;
  const hasPrev = skip > 0;

  const next = useCallback(() => {
    if (hasNext) {
      setSkip(prev => prev + limit);
    }
  }, [hasNext, limit]);

  const prev = useCallback(() => {
    if (hasPrev) {
      setSkip(prev => Math.max(0, prev - limit));
    }
  }, [hasPrev, limit]);

  const goToPage = useCallback((page) => {
    const newSkip = (page - 1) * limit;
    setSkip(newSkip);
  }, [limit]);

  return {
    data,
    loading,
    error,
    pagination: {
      skip,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      currentPage,
    },
    next,
    prev,
    goToPage,
    setLimit,
    refetch: fetchData,
  };
};

/**
 * Hook for debouncing values
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for local storage
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @returns {[*, Function]} Stored value and setter function
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};

/**
 * Hook for session storage
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @returns {[*, Function]} Stored value and setter function
 */
export const useSessionStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};

/**
 * Hook for window size
 * @returns {Object} Window size object
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Hook for media queries
 * @param {string} query - Media query string
 * @returns {boolean} Whether the media query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event) => setMatches(event.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

/**
 * Hook for previous value
 * @param {*} value - Current value
 * @returns {*} Previous value
 */
export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

/**
 * Hook for toggle state
 * @param {boolean} initialValue - Initial value
 * @returns {[boolean, Function]} Toggle state and toggle function
 */
export const useToggle = (initialValue = false) => {
  const [state, setState] = useState(initialValue);

  const toggle = useCallback(() => {
    setState(prev => !prev);
  }, []);

  return [state, toggle];
};

/**
 * Hook for timer
 * @param {number} seconds - Timer duration in seconds
 * @returns {Object} Timer object
 */
export const useTimer = (seconds) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId = null;

    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsRunning(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, timeLeft]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(seconds);
    setIsRunning(false);
  }, [seconds]);

  return { timeLeft, isRunning, start, stop, reset };
};

/**
 * Hook for async operation
 * @param {Function} asyncFunction - Async function to execute
 * @returns {Object} Async operation result
 */
export const useAsync = (asyncFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return { data, loading, error, execute };
};

/**
 * Hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationSchema - Validation schema
 * @returns {Object} Form validation result
 */
export const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback(() => {
    const newErrors = {};
    
    // Simple validation logic (you can replace with a proper validation library)
    Object.keys(validationSchema).forEach(key => {
      const rules = validationSchema[key];
      const value = values[key];

      if (rules.required && (!value || value === '')) {
        newErrors[key] = `${key} is required`;
      } else if (rules.minLength && value && value.length < rules.minLength) {
        newErrors[key] = `${key} must be at least ${rules.minLength} characters`;
      } else if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[key] = `${key} must be a valid email`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationSchema]);

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
};

/**
 * Hook for infinite scroll
 * @param {Function} fetchFunction - Function to fetch more data
 * @param {Object} options - Options object
 * @returns {Object} Infinite scroll result
 */
export const useInfiniteScroll = (fetchFunction, options = {}) => {
  const { threshold = 100 } = options;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newItems = await fetchFunction(page);
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, loading, hasMore, page]);

  return {
    data,
    loading,
    hasMore,
    loadMore,
  };
};

/**
 * Hook for clipboard operations
 * @returns {Object} Clipboard operations
 */
export const useClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, []);

  return { copied, copy };
};

/**
 * Hook for online status
 * @returns {boolean} Online status
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Hook for keyboard shortcuts
 * @param {Object} shortcuts - Keyboard shortcuts object
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      Object.entries(shortcuts).forEach(([shortcut, callback]) => {
        const [requiredKey, modifiers] = shortcut.split('+');
        const requiredCtrl = modifiers.includes('ctrl');
        const requiredShift = modifiers.includes('shift');
        const requiredAlt = modifiers.includes('alt');

        if (
          key === requiredKey &&
          ctrl === requiredCtrl &&
          shift === requiredShift &&
          alt === requiredAlt
        ) {
          event.preventDefault();
          callback(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
