import { useCallback, useRef } from 'react';

// Throttle hook for scroll and resize events
export const useThrottle = (callback: (...args: any[]) => void, delay = 100) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args: any[]) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

