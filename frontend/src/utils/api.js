/**
 * API utilities and helpers
 */

/**
 * Base API class
 */
class BaseAPI {
  constructor(baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get auth headers
   * @returns {Object} Auth headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get full headers
   * @returns {Object} Full headers
   */
  getHeaders() {
    return {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
    };
  }

  /**
   * Make API request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} Response
   */
  async request(url, options = {}) {
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} url - Request URL
   * @param {Object} params - Query parameters
   * @returns {Promise} Response
   */
  async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl);
  }

  /**
   * POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @returns {Promise} Response
   */
  async post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @returns {Promise} Response
   */
  async put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @returns {Promise} Response
   */
  async patch(url, data = {}) {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   * @param {string} url - Request URL
   * @returns {Promise} Response
   */
  async delete(url) {
    return this.request(url, {
      method: 'DELETE',
    });
  }

  /**
   * Upload file
   * @param {string} url - Upload URL
   * @param {FormData} formData - Form data
   * @returns {Promise} Response
   */
  async upload(url, formData) {
    const headers = {
      ...this.getAuthHeaders(),
      // Don't set Content-Type for FormData (browser will set it with boundary)
    };

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }
}

/**
 * API request interceptor
 */
class APIInterceptor {
  constructor() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Add request interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   * @param {Object} config - Request config
   * @returns {Object} Modified config
   */
  applyRequestInterceptors(config) {
    return this.requestInterceptors.reduce(
      (acc, interceptor) => interceptor(acc),
      config
    );
  }

  /**
   * Apply response interceptors
   * @param {*} response - Response
   * @returns {*} Modified response
   */
  applyResponseInterceptors(response) {
    return this.responseInterceptors.reduce(
      (acc, interceptor) => interceptor(acc),
      response
    );
  }
}

/**
 * API error handler
 */
class APIErrorHandler {
  /**
   * Handle API error
   * @param {Error} error - Error object
   * @returns {Object} Error response
   */
  static handle(error) {
    console.error('API Error:', error);

    // Network errors
    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      };
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return {
        success: false,
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT_ERROR',
      };
    }

    // Server errors
    if (error.message.includes('500')) {
      return {
        success: false,
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
      };
    }

    // Validation errors
    if (error.message.includes('400') || error.message.includes('422')) {
      return {
        success: false,
        message: 'Invalid request. Please check your input.',
        code: 'VALIDATION_ERROR',
      };
    }

    // Authentication errors
    if (error.message.includes('401') || error.message.includes('403')) {
      return {
        success: false,
        message: 'Authentication error. Please login again.',
        code: 'AUTH_ERROR',
      };
    }

    // Not found errors
    if (error.message.includes('404')) {
      return {
        success: false,
        message: 'Resource not found.',
        code: 'NOT_FOUND',
      };
    }

    // Default error
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * API cache manager
 */
class APICache {
  constructor() {
    this.cache = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {*} Cached data
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} maxAge - Custom max age
   */
  set(key, data, maxAge = this.maxAge) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + maxAge,
    });
  }

  /**
   * Clear cache
   * @param {string} key - Cache key (optional)
   */
  clear(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Clean expired entries
   */
  clean() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * API retry utility
 */
class APIRetry {
  /**
   * Retry API call with exponential backoff
   * @param {Function} apiCall - API call function
   * @param {number} maxRetries - Maximum retries
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} API response
   */
  static async retry(apiCall, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.message.includes('4') || error.message.includes('400')) {
          throw error;
        }

        // Don't retry on last attempt
        if (i === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * API utilities
 */
export const apiUtils = {
  /**
   * Build query string
   * @param {Object} params - Query parameters
   * @returns {string} Query string
   */
  buildQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return searchParams.toString();
  },

  /**
   * Parse query string
   * @param {string} queryString - Query string
   * @returns {Object} Parsed parameters
   */
  parseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  },

  /**
   * Get file type from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} File type
   */
  getFileType(mimeType) {
    const types = {
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'image/webp': 'image',
      'application/pdf': 'document',
      'text/plain': 'document',
      'application/msword': 'document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
      'application/vnd.ms-excel': 'spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
      'text/csv': 'spreadsheet',
      'video/mp4': 'video',
      'video/webm': 'video',
      'audio/mpeg': 'audio',
      'audio/wav': 'audio',
      'application/zip': 'archive',
      'application/x-rar-compressed': 'archive',
    };
    return types[mimeType] || 'unknown';
  },

  /**
   * Validate file size
   * @param {File} file - File to validate
   * @param {number} maxSize - Maximum size in bytes
   * @returns {boolean} Is valid
   */
  validateFileSize(file, maxSize) {
    return file.size <= maxSize;
  },

  /**
   * Validate file type
   * @param {File} file - File to validate
   * @param {string[]} allowedTypes - Allowed MIME types
   * @returns {boolean} Is valid
   */
  validateFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
  },

  /**
   * Create FormData from object
   * @param {Object} data - Data object
   * @returns {FormData} FormData
   */
  createFormData(data) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });
    return formData;
  },
};

// Export classes
export {
  BaseAPI,
  APIInterceptor,
  APIErrorHandler,
  APICache,
  APIRetry,
};

// Create instances
export const apiCache = new APICache();
export const apiInterceptor = new APIInterceptor();

// Clean cache periodically
setInterval(() => {
  apiCache.clean();
}, 60000); // Every minute
