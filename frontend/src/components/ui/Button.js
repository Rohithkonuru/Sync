import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable Button Component
 * Supports multiple variants, sizes, and states
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disable button
 * @param {string} theme - 'orange' | 'purple' | 'green' | 'blue' (for primary variant)
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  theme = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: {
      orange: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
      purple: 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-500',
      green: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
      blue: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
      default: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    },
    secondary: 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  };

  const getVariantClass = () => {
    if (variant === 'primary' && variantClasses.primary[theme]) {
      return variantClasses.primary[theme];
    }
    return variantClasses[variant] || variantClasses.primary.default;
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${getVariantClass()} ${widthClass} ${className}`}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2"
        />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-5 h-5 mr-2" />
      ) : null}
      {children}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className="w-5 h-5 ml-2" />
      )}
    </motion.button>
  );
};

export default Button;

