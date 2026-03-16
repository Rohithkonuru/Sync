const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const calculateSyncScore = (user = {}) => {
  const profileCompletion = Number(user?.profile_completion || 0);
  const connections = Array.isArray(user?.connections) ? user.connections.length : Number(user?.connections || 0);
  const posts = Number(user?.posts_count || 0);
  const applications = Number(user?.applications_count || 0);

  const weighted = (
    profileCompletion * 0.3 +
    Math.min(connections * 2, 100) * 0.2 +
    Math.min(posts * 5, 100) * 0.2 +
    Math.min(applications * 10, 100) * 0.3
  );

  return Math.round(clamp(weighted));
};

export const calculateGrowthScore = (user = {}) => {
  const syncDelta = Math.max(0, Number(user?.sync_score || 0) - Number(user?.previous_sync_score || 0));
  const atsDelta = Math.max(0, Number(user?.ats_score?.score || 0) - Number(user?.previous_ats_score || 0));
  const activity = Number(user?.recent_activity_count || 0);

  const weighted = syncDelta * 0.5 + atsDelta * 0.2 + Math.min(activity * 3, 100) * 0.3;
  return Math.round(clamp(weighted));
};
