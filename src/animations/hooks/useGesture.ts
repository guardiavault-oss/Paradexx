/**
 * Paradox Animation Hook - useGesture
 * Advanced gesture handling with spring physics
 */

import { useRef, useState, useCallback } from 'react';
import { PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { swipeThresholds, pullToRefresh as pullConfig } from '../gestures';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGesture(handlers: SwipeHandlers) {
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      // Check horizontal swipe
      if (Math.abs(velocity.x) > swipeThresholds.velocity) {
        if (offset.x > swipeThresholds.distance && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (offset.x < -swipeThresholds.distance && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }

      // Check vertical swipe
      if (Math.abs(velocity.y) > swipeThresholds.velocity) {
        if (offset.y > swipeThresholds.distance && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (offset.y < -swipeThresholds.distance && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    },
    [handlers]
  );

  return {
    drag: true as const,
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragElastic: 0.2,
    onDragEnd: handleDragEnd,
  };
}

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
}

export function usePullToRefresh(options: PullToRefreshOptions) {
  const { onRefresh, threshold = pullConfig.threshold } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);

  // Calculate progress (0-1)
  const progress = useTransform(y, [0, threshold], [0, 1]);

  // Calculate opacity for refresh indicator
  const opacity = useTransform(progress, [0, 0.5, 1], [0, 0.5, 1]);

  // Calculate rotation for refresh icon
  const rotate = useTransform(progress, [0, 1], [0, 180]);

  const handleDragEnd = useCallback(
    async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          y.set(0);
        }
      } else {
        y.set(0);
      }
    },
    [threshold, isRefreshing, onRefresh, y]
  );

  return {
    // Drag props
    drag: 'y' as const,
    dragConstraints: { top: 0, bottom: threshold * 1.5 },
    dragElastic: pullConfig.resistance,
    onDragEnd: handleDragEnd,
    style: { y },

    // State
    isRefreshing,
    progress,
    opacity,
    rotate,
  };
}

interface LongPressOptions {
  onLongPress: () => void;
  delay?: number;
}

export function useLongPress(options: LongPressOptions) {
  const { onLongPress, delay = 500 } = options;
  const timerRef = useRef<NodeJS.Timeout>();
  const [isLongPressing, setIsLongPressing] = useState(false);

  const start = useCallback(() => {
    setIsLongPressing(true);
    timerRef.current = setTimeout(() => {
      onLongPress();
      setIsLongPressing(false);
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsLongPressing(false);
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    isLongPressing,
  };
}

/**
 * Hook for elastic drag with boundaries
 */
export function useElasticDrag(bounds: { left?: number; right?: number }) {
  const x = useMotionValue(0);

  const handleDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset } = info;
      let newX = offset.x;

      // Apply elastic resistance at boundaries
      if (bounds.left !== undefined && newX < bounds.left) {
        newX = bounds.left + (newX - bounds.left) * swipeThresholds.resist;
      }
      if (bounds.right !== undefined && newX > bounds.right) {
        newX = bounds.right + (newX - bounds.right) * swipeThresholds.resist;
      }

      x.set(newX);
    },
    [bounds, x]
  );

  return {
    drag: 'x' as const,
    style: { x },
    onDrag: handleDrag,
    dragElastic: 0,
  };
}
