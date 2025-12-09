/**
 * Theme Interpolation Engine
 * Smooth theme transitions with perceptually uniform color interpolation
 */

import { useEffect, useState, useCallback } from 'react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export type ThemeMode = 'degen' | 'regen';

export interface TimeBasedThemeConfig {
  enabled: boolean;
  dimAtNight: boolean;
  sunriseSunset: boolean;
}

// ==============================================
// COLOR CONVERSION UTILITIES
// ==============================================

export class ColorConverter {
  /**
   * Convert hex to RGB
   */
  static hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  }

  /**
   * Convert RGB to hex
   */
  static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) =>
      Math.round(n * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Convert RGB to linear RGB (remove gamma correction)
   */
  static rgbToLinear(c: number): number {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  /**
   * Convert linear RGB to RGB (apply gamma correction)
   */
  static linearToRgb(c: number): number {
    return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  }

  /**
   * Convert RGB to OKLCH (perceptually uniform color space)
   */
  static rgbToOklch(
    rgb: [number, number, number]
  ): [number, number, number] {
    // First convert to linear RGB
    const [r, g, b] = rgb.map(this.rgbToLinear);

    // Convert to OKLab
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

    // Convert to LCH
    const C = Math.sqrt(a * a + b_ * b_);
    const h = Math.atan2(b_, a) * (180 / Math.PI);

    return [L, C, h < 0 ? h + 360 : h];
  }

  /**
   * Convert OKLCH to RGB
   */
  static oklchToRgb(
    lch: [number, number, number]
  ): [number, number, number] {
    const [L, C, h] = lch;

    // Convert to OKLab
    const hRad = h * (Math.PI / 180);
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    // Convert to linear RGB
    let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let b_ = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

    // Apply gamma correction
    r = this.linearToRgb(r);
    g = this.linearToRgb(g);
    b_ = this.linearToRgb(b_);

    // Clamp values
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b_ = Math.max(0, Math.min(1, b_));

    return [r, g, b_];
  }

  /**
   * Interpolate between two colors in OKLCH space
   */
  static interpolate(
    color1: string,
    color2: string,
    t: number
  ): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const lch1 = this.rgbToOklch(rgb1);
    const lch2 = this.rgbToOklch(rgb2);

    // Interpolate in OKLCH space
    const L = lch1[0] + (lch2[0] - lch1[0]) * t;
    const C = lch1[1] + (lch2[1] - lch1[1]) * t;

    // Handle hue interpolation (shortest path around color wheel)
    let h1 = lch1[2];
    let h2 = lch2[2];

    if (Math.abs(h2 - h1) > 180) {
      if (h2 > h1) {
        h1 += 360;
      } else {
        h2 += 360;
      }
    }

    let h = h1 + (h2 - h1) * t;
    if (h >= 360) h -= 360;
    if (h < 0) h += 360;

    const rgb = this.oklchToRgb([L, C, h]);
    return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
  }
}

// ==============================================
// THEME INTERPOLATION ENGINE
// ==============================================

class ThemeInterpolationEngine {
  private currentTheme: ThemeColors | null = null;
  private targetTheme: ThemeColors | null = null;
  private animationId: number | null = null;
  private startTime = 0;
  private duration = 500;
  private listeners = new Set<(theme: ThemeColors) => void>();
  private timeBasedConfig: TimeBasedThemeConfig = {
    enabled: false,
    dimAtNight: false,
    sunriseSunset: false,
  };

  /**
   * Interpolate between current and target theme
   */
  private interpolateThemes(t: number): ThemeColors {
    if (!this.currentTheme || !this.targetTheme) {
      throw new Error('Themes not set');
    }

    const interpolated: Partial<ThemeColors> = {};

    for (const key in this.currentTheme) {
      const k = key as keyof ThemeColors;
      interpolated[k] = ColorConverter.interpolate(
        this.currentTheme[k],
        this.targetTheme[k],
        t
      );
    }

    return interpolated as ThemeColors;
  }

  /**
   * Animation step
   */
  private animate(timestamp: number): void {
    if (this.startTime === 0) {
      this.startTime = timestamp;
    }

    const elapsed = timestamp - this.startTime;
    const t = Math.min(elapsed / this.duration, 1);

    // Easing function (ease-in-out cubic)
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const theme = this.interpolateThemes(eased);
    this.notifyListeners(theme);

    if (t < 1) {
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    } else {
      this.currentTheme = this.targetTheme;
      this.animationId = null;
      this.startTime = 0;
    }
  }

