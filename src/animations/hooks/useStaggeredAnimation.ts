/**
 * Paradox Animation Hook - useStaggeredAnimation
 * Utilities for staggered list animations
 */

import { useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { stagger as staggerDelays } from '../springs';

interface UseStaggeredAnimationOptions {
  /**
   * Delay between each item animation
   */
  staggerDelay?: number;
  /**
   * Initial delay before first item animates
   */
  initialDelay?: number;
  /**
   * Trigger animation on mount
   */
  autoPlay?: boolean;
}

export function useStaggeredAnimation(
  itemCount: number,
  options: UseStaggeredAnimationOptions = {}
) {
  const {
    staggerDelay = staggerDelays.normal,
    initialDelay = 0.1,
    autoPlay = true,
  } = options;

  const controls = useAnimation();

  useEffect(() => {
    if (autoPlay) {
      controls.start('visible');
    }
  }, [controls, autoPlay]);

  const variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return {
    controls,
    containerVariants: variants,
    itemVariants,
    /**
     * Manually trigger the animation
     */
    play: () => controls.start('visible'),
    /**
     * Reset animation to initial state
     */
    reset: () => controls.start('hidden'),
  };
}

/**
 * Calculate stagger delay based on item index
 */
export function getStaggerDelay(
  index: number,
  baseDelay: number = staggerDelays.normal,
  maxItems: number = 10
): number {
  // Cap stagger for large lists to prevent long waits
  const cappedIndex = Math.min(index, maxItems);
  return cappedIndex * baseDelay;
}
