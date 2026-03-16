import React, { useState, useEffect, useCallback } from 'react';
import { FiTrendingUp, FiInfo } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';

const SyncScore = ({ userId, showTooltip = true, compact = false, refreshTrigger = 0 }) => {
  const { user } = useAuth();
  const [syncScore, setSyncScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewerId = user?.id || user?._id;

  // Check if current user can view this sync score
  const canViewSyncScore = () => {
    if (!user) return false;
    // User can always see their own sync score
    if (String(userId) === String(viewerId)) return true;
    // Recruiters can see anyone's sync score
    if (user.user_type === 'recruiter') return true;
    return false;
  };

  const fetchSyncScore = useCallback(async () => {
    if (!canViewSyncScore()) {
      setLoading(false);
      return;
    }

    try {
      const data = await analyticsService.getUserSyncScore(userId);
      setSyncScore({
        ...data,
        score: data?.score ?? data?.sync_score ?? 0,
      });
    } catch (error) {
      console.error('Failed to fetch sync score:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, user, viewerId]);

  useEffect(() => {
    fetchSyncScore();
  }, [fetchSyncScore, refreshTrigger]);

  // Expose refresh method for external updates
  useEffect(() => {
    if (window.syncScoreRefreshers) {
      window.syncScoreRefreshers[userId] = fetchSyncScore;
    } else {
      window.syncScoreRefreshers = { [userId]: fetchSyncScore };
    }

    return () => {
      if (window.syncScoreRefreshers && window.syncScoreRefreshers[userId]) {
        delete window.syncScoreRefreshers[userId];
      }
    };
  }, [userId, fetchSyncScore]);

  if (!canViewSyncScore()) {
    return null;
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${compact ? 'flex items-center gap-2' : ''}`}>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        {!compact && <div className="h-2 bg-gray-200 rounded w-20 mt-1"></div>}
      </div>
    );
  }

  if (!syncScore || syncScore.score === null || syncScore.score === undefined) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <FiTrendingUp className={`w-4 h-4 ${getScoreColor(syncScore.score)}`} />
        <span className={`text-sm font-medium ${getScoreColor(syncScore.score)}`}>
          {syncScore.score}/100
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${getScoreBgColor(syncScore.score)} border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FiTrendingUp className={`w-5 h-5 ${getScoreColor(syncScore.score)}`} />
          <h3 className="font-semibold text-gray-900">Sync Score</h3>
          {showTooltip && (
            <div className="relative group">
              <FiInfo className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Sync Score reflects profile completeness and activity on Sync
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
        <span className={`text-2xl font-bold ${getScoreColor(syncScore.score)}`}>
          {syncScore.score}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getScoreColor(syncScore.score).replace('text-', 'bg-')}`}
          style={{ width: `${syncScore.score}%` }}
        ></div>
      </div>

      <div className="flex justify-between text-xs text-gray-600">
        <span>0</span>
        <span>100</span>
      </div>

      <div className="mt-3 text-xs text-gray-600">
        {syncScore.score >= 80 && "Excellent! Your profile is highly optimized."}
        {syncScore.score >= 60 && syncScore.score < 80 && "Good progress! Keep engaging to improve."}
        {syncScore.score < 60 && "Getting started! Complete your profile and engage more."}
      </div>
    </div>
  );
};

export default SyncScore;
