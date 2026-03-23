import { useEffect, useRef, useCallback } from 'react';

const useInfiniteScroll = (callback, options = {}) => {
  const { threshold = 0.5, rootMargin = '0px 0px 200px 0px' } = options;
  const observerTarget = useRef(null);

  const handleIntersection = useCallback(
    (entries) => {
      if (entries[0].isIntersecting) {
        callback?.();
      }
    },
    [callback]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  return observerTarget;
};

export default useInfiniteScroll;
