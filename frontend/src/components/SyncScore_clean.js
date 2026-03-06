/**
 * Clean SyncScore component with visualization
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../utils/helpers';
import { Badge } from './BaseComponents';
import { Tooltip } from './BaseComponents';
import { userService } from '../services/api_clean';

/**
 * SyncScore component props
 * @typedef {Object} SyncScoreProps
 * @property {string} [userId] - User ID
 * @property {boolean} [compact=false] - Compact view
 * @property {boolean} [showTooltip=true] - Show tooltip
 * @property {boolean} [showProgress=true] - Show progress bar
 * @property {boolean} [showDetails=false] - Show detailed breakdown
 * @property {boolean} [animate=true] - Animate score changes
 * @property {string} [className] - Additional CSS classes
 * @property {Object} [style] - Inline styles
 */

/**
 * SyncScore component with visualization and real-time updates
 * @param {SyncScoreProps} props - Component props
 * @returns {JSX.Element} SyncScore component
 */
const SyncScore = ({
  userId,
  compact = false,
  showTooltip = true,
  showProgress = true,
  showDetails = false,
  animate = true,
  className = '',
  style,
  ...props
}) => {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [previousScore, setPreviousScore] = useState(0);

  // Fetch sync score
  const fetchSyncScore = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch from the API
      // For now, we'll simulate with a mock response
      const mockResponse = {
        success: true,
        data: {
          sync_score: Math.floor(Math.random() * 100),
          sync_score_updated: new Date().toISOString(),
          breakdown: {
            profile_completeness: Math.floor(Math.random() * 30) + 70,
            activity_score: Math.floor(Math.random() * 30) + 60,
            engagement_score: Math.floor(Math.random() * 30) + 50,
            network_score: Math.floor(Math.random() * 30) + 40,
          },
          recommendations: [
            'Add more skills to your profile',
            'Complete your education history',
            'Add work experience details',
            'Upload a professional photo',
            'Connect with more professionals'
          ]
        }
      };
      
      if (mockResponse.success) {
        const newScore = mockResponse.data.sync_score;
        setPreviousScore(score);
        setScore(newScore);
        setScoreHistory(prev => [...prev.slice(-9), newScore]); // Keep last 10 scores
      } else {
        throw new Error('Failed to fetch sync score');
      }
    } catch (err) {
      setError(err.message);
      // Fallback to a default score
      setScore(50);
    } finally {
      setLoading(false);
    }
  };

  // Fetch score on mount and when userId changes
  useEffect(() => {
    fetchSyncScore();
  }, [userId]);

  // Animate score changes
  useEffect(() => {
    if (animate && previousScore !== score) {
      // Animation logic would go here
      // For now, we'll just update the score
    }
  }, [score, previousScore, animate]);

  // Get score color
  const getScoreColor = (scoreValue) => {
    if (scoreValue >= 80) return 'text-green-600';
    if (scoreValue >= 60) return 'text-yellow-600';
    if (scoreValue >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get score badge variant
  const getScoreVariant = (scoreValue) => {
    if (scoreValue >= 80) return 'success';
    if (scoreValue >= 60) return 'warning';
    if (scoreValue >= 40) return 'info';
    return 'danger';
  };

  // Get progress color
  const getProgressColor = (scoreValue) => {
    if (scoreValue >= 80) return 'bg-green-500';
    if (scoreValue >= 60) return 'bg-yellow-500';
    if (scoreValue >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Format score with animation
  const formatScore = (scoreValue) => {
    if (animate && previousScore !== score) {
      return scoreValue; // Animation would handle the transition
    }
    return scoreValue;
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('flex items-center space-x-2', className)} {...props}>
        <div className="animate-pulse">
          <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex items-center space-x-2', className)} {...props}>
        <svg
          className="h-4 w-4 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm text-red-600">Score unavailable</span>
      </div>
    );
  }

  // Compact view
  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)} {...props}>
        <div className="flex items-center space-x-1">
          <span className={cn('text-sm font-medium', getScoreColor(score))}>
            Sync:
          </span>
          <span className={cn('text-sm font-bold', getScoreColor(score))}>
            {formatScore(score)}
          </span>
        </div>
        {showTooltip && (
          <Tooltip
            content={
              <div className="p-2">
                <div className="font-medium">Sync Score: {score}/100</div>
                <div className="text-sm text-gray-600 mt-1">
                  Your profile completeness and activity score
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            }
          >
            <svg
              className="h-3 w-3 text-gray-400 cursor-help"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Tooltip>
        )}
      </div>
    );
  }

  // Full view with progress bar
  return (
    <div className={cn('w-full', className)} {...props} style={style}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Sync Score</span>
          {showTooltip && (
            <Tooltip
              content={
                <div className="p-2">
                  <div className="font-medium">Sync Score: {score}/100</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Your profile completeness and activity score
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                </div>
              }
            >
              <svg
                className="h-3 w-3 text-gray-400 cursor-help"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Tooltip>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge
            variant={getScoreVariant(score)}
            size="small"
            className={cn('font-bold', getScoreColor(score))}
          >
            {formatScore(score)}
          </Badge>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500 ease-out',
                getProgressColor(score)
              )}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {/* Details */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Profile Completeness:</span>
              <span>85%</span>
            </div>
            <div className="flex justify-between">
              <span>Activity Score:</span>
              <span>72%</span>
            </div>
            <div className="flex justify-between">
              <span>Engagement:</span>
              <span>68%</span>
            </div>
            <div className="flex justify-between">
              <span>Network:</span>
              <span>45%</span>
            </div>
          </div>
        </div>
      )}

      {/* Score History */}
      {scoreHistory.length > 1 && (
        <div className="mt-3">
          <div className="text-xs text-gray-600 mb-1">Recent Changes</div>
          <div className="flex items-center space-x-1">
            {scoreHistory.slice(-5).map((historyScore, index) => (
              <div
                key={index}
                className={cn(
                  'h-1 w-1 rounded-full',
                  getProgressColor(historyScore)
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * SyncScoreCard component for dashboard
 * @param {Object} props - Component props
 * @returns {JSX.Element} SyncScoreCard
 */
export const SyncScoreCard = (props) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sync Score</h3>
        <SyncScore compact={true} userId={props.userId} />
      </div>
      <SyncScore
        userId={props.userId}
        showProgress={true}
        showDetails={true}
        showTooltip={false}
        {...props}
      />
    </div>
  );
};

/**
 * SyncScoreProgress component
 * @param {Object} props - Component props
 * @returns {JSX.Element} SyncScoreProgress
 */
export const SyncScoreProgress = (props) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <SyncScore
        userId={props.userId}
        compact={false}
        showProgress={true}
        showDetails={true}
        showTooltip={false}
        {...props}
      />
    </div>
  );
};

export default SyncScore;
