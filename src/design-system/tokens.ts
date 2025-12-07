/**
 * Paradox Wallet Design System Tokens
 * 
 * Semantic, mode-aware design tokens for the Paradox Wallet application.
 * These tokens support both Degen (fire/aggressive) and Regen (ice/calm) modes.
 * 
 * @module design-system/tokens
 */

// ============================================
// CORE COLOR PALETTE
// ============================================

export const palette = {
  // Pure base colors
  white: '#ffffff',
  black: '#000000',
  
  // Degen (Fire) palette
  degen: {
    primary: '#ff3366',      // Main brand color - consolidated from #ff3333, #ff0000
    secondary: '#ff9500',    // Orange accent
    tertiary: '#ff6b6b',     // Light red for hover states
    dark: '#cc0000',         // Dark red for shadows
    darker: '#990000',       // Deeper shadows
    darkest: '#660000',      // Text shadow depths
  },
  
  // Regen (Ice) palette
  regen: {
    primary: '#00d4ff',      // Main brand color - consolidated from #00aaff, #3399ff, #0066ff
    secondary: '#00ff88',    // Green accent
    tertiary: '#00aaff',     // Can use for special contexts
    dark: '#0066cc',         // Dark blue for shadows
    darker: '#004099',       // Deeper shadows
    darkest: '#003366',      // Text shadow depths
  },
  
  // Neutral grays (from RGBA patterns)
  neutral: {
    50: 'rgba(255, 255, 255, 0.05)',
    100: 'rgba(255, 255, 255, 0.1)',
    200: 'rgba(255, 255, 255, 0.2)',
    300: 'rgba(255, 255, 255, 0.3)',
    400: 'rgba(255, 255, 255, 0.4)',
    500: 'rgba(255, 255, 255, 0.5)',
    600: 'rgba(255, 255, 255, 0.6)',
    700: 'rgba(255, 255, 255, 0.7)',
    800: 'rgba(255, 255, 255, 0.8)',
    900: 'rgba(255, 255, 255, 0.9)',
  },
} as const;

// ============================================
// SEMANTIC COLOR TOKENS
// ============================================

export const colors = {
  // Background colors
  background: {
    primary: 'rgba(0, 0, 0, 0.95)',      // Main dark background
    secondary: 'rgba(0, 0, 0, 0.8)',     // Secondary surfaces
    tertiary: 'rgba(0, 0, 0, 0.4)',      // Lighter backgrounds
    overlay: 'rgba(0, 0, 0, 0.7)',       // Modal overlays
    glass: {
      subtle: 'rgba(0, 0, 0, 0.4)',      // Glassmorphism backgrounds
      medium: 'rgba(0, 0, 0, 0.6)',      
      strong: 'rgba(0, 0, 0, 0.8)',
    },
  },
  
  // Text colors
  text: {
    primary: palette.white,                      // Main text
    secondary: 'rgba(255, 255, 255, 0.7)',      // Secondary text
    tertiary: 'rgba(255, 255, 255, 0.6)',       // Tertiary text
    muted: 'rgba(255, 255, 255, 0.4)',          // Muted/disabled text
    inverse: palette.black,                      // Light backgrounds
  },
  
  // Border colors
  border: {
    subtle: 'rgba(255, 255, 255, 0.1)',         // Most common - subtle borders
    normal: 'rgba(255, 255, 255, 0.2)',         // Standard borders
    strong: 'rgba(255, 255, 255, 0.3)',         // Emphasized borders
    focus: 'rgba(255, 255, 255, 0.5)',          // Focus states
  },
  
  // Surface colors (cards, panels)
  surface: {
    base: 'rgba(0, 0, 0, 0.95)',
    elevated: 'rgba(0, 0, 0, 0.8)',
    overlay: 'rgba(255, 255, 255, 0.05)',
    hover: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Interactive states
  interactive: {
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.15)',
    disabled: 'rgba(255, 255, 255, 0.05)',
  },
} as const;

// ============================================
// MODE-SPECIFIC ACCENT TOKENS
// ============================================

