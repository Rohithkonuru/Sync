/**
 * Clean ProfileCard component with enhanced features
 */

import React, { useState } from 'react';
import { cn } from '../utils/helpers';
import { formatRelativeTime } from '../utils/helpers';
import { Avatar, AvatarWithStatus } from './Avatar';
import { Badge } from './BaseComponents';
import { Button } from './Button';
import { Tooltip } from './BaseComponents';
import SyncScore from './SyncScore';
import GrowthScore from './GrowthScore';

/**
 * ProfileCard component props
 * @typedef {Object} ProfileCardProps
 * @property {Object} user - User data
 * @property {boolean} [showActions=true] - Show action buttons
 * @property {boolean} [showScores=true] - Show scores
 * @property {boolean} [showConnections=true] - Show connections
 * @property {boolean} [showStatus=true] - Show online status
 * @property {boolean} [compact=false] - Compact view
 * @property {boolean} [showTooltip=true] - Show tooltips
 * @property {Function} [onConnect] - Connect handler
 * @property {Function} [onMessage] - Message handler
 * @property {Function} [onViewProfile] - View profile handler
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Enhanced ProfileCard component
 * @param {ProfileCardProps} props - Component props
 * @returns {JSX.Element} ProfileCard component
 */
const ProfileCard = ({
  user,
  showActions = true,
  showScores = true,
  showConnections = true,
  showStatus = true,
  compact = false,
  showTooltip = true,
  onConnect,
  onMessage,
  onViewProfile,
  className = '',
  ...props
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(
    user?.connections?.includes(user?.id) || false
  );

  // Handle connect action
  const handleConnect = async () => {
    if (isConnected) return;
    
    setIsConnecting(true);
    try {
      await onConnect?.(user.id);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle message action
  const handleMessage = () => {
    onMessage?.(user);
  };

  // Handle view profile action
  const handleViewProfile = () => {
    onViewProfile?.(user);
  };

  // Get user display name
  const displayName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  const headline = user?.headline || '';
  const location = user?.location || '';
  const skills = user?.skills || [];
  const connectionsCount = user?.connections?.length || 0;

  // Size classes
  const sizeClasses = compact
    ? 'p-4'
    : 'p-6';

  // Card content
  const cardContent = (
    <div className={cn('w-full', sizeClasses, className)} {...props}>
      {/* Header Section */}
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {showStatus ? (
            <AvatarWithStatus
              src={user?.profile_picture}
              name={displayName}
              size={compact ? 'large' : 'xl'}
              isOnline={user?.is_online}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleViewProfile}
            />
          ) : (
            <Avatar
              src={user?.profile_picture}
              name={displayName}
              size={compact ? 'large' : 'xl'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleViewProfile}
            />
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          {/* Name and Title */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {displayName}
              </h3>
              {headline && (
                <p className="text-sm text-gray-600 truncate mt-1">
                  {headline}
                </p>
              )}
            </div>
            
            {/* Status Badge */}
            {user?.user_type && (
              <Badge
                variant={user.user_type === 'recruiter' ? 'primary' : 'info'}
                size="small"
                className="ml-2"
              >
                {user.user_type === 'recruiter' ? 'Recruiter' : 'Candidate'}
              </Badge>
            )}
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {location}
            </div>
          )}

          {/* Connections */}
          {showConnections && (
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v-1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {connectionsCount} connections
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, compact ? 3 : 5).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="info"
                    size="small"
                    className="text-xs"
                  >
                    {skill}
                  </Badge>
                ))}
                {skills.length > (compact ? 3 : 5) && (
                  <Badge
                    variant="ghost"
                    size="small"
                    className="text-xs"
                  >
                    +{skills.length - (compact ? 3 : 5)} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scores Section */}
      {showScores && !compact && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-3">
            {/* Sync Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Sync Score</span>
                {showTooltip && (
                  <Tooltip content="Sync Score reflects profile completeness and activity on Sync">
                    <svg
                      className="h-3 h-3 text-gray-400 cursor-help"
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
              <SyncScore userId={user?.id} compact={true} />
            </div>

            {/* Growth Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Growth Score</span>
                {showTooltip && (
                  <Tooltip content="Growth Score reflects your improvement and engagement over time">
                    <svg
                      className="h-3 h-3 text-gray-400 cursor-help"
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
              <GrowthScore userId={user?.id} compact={true} />
            </div>

            {/* ATS Score */}
            {user?.ats_score?.score && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">ATS Score</span>
                  {showTooltip && (
                    <Tooltip content="ATS Score reflects resume quality and job match">
                      <svg
                        className="h-3 h-3 text-gray-400 cursor-help"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.707.293H19a2 2 0 012 2z"
                        />
                      </svg>
                    </Tooltip>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {user.ats_score.score}
                  </div>
                  <div className="text-xs text-gray-500">
                    /100
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions Section */}
      {showActions && !compact && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            {/* View Profile */}
            <Button
              variant="ghost"
              size="small"
              onClick={handleViewProfile}
              className="flex-1"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S4.732 16.057 3.458 12z"
                />
              </svg>
              View Profile
            </Button>

            {/* Message */}
            <Button
              variant="ghost"
              size="small"
              onClick={handleMessage}
              className="flex-1"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949M3 10.343a9.863 9.863 0 014.255.949"
                />
              </svg>
              Message
            </Button>

            {/* Connect */}
            <Button
              variant={isConnected ? 'secondary' : 'primary'}
              size="small"
              onClick={handleConnect}
              disabled={isConnected || isConnecting}
              loading={isConnecting}
              className="flex-1"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v-1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {isConnected ? 'Connected' : 'Connect'}
            </Button>
          </div>
        </div>
      )}

      {/* Last Active */}
      {!compact && user?.last_login && (
        <div className="mt-3 text-xs text-gray-500">
          Last active {formatRelativeTime(user.last_login)}
        </div>
      )}
    </div>
  );

  // Wrap with tooltip if enabled
  if (showTooltip && !compact) {
    return (
      <Tooltip
        content={
          <div className="p-2">
            <div className="font-medium">{displayName}</div>
            {headline && <div className="text-sm text-gray-600">{headline}</div>}
            {location && <div className="text-sm text-gray-600">{location}</div>}
            <div className="text-sm text-gray-600 mt-1">
              {connectionsCount} connections • {skills.length} skills
            </div>
          </div>
        }
      >
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
};

/**
 * Compact ProfileCard for lists
 * @param {Object} props - Component props
 * @returns {JSX.Element} Compact ProfileCard
 */
export const CompactProfileCard = (props) => {
  return <ProfileCard compact={true} {...props} />;
};

/**
 * ProfileCard with enhanced features
 * @param {Object} props - Component props
 * @returns {JSX.Element} Enhanced ProfileCard
 */
export const EnhancedProfileCard = (props) => {
  return <ProfileCard showTooltip={true} showScores={true} {...props} />;
};

export default ProfileCard;
