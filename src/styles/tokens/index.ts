// ==============================================
// PARADOX DESIGN SYSTEM TOKENS
// ==============================================

export const palette = {
  white: '#ffffff',
  black: '#000000',
  
  degen: {
    primary: '#ff3366',
    secondary: '#ff9500',
    tertiary: '#ff6b6b',
    dark: '#cc0000',
    darker: '#990000',
    darkest: '#660000',
  },
  
  regen: {
    primary: '#00d4ff',
    secondary: '#00ff88',
    tertiary: '#00aaff',
    dark: '#0066cc',
    darker: '#004099',
    darkest: '#003366',
  },
} as const;

export const colors = {
  background: {
    primary: 'rgba(0, 0, 0, 0.95)',
    secondary: 'rgba(0, 0, 0, 0.8)',
    tertiary: 'rgba(0, 0, 0, 0.4)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    glass: {
      subtle: 'rgba(0, 0, 0, 0.4)',
      medium: 'rgba(0, 0, 0, 0.6)',
      strong: 'rgba(0, 0, 0, 0.8)',
    },
  },
  
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    muted: 'rgba(255, 255, 255, 0.4)',
    disabled: 'rgba(255, 255, 255, 0.3)',
  },
  
  border: {
    subtle: 'rgba(255, 255, 255, 0.1)',
    normal: 'rgba(255, 255, 255, 0.2)',
    strong: 'rgba(255, 255, 255, 0.3)',
    focus: 'rgba(255, 255, 255, 0.5)',
  },
  
  success: {
    primary: '#10b981',
    secondary: '#34d399',
    muted: 'rgba(16, 185, 129, 0.2)',
  },
  
  error: {
    primary: '#ef4444',
    secondary: '#f87171',
    muted: 'rgba(239, 68, 68, 0.2)',
  },
  
  warning: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    muted: 'rgba(245, 158, 11, 0.2)',
  },
  
  info: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    muted: 'rgba(59, 130, 246, 0.2)',
  },
} as const;

export const modeColors = {
  degen: {
    accent: palette.degen.primary,
    accentSecondary: palette.degen.secondary,
    accentTertiary: palette.degen.tertiary,
    glow: 'rgba(255, 51, 102, 0.4)',
    glowStrong: 'rgba(255, 51, 102, 0.8)',
    glowSubtle: 'rgba(255, 51, 102, 0.2)',
    gradient: `linear-gradient(135deg, ${palette.degen.primary}, ${palette.degen.secondary})`,
    gradientVertical: `linear-gradient(to bottom, ${palette.degen.primary}, ${palette.degen.secondary})`,
    bgSubtle: 'rgba(255, 51, 102, 0.1)',
    bgMuted: 'rgba(255, 51, 102, 0.05)',
    border: 'rgba(255, 51, 102, 0.4)',
    borderSubtle: 'rgba(255, 51, 102, 0.2)',
  },
  
  regen: {
    accent: palette.regen.primary,
    accentSecondary: palette.regen.secondary,
    accentTertiary: palette.regen.tertiary,
    glow: 'rgba(0, 212, 255, 0.4)',
    glowStrong: 'rgba(0, 212, 255, 0.8)',
    glowSubtle: 'rgba(0, 212, 255, 0.2)',
    gradient: `linear-gradient(135deg, ${palette.regen.primary}, ${palette.regen.secondary})`,
    gradientVertical: `linear-gradient(to bottom, ${palette.regen.primary}, ${palette.regen.secondary})`,
    bgSubtle: 'rgba(0, 212, 255, 0.1)',
    bgMuted: 'rgba(0, 212, 255, 0.05)',
    border: 'rgba(0, 212, 255, 0.4)',
    borderSubtle: 'rgba(0, 212, 255, 0.2)',
  },
} as const;

export const typography = {
  fontFamily: {
    primary: "'Rajdhani', sans-serif",
    mono: "'JetBrains Mono', monospace",
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  fontSize: {
    hero: 'clamp(48px, 10vw, 120px)',
    title: 'clamp(32px, 5vw, 48px)',
    heading: 'clamp(24px, 4vw, 42px)',
    subheading: 'clamp(20px, 2vw, 28px)',
    body: 'clamp(14px, 2vw, 18px)',
    small: 'clamp(12px, 2vw, 14px)',
    xs: '12px',
  },
  
  fontWeight: {
    black: 900,
    extrabold: 800,
    bold: 700,
    semibold: 600,
    medium: 500,
    normal: 400,
  },
  
  lineHeight: {
    tight: 1.1,
    snug: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
} as const;

export const radius = {
  none: '0px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  full: '9999px',
} as const;

export const blur = {
  none: '0px',
  sm: '10px',
  md: '20px',
  lg: '40px',
  xl: '100px',
} as const;

export const shadows = {
  sm: '0 10px 30px rgba(0, 0, 0, 0.3)',
  md: '0 20px 60px rgba(0, 0, 0, 0.5)',
  lg: '0 20px 60px rgba(0, 0, 0, 0.9)',
  xl: '0 40px 100px rgba(0, 0, 0, 0.9)',
  
  glow: {
    degen: '0 0 40px rgba(255, 51, 102, 0.4)',
    degenStrong: '0 0 60px rgba(255, 51, 102, 0.6)',
    degenSubtle: '0 0 20px rgba(255, 51, 102, 0.2)',
    regen: '0 0 40px rgba(0, 212, 255, 0.4)',
    regenStrong: '0 0 60px rgba(0, 212, 255, 0.6)',
    regenSubtle: '0 0 20px rgba(0, 212, 255, 0.2)',
  },
  
  inner: {
    sm: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
    md: 'inset 0 4px 8px rgba(0, 0, 0, 0.5)',
    lg: 'inset 0 8px 16px rgba(0, 0, 0, 0.5)',
  },
} as const;

export const transitions = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '700ms',
  slowest: '1000ms',
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
  max: 9999,
} as const;

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Utility functions
export type Mode = 'degen' | 'regen';

export const getAccentColor = (mode: Mode) => modeColors[mode].accent;
export const getAccentSecondary = (mode: Mode) => modeColors[mode].accentSecondary;
export const getGradient = (mode: Mode) => modeColors[mode].gradient;
export const getGlow = (mode: Mode) => modeColors[mode].glow;
export const getGlowStrong = (mode: Mode) => modeColors[mode].glowStrong;
export const getBorder = (mode: Mode) => modeColors[mode].border;
export const getBgSubtle = (mode: Mode) => modeColors[mode].bgSubtle;

export const getModeColors = (mode: Mode) => modeColors[mode];
