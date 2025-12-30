export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (!error) return defaultMessage;

  // Handle Axios response errors
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(err => err.msg || JSON.stringify(err)).join(', ');
    }
    if (typeof detail === 'object') {
      return JSON.stringify(detail);
    }
  }

  // Handle message field
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Handle standard Error object
  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};
