/**
 * Accessibility Animation System
 * Enterprise-grade accessibility features for animations and interactions
 */

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export type AnnouncementPriority = 'polite' | 'assertive';

export interface FocusTrapConfig {
  returnFocus?: boolean;
  initialFocus?: HTMLElement | null;
  allowOutsideClick?: boolean;
}

export interface ContrastInfo {
  ratio: number;
  level: 'AAA' | 'AA' | 'fail';
  foreground: string;
  background: string;
}

// ==============================================
// SCREEN READER ANNOUNCER
// ==============================================

class ScreenReaderAnnouncer {
  private politeElement: HTMLDivElement | null = null;
  private assertiveElement: HTMLDivElement | null = null;
  private announceQueue: Array<{ message: string; priority: AnnouncementPriority }> = [];
  private isProcessing = false;
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.createAnnouncers();
  }

  /**
   * Create aria-live regions for announcements
   */
  private createAnnouncers(): void {
    if (typeof document === 'undefined') return;

    // Create polite announcer
    this.politeElement = document.createElement('div');
    this.politeElement.setAttribute('aria-live', 'polite');
    this.politeElement.setAttribute('aria-atomic', 'true');
    this.politeElement.className = 'sr-only';
    this.politeElement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    `;
    document.body.appendChild(this.politeElement);

    // Create assertive announcer
    this.assertiveElement = document.createElement('div');
    this.assertiveElement.setAttribute('aria-live', 'assertive');
    this.assertiveElement.setAttribute('aria-atomic', 'true');
    this.assertiveElement.className = 'sr-only';
    this.assertiveElement.style.cssText = this.politeElement.style.cssText;
    document.body.appendChild(this.assertiveElement);
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: AnnouncementPriority = 'polite'): void {
    this.announceQueue.push({ message, priority });
    this.processQueue();
  }

  /**
   * Announce with debouncing (useful for rapid updates like prices)
   */
  announceDebounced(
    message: string,
    priority: AnnouncementPriority = 'polite',
    key: string,
    delay = 1000
  ): void {
    // Clear existing timer for this key
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.announce(message, priority);
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Process announcement queue
   */
  private processQueue(): void {
    if (this.isProcessing || this.announceQueue.length === 0) return;

    this.isProcessing = true;
    const { message, priority } = this.announceQueue.shift()!;

    const element =
      priority === 'assertive' ? this.assertiveElement : this.politeElement;

    if (element) {
      // Clear and set new message
      element.textContent = '';
      setTimeout(() => {
        element.textContent = message;
        this.isProcessing = false;
        this.processQueue();
      }, 100);
    }
  }

  /**
   * Clear all announcements
   */
  clear(): void {
    this.announceQueue = [];
    if (this.politeElement) this.politeElement.textContent = '';
    if (this.assertiveElement) this.assertiveElement.textContent = '';
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clear();
    this.politeElement?.remove();
    this.assertiveElement?.remove();
  }
}

// Singleton instance
const announcer = new ScreenReaderAnnouncer();

// ==============================================
// FOCUS MANAGEMENT
// ==============================================

export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
      container.querySelectorAll<HTMLElement>(this.focusableSelectors)
    ).filter((el) => {
      // Filter out hidden elements
      return (
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        window.getComputedStyle(el).visibility !== 'hidden'
      );
    });
  }

  /**
   * Create focus trap for modal/dialog
   */
  static createTrap(
    container: HTMLElement,
    config: FocusTrapConfig = {}
  ): () => void {
    const { returnFocus = true, initialFocus, allowOutsideClick = false } =
      config;

    const previouslyFocused = document.activeElement as HTMLElement;
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length === 0) {
      console.warn('No focusable elements found in focus trap');
      return () => {};
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus initial element
    const elementToFocus = initialFocus || firstElement;
    setTimeout(() => elementToFocus?.focus(), 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (allowOutsideClick) return;

      const relatedTarget = e.relatedTarget as HTMLElement;
      if (!container.contains(relatedTarget)) {
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focusout', handleFocusOut);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focusout', handleFocusOut);

      if (returnFocus && previouslyFocused) {
        setTimeout(() => previouslyFocused.focus(), 0);
      }
    };
  }

  /**
   * Create skip link for keyboard navigation
   */
  static createSkipLink(targetId: string, label: string): HTMLElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = label;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    return skipLink;
  }

  /**
   * Implement roving tabindex for widget
   */
  static createRovingTabindex(
    container: HTMLElement,
    items: HTMLElement[],
    orientation: 'horizontal' | 'vertical' = 'horizontal'
  ): () => void {
    let currentIndex = 0;

    const updateTabindexes = () => {
      items.forEach((item, index) => {
        item.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      let newIndex = currentIndex;

      if (orientation === 'horizontal') {
        if (key === 'ArrowRight') newIndex = (currentIndex + 1) % items.length;
        if (key === 'ArrowLeft')
          newIndex = (currentIndex - 1 + items.length) % items.length;
      } else {
        if (key === 'ArrowDown') newIndex = (currentIndex + 1) % items.length;
        if (key === 'ArrowUp')
          newIndex = (currentIndex - 1 + items.length) % items.length;
      }

      if (key === 'Home') newIndex = 0;
      if (key === 'End') newIndex = items.length - 1;

      if (newIndex !== currentIndex) {
        e.preventDefault();
        currentIndex = newIndex;
        updateTabindexes();
        items[currentIndex].focus();
      }
    };

    updateTabindexes();
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
}

// ==============================================
// MOTION ALTERNATIVES
// ==============================================

export class MotionAlternatives {
  /**
   * Get motion-safe CSS for animations
   */
  static getMotionSafeCSS(
    normalAnimation: string,
    reducedAnimation: string
  ): string {
    return `
      @media (prefers-reduced-motion: no-preference) {
        ${normalAnimation}
      }
      @media (prefers-reduced-motion: reduce) {
        ${reducedAnimation}
      }
    `;
  }

  /**
   * Create opacity-only alternative for motion
   */
  static createOpacityAlternative(element: HTMLElement): Animation {
    return element.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 150,
      easing: 'ease-in',
      fill: 'both',
    });
  }

  /**
   * Check if should use reduced motion
   */
  static shouldReduceMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get appropriate duration based on motion preference
   */
  static getDuration(normalDuration: number, reducedDuration = 0): number {
    return this.shouldReduceMotion() ? reducedDuration : normalDuration;
  }
}

// ==============================================
// CONTRAST SYSTEM
// ==============================================

export class ContrastChecker {
  /**
   * Calculate relative luminance
   */
  private static getLuminance(color: string): number {
    // Convert color to RGB
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    // Convert to sRGB
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(foreground: string, background: string): number {
    const l1 = this.getLuminance(foreground);
    const l2 = this.getLuminance(background);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast meets WCAG standards
   */
  static checkContrast(
    foreground: string,
    background: string,
    fontSize = 16,
    isBold = false
  ): ContrastInfo {
    const ratio = this.getContrastRatio(foreground, background);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);

    let level: ContrastInfo['level'];
    if (isLargeText) {
      level = ratio >= 4.5 ? 'AAA' : ratio >= 3 ? 'AA' : 'fail';
    } else {
      level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail';
    }

    return {
      ratio: Math.round(ratio * 100) / 100,
      level,
      foreground,
      background,
    };
  }

  /**
   * Get accessible alternative color
   */
  static getAccessibleAlternative(
    foreground: string,
    background: string,
    targetRatio = 4.5
  ): string {
    const currentRatio = this.getContrastRatio(foreground, background);
    if (currentRatio >= targetRatio) return foreground;

    // Adjust foreground color to meet target ratio
    const rgb = this.hexToRgb(foreground);
    if (!rgb) return foreground;

    // Simple approach: darken or lighten
    const bgLuminance = this.getLuminance(background);
    const adjustment = bgLuminance > 0.5 ? -20 : 20;

    let newColor = foreground;
    let attempts = 0;
    const maxAttempts = 10;

    while (
      this.getContrastRatio(newColor, background) < targetRatio &&
      attempts < maxAttempts
    ) {
      const newRgb = this.hexToRgb(newColor);
      if (!newRgb) break;

      const adjustedRgb = {
        r: Math.max(0, Math.min(255, newRgb.r + adjustment)),
        g: Math.max(0, Math.min(255, newRgb.g + adjustment)),
        b: Math.max(0, Math.min(255, newRgb.b + adjustment)),
      };

      newColor = `#${adjustedRgb.r.toString(16).padStart(2, '0')}${adjustedRgb.g
        .toString(16)
        .padStart(2, '0')}${adjustedRgb.b.toString(16).padStart(2, '0')}`;

      attempts++;
    }

    return newColor;
  }
}

// ==============================================
// REACT HOOKS
// ==============================================

/**
 * Hook for accessible announcements
 */
export function useAccessibleAnnounce() {
  return useCallback(
    (message: string, priority: AnnouncementPriority = 'polite') => {
      announcer.announce(message, priority);
    },
    []
  );
}

/**
 * Hook for debounced announcements
 */
export function useAccessibleAnnounceDebounced() {
  return useCallback(
    (
      message: string,
      priority: AnnouncementPriority = 'polite',
      key: string,
      delay = 1000
    ) => {
      announcer.announceDebounced(message, priority, key, delay);
    },
    []
  );
}

/**
 * Hook for focus trap
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  config: FocusTrapConfig = {}
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return FocusManager.createTrap(element, config);
  }, [ref, config]);
}

/**
 * Hook for roving tabindex
 */
export function useRovingTabindex(
  containerRef: RefObject<HTMLElement>,
  itemRefs: RefObject<HTMLElement>[],
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): void {
  useEffect(() => {
    const container = containerRef.current;
    const items = itemRefs
      .map((ref) => ref.current)
      .filter((el): el is HTMLElement => el !== null);

    if (!container || items.length === 0) return;

    return FocusManager.createRovingTabindex(container, items, orientation);
  }, [containerRef, itemRefs, orientation]);
}

/**
 * Hook to check color contrast
 */
export function useContrastCheck(
  foreground: string,
  background: string,
  fontSize?: number,
  isBold?: boolean
): ContrastInfo {
  const [contrastInfo, setContrastInfo] = useState<ContrastInfo>(() =>
    ContrastChecker.checkContrast(foreground, background, fontSize, isBold)
  );

  useEffect(() => {
    setContrastInfo(
      ContrastChecker.checkContrast(foreground, background, fontSize, isBold)
    );
  }, [foreground, background, fontSize, isBold]);

  return contrastInfo;
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [shouldReduce, setShouldReduce] = useState(
    () => MotionAlternatives.shouldReduceMotion()
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduce(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return shouldReduce;
}

// ==============================================
// EXPORTS
// ==============================================

export { announcer as screenReaderAnnouncer };

export default {
  ScreenReaderAnnouncer,
  FocusManager,
  MotionAlternatives,
  ContrastChecker,
  useAccessibleAnnounce,
  useAccessibleAnnounceDebounced,
  useFocusTrap,
  useRovingTabindex,
  useContrastCheck,
  useReducedMotion,
};
