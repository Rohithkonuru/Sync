import React from 'react';
import { motion } from 'framer-motion';

/**
 * Input Component
 * 
 * @param {string} type - Input type
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {object} icon - Icon component
 * @param {string} error - Error message
 */
const Input = ({
  label,
  type = 'text',
  size = 'md',
  icon: Icon,
  error,
  helperText,
  fullWidth = true,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const baseClasses = 'w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors';
  const stateClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          type={type}
          className={`${baseClasses} ${sizeClasses[size]} ${stateClasses} ${Icon ? 'pl-10' : ''} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id || 'input'}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          id={`${props.id || 'input'}-error`}
          className="mt-1.5 text-sm text-red-600"
          role="alert"
        >
          {error}
        </motion.p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;

