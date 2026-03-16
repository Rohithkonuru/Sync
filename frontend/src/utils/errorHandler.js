export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  if (!error) return fallback;

  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) => (typeof item === 'string' ? item : item?.msg))
      .filter(Boolean)
      .join(', ');
    if (joined) return joined;
  }

  if (typeof error?.response?.data?.message === 'string' && error.response.data.message.trim()) {
    return error.response.data.message;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const handleApiError = (error, fallback = 'Request failed') => {
  const message = getErrorMessage(error, fallback);
  return {
    message,
    status: error?.response?.status,
    raw: error,
  };
};
