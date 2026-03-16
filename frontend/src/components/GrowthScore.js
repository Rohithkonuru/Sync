import React, { useState, useEffect, useCallback } from 'react';
import { FiTrendingUp, FiInfo } from 'react-icons/fi';
import { analyticsService } from '../services/api';

/**
 * Growth Score Component
 * Displays user's Growth Score with role-based access control
 * 
 * @param {string} userId - User ID to fetch Growth Score for
 * @param {boolean} showTooltip - Whether to show tooltip
 * @param {boolean} compact - Whether to show compact version
 * @param {function} onScoreUpdate - Callback when score updates
 */
const GrowthScore = ({ 
  userId, 
  showTooltip = true, 
  compact = false, 
  onScoreUpdate 
}) => {
  const [growthScore, setGrowthScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchGrowthScore = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await analyticsService.getUserGrowthScore(userId);
      
      if (response && response.growth_score !== null && response.growth_score !== undefined) {
        setGrowthScore(response.growth_score);
        setLastUpdated(response.growth_score_updated);
        
        if (onScoreUpdate) {
          onScoreUpdate(response.growth_score);
        }
      } else {
        setError(response.message || 'Failed to fetch Growth Score');
      }
    } catch (err) {
      console.error('Error fetching Growth Score:', err);
      setError('Failed to fetch Growth Score');
    } finally {
      setLoading(false);
    }
  }, [userId, onScoreUpdate]);

  useEffect(() => {
    fetchGrowthScore();
  }, [fetchGrowthScore]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLevel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        {!compact && <span className="text-sm text-gray-500">Loading...</span>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Score unavailable</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <FiTrendingUp className={`w-4 h-4 ${getScoreColor(growthScore)}`} />
        <span className={`text-sm font-bold ${getScoreColor(growthScore)}`}>
          {growthScore}
        </span>
        <span className="text-xs text-gray-500">/100</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Growth Score</h3>
          {showTooltip && (
            <div className="relative group">
              <FiInfo className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Growth Score reflects your improvement and engagement over time
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
        <div className={`text-2xl font-bold ${getScoreColor(growthScore)}`}>
          {growthScore}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className={`font-medium ${getScoreColor(growthScore)}`}>
            {getScoreLevel(growthScore)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              growthScore >= 80 ? 'bg-green-500' :
              growthScore >= 60 ? 'bg-yellow-500' :
              growthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${growthScore}%` }}
          ></div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Current Score</span>
          <div className={`font-bold ${getScoreColor(growthScore)}`}>
            {growthScore} / 100
          </div>
        </div>
        <div>
          <span className="text-gray-600">Last Updated</span>
          <div className="font-medium text-gray-700">
            {lastUpdated ? 
              new Date(lastUpdated).toLocaleDateString() : 
              'Not available'
            }
          </div>
        </div>
      </div>

      {/* Improvement Tips */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-2">Ways to improve:</div>
          <ul className="space-y-1 text-xs">
            <li>• Update your profile regularly</li>
            <li>• Add new skills and experiences</li>
            <li>• Complete courses and certifications</li>
            <li>• Stay active on the platform</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GrowthScore;