export const modeColors = {
  degen: {
    // Primary accent colors
    accent: {
      primary: palette.degen.primary,
      secondary: palette.degen.secondary,
      tertiary: palette.degen.tertiary,
    },
    
    // Background overlays
    background: {
      subtle: 'rgba(255, 51, 102, 0.05)',
      light: 'rgba(255, 51, 102, 0.1)',
      medium: 'rgba(255, 51, 102, 0.15)',
      strong: 'rgba(255, 51, 102, 0.2)',
    },
    
    // Borders with brand color
    border: {
      subtle: 'rgba(255, 51, 102, 0.2)',
      normal: 'rgba(255, 51, 102, 0.4)',
      strong: 'rgba(255, 51, 102, 0.6)',
      solid: palette.degen.primary,
    },
    
    // Glow/shadow colors
    glow: {
      subtle: 'rgba(255, 51, 102, 0.2)',
      normal: 'rgba(255, 51, 102, 0.4)',
      strong: 'rgba(255, 51, 102, 0.8)',
    },
    
    // Gradients
    gradient: {
      primary: `linear-gradient(90deg, ${palette.degen.primary}, ${palette.degen.secondary})`,
      button: `linear-gradient(135deg, ${palette.degen.primary}, ${palette.degen.tertiary}, ${palette.degen.primary})`,
      background: `linear-gradient(135deg, rgba(255, 51, 102, 0.1), rgba(255, 107, 107, 0.05))`,
      radial: `radial-gradient(circle at top left, rgba(255, 51, 102, 0.15) 0%, rgba(0, 0, 0, 0.95) 50%)`,
    },
  },
  
  regen: {
    // Primary accent colors
    accent: {
      primary: palette.regen.primary,
      secondary: palette.regen.secondary,
      tertiary: palette.regen.tertiary,
    },
    
    // Background overlays
    background: {
      subtle: 'rgba(0, 212, 255, 0.05)',
      light: 'rgba(0, 212, 255, 0.1)',
      medium: 'rgba(0, 212, 255, 0.15)',
      strong: 'rgba(0, 212, 255, 0.2)',
    },
    
    // Borders with brand color
    border: {
      subtle: 'rgba(0, 212, 255, 0.2)',
      normal: 'rgba(0, 212, 255, 0.4)',
      strong: 'rgba(0, 212, 255, 0.6)',
      solid: palette.regen.primary,
    },
    
    // Glow/shadow colors
    glow: {
      subtle: 'rgba(0, 212, 255, 0.2)',
      normal: 'rgba(0, 212, 255, 0.4)',
      strong: 'rgba(0, 212, 255, 0.8)',
    },
    
    // Gradients
    gradient: {
      primary: `linear-gradient(90deg, ${palette.regen.primary}, ${palette.regen.secondary})`,
      button: `linear-gradient(135deg, ${palette.regen.primary}, ${palette.regen.secondary}, ${palette.regen.primary})`,
      background: `linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 136, 0.05))`,
      radial: `radial-gradient(circle at top right, rgba(0, 212, 255, 0.15) 0%, rgba(0, 0, 0, 0.95) 50%)`,
    },
  },
} as const;

// ============================================
// TYPOGRAPHY TOKENS
// ============================================