  /**
   * Transition to new theme
   */
  transitionTo(theme: ThemeColors, duration = 500): void {
    // Cancel existing animation
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (!this.currentTheme) {
      // First theme, no animation
      this.currentTheme = theme;
      this.notifyListeners(theme);
      return;
    }

    this.targetTheme = theme;
    this.duration = duration;
    this.startTime = 0;

    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  /**
   * Instantly set theme (no animation)
   */
  setTheme(theme: ThemeColors): void {
    this.currentTheme = theme;
    this.notifyListeners(theme);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): ThemeColors | null {
    return this.currentTheme;
  }

  /**
   * Add listener for theme changes
   */
  addListener(listener: (theme: ThemeColors) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(theme: ThemeColors): void {
    this.listeners.forEach((listener) => listener(theme));
  }

  /**
   * Configure time-based theming
   */
  configureTimeBased(config: Partial<TimeBasedThemeConfig>): void {
    this.timeBasedConfig = { ...this.timeBasedConfig, ...config };
  }

  /**
   * Get time of day adjustment factor
   */
  getTimeOfDayFactor(): number {
    if (!this.timeBasedConfig.enabled) return 1;

    const hour = new Date().getHours();

    if (this.timeBasedConfig.dimAtNight) {
      // Dim between 10 PM and 6 AM
      if (hour >= 22 || hour < 6) {
        return 0.7; // 30% dimmer
      }
    }

    if (this.timeBasedConfig.sunriseSunset) {
      // Warmer colors during sunrise (5-8 AM) and sunset (5-8 PM)
      if ((hour >= 5 && hour < 8) || (hour >= 17 && hour < 20)) {
        return 1.2; // 20% warmer
      }
    }

    return 1;
  }

  /**
   * Apply time-based adjustments to theme
   */
  applyTimeAdjustments(theme: ThemeColors): ThemeColors {
    const factor = this.getTimeOfDayFactor();
    if (factor === 1) return theme;

    // Adjust lightness/brightness based on time
    const adjusted: Partial<ThemeColors> = {};

    for (const key in theme) {
      const k = key as keyof ThemeColors;
      const rgb = ColorConverter.hexToRgb(theme[k]);
      const lch = ColorConverter.rgbToOklch(rgb);

      // Adjust lightness
      lch[0] = Math.max(0, Math.min(1, lch[0] * factor));

      const newRgb = ColorConverter.oklchToRgb(lch);
      adjusted[k] = ColorConverter.rgbToHex(newRgb[0], newRgb[1], newRgb[2]);
    }

    return adjusted as ThemeColors;
  }
}

// Singleton instance
const themeEngine = new ThemeInterpolationEngine();

// ==============================================
// PRESET THEMES
// ==============================================

export const DEGEN_THEME: ThemeColors = {
  primary: '#ef4444',
  secondary: '#f97316',
  accent: '#eab308',
  background: '#000000',
  foreground: '#ffffff',
  muted: '#374151',
  border: '#1f2937',
};

export const REGEN_THEME: ThemeColors = {
  primary: '#10b981',
  secondary: '#14b8a6',
  accent: '#06b6d4',
  background: '#ffffff',
  foreground: '#000000',
  muted: '#d1d5db',
  border: '#e5e7eb',
};

// ==============================================
// REACT HOOKS
// ==============================================

/**
 * Hook to use theme engine
 */
export function useThemeInterpolation() {
  const [currentTheme, setCurrentTheme] = useState<ThemeColors | null>(() =>
    themeEngine.getCurrentTheme()
  );

  useEffect(() => {
    return themeEngine.addListener((theme) => {
      setCurrentTheme(theme);
    });
  }, []);

  const transitionTo = useCallback(
    (theme: ThemeColors, duration?: number) => {
      themeEngine.transitionTo(theme, duration);
    },
    []
  );

  const setTheme = useCallback((theme: ThemeColors) => {
    themeEngine.setTheme(theme);
  }, []);

  return {
    currentTheme,
    transitionTo,
    setTheme,
  };
}

/**
 * Hook for mode switching with smooth transition
 */
export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>('degen');
  const { transitionTo } = useThemeInterpolation();

  const switchMode = useCallback(
    (newMode: ThemeMode, instant = false) => {
      setMode(newMode);
      const theme = newMode === 'degen' ? DEGEN_THEME : REGEN_THEME;

      // Apply time-based adjustments
      const adjustedTheme = themeEngine.applyTimeAdjustments(theme);

      if (instant) {
        themeEngine.setTheme(adjustedTheme);
      } else {
        transitionTo(adjustedTheme, 500);
      }
    },
    [transitionTo]
  );

  const toggleMode = useCallback(() => {
    switchMode(mode === 'degen' ? 'regen' : 'degen');
  }, [mode, switchMode]);

  return {
    mode,
    switchMode,
    toggleMode,
  };
}

/**
 * Hook for time-based theming
 */
export function useTimeBasedTheming(config: TimeBasedThemeConfig) {
  const { currentTheme } = useThemeInterpolation();

  useEffect(() => {
    themeEngine.configureTimeBased(config);

    // Update theme every minute to adjust for time changes
    const interval = setInterval(() => {
      if (currentTheme) {
        const adjusted = themeEngine.applyTimeAdjustments(currentTheme);
        themeEngine.transitionTo(adjusted, 2000); // Slow transition
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [config, currentTheme]);
}

/**
 * Hook to apply theme to CSS variables
 */
export function useApplyThemeToCSSVars() {
  const { currentTheme } = useThemeInterpolation();

  useEffect(() => {
    if (!currentTheme) return;

    const root = document.documentElement;

    root.style.setProperty('--color-primary', currentTheme.primary);
    root.style.setProperty('--color-secondary', currentTheme.secondary);
    root.style.setProperty('--color-accent', currentTheme.accent);
    root.style.setProperty('--color-background', currentTheme.background);
    root.style.setProperty('--color-foreground', currentTheme.foreground);
    root.style.setProperty('--color-muted', currentTheme.muted);
    root.style.setProperty('--color-border', currentTheme.border);
  }, [currentTheme]);
}

// ==============================================
// SYSTEM THEME DETECTION
// ==============================================

/**
 * Hook to follow system theme preference
 */
export function useSystemTheme() {
  const { switchMode } = useThemeMode();
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(
    () =>
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const preference = e.matches ? 'dark' : 'light';
      setSystemPreference(preference);
      switchMode(preference === 'dark' ? 'degen' : 'regen', false);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [switchMode]);

  return systemPreference;
}

// ==============================================
// EXPORTS
// ==============================================

export { themeEngine, ColorConverter };
export default themeEngine;
