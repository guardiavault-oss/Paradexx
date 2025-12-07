/**
 * Performance optimization utilities
 */

// Debounce function for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll/resize handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Request idle callback polyfill
export const requestIdleCallback =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (callback: IdleRequestCallback) => {
        const start = Date.now();
        return setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          });
        }, 1);
      };

export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);

// Lazy load images with Intersection Observer
export function lazyLoadImage(img: HTMLImageElement) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          const src = target.dataset.src;
          if (src) {
            target.src = src;
            target.removeAttribute('data-src');
          }
          observer.unobserve(target);
        }
      });
    },
    {
      rootMargin: '50px',
    }
  );

  observer.observe(img);
}

// Measure performance metrics
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  mark(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  }

  measure(name: string, startMark: string, endMark: string) {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name)[0];
        
        if (!this.metrics.has(name)) {
          this.metrics.set(name, []);
        }
        
        this.metrics.get(name)!.push(measure.duration);
        
        // Keep only last 100 measurements
        const measurements = this.metrics.get(name)!;
        if (measurements.length > 100) {
          measurements.shift();
        }
      } catch (e) {
        console.warn('Performance measurement failed:', e);
      }
    }
  }

  getAverage(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  clear() {
    this.metrics.clear();
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }
  }

  report() {
    const report: Record<string, number> = {};
    this.metrics.forEach((measurements, name) => {
      report[name] = this.getAverage(name);
    });
    return report;
  }
}

// Detect device capabilities
export function getDeviceCapabilities() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isLowEnd: false,
      hasGPU: false,
      devicePixelRatio: 1,
      cores: 1,
      memory: 4,
    };
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 1;
  const memory = (navigator as any).deviceMemory || 4;
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Check for GPU support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const hasGPU = !!gl;

  // Determine if device is low-end
  const isLowEnd = isMobile && (cores <= 4 || memory <= 2);

  return {
    isMobile,
    isLowEnd,
    hasGPU,
    devicePixelRatio,
    cores,
    memory,
  };
}

// Optimize shader complexity based on device
export function getShaderQuality(): 'low' | 'medium' | 'high' {
  const { isLowEnd, isMobile, cores } = getDeviceCapabilities();

  if (isLowEnd) return 'low';
  if (isMobile && cores <= 6) return 'medium';
  return 'high';
}

// Measure FPS
export class FPSMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private frameCount = 0;

  tick() {
    const now = performance.now();
    const delta = now - this.lastTime;
    
    if (delta > 0) {
      const fps = 1000 / delta;
      this.frames.push(fps);
      
      if (this.frames.length > 60) {
        this.frames.shift();
      }
    }
    
    this.lastTime = now;
    this.frameCount++;
  }

  getAverageFPS(): number {
    if (this.frames.length === 0) return 0;
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frames.length);
  }

  reset() {
    this.frames = [];
    this.frameCount = 0;
    this.lastTime = performance.now();
  }
}

// Bundle size optimization - dynamic imports helper
export async function lazyLoad<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): Promise<T> {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.error('Failed to lazy load module:', error);
    if (fallback) return fallback;
    throw error;
  }
}

// Preload critical resources
export function preloadCriticalAssets(assets: string[]) {
  if (typeof document === 'undefined') return;

  assets.forEach((asset) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (asset.endsWith('.js')) {
      link.as = 'script';
    } else if (asset.endsWith('.css')) {
      link.as = 'style';
    } else if (asset.match(/\.(woff|woff2|ttf)$/)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else if (asset.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
      link.as = 'image';
    }
    
    link.href = asset;
    document.head.appendChild(link);
  });
}

// Memory management
export function cleanupMemory() {
  if (typeof window === 'undefined') return;

  // Clear caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.includes('old') || name.includes('temp')) {
          caches.delete(name);
        }
      });
    });
  }

  // Suggest garbage collection (only works in some environments)
  if ((window as any).gc) {
    (window as any).gc();
  }
}

// Detect network speed
export async function getNetworkSpeed(): Promise<'slow' | 'medium' | 'fast'> {
  if (typeof navigator === 'undefined') return 'medium';

  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;

  if (!connection) return 'medium';

  const effectiveType = connection.effectiveType;

  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
  if (effectiveType === '3g') return 'medium';
  return 'fast';
}

// Adaptive loading based on network
export async function shouldLoadHeavyAssets(): Promise<boolean> {
  const networkSpeed = await getNetworkSpeed();
  const { isLowEnd } = getDeviceCapabilities();

  return networkSpeed === 'fast' && !isLowEnd;
}
