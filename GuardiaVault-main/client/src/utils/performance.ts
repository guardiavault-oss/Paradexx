// Performance optimization utilities
// Note: JSX components and React hooks have been moved to component files
// This utility file contains only pure TypeScript functions

// Throttle function for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
};

// Memoized selectors for expensive computations
export const createSelector = <T, R,>(...args: any[]): ((...params: T[]) => R) => {
  const resultFunc = args.pop();
  const dependencies = args;
  
  let lastDependencies: any[] = [];
  let lastResult: R;
  
  return (...params: T[]): R => {
    const currentDependencies = dependencies.map((dep: any) => dep(...params));
    
    const hasChanged = currentDependencies.some(
      (dep, index) => dep !== lastDependencies[index]
    );
    
    if (hasChanged) {
      lastDependencies = currentDependencies;
      lastResult = resultFunc(...currentDependencies);
    }
    
    return lastResult;
  };
};

// Request idle callback for non-critical tasks
export const scheduleIdleTask = (callback: () => void): number | NodeJS.Timeout => {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback);
  } else {
    return setTimeout(callback, 1);
  }
};

// Web Worker for heavy computations
export const createWorker = (workerFunction: (e: MessageEvent) => void): Worker => {
  const blob = new Blob(
    [`self.onmessage = ${workerFunction.toString()}`],
    { type: 'application/javascript' }
  );
  const workerUrl = URL.createObjectURL(blob);
  return new Worker(workerUrl);
};

// Resource preloading
export const preloadResources = (resources: Array<{ url: string; type: string }>) => {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = resource.type === 'script' ? 'preload' : 'prefetch';
    link.as = resource.type;
    link.href = resource.url;
    if (resource.type === 'font') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
};

// Performance configuration helper
export const getPerformanceConfig = () => {
  // Detect mobile devices
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                   (typeof window !== 'undefined' && window.innerWidth < 768);
  
  // Detect slow connections
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
  
  const shouldReduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return {
    isMobile,
    isSlowConnection: isSlowConnection || false,
    shouldReduceMotion,
    shouldReduceData: isSlowConnection || false,
    // Reduce animations on mobile by default for better performance
    reduceAnimations: isMobile || shouldReduceMotion || isSlowConnection || false,
    pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2) : 1,
    cloudCount: isMobile ? 2 : 5, // Reduced from 3 to 2 for better mobile performance
    particleCount: isMobile ? 500 : (isSlowConnection ? 1000 : 2000), // Particle count for 3D backgrounds
    enableScrollSmoother: !isMobile, // Disable ScrollSmoother on mobile for better performance
    env: typeof process !== 'undefined' && process.env ? process.env : {},
  };
};

// Intersection Observer helper
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null => {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }
  return new IntersectionObserver(callback, options);
};
