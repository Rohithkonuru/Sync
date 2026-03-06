/**
 * Clean Avatar component with variants and states
 */

import React from 'react';
import { cn } from '../utils/helpers';
import { getInitials } from '../utils/helpers';

/**
 * Avatar component props
 * @typedef {Object} AvatarProps
 * @property {string} [src] - Image source
 * @property {string} [alt] - Alt text
 * @property {string} [name] - User name for initials
 * @property {string} [size='medium'] - Avatar size
 * @property {string} [variant='circular'] - Avatar variant
 * @property {boolean} [showInitials=true] - Show initials when no image
 * @property {string} [backgroundColor] - Background color
 * @property {string} [textColor] - Text color
 * @property {boolean} [border=false] - Show border
 * @property {boolean} [shadow=false] - Show shadow
 * @property {React.ReactNode} [children] - Custom content
 * @property {string} [className] - Additional CSS classes
 * @property {Object} [style] - Inline styles
 * @property {Function} [onError] - Image error handler
 * @property {Function} [onClick] - Click handler
 */

/**
 * Avatar component with image fallback to initials
 * @param {AvatarProps} props - Avatar props
 * @returns {JSX.Element} Avatar component
 */
const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'medium',
  variant = 'circular',
  showInitials = true,
  backgroundColor,
  textColor,
  border = false,
  shadow = false,
  children,
  className = '',
  style,
  onError,
  onClick,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Size classes
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    small: 'h-8 w-8 text-sm',
    medium: 'h-10 w-10 text-base',
    large: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl',
    '3xl': 'h-24 w-24 text-3xl',
  };

  // Variant classes
  const variantClasses = {
    circular: 'rounded-full',
    rounded: 'rounded-md',
    square: 'rounded-none',
  };

  // Generate background color if not provided
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-gray-500',
      'bg-teal-500',
      'bg-orange-500',
    ];
    
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // Handle image error
  const handleImageError = (e) => {
    setImageError(true);
    setImageLoaded(false);
    onError?.(e);
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageError(false);
    setImageLoaded(true);
  };

  // Get initials
  const initials = getInitials(name);

  // Base classes
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium text-white relative overflow-hidden',
    sizeClasses[size],
    variantClasses[variant],
    border && 'ring-2 ring-white ring-offset-2 ring-offset-gray-100',
    shadow && 'shadow-lg',
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  );

  // Background style
  const backgroundStyle = {
    backgroundColor: imageLoaded || imageError ? undefined : getBackgroundColor(),
    ...style,
  };

  // Render content
  const renderContent = () => {
    // Custom content takes precedence
    if (children) {
      return children;
    }

    // Render image if available and loaded
    if (src && !imageError && imageLoaded) {
      return (
        <img
          src={src}
          alt={alt || name}
          className="h-full w-full object-cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      );
    }

    // Render initials if no image or image error
    if (showInitials && initials) {
      return (
        <span className={cn('font-medium', textColor || 'text-white')}>
          {initials}
        </span>
      );
    }

    // Default fallback icon
    return (
      <svg
        className="h-1/2 w-1/2 text-white opacity-50"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div
      className={baseClasses}
      style={backgroundStyle}
      onClick={onClick}
      {...props}
    >
      {renderContent()}
      
      {/* Loading state */}
      {src && !imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};

/**
 * Avatar group component
 * @param {Object} props - Component props
 * @param {React.ReactNode} [props.children] - Avatar children
 * @param {boolean} [props.stack=true] - Stack avatars
 * @param {number} [props.max=3] - Maximum avatars to show
 * @param {string} [props.size='medium'] - Avatar size
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Avatar group component
 */
export const AvatarGroup = ({
  children,
  stack = true,
  max = 3,
  size = 'medium',
  className = '',
  ...props
}) => {
  const avatars = React.Children.toArray(children).slice(0, max);
  const remainingCount = React.Children.count(children) - max;

  const sizeClasses = {
    xs: 'h-6 w-6',
    small: 'h-8 w-8',
    medium: 'h-10 w-10',
    large: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-20 w-20',
    '3xl': 'h-24 w-24',
  };

  if (stack) {
    return (
      <div className={cn('flex -space-x-2', className)} {...props}>
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className={cn(
              'ring-2 ring-white',
              sizeClasses[size]
            )}
            style={{ zIndex: avatars.length - index }}
          >
            {avatar}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              'flex items-center justify-center bg-gray-100 text-gray-600 rounded-full ring-2 ring-white',
              sizeClasses[size]
            )}
            style={{ zIndex: 0 }}
          >
            <span className="text-xs font-medium">+{remainingCount}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)} {...props}>
      {avatars}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center bg-gray-100 text-gray-600 rounded-full',
            sizeClasses[size]
          )}
        >
          <span className="text-xs font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Avatar with status indicator
 * @param {Object} props - Component props
 * @param {string} [props.status] - Status indicator
 * @param {string} [props.statusPosition='bottom-right'] - Status position
 * @param {string} [props.statusColor='green'] - Status color
 * @returns {JSX.Element} Avatar with status
 */
export const AvatarWithStatus = ({
  status,
  statusPosition = 'bottom-right',
  statusColor = 'green',
  className = '',
  ...props
}) => {
  const statusColors = {
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
    blue: 'bg-blue-400',
    gray: 'bg-gray-400',
    purple: 'bg-purple-400',
    pink: 'bg-pink-400',
  };

  const statusPositions = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar {...props} />
      {status && (
        <div
          className={cn(
            'absolute h-3 w-3 rounded-full ring-2 ring-white',
            statusColors[statusColor],
            statusPositions[statusPosition]
          )}
        />
      )}
    </div>
  );
};

/**
 * Avatar with presence indicator
 * @param {Object} props - Component props
 * @param {boolean} [props.isOnline=false] - Online status
 * @param {string} [props.presencePosition='bottom-right'] - Presence position
 * @returns {JSX.Element} Avatar with presence
 */
export const AvatarWithPresence = ({
  isOnline = false,
  presencePosition = 'bottom-right',
  className = '',
  ...props
}) => {
  return (
    <AvatarWithStatus
      status={isOnline ? 'green' : 'gray'}
      statusPosition={presencePosition}
      className={className}
      {...props}
    />
  );
};

/**
 * Avatar with badge
 * @param {Object} props - Component props
 * @param {React.ReactNode} [props.badge] - Badge content
 * @param {string} [props.badgePosition='top-right'] - Badge position
 * @param {string} [props.badgeColor='red'] - Badge color
 * @returns {JSX.Element} Avatar with badge
 */
export const AvatarWithBadge = ({
  badge,
  badgePosition = 'top-right',
  badgeColor = 'red',
  className = '',
  ...props
}) => {
  const badgeColors = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
  };

  const badgePositions = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar {...props} />
      {badge && (
        <div
          className={cn(
            'absolute flex items-center justify-center h-5 w-5 rounded-full text-xs text-white font-bold ring-2 ring-white',
            badgeColors[badgeColor],
            badgePositions[badgePosition]
          )}
        >
          {badge}
        </div>
      )}
    </div>
  );
};

// Predefined avatar configurations
export const UserAvatar = (props) => <Avatar variant="circular" {...props} />;
export const CompanyAvatar = (props) => <Avatar variant="rounded" {...props} />;
export const SquareAvatar = (props) => <Avatar variant="square" {...props} />;

export default Avatar;