export const typography = {
  // Font families
  fontFamily: {
    primary: "'Rajdhani', sans-serif",
    mono: 'monospace',
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  // Font sizes (responsive with clamp)
  fontSize: {
    hero: 'clamp(48px, 10vw, 120px)',        // Main hero text
    title: 'clamp(32px, 5vw, 48px)',         // Page titles
    heading: 'clamp(24px, 4vw, 42px)',       // Major headings
    subheading: 'clamp(20px, 2vw, 28px)',    // Subheadings
    body: 'clamp(14px, 2vw, 18px)',          // Body text
    small: 'clamp(12px, 2vw, 14px)',         // Small text
    xs: '12px',                               // Extra small
    
    // Fixed sizes for precise control
    fixed: {
      '72': '72px',
      '48': '48px',
      '32': '32px',
      '28': '28px',
      '24': '24px',
      '20': '20px',
      '18': '18px',
      '16': '16px',
      '14': '14px',
      '12': '12px',
    },
  },
  
  // Font weights
  fontWeight: {
    black: 900,       // Ultra bold - main titles
    extrabold: 800,   // Heavy - section headers
    bold: 700,        // Bold - UI elements
    semibold: 600,    // Semi-bold - emphasis
    medium: 500,      // Medium - body variants
    normal: 400,      // Normal - default
  },
  
  // Line heights
  lineHeight: {
    tight: 0.9,       // Very tight - large titles
    snug: 1.3,        // Snug - content
    normal: 1.5,      // Normal - body text
    relaxed: 1.8,     // Relaxed - readable content
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0em',
    wide: '0.05em',
    wider: '0.1em',
    widest: '0.2em',    // Most common for uppercase
  },
} as const;

// ============================================
// SPACING TOKENS
// ============================================

export const spacing = {
  // Base 4px scale
  px: '1px',
  0: '0',
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
  
  // Semantic spacing
  button: {
    sm: '8px 16px',      // Small buttons
    md: '12px 16px',     // Medium buttons
    lg: '16px 32px',     // Large buttons
    xl: '16px 48px',     // Extra large
  },
  
  card: {
    sm: '16px',
    md: '24px',          // Most common
    lg: '32px',
  },
  
  section: {
    sm: '32px',
    md: '48px',
    lg: '64px',
    xl: '96px',
  },
} as const;

// ============================================
// BORDER RADIUS TOKENS
// ============================================

export const radius = {
  none: '0',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  full: '9999px',
  
  // Custom values found in codebase
  card: '24px',
  tunnel: '40px',
} as const;

// ============================================
// SHADOW TOKENS
// ============================================

export const shadows = {
  // Standard shadows
  sm: '0 10px 30px rgba(0, 0, 0, 0.3)',
  md: '0 20px 60px rgba(0, 0, 0, 0.5)',
  lg: '0 20px 60px rgba(0, 0, 0, 0.9)',
  
  // Elevated shadows
  elevated: '-10px 0 40px rgba(0, 0, 0, 0.5)',
  
  // Mode-specific glows (use with accent colors)
  glow: {
    degen: {
      sm: `0 0 20px ${modeColors.degen.glow.subtle}`,
      md: `0 0 40px ${modeColors.degen.glow.normal}`,
      lg: `0 0 60px ${modeColors.degen.glow.normal}`,
      xl: `0 0 80px ${modeColors.degen.glow.normal}`,
      elevated: `0 20px 60px ${modeColors.degen.glow.normal}`,
      tunnel: `0 0 60px 5px rgba(255, 50, 50, 0.7), inset 0 0 40px rgba(255, 50, 50, 0.1)`,
    },
    regen: {
      sm: `0 0 20px ${modeColors.regen.glow.subtle}`,
      md: `0 0 40px ${modeColors.regen.glow.normal}`,
      lg: `0 0 60px ${modeColors.regen.glow.normal}`,
      xl: `0 0 80px ${modeColors.regen.glow.normal}`,
      elevated: `0 20px 60px ${modeColors.regen.glow.normal}`,
      tunnel: `0 0 60px 5px rgba(0, 150, 255, 0.7), inset 0 0 40px rgba(0, 150, 255, 0.1)`,
    },
  },
  
  // Text shadows
  text: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)',
    glow: '0 0 80px rgba(255, 255, 255, 0.3)',
  },
} as const;

// ============================================
// BLUR TOKENS
// ============================================

export const blur = {
  none: '0',
  sm: '10px',
  md: '20px',      // Most common - glassmorphism
  lg: '40px',
  xl: '100px',
} as const;

// ============================================
// TRANSITION TOKENS
// ============================================

export const transitions = {
  duration: {
    fast: '200ms',
    normal: '300ms',     // Most common
    slow: '700ms',
    slower: '1000ms',
  },
  
  easing: {
    default: 'ease',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
  
  // Common combinations
  all: 'all 300ms ease',
  colors: 'background-color 300ms ease, border-color 300ms ease, color 300ms ease',
  transform: 'transform 300ms ease',
} as const;

// ============================================
// Z-INDEX TOKENS
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get mode-specific accent color
 */
export const getAccentColor = (mode: 'degen' | 'regen', variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
  return modeColors[mode].accent[variant];
};

/**
 * Get mode-specific gradient
 */
export const getGradient = (mode: 'degen' | 'regen', type: keyof typeof modeColors.degen.gradient) => {
  return modeColors[mode].gradient[type];
};

/**
 * Get mode-specific glow shadow
 */
export const getGlow = (mode: 'degen' | 'regen', size: 'sm' | 'md' | 'lg' | 'xl' | 'elevated' | 'tunnel') => {
  return shadows.glow[mode][size];
};

// ============================================
// TYPE EXPORTS
// ============================================

export type Mode = 'degen' | 'regen';
export type GlowSize = 'sm' | 'md' | 'lg' | 'xl' | 'elevated' | 'tunnel';
export type GradientType = keyof typeof modeColors.degen.gradient;
