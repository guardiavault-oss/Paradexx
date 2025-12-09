/**
 * Haptic Feedback System
 * Provides tactile feedback for user interactions
 */

import { useCallback, useEffect, useState } from 'react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'error'
  | 'success'
  | 'warning';

export interface HapticConfig {
  enabled: boolean;
  audioFallback: boolean;
}

// ==============================================
// HAPTIC PATTERNS
// ==============================================

const HAPTIC_PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [25],
  heavy: [50],
  error: [30, 50, 30], // Double buzz
  success: [20, 30, 30, 40, 40, 50], // Triple ascending
  warning: [100], // Long buzz
};

// ==============================================
// HAPTIC MANAGER
// ==============================================

class HapticManager {
  private config: HapticConfig = {
    enabled: true,
    audioFallback: false,
  };

  private readonly STORAGE_KEY = 'haptic-preferences';
  private audioContext: AudioContext | null = null;

  constructor() {
    this.loadPreferences();
    this.detectHapticSupport();
  }

  /**
   * Check if haptics are supported
   */
  isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Detect haptic support and system settings
   */
  private detectHapticSupport(): void {
    // Check if vibration API is available
    if (!this.isSupported()) {
      console.info('Haptic feedback not supported on this device');
    }

    // On iOS, check for Taptic Engine support
    if (this.isIOS()) {
      // iOS devices with Taptic Engine (iPhone 6s and later)
      const hasHapticEngine = 'ontouchstart' in window;
      if (!hasHapticEngine) {
        this.config.enabled = false;
      }
    }
  }

  /**
   * Check if running on iOS
   */
  private isIOS(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  /**
   * Load user preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load haptic preferences:', e);
    }
  }

  /**
   * Save user preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save haptic preferences:', e);
    }
  }

  /**
   * Trigger haptic feedback with pattern
   */
  trigger(pattern: HapticPattern): void {
    if (!this.config.enabled) return;

    const vibrationPattern = HAPTIC_PATTERNS[pattern];

    if (this.isSupported()) {
      try {
        navigator.vibrate(vibrationPattern);
      } catch (e) {
        console.warn('Haptic feedback failed:', e);
        this.fallbackToAudio(pattern);
      }
    } else if (this.config.audioFallback) {
      this.fallbackToAudio(pattern);
    }
  }

  /**
   * Trigger custom vibration pattern
   */
  custom(pattern: number[]): void {
    if (!this.config.enabled || !this.isSupported()) return;

    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('Custom haptic feedback failed:', e);
    }
  }

  /**
   * Light haptic feedback (10ms)
   */
  light(): void {
    this.trigger('light');
  }

  /**
   * Medium haptic feedback (25ms)
   */
  medium(): void {
    this.trigger('medium');
  }

  /**
   * Heavy haptic feedback (50ms)
   */
  heavy(): void {
    this.trigger('heavy');
  }

  /**
   * Error haptic pattern
   */
  error(): void {
    this.trigger('error');
  }

  /**
   * Success haptic pattern
   */
  success(): void {
    this.trigger('success');
  }

  /**
   * Warning haptic pattern
   */
  warning(): void {
    this.trigger('warning');
  }

  /**
   * Enable haptics
   */
  enable(): void {
    this.config.enabled = true;
    this.savePreferences();
  }

  /**
   * Disable haptics
   */
  disable(): void {
    this.config.enabled = false;
    this.savePreferences();
  }

  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable audio fallback
   */
  enableAudioFallback(): void {
    this.config.audioFallback = true;
    this.savePreferences();
  }

  /**
   * Disable audio fallback
   */
  disableAudioFallback(): void {
    this.config.audioFallback = false;
    this.savePreferences();
  }

  /**
   * Audio fallback for devices without haptic support
   */
  private fallbackToAudio(pattern: HapticPattern): void {
    if (!this.config.audioFallback) return;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const frequencies: Record<HapticPattern, number> = {
        light: 200,
        medium: 400,
        heavy: 600,
        error: 300,
        success: 500,
        warning: 250,
      };

      const frequency = frequencies[pattern];
      const vibrationPattern = HAPTIC_PATTERNS[pattern];

      let time = this.audioContext.currentTime;

      vibrationPattern.forEach((duration, index) => {
        if (index % 2 === 0) {
          // Play sound
          const oscillator = this.audioContext!.createOscillator();
          const gainNode = this.audioContext!.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext!.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.1, time);
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration / 1000);

          oscillator.start(time);
          oscillator.stop(time + duration / 1000);

          time += duration / 1000;
        } else {
          // Pause
          time += duration / 1000;
        }
      });
    } catch (e) {
      console.warn('Audio fallback failed:', e);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): HapticConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...config };
    this.savePreferences();
  }
}

// ==============================================
// SINGLETON INSTANCE
// ==============================================

const hapticManager = new HapticManager();

// ==============================================
// REACT HOOKS
// ==============================================

/**
 * Hook to use haptic feedback
 */
export function useHaptics() {
  const [isSupported] = useState(() => hapticManager.isSupported());
  const [isEnabled, setIsEnabled] = useState(() => hapticManager.isEnabled());

  const updateEnabled = useCallback(() => {
    setIsEnabled(hapticManager.isEnabled());
  }, []);

  const enable = useCallback(() => {
    hapticManager.enable();
    updateEnabled();
  }, [updateEnabled]);

  const disable = useCallback(() => {
    hapticManager.disable();
    updateEnabled();
  }, [updateEnabled]);

  return {
    isSupported,
    isEnabled,
    enable,
    disable,
    light: hapticManager.light.bind(hapticManager),
    medium: hapticManager.medium.bind(hapticManager),
    heavy: hapticManager.heavy.bind(hapticManager),
    error: hapticManager.error.bind(hapticManager),
    success: hapticManager.success.bind(hapticManager),
    warning: hapticManager.warning.bind(hapticManager),
    pattern: hapticManager.custom.bind(hapticManager),
  };
}

/**
 * Hook to add haptic feedback to element interactions
 */
export function useHapticFeedback(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    hover?: HapticPattern;
    click?: HapticPattern;
    focus?: HapticPattern;
  } = {}
) {
  const haptics = useHaptics();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !haptics.isEnabled) return;

    const handlers: Array<[string, EventListener]> = [];

    if (options.hover) {
      const handler = () => hapticManager.trigger(options.hover!);
      element.addEventListener('mouseenter', handler);
      handlers.push(['mouseenter', handler]);
    }

    if (options.click) {
      const handler = () => hapticManager.trigger(options.click!);
      element.addEventListener('click', handler);
      handlers.push(['click', handler]);
    }

    if (options.focus) {
      const handler = () => hapticManager.trigger(options.focus!);
      element.addEventListener('focus', handler);
      handlers.push(['focus', handler]);
    }

    return () => {
      handlers.forEach(([event, handler]) => {
        element.removeEventListener(event, handler);
      });
    };
  }, [elementRef, options, haptics.isEnabled]);
}

/**
 * Auto-haptics for common UI patterns
 */
export function useAutoHaptics(
  elementRef: React.RefObject<HTMLElement>,
  elementType: 'button' | 'toggle' | 'slider' | 'input' = 'button'
) {
  const patterns: Record<typeof elementType, Partial<{
    hover: HapticPattern;
    click: HapticPattern;
    focus: HapticPattern;
  }>> = {
    button: { click: 'medium' },
    toggle: { click: 'light' },
    slider: { focus: 'light' },
    input: { focus: 'light' },
  };

  useHapticFeedback(elementRef, patterns[elementType]);
}

// ==============================================
// EXPORTS
// ==============================================

export { hapticManager };
export default hapticManager;
