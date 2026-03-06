/**
 * Base component with common functionality
 */

import React from 'react';
import { cn } from '../utils/helpers';

/**
 * Base component props
 * @typedef {Object} BaseComponentProps
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Child components
 * @property {string} [id] - Component ID
 * @property {Object} [style] - Inline styles
 */

/**
 * Base component with common functionality
 * @param {BaseComponentProps} props - Component props
 * @returns {JSX.Element} Base component
 */
export const BaseComponent = ({
  className = '',
  children,
  id,
  style,
  ...props
}) => {
  const baseClasses = 'base-component';
  const combinedClasses = cn(baseClasses, className);

  return (
    <div
      id={id}
      className={combinedClasses}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Loading component
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Loading state
 * @param {string} [props.size='medium'] - Size variant
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.message] - Loading message
 * @returns {JSX.Element} Loading component
 */
export const Loading = ({
  loading = true,
  size = 'medium',
  className = '',
  message = 'Loading...',
  ...props
}) => {
  if (!loading) return null;

  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)} {...props}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size]
        )}
      />
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

/**
 * Error component
 * @param {Object} props - Component props
 * @param {string} props.error - Error message
 * @param {Function} [props.onRetry] - Retry function
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Error component
 */
export const ErrorComponent = ({
  error,
  onRetry,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-4 text-center',
        className
      )}
      {...props}
    >
      <div className="text-red-500 mb-2">
        <svg
          className="h-8 w-8"
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
      </div>
      <p className="text-sm text-gray-600 mb-3">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

/**
 * Empty state component
 * @param {Object} props - Component props
 * @param {string} [props.title] - Empty state title
 * @param {string} [props.description] - Empty state description
 * @param {React.ReactNode} [props.icon] - Empty state icon
 * @param {React.ReactNode} [props.action] - Action button
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Empty state component
 */
export const EmptyState = ({
  title = 'No data found',
  description = 'There is no data to display at the moment.',
  icon,
  action,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {action && action}
    </div>
  );
};

/**
 * Card component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.hover=true] - Hover effect
 * @param {boolean} [props.shadow=true] - Shadow effect
 * @param {boolean} [props.border=true] - Border effect
 * @param {React.ReactNode} [props.children] - Card content
 * @returns {JSX.Element} Card component
 */
export const Card = ({
  className = '',
  hover = true,
  shadow = true,
  border = true,
  children,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';
  const shadowClasses = shadow ? 'shadow-md' : '';
  const borderClasses = border ? 'border border-gray-200' : '';

  return (
    <div
      className={cn(
        baseClasses,
        hoverClasses,
        shadowClasses,
        borderClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card header component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Header content
 * @returns {JSX.Element} Card header component
 */
export const CardHeader = ({ className = '', children, ...props }) => {
  return (
    <div
      className={cn('px-6 py-4 border-b border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card body component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Body content
 * @returns {JSX.Element} Card body component
 */
export const CardBody = ({ className = '', children, ...props }) => {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Card footer component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Footer content
 * @returns {JSX.Element} Card footer component
 */
export const CardFooter = ({ className = '', children, ...props }) => {
  return (
    <div
      className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50', className)}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Badge component
 * @param {Object} props - Component props
 * @param {string} [props.variant='default'] - Badge variant
 * @param {string} [props.size='medium'] - Badge size
 * @param {boolean} [props.rounded=true] - Rounded corners
 * @param {React.ReactNode} [props.children] - Badge content
 * @returns {JSX.Element} Badge component
 */
export const Badge = ({
  variant = 'default',
  size = 'medium',
  rounded = true,
  children,
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
  };

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base',
  };

  const roundedClasses = rounded ? 'rounded-full' : 'rounded';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * Separator component
 * @param {Object} props - Component props
 * @param {string} [props.orientation='horizontal'] - Separator orientation
 * @param {string} [props.variant='default'] - Separator variant
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Separator component
 */
export const Separator = ({
  orientation = 'horizontal',
  variant = 'default',
  className = '',
  ...props
}) => {
  const orientationClasses = {
    horizontal: 'w-full h-px',
    vertical: 'h-full w-px',
  };

  const variantClasses = {
    default: 'bg-gray-200',
    subtle: 'bg-gray-100',
    strong: 'bg-gray-300',
  };

  return (
    <div
      className={cn(
        orientationClasses[orientation],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};

/**
 * Skeleton component for loading states
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.lines=1] - Number of skeleton lines
 * @param {boolean} [props.circle=false] - Circle shape
 * @param {Object} [props.style] - Inline styles
 * @returns {JSX.Element} Skeleton component
 */
export const Skeleton = ({
  className = '',
  lines = 1,
  circle = false,
  style,
  ...props
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  const shapeClasses = circle ? 'rounded-full' : 'rounded';

  if (lines === 1) {
    return (
      <div
        className={cn(baseClasses, shapeClasses, className)}
        style={{
          width: circle ? '40px' : '100%',
          height: circle ? '40px' : '20px',
          ...style,
        }}
        {...props}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(baseClasses, shapeClasses)}
          style={{
            width: index === lines - 1 ? '60%' : '100%',
            height: '20px',
            ...style,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Tooltip component
 * @param {Object} props - Component props
 * @param {React.ReactNode} [props.children] - Tooltip trigger
 * @param {string} [props.content] - Tooltip content
 * @param {string} [props.position='top'] - Tooltip position
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Tooltip component
 */
export const Tooltip = ({
  children,
  content,
  position = 'top',
  className = '',
  ...props
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div className={cn('relative inline-block', className)} {...props}>
      {children}
      {content && (
        <div
          className={cn(
            'absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none',
            positionClasses[position]
          )}
        >
          {content}
          <div
            className={cn(
              'absolute border-4 border-transparent',
              position === 'top' && 'bottom-full left-1/2 transform -translate-x-1/2 border-t-gray-900',
              position === 'bottom' && 'top-full left-1/2 transform -translate-x-1/2 border-b-gray-900',
              position === 'left' && 'right-full top-1/2 transform -translate-y-1/2 border-l-gray-900',
              position === 'right' && 'left-full top-1/2 transform -translate-y-1/2 border-r-gray-900'
            )}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Modal component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Modal close function
 * @param {string} [props.title] - Modal title
 * @param {string} [props.size='medium'] - Modal size
 * @param {boolean} [props.closeOnOverlay=true] - Close on overlay click
 * @param {boolean} [props.showCloseButton=true] - Show close button
 * @param {React.ReactNode} [props.children] - Modal content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Modal component
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'medium',
  closeOnOverlay = true,
  showCloseButton = true,
  children,
  className = '',
  ...props
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default {
  BaseComponent,
  Loading,
  ErrorComponent,
  EmptyState,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Separator,
  Skeleton,
  Tooltip,
  Modal,
};
