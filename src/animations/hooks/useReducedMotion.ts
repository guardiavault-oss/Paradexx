/**
 * Paradox Animation Hook - useReducedMotion
 * Respects user's prefers-reduced-motion setting
 */

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to get animation-aware transition config
 * Returns instant transitions when reduced motion is preferred
 */
export function useAnimationConfig() {
  const shouldReduceMotion = useReducedMotion();

  return {
    shouldReduceMotion,
    transition: shouldReduceMotion
      ? { duration: 0 }
      : undefined,
  };
}
