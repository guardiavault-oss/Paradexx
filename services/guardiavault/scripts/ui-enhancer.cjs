#!/usr/bin/env node

/**
 * UI/UX Enhancement Script
 * Optimizes landing pages and dashboards with modern design patterns
 * Adapted for GuardiaVault project structure
 */

const fs = require('fs').promises;
const path = require('path');

class UIEnhancer {
  constructor() {
    this.projectRoot = process.cwd();
    this.componentsCreated = [];
    this.clientSrc = path.join(this.projectRoot, 'client', 'src');
  }

  async createAccessibilityEnhancements() {
    console.log('\n♿ Adding accessibility enhancements...');

    const a11yUtils = `// Accessibility utilities and hooks
import { useEffect, useRef, useState } from 'react';

// Skip to main content link
export const SkipToMain = () => (
  <a 
    href="#main-content" 
    className="skip-to-main"
    style={{
      position: 'absolute',
      left: '-9999px',
      zIndex: 999,
      padding: '1rem',
      background: '#000',
      color: '#fff',
      textDecoration: 'none',
    }}
    onFocus={(e) => {
      e.currentTarget.style.left = '50%';
      e.currentTarget.style.transform = 'translateX(-50%)';
      e.currentTarget.style.top = '1rem';
    }}
    onBlur={(e) => {
      e.currentTarget.style.left = '-9999px';
    }}
  >
    Skip to main content
  </a>
);

// Focus trap hook for modals and overlays
export const useFocusTrap = (isActive = true) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
};

// Announce screen reader messages
export const useAnnounce = () => {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!announceRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-9999px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      document.body.appendChild(announcer);
      announceRef.current = announcer;
    }

    return () => {
      if (announceRef.current && announceRef.current.parentNode) {
        document.body.removeChild(announceRef.current);
      }
    };
  }, []);

  const announce = (message: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = '';
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message;
        }
      }, 100);
    }
  };

  return announce;
};

// Keyboard navigation hook
export const useKeyboardNavigation = <T,>(items: T[], onSelect: (item: T) => void) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => 
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => 
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(items[focusedIndex]);
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, onSelect]);

  return { focusedIndex, setFocusedIndex };
};

// ARIA labels generator
export const getAriaLabel = (type: string, context: string): string => {
  const labels: Record<string, Record<string, string>> = {
    button: {
      close: 'Close dialog',
      menu: 'Open navigation menu',
      submit: 'Submit form',
      search: 'Search',
      filter: 'Apply filters',
      sort: \`Sort by \${context}\`,
      expand: \`Expand \${context}\`,
      collapse: \`Collapse \${context}\`
    },
    input: {
      email: 'Email address',
      password: 'Password',
      search: 'Search query',
      date: 'Select date',
      file: 'Choose file to upload'
    },
    navigation: {
      main: 'Main navigation',
      breadcrumb: 'Breadcrumb navigation',
      pagination: 'Pagination navigation'
    },
    status: {
      loading: 'Loading content',
      error: 'Error message',
      success: 'Success message',
      warning: 'Warning message'
    }
  };

  return labels[type]?.[context] || context;
};

// Color contrast checker
export const checkContrast = (foreground: string, background: string) => {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\\d+/g);
    if (!rgb || rgb.length < 3) return 0;
    
    const [r, g, b] = rgb.map(val => {
      const sRGB = parseInt(val) / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    ratio: ratio.toFixed(2),
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
    passesLargeAA: ratio >= 3,
    passesLargeAAA: ratio >= 4.5
  };
};`;

    try {
      const utilsDir = path.join(this.clientSrc, 'utils');
      await fs.mkdir(utilsDir, { recursive: true });
      await fs.writeFile(
        path.join(utilsDir, 'accessibility.ts'),
        a11yUtils
      );
      console.log('  ✅ Created accessibility utilities');
    } catch (error) {
      console.error('  ❌ Failed to create accessibility utilities:', error.message);
    }
  }

  async createPerformanceOptimizations() {
    console.log('\n⚡ Adding performance optimizations...');

    const perfUtils = `// Performance optimization utilities
import { lazy, Suspense, memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';

// Image lazy loading with intersection observer
export const LazyImage = ({ 
  src, 
  alt, 
  placeholder, 
  ...props 
}: {
  src: string;
  alt: string;
  placeholder?: string;
  [key: string]: any;
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    
    if (imageRef && imageSrc === (placeholder || '')) {
      if (typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                setImageSrc(src);
                if (observer && imageRef) {
                  observer.unobserve(imageRef);
                }
              }
            });
          },
          { threshold: 0.1 }
        );
        observer.observe(imageRef);
      } else {
        // Fallback for browsers that don't support IntersectionObserver
        setImageSrc(src);
      }
    }
    
    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, placeholder, src]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      loading="lazy"
      {...props}
    />
  );
};

// Debounce hook for search inputs and API calls
export const useDebounce = <T,>(value: T, delay = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

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

// Virtual scrolling for large lists
export const VirtualList = <T,>({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  overscan = 3 
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useThrottle(() => {
    if (scrollElementRef.current) {
      setScrollTop(scrollElementRef.current.scrollTop);
    }
  }, 10);

  return (
    <div
      ref={scrollElementRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: \`translateY(\${offsetY}px)\` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Code splitting with lazy loading
export const lazyLoadComponent = (componentPath: string) => {
  return lazy(() => 
    import(componentPath).catch(() => ({
      default: () => <div>Error loading component</div>
    }))
  );
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
export const scheduleIdleTask = (callback: () => void): number => {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback);
  } else {
    return setTimeout(callback, 1);
  }
};

// Web Worker for heavy computations
export const createWorker = (workerFunction: (e: MessageEvent) => void): Worker => {
  const blob = new Blob(
    [\`self.onmessage = \${workerFunction.toString()}\`],
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
};`;

    try {
      const utilsDir = path.join(this.clientSrc, 'utils');
      await fs.mkdir(utilsDir, { recursive: true });
      await fs.writeFile(
        path.join(utilsDir, 'performance.ts'),
        perfUtils
      );
      console.log('  ✅ Created performance utilities');
    } catch (error) {
      console.error('  ❌ Failed to create performance utilities:', error.message);
    }
  }

  async run() {
    console.log('\n🎨 UI/UX Enhancement Suite');
    console.log('================================\n');

    await this.createAccessibilityEnhancements();
    await this.createPerformanceOptimizations();

    console.log('\n✨ UI/UX enhancements complete!');
    console.log('\nUtilities created:');
    console.log('  - Accessibility utilities (client/src/utils/accessibility.ts)');
    console.log('  - Performance utilities (client/src/utils/performance.ts)');
    console.log('\nNote: Your project already has:');
    console.log('  ✅ Theme system (CSS variables with dark mode)');
    console.log('  ✅ Component library (Radix UI + Tailwind)');
    console.log('  ✅ Landing page components');
    console.log('  ✅ Dashboard components');
    console.log('\nThese utilities complement your existing infrastructure.');
  }
}

// Run the UI enhancer
const enhancer = new UIEnhancer();
enhancer.run().catch(console.error);

