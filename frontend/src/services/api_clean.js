/**
 * Clean API service using BaseAPI
 */

import { BaseAPI, apiCache, APIRetry } from './api';

/**
 * User API service
 */
class UserService extends BaseAPI {
  constructor() {
    super('/users');
  }

  /**
   * Register user
   * @param {Object} userData - User data
   * @returns {Promise} Registration response
   */
  async register(userData) {
    return this.post('/register', userData);
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login response
   */
  async login(email, password) {
    const response = await this.post('/login', { email, password });
    
    // Store token and user data
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token || 'temp_token');
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  }

  /**
   * Get current user profile
   * @returns {Promise} User profile
   */
  async getProfile() {
    const cacheKey = 'user_profile';
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get('/me');
    apiCache.set(cacheKey, response);
    return response;
  }

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise} Update response
   */
  async updateProfile(userData) {
    const response = await this.put('/me', userData);
    apiCache.clear('user_profile'); // Clear cache
    return response;
  }

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Change password response
   */
  async changePassword(currentPassword, newPassword) {
    return this.put('/password', { current_password: currentPassword, new_password: newPassword });
  }

  /**
   * Search users
   * @param {Object} params - Search parameters
   * @returns {Promise} Search results
   */
  async searchUsers(params) {
    const cacheKey = `users_search_${JSON.stringify(params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get('/search', params);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Get users by type
   * @param {string} userType - User type
   * @param {Object} params - Query parameters
   * @returns {Promise} Users list
   */
  async getUsersByType(userType, params = {}) {
    const cacheKey = `users_by_type_${userType}_${JSON.stringify(params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get(`/type/${userType}`, params);
    apiCache.set(cacheKey, response, 60000); // Cache for 1 minute
    return response;
  }

  /**
   * Get user connections
   * @param {string} userId - User ID
   * @returns {Promise} User connections
   */
  async getUserConnections(userId) {
    const cacheKey = `user_connections_${userId}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get(`/${userId}/connections`);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Get user stats
   * @param {string} userId - User ID
   * @returns {Promise} User stats
   */
  async getUserStats(userId) {
    const cacheKey = `user_stats_${userId}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get(`/${userId}/stats`);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Add skill to user
   * @param {string} userId - User ID
   * @param {string} skill - Skill to add
   * @returns {Promise} Add skill response
   */
  async addSkill(userId, skill) {
    const response = await this.post(`/${userId}/skills`, { skill });
    apiCache.clear(`user_stats_${userId}`); // Clear stats cache
    return response;
  }

  /**
   * Remove skill from user
   * @param {string} userId - User ID
   * @param {string} skill - Skill to remove
   * @returns {Promise} Remove skill response
   */
  async removeSkill(userId, skill) {
    const response = await this.delete(`/${userId}/skills/${skill}`);
    apiCache.clear(`user_stats_${userId}`); // Clear stats cache
    return response;
  }

  /**
   * Get growth score
   * @param {string} userId - User ID
   * @returns {Promise} Growth score data
   */
  async getGrowthScore(userId) {
    const cacheKey = `growth_score_${userId}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get(`/me/growth-score`);
    apiCache.set(cacheKey, response, 60000); // Cache for 1 minute
    return response;
  }

  /**
   * Update growth score
   * @returns {Promise} Update response
   */
  async updateGrowthScore() {
    const response = await this.post('/growth-score/update');
    apiCache.clear('growth_score_me'); // Clear cache
    return response;
  }

  /**
   * Record user activity
   * @param {string} activityType - Activity type
   * @returns {Promise} Record response
   */
  async recordActivity(activityType) {
    return this.post(`/activity/${activityType}`);
  }
}

/**
 * Job API service
 */
class JobService extends BaseAPI {
  constructor() {
    super('/jobs');
  }

  /**
   * Create job
   * @param {Object} jobData - Job data
   * @returns {Promise} Create response
   */
  async createJob(jobData) {
    const response = await this.post('/', jobData);
    apiCache.clear('my_jobs'); // Clear my jobs cache
    return response;
  }

  /**
   * Get all jobs
   * @param {Object} params - Query parameters
   * @returns {Promise} Jobs list
   */
  async getJobs(params = {}) {
    const cacheKey = `jobs_${JSON.stringify(params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get('/', params);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Get my jobs
   * @returns {Promise} My jobs
   */
  async getMyJobs() {
    const cacheKey = 'my_jobs';
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get('/my-jobs');
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise} Job details
   */
  async getJob(jobId) {
    const cacheKey = `job_${jobId}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get(`/${jobId}`);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Update job
   * @param {string} jobId - Job ID
   * @param {Object} jobData - Updated job data
   * @returns {Promise} Update response
   */
  async updateJob(jobId, jobData) {
    const response = await this.put(`/${jobId}`, jobData);
    apiCache.clear(`job_${jobId}`); // Clear job cache
    apiCache.clear('my_jobs'); // Clear my jobs cache
    return response;
  }

  /**
   * Delete job
   * @param {string} jobId - Job ID
   * @returns {Promise} Delete response
   */
  async deleteJob(jobId) {
    const response = await this.delete(`/${jobId}`);
    apiCache.clear(`job_${jobId}`); // Clear job cache
    apiCache.clear('my_jobs'); // Clear my jobs cache
    return response;
  }

  /**
   * Apply for job
   * @param {string} jobId - Job ID
   * @param {Object} applicationData - Application data
   * @returns {Promise} Application response
   */
  async applyForJob(jobId, applicationData) {
    const response = await this.post(`/${jobId}/apply`, applicationData);
    apiCache.clear('my_applications'); // Clear applications cache
    return response;
  }

  /**
   * Get job applications
   * @param {string} jobId - Job ID
   * @param {Object} params - Query parameters
   * @returns {Promise} Applications list
   */
  async getJobApplications(jobId, params = {}) {
    const cacheKey = `job_applications_${jobId}_${JSON.stringify(params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get(`/${jobId}/applications`, params);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Get job stats
   * @param {string} jobId - Job ID
   * @returns {Promise} Job stats
   */
  async getJobStats(jobId) {
    const cacheKey = `job_stats_${jobId}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get(`/${jobId}/stats`);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Toggle job status
   * @param {string} jobId - Job ID
   * @returns {Promise} Toggle response
   */
  async toggleJobStatus(jobId) {
    const response = await this.post(`/${jobId}/toggle-status`);
    apiCache.clear(`job_${jobId}`); // Clear job cache
    apiCache.clear('my_jobs'); // Clear my jobs cache
    return response;
  }

  /**
   * Feature job
   * @param {string} jobId - Job ID
   * @returns {Promise} Feature response
   */
  async featureJob(jobId) {
    const response = await this.post(`/${jobId}/feature`);
    apiCache.clear(`job_${jobId}`); // Clear job cache
    apiCache.clear('my_jobs'); // Clear my jobs cache
    return response;
  }
}

/**
 * Application API service
 */
class ApplicationService extends BaseAPI {
  constructor() {
    super('/applications');
  }

  /**
   * Get my applications
   * @param {Object} params - Query parameters
   * @returns {Promise} Applications list
   */
  async getMyApplications(params = {}) {
    const cacheKey = `my_applications_${JSON.stringify(params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get('/', params);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Get application by ID
   * @param {string} applicationId - Application ID
   * @returns {Promise} Application details
   */
  async getApplication(applicationId) {
    const cacheKey = `application_${applicationId}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get(`/${applicationId}`);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Update application status
   * @param {string} applicationId - Application ID
   * @param {Object} statusData - Status data
   * @returns {Promise} Update response
   */
  async updateApplicationStatus(applicationId, statusData) {
    const response = await this.put(`/${applicationId}/status`, statusData);
    apiCache.clear(`application_${applicationId}`); // Clear application cache
    apiCache.clear('my_applications'); // Clear my applications cache
    return response;
  }

  /**
   * Mark application as seen
   * @param {string} applicationId - Application ID
   * @returns {Promise} Mark seen response
   */
  async markApplicationAsSeen(applicationId) {
    const response = await this.put(`/${applicationId}/seen`);
    apiCache.clear(`application_${applicationId}`); // Clear application cache
    return response;
  }

  /**
   * Get application history
   * @param {string} applicationId - Application ID
   * @returns {Promise} Application history
   */
  async getApplicationHistory(applicationId) {
    const cacheKey = `application_history_${applicationId}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get(`/${applicationId}/history`);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Withdraw application
   * @param {string} applicationId - Application ID
   * @returns {Promise} Withdraw response
   */
  async withdrawApplication(applicationId) {
    const response = await this.delete(`/${applicationId}`);
    apiCache.clear(`application_${applicationId}`); // Clear application cache
    apiCache.clear('my_applications'); // Clear my applications cache
    return response;
  }

  /**
   * Download resume
   * @param {string} applicationId - Application ID
   * @returns {Promise} Download response
   */
  async downloadResume(applicationId) {
    const response = await this.get(`/${applicationId}/resume`);
    return response;
  }
}

/**
 * Notification API service
 */
class NotificationService extends BaseAPI {
  constructor() {
    super('/notifications');
  }

  /**
   * Get notifications
   * @param {Object} params - Query parameters
   * @returns {Promise} Notifications list
   */
  async getNotifications(params = {}) {
    const cacheKey = `notifications_${JSON.stringify(params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get('/', params);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Get unread count
   * @returns {Promise} Unread count
   */
  async getUnreadCount() {
    const cacheKey = 'unread_count';
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get('/unread-count');
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Mark as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Mark read response
   */
  async markAsRead(notificationId) {
    const response = await this.put(`/${notificationId}/read`);
    apiCache.clear('unread_count'); // Clear unread count cache
    return response;
  }

  /**
   * Mark all as read
   * @returns {Promise} Mark all read response
   */
  async markAllAsRead() {
    const response = await this.put('/read-all');
    apiCache.clear('unread_count'); // Clear unread count cache
    apiCache.clear('notifications'); // Clear notifications cache
    return response;
  }
}

/**
 * Connection API service
 */
class ConnectionService extends BaseAPI {
  constructor() {
    super('/connections');
  }

  /**
   * Send connection request
   * @param {string} userId - User ID
   * @param {Object} requestData - Request data
   * @returns {Promise} Send response
   */
  async sendRequest(userId, requestData) {
    const response = await this.post('/request', { user_id: userId, ...requestData });
    apiCache.clear('my_connections'); // Clear connections cache
    return response;
  }

  /**
   * Accept connection request
   * @param {string} requestId - Request ID
   * @returns {Promise} Accept response
   */
  async acceptRequest(requestId) {
    const response = await this.put(`/${requestId}/accept`);
    apiCache.clear('my_connections'); // Clear connections cache
    return response;
  }

  /**
   * Decline connection request
   * @param {string} requestId - Request ID
   * @returns {Promise} Decline response
   */
  async declineRequest(requestId) {
    const response = await this.put(`/${requestId}/decline`);
    apiCache.clear('my_connections'); // Clear connections cache
    return response;
  }

  /**
   * Get my connections
   * @param {Object} params - Query parameters
   * @returns {Promise} Connections list
   */
  async getMyConnections(params = {}) {
    const cacheKey = `my_connections_${JSON.stringify(params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get('/my-connections', params);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }

  /**
   * Get connection requests
   * @param {Object} params - Query parameters
   * @returns {Promise} Requests list
   */
  async getConnectionRequests(params = {}) {
    const cacheKey = `connection_requests_${JSON.stringify(params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.get('/requests', params);
    apiCache.set(cacheKey, response, 30000); // Cache for 30 seconds
    return response;
  }
}

// Create service instances
export const userService = new UserService();
export const jobService = new JobService();
export const applicationService = new ApplicationService();
export const notificationService = new NotificationService();
export const connectionService = new ConnectionService();

// Export all services
export default {
  userService,
  jobService,
  applicationService,
  notificationService,
  connectionService,
};
