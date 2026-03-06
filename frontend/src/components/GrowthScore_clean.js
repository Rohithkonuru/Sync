/**
 * Clean GrowthScore component with visualization
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../utils/helpers';
import { Badge } from './BaseComponents';
import { Tooltip } from './BaseComponents';
import { userService } from '../services/api_clean';

/**
 * GrowthScore component props
 * @typedef {Object} GrowthScoreProps
 * @property {string} [userId] - User ID
 * @property {boolean} [compact=false] - Compact view
 * @property {boolean} [showTooltip=true] - Show tooltip
 * @property {boolean} [showProgress=true] - Show progress bar
 * @property {boolean} [showTrend=true] - Show trend indicator
 * @property {boolean} [showDetails=false] - Show detailed breakdown
 * @property {boolean} [animate=true] - Animate score changes
 * @property {string} [className] - Additional CSS classes
 * @property {Object} [style] - Inline styles
 */

/**
 * GrowthScore component with visualization and real-time updates
 * @param {GrowthScoreProps} props - Component props
 * @returns {JSX.Element} GrowthScore component
 */
const GrowthScore = ({
  userId,
  compact = false,
  showTooltip = true,
  showProgress = true,
  showTrend = true,
  showDetails = false,
  animate = true,
  className = '',
  style,
  ...props
}) => {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trend, setTrend] = useState('neutral');
  const [scoreHistory, setScoreHistory] = useState([]);
  const [previousScore, setPreviousScore] = useState(0);
  const [growthData, setGrowthData] = useState({
    monthly_growth: 0,
    weekly_growth: 0,
    activities_completed: 0,
    skill_improvements: 0,
    network_growth: 0
  });

  // Fetch growth score
  const fetchGrowthScore = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch from the API
      // For now, we'll simulate with a mock response
      const mockResponse = {
        success: true,
        data: {
          growth_score: Math.floor(Math.random() * 100),
          growth_score_updated: new Date().toISOString(),
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'neutral' : 'down',
          monthly_growth: Math.floor(Math.random() * 20) - 5,
          weekly_growth: Math.floor(Math.random() * 10) - 2,
          activities_completed: Math.floor(Math.random() * 50),
          skill_improvements: Math.floor(Math.random() * 10),
          network_growth: Math.floor(Math.random() * 15),
          breakdown: {
            profile_updates: Math.floor(Math.random() * 25) + 60,
            skill_additions: Math.floor(Math.random() * 20) + 70,
            network_expansion: Math.floor(Math.random() * 15) + 50,
            activity_engagement: Math.floor(Math.random() * 30) + 65,
            content_creation: Math.floor(Math.random() * 25) + 55,
          },
          achievements: [
            'Profile completed',
            '10+ connections made',
            '5 skills added',
            'Active for 30 days',
            'Posted 3 times'
          ],
          recommendations: [
            'Update your profile regularly',
            'Add more relevant skills',
            'Engage with your network',
            'Share valuable content',
            'Participate in discussions'
          ]
        }
      };
      
      if (mockResponse.success) {
        const newScore = mockResponse.data.growth_score;
        const newTrend = mockResponse.data.trend;
        setPreviousScore(score);
        setScore(newScore);
        setTrend(newTrend);
        setScoreHistory(prev => [...prev.slice(-9), newScore]); // Keep last 10 scores
        setGrowthData({
          monthly_growth: mockResponse.data.monthly_growth,
          weekly_growth: mockResponse.data.weekly_growth,
          activities_completed: mockResponse.data.activities_completed,
          skill_improvements: mockResponse.data.skill_improvements,
          network_growth: mockResponse.data.network_growth
        });
      } else {
        throw new Error('Failed to fetch growth score');
      }
    } catch (err) {
      setError(err.message);
      // Fallback to a default score
      setScore(50);
      setTrend('neutral');
    } finally {
      setLoading(false);
    }
  };

  // Fetch score on mount and when userId changes
  useEffect(() => {
    fetchGrowthScore();
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

  // Get trend icon and color
  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg
          className="h-4 w-4 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      );
    } else if (trend === 'down') {
      return (
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
            d="M13 17h8m0 0V9m0 0l-8-8-4-4-6 6"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="h-4 w-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14"
          />
        </svg>
      );
    }
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
          <span className="text-sm font-medium text-gray-700">Growth:</span>
          <span className={cn('text-sm font-bold', getScoreColor(score))}>
            {formatScore(score)}
          </span>
        </div>
        {showTrend && (
          <div className="flex items-center">
            {getTrendIcon()}
            <span className={cn(
              'text-xs ml-1',
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
            )}>
              {trend === 'up' ? '+' : trend === 'down' ? '' : ''}
              {Math.abs(growthData.weekly_growth)}%
            </span>
          </div>
        )}
        {showTooltip && (
          <Tooltip
            content={
              <div className="p-2">
                <div className="font-medium">Growth Score: {score}/100</div>
                <div className="text-sm text-gray-600 mt-1">
                  Your improvement and engagement over time
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Weekly: {growthData.weekly_growth > 0 ? '+' : ''}{growthData.weekly_growth}%
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
          <span className="text-sm font-medium text-gray-700">Growth Score</span>
          {showTooltip && (
            <Tooltip
              content={
                <div className="p-2">
                  <div className="font-medium">Growth Score: {score}/100</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Your improvement and engagement over time
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Weekly: {growthData.weekly_growth > 0 ? '+' : ''}{growthData.weekly_growth}%
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
          {showTrend && (
            <div className="flex items-center">
              {getTrendIcon()}
              <span className={cn(
                'text-xs ml-1',
                trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
              )}>
                {trend === 'up' ? '+' : trend === 'down' ? '' : ''}
                {Math.abs(growthData.weekly_growth)}%
              </span>
            </div>
          )}
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

      {/* Growth Metrics */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Activities:</span>
          <span className="font-medium">{growthData.activities_completed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Skills:</span>
          <span className="font-medium">{growthData.skill_improvements}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Network:</span>
          <span className="font-medium">+{growthData.network_growth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Monthly:</span>
          <span className={cn(
            'font-medium',
            growthData.monthly_growth > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {growthData.monthly_growth > 0 ? '+' : ''}{growthData.monthly_growth}%
          </span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">Score Breakdown:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Profile Updates:</span>
                <span>85%</span>
              </div>
              <div className="flex justify-between">
                <span>Skill Additions:</span>
                <span>72%</span>
              </div>
              <div className="flex justify-between">
                <span>Network Expansion:</span>
                <span>68%</span>
              </div>
              <div className="flex justify-between">
                <span>Activity Engagement:</span>
                <span>45%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score History */}
      {scoreHistory.length > 1 && (
        <div className="mt-3">
          <div className="text-xs text-gray-600 mb-1">Recent Progress</div>
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
 * GrowthScoreCard component for dashboard
 * @param {Object} props - Component props
 * @returns {JSX.Element} GrowthScoreCard
 */
export const GrowthScoreCard = (props) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Growth Score</h3>
        <GrowthScore compact={true} userId={props.userId} />
      </div>
      <GrowthScore
        userId={props.userId}
        showProgress={true}
        showTrend={true}
        showDetails={true}
        showTooltip={false}
        {...props}
      />
    </div>
  );
};

/**
 * GrowthScoreProgress component
 * @param {Object} props - Component props
 * @returns {JSX.Element} GrowthScoreProgress
 */
export const GrowthScoreProgress = (props) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <GrowthScore
        userId={props.userId}
        compact={false}
        showProgress={true}
        showTrend={true}
        showDetails={true}
        showTooltip={false}
        {...props}
      />
    </div>
  );
};

export default GrowthScore;
