import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable Card Component
 * 
 * @param {boolean} hover - Enable hover effect
 * @param {boolean} clickable - Make card clickable
 * @param {string} padding - 'none' | 'sm' | 'md' | 'lg'
 */
const Card = ({
  children,
  hover = false,
  clickable = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseClasses = 'bg-white rounded-xl border border-neutral-200 shadow-soft';
  const hoverClasses = hover || clickable ? 'hover:shadow-medium transition-shadow cursor-pointer' : '';
  const clickableClasses = clickable ? 'focus:outline-none focus:ring-2 focus:ring-primary-500' : '';

  const Component = clickable ? motion.div : 'div';
  const motionProps = clickable ? {
    whileHover: { y: -2 },
    whileTap: { y: 0 },
  } : {};

  return (
    <Component
      className={`${baseClasses} ${paddingClasses[padding]} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;

