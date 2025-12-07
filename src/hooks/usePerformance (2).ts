/**
 * Performance Optimization Hooks
 * ==============================
 * Hooks for achieving 60fps performance in React applications
 * 
 * PERFORMANCE NOTES:
 * - 60fps = 16.67ms per frame budget
 * - Use GPU-accelerated properties: transform, opacity
 * - Avoid layout thrashing: batch DOM reads/writes
 * - Use will-change sparingly for animated elements
 */

import { 
  useCallback, 
  useEffect, 
  useLayoutEffect, 
  useMemo, 
  useRef, 
  useState,
  startTransition
} from 'react';

// ============================================================================
// REDUCED MOTION HOOK
// ============================================================================
/**
 * Detects if user prefers reduced motion
 * Use this to disable or reduce animations for accessibility
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// THROTTLED CALLBACK HOOK
// ============================================================================
/**
 * Throttles a callback to run at most once per specified delay
 * Perfect for scroll, resize, and mousemove handlers
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 16 // ~60fps
): T {
  const lastRun = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      } else {
        // Schedule trailing call
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, delay - (now - lastRun.current));
      }
    }) as T,
    [callback, delay]
  );
}

// ============================================================================
// DEBOUNCED VALUE HOOK
// ============================================================================
/**
 * Debounces a value to prevent excessive re-renders
 * Use for search inputs, filters, etc.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// REQUEST ANIMATION FRAME HOOK
// ============================================================================
/**
 * Runs a callback synchronized with the browser's refresh rate
 * Perfect for smooth animations at 60fps
 */
export function useRAF(callback: (deltaTime: number) => void, isActive: boolean = true): void {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);

  // Update callback ref on change
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) return;

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callbackRef.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive]);
}

// ============================================================================
// INTERSECTION OBSERVER HOOK (Lazy Loading)
// ============================================================================
/**
 * Observes when an element enters the viewport
 * Use for lazy loading images, components, or triggering animations
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement | null>, boolean] {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [elementRef, isIntersecting];
}

// ============================================================================
// VIRTUAL LIST HOOK
// ============================================================================
interface VirtualListConfig {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
}

interface VirtualListResult {
  virtualItems: Array<{ index: number; start: number; size: number }>;
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollToIndex: (index: number) => void;
}

/**
 * Virtualizes a list for rendering only visible items
 * Essential for large lists to maintain 60fps
 * 
 * USAGE:
 * const { virtualItems, totalHeight, containerRef } = useVirtualList({
 *   itemCount: 1000,
 *   itemHeight: 50,
 * });
 */
export function useVirtualList(config: VirtualListConfig): VirtualListResult {
  const { itemCount, itemHeight, overscan = 3, containerHeight = 400 } = config;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useThrottledCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    // Use startTransition to keep scroll smooth
    startTransition(() => {
      setScrollTop(target.scrollTop);
    });
  }, 16);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const virtualItems = useMemo(() => {
    const height = containerRef.current?.clientHeight || containerHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.floor((scrollTop + height) / itemHeight) + overscan
    );

    const items: Array<{ index: number; start: number; size: number }> = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        size: itemHeight,
      });
    }
    return items;
  }, [scrollTop, itemHeight, itemCount, overscan, containerHeight]);

  const totalHeight = itemCount * itemHeight;

  const scrollToIndex = useCallback((index: number) => {
    containerRef.current?.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth',
    });
  }, [itemHeight]);

  return { virtualItems, totalHeight, containerRef, scrollToIndex };
}

// ============================================================================
// STABLE CALLBACK HOOK
// ============================================================================
/**
 * Creates a stable callback reference that doesn't cause re-renders
 * Use for event handlers passed to memoized children
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef(callback);
  
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
}

// ============================================================================
// PREVIOUS VALUE HOOK
// ============================================================================
/**
 * Returns the previous value of a variable
 * Useful for comparing state changes and optimizing renders
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

// ============================================================================
// FRAME RATE MONITOR HOOK (Development Only)
// ============================================================================
interface FrameRateInfo {
  fps: number;
  frameTime: number;
  isLow: boolean;
}

/**
 * Monitors frame rate for performance debugging
 * Only use in development!
 */
export function useFrameRateMonitor(enabled: boolean = false): FrameRateInfo {
  const [info, setInfo] = useState<FrameRateInfo>({ fps: 60, frameTime: 16.67, isLow: false });
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV === 'production') return;

    let animationId: number;

    const measure = (currentTime: number) => {
      frameCountRef.current++;
      
      const elapsed = currentTime - lastTimeRef.current;
      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        const frameTime = elapsed / frameCountRef.current;
        
        setInfo({
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          isLow: fps < 55,
        });
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      animationId = requestAnimationFrame(measure);
    };

    animationId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animationId);
  }, [enabled]);

  return info;
}

// ============================================================================
// GPU ACCELERATION UTILITIES
// ============================================================================
/**
 * CSS properties for GPU acceleration
 * Apply these to animated elements for 60fps performance
 */
export const GPU_ACCELERATED_STYLES = {
  transform: 'translate3d(0, 0, 0)',
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
  willChange: 'transform, opacity',
} as const;

/**
 * Creates GPU-accelerated inline styles
 */
export function useGPUAcceleratedStyle(
  additionalStyles: React.CSSProperties = {}
): React.CSSProperties {
  return useMemo(() => ({
    ...GPU_ACCELERATED_STYLES,
    ...additionalStyles,
  }), [additionalStyles]);
}

// ============================================================================
// BATCH STATE UPDATES HOOK
// ============================================================================
/**
 * Batches multiple state updates to prevent layout thrashing
 * Use when updating multiple related states
 */
export function useBatchedUpdates<T extends Record<string, unknown>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState(initialState);
  
  const batchUpdate = useCallback((updates: Partial<T>) => {
    startTransition(() => {
      setState(prev => ({ ...prev, ...updates }));
    });
  }, []);

  return [state, batchUpdate];
}

// ============================================================================
// IDLE CALLBACK HOOK
// ============================================================================
/**
 * Runs low-priority work when the browser is idle
 * Use for analytics, prefetching, etc.
 */
export function useIdleCallback(
  callback: () => void,
  options: IdleRequestOptions = { timeout: 2000 }
): void {
  const callbackRef = useRef(callback);
  
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (typeof requestIdleCallback === 'undefined') {
      // Fallback for Safari
      const timeoutId = setTimeout(callbackRef.current, 1);
      return () => clearTimeout(timeoutId);
    }

    const id = requestIdleCallback(() => {
      callbackRef.current();
    }, options);

    return () => cancelIdleCallback(id);
  }, [options]);
}

// Export all hooks
export default {
  useReducedMotion,
  useThrottledCallback,
  useDebouncedValue,
  useRAF,
  useIntersectionObserver,
  useVirtualList,
  useStableCallback,
  usePrevious,
  useFrameRateMonitor,
  useGPUAcceleratedStyle,
  useBatchedUpdates,
  useIdleCallback,
  GPU_ACCELERATED_STYLES,
};
