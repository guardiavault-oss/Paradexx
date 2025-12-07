/**
 * Paradox Wallet Design System - Main Export
 * 
 * Centralized export for all design system tokens, utilities, and components.
 * Import everything you need from this single file.
 * 
 * @example
 * ```typescript
 * import { colors, getAccentColor, GlassCard } from '@/design-system';
 * ```
 */

// ============================================
// TOKENS
// ============================================

export {
  // Core palette
  palette,
  
  // Semantic colors
  colors,
  
  // Mode-specific colors
  modeColors,
  
  // Typography
  typography,
  
  // Spacing
  spacing,
  
  // Border radius
  radius,
  
  // Shadows
  shadows,
  
  // Blur
  blur,
  
  // Transitions
  transitions,
  
  // Z-index
  zIndex,
  
  // Utility functions
  getAccentColor,
  getGradient,
  getGlow,
  
  // Types
  type Mode,
  type GlowSize,
  type GradientType,
} from './tokens';

// ============================================
// COMPONENTS
// ============================================

export {
  GlassCard,
  GlassPanel,
  GlassButton,
  type GlassCardProps,
  type GlassButtonProps,
} from './components/GlassCard';

// ============================================
// QUICK REFERENCE
// ============================================

/**
 * Common Import Patterns:
 * 
 * // Get all colors
 * import { colors } from '@/design-system';
 * colors.background.primary
 * colors.text.secondary
 * colors.border.subtle
 * 
 * // Get mode-specific accent
 * import { getAccentColor } from '@/design-system';
 * const accentColor = getAccentColor('degen', 'primary');
 * 
 * // Use glassmorphism components
 * import { GlassCard, GlassButton } from '@/design-system';
 * <GlassCard mode="degen" accent>
 *   <GlassButton variant="primary">Action</GlassButton>
 * </GlassCard>
 * 
 * // Get typography tokens
 * import { typography } from '@/design-system';
 * fontFamily: typography.fontFamily.primary
 * fontSize: typography.fontSize.title
 * 
 * // Get spacing tokens
 * import { spacing, radius } from '@/design-system';
 * padding: spacing[6]
 * borderRadius: radius.xl
 */

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Pre-configured theme objects for common use cases
 */
export const themes = {
  degen: {
    primary: '#ff3366',
    secondary: '#ff9500',
    gradient: 'linear-gradient(90deg, #ff3366, #ff9500)',
    glow: '0 0 40px rgba(255, 51, 102, 0.4)',
  },
  regen: {
    primary: '#00d4ff',
    secondary: '#00ff88',
    gradient: 'linear-gradient(90deg, #00d4ff, #00ff88)',
    glow: '0 0 40px rgba(0, 212, 255, 0.4)',
  },
} as const;

/**
 * Common glassmorphism presets
 */
export const glassPresets = {
  subtle: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  medium: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  strong: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
} as const;

/**
 * Common button styles
 */
export const buttonPresets = {
  primary: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    borderRadius: '9999px',
    padding: '12px 32px',
  },
  secondary: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    borderRadius: '9999px',
    padding: '10px 30px',
  },
  ghost: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    borderRadius: '9999px',
    padding: '12px 32px',
  },
} as const;
