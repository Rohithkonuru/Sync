import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not on login page and actually authenticated before
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (userData) => {
    // If FormData, send with multipart headers to full register endpoint
    if (userData instanceof FormData) {
      return api.post('/api/auth/register', userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // For simple registration, use simple endpoint
    return api.post('/api/auth/register/simple', userData);
  },
  getCurrentUser: () => api.get('/api/auth/me'),
  refreshToken: () => api.post('/api/auth/refresh'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', null, { params: { email } }),
  sendOTP: (email, phone) => api.post('/api/auth/otp/send', { email, phone }),
  verifyOTP: (email, phone, otp) => api.post('/api/auth/otp/verify', { email, phone, otp }),
};

export const userService = {
  getProfile: (userId) => api.get(`/api/users/${userId}`),
  updateProfile: (data) => api.put('/api/users/me', data),
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/users/upload/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadBannerPicture: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/users/upload/banner-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteProfilePicture: () => api.delete('/api/users/me/profile-picture'),
  // Legacy endpoints (kept for backward compatibility)
  sendConnectionRequest: (userId) => api.post(`/api/users/${userId}/connect`),
  acceptConnection: (userId) => api.post(`/api/users/${userId}/accept`),
  rejectConnection: (userId) => api.post(`/api/users/${userId}/reject`),
  declineConnection: (userId) => api.post(`/api/users/${userId}/decline`),
  cancelConnectionRequest: (userId) => api.delete(`/api/users/${userId}/cancel-request`),
  removeConnection: (userId) => api.delete(`/api/users/connections/${userId}`),
  getConnections: (params) => api.get('/api/users/connections/list', { params }),
  getConnectionRequests: () => api.get('/api/users/connection-requests/list'),
  // New connection endpoints
  sendConnectionRequestNew: (userId) => api.post('/api/connections/request', { user_id: userId }),
  acceptConnectionNew: (userId) => api.post(`/api/connections/${userId}/accept`),
  declineConnectionNew: (userId) => api.post(`/api/connections/${userId}/decline`),
  removeConnectionNew: (userId) => api.delete(`/api/connections/${userId}`),
  getMyConnections: (params) => api.get('/api/connections/me/connections', { params }),
  getIncomingRequests: () => api.get('/api/connections/me/requests/incoming'),
  getConnectionStatus: (userId) => api.get(`/api/connections/me/status/${userId}`),
  getSuggestions: () => api.get('/api/users/suggestions/list'),
  searchUsers: (params) => api.get('/api/users/search', { params }),
  getAtsScore: () => api.get('/api/users/me/ats-score'),
  uploadResume: (formData) => api.post('/api/users/upload/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const postService = {
  createPost: (data) => api.post('/api/posts', data),
  getPosts: (params) => api.get('/api/posts', { params }),
  getFeed: (params) => api.get('/api/posts/feed', { params }),
  getPost: (postId) => api.get(`/api/posts/${postId}`),
  likePost: (postId) => api.post(`/api/posts/${postId}/like`),
  commentPost: (postId, content) => api.post(`/api/posts/${postId}/comment?content=${encodeURIComponent(content)}`),
  sharePost: (postId) => api.post(`/api/posts/${postId}/share`),
  savePost: (postId) => api.post(`/api/posts/${postId}/save`),
  getSavedPosts: (params) => api.get('/api/posts/saved/list', { params }),
  deletePost: (postId) => api.delete(`/api/posts/${postId}`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/posts/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const jobService = {
  createJob: (data) => api.post('/api/jobs', data),
  getJobs: (params) => api.get('/api/jobs', { params }),
  getJob: (jobId) => api.get(`/api/jobs/${jobId}`),
  updateJob: (jobId, data) => api.put(`/api/jobs/${jobId}`, data),
  deleteJob: (jobId) => api.delete(`/api/jobs/${jobId}`),
  applyJob: (jobId, applicationData, resumeFile) => {
    const formData = new FormData();
    if (resumeFile) {
      formData.append('resume_file', resumeFile);
    }
    Object.keys(applicationData).forEach(key => {
      if (applicationData[key] !== null && applicationData[key] !== undefined) {
        if (Array.isArray(applicationData[key])) {
          formData.append(key, JSON.stringify(applicationData[key]));
        } else {
          formData.append(key, applicationData[key]);
        }
      }
    });
    return api.post(`/api/jobs/${jobId}/apply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getApplication: (applicationId) => api.get(`/api/jobs/applications/${applicationId}`),
  getApplicationHistory: (applicationId) => api.get(`/api/jobs/applications/${applicationId}/history`),
  getApplications: (params) => api.get('/api/jobs/my-applications/list', { params }),
  getJobApplications: (jobId) => api.get(`/api/jobs/${jobId}/applications`),
  getRecruiterJobApplications: (jobId) => api.get(`/api/jobs/recruiter/jobs/${jobId}/applications`),
  getMyJobs: () => api.get('/api/jobs/my-jobs/list'),
  updateApplicationStatus: (applicationId, status, note) => api.put(`/api/jobs/applications/${applicationId}/status`, { status, note }),
  markApplicationAsSeen: (applicationId) => api.put(`/api/jobs/applications/${applicationId}/seen`),
  deleteApplication: (applicationId) => api.delete(`/api/jobs/applications/${applicationId}`),
  downloadResume: (applicationId) => api.get(`/api/jobs/applications/${applicationId}/resume`, { responseType: 'blob' }),
  saveJob: (jobId) => api.post(`/api/jobs/${jobId}/save`),
  getSavedJobs: () => api.get('/api/jobs/saved/list'),
};

export const messageService = {
  sendMessage: (data) => api.post('/api/messages', data),
  sendMessageWithAttachment: (receiverId, content, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('content', content || '');
    return api.post(`/api/messages/${receiverId}/attachment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  sharePost: (receiverId, postId, note) => api.post('/api/messages/share-post', null, {
    params: { receiver_id: receiverId, post_id: postId, note },
  }),
  createConversation: (receiverId) => api.post('/api/messages/conversations', null, {
    params: { receiver_id: receiverId },
  }),
  getConversations: () => api.get('/api/messages'),
  getConversation: (userId, params) => api.get(`/api/messages/${userId}`, { params }),
  markRead: (messageId) => api.put(`/api/messages/${messageId}/read`),
};

export const companyService = {
  createCompany: (data) => api.post('/api/companies', data),
  getCompanies: (params) => api.get('/api/companies', { params }),
  getCompany: (companyId) => api.get(`/api/companies/${companyId}`),
  getCompanyJobs: (companyId) => api.get(`/api/companies/${companyId}/jobs`),
  updateCompany: (companyId, data) => api.put(`/api/companies/${companyId}`, data),
};

export const notificationService = {
  getNotifications: (params) => api.get('/api/notifications', { params }),
  getUnreadCount: () => api.get('/api/notifications/unread/count'),
  markRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/api/notifications/${notificationId}`),
};

export const growthScoreService = {
  getMyGrowthScore: () => api.get('/api/users/me/growth-score'),
  getUserGrowthScore: (userId) => api.get(`/api/users/${userId}/growth-score`),
  updateGrowthScore: () => api.post('/api/users/growth-score/update'),
  recordActivity: (activityType) => api.post(`/api/users/activity/${activityType}`),
};

export const analyticsService = {
  getGenderDemographics: (jobId) => api.get('/api/analytics/gender-demographics', { params: { job_id: jobId } }),
  getApplicationsOverTime: (jobId, days = 30) => api.get('/api/analytics/applications-over-time', { params: { job_id: jobId, days } }),
  getApplicationStatusBreakdown: (jobId) => api.get('/api/analytics/status-breakdown', { params: { job_id: jobId } }),
  getSyncScoreDistribution: (jobId) => api.get('/api/analytics/sync-score-distribution', { params: { job_id: jobId } }),
  getAtsScoreAverages: (jobId) => api.get('/api/analytics/ats-score-averages', { params: { job_id: jobId } }),
  getRecruiterAnalyticsOverview: () => api.get('/api/analytics/overview'),
};

// Extend userService with Growth Score methods
userService.getGrowthScore = (userId) => {
  if (userId === 'me' || !userId) {
    return growthScoreService.getMyGrowthScore();
  }
  return growthScoreService.getUserGrowthScore(userId);
};

userService.updateGrowthScore = () => growthScoreService.updateGrowthScore();
userService.recordActivity = (activityType) => growthScoreService.recordActivity(activityType);

export default api;

