/**
 * Clean Button component with variants and loading states
 */

import React from 'react';
import { cn } from '../utils/helpers';
import { Loading } from './BaseComponents';

/**
 * Button component props
 * @typedef {Object} ButtonProps
 * @property {string} [variant='primary'] - Button variant
 * @property {string} [size='medium'] - Button size
 * @property {boolean} [disabled=false] - Disabled state
 * @property {boolean} [loading=false] - Loading state
 * @property {boolean} [fullWidth=false] - Full width
 * @property {string} [type='button'] - Button type
 * @property {React.ReactNode} [children] - Button content
 * @property {Function} [onClick] - Click handler
 * @property {string} [className] - Additional CSS classes
 * @property {Object} [style] - Inline styles
 * @property {string} [href] - Link href (for link-style buttons)
 * @property {string} [target] - Link target
 * @property {boolean} [outline=false] - Outline variant
 * @property {boolean} [ghost=false] - Ghost variant
 * @property {string} [leftIcon] - Left icon
 * @property {string} [rightIcon] - Right icon
 */

/**
 * Button component with multiple variants and states
 * @param {ButtonProps} props - Button props
 * @returns {JSX.Element} Button component
 */
const Button = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  children,
  onClick,
  className = '',
  style,
  href,
  target,
  outline = false,
  ghost = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size classes
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm rounded-md',
    medium: 'px-4 py-2 text-sm rounded-md',
    large: 'px-6 py-3 text-base rounded-lg',
  };

  // Variant classes
  const getVariantClasses = () => {
    const variants = {
      primary: {
        normal: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
        ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      },
      secondary: {
        normal: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        outline: 'border-2 border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
        ghost: 'text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
      },
      success: {
        normal: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
        ghost: 'text-green-600 hover:bg-green-50 focus:ring-green-500',
      },
      warning: {
        normal: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
        outline: 'border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500',
        ghost: 'text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500',
      },
      danger: {
        normal: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'border-2 border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
        ghost: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
      },
      info: {
        normal: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
        ghost: 'text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
      },
      ghost: {
        normal: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      },
    };

    const styleType = outline ? 'outline' : ghost ? 'ghost' : 'normal';
    return variants[variant]?.[styleType] || variants.primary.normal;
  };

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Combine all classes
  const combinedClasses = cn(
    baseClasses,
    sizeClasses[size],
    getVariantClasses(),
    widthClasses,
    className
  );

  // Loading spinner
  const loadingSpinner = (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Icon component
  const IconComponent = ({ icon, position }) => {
    if (!icon) return null;
    
    const iconClasses = position === 'left' ? 'mr-2' : 'ml-2';
    
    return (
      <span className={iconClasses}>
        {icon}
      </span>
    );
  };

  // Render as link if href is provided
  if (href) {
    return (
      <a
        href={href}
        target={target}
        className={combinedClasses}
        style={style}
        disabled={disabled || loading}
        {...props}
      >
        {loading && loadingSpinner}
        {!loading && <IconComponent icon={leftIcon} position="left" />}
        {loading ? 'Loading...' : children}
        {!loading && <IconComponent icon={rightIcon} position="right" />}
      </a>
    );
  }

  // Render as button
  return (
    <button
      type={type}
      className={combinedClasses}
      style={style}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && loadingSpinner}
      {!loading && <IconComponent icon={leftIcon} position="left" />}
      {loading ? 'Loading...' : children}
      {!loading && <IconComponent icon={rightIcon} position="right" />}
    </button>
  );
};

/**
 * Button group component
 * @param {Object} props - Component props
 * @param {React.ReactNode} [props.children] - Button children
 * @param {boolean} [props.vertical=false] - Vertical layout
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Button group component
 */
export const ButtonGroup = ({
  children,
  vertical = false,
  className = '',
  ...props
}) => {
  const groupClasses = cn(
    'inline-flex',
    vertical ? 'flex-col' : 'flex-row',
    className
  );

  return (
    <div className={groupClasses} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          const roundedClasses = vertical
            ? cn(
                isFirst ? 'rounded-t-md rounded-b-none' : '',
                isLast ? 'rounded-b-md rounded-t-none' : 'rounded-none'
              )
            : cn(
                isFirst ? 'rounded-l-md rounded-r-none' : '',
                isLast ? 'rounded-r-md rounded-l-none' : 'rounded-none'
              );

          return React.cloneElement(child, {
            className: cn(child.props.className, roundedClasses),
          });
        }
        return child;
      })}
    </div>
  );
};

/**
 * IconButton component
 * @param {Object} props - Component props
 * @param {React.ReactNode} [props.icon] - Icon to display
 * @param {string} [props.ariaLabel] - Accessibility label
 * @param {string} [props.size='medium'] - Button size
 * @param {string} [props.variant='ghost'] - Button variant
 * @param {boolean} [props.circular=true] - Circular shape
 * @returns {JSX.Element} IconButton component
 */
export const IconButton = ({
  icon,
  ariaLabel,
  size = 'medium',
  variant = 'ghost',
  circular = true,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-3',
  };

  const shapeClasses = circular ? 'rounded-full' : 'rounded-md';

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(
        sizeClasses[size],
        shapeClasses,
        'p-2',
        className
      )}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </Button>
  );
};

/**
 * Floating action button
 * @param {Object} props - Component props
 * @param {React.ReactNode} [props.icon] - Icon to display
 * @param {string} [props.position='bottom-right'] - Position
 * @param {string} [props.size='large'] - Button size
 * @param {string} [props.variant='primary'] - Button variant
 * @returns {JSX.Element} FAB component
 */
export const FloatingActionButton = ({
  icon,
  position = 'bottom-right',
  size = 'large',
  variant = 'primary',
  className = '',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const sizeClasses = {
    small: 'h-10 w-10',
    medium: 'h-12 w-12',
    large: 'h-14 w-14',
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(
        'fixed shadow-lg hover:shadow-xl',
        positionClasses[position],
        sizeClasses[size],
        'rounded-full',
        className
      )}
      {...props}
    >
      {icon}
    </Button>
  );
};

// Predefined button configurations
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const WarningButton = (props) => <Button variant="warning" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const InfoButton = (props) => <Button variant="info" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const OutlineButton = (props) => <Button outline {...props} />;

export default Button;
