import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ count = 3, variant = 'card' }) => {
  const skeletonVariants = {
    card: (
      <div key="skeleton-{index}" className="bg-white rounded-lg p-4 space-y-3 mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
        </div>
      </div>
    ),
    text: (
      <div key="skeleton-{index}" className="space-y-2 mb-4">
        <div className="h-4 bg-gray-300 rounded animate-pulse" />
        <div className="h-4 bg-gray-300 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
      </div>
    ),
  };

  const template = skeletonVariants[variant] || skeletonVariants.card;

  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        >
          {template}
        </motion.div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
