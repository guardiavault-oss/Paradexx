// Accessibility utilities and hooks
import React from 'react';
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
      sort: `Sort by ${context}`,
      expand: `Expand ${context}`,
      collapse: `Collapse ${context}`
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
    const rgb = color.match(/\d+/g);
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
};

