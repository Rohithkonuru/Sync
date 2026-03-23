import React, { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash-es';
import { motion, AnimatePresence } from 'framer-motion';
import { FiImageOff } from 'react-icons/fi';

const LazyImage = ({ src, alt, className = '', onLoad = () => {} }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entries[0].target);
        }
      },
      { rootMargin: '50px' }
    );

    const img = document.createElement('img');
    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <FiImageOff className="text-gray-400 w-8 h-8" />
        </div>
      )}

      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        src={imageSrc}
        alt={alt}
        className={className}
        onLoad={() => {
          setIsLoading(false);
          onLoad();
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

export default LazyImage;
