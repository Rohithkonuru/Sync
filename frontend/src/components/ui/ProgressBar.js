import React from 'react';
import { motion } from 'framer-motion';

/**
 * Progress Bar Component
 * 
 * @param {number} value - Progress value (0-100)
 * @param {string} color - Color theme
 * @param {boolean} showLabel - Show percentage label
 */
const ProgressBar = ({
  value = 0,
  color = 'primary',
  showLabel = false,
  label,
  className = '',
  ...props
}) => {
  const colorClasses = {
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    primary: 'bg-primary-500',
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-neutral-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-semibold text-neutral-900">
            {clampedValue}%
          </span>
        </div>
      )}
      <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full ${colorClasses[color] || colorClasses.primary} rounded-full`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

