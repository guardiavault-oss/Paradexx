/**
 * Paradox Wallet Design System - Components
 * 
 * Theme-aware, token-based UI components following the design system.
 * These components automatically use CSS variables from globals.css.
 */

// Theme utilities
export {
    ThemeProvider,
    useTheme,
    getThemeStyles,
    cn,
    themeClass,
    type ThemeMode
} from './ThemeProvider';

// Themed components
export { ThemedButton } from './ThemedButton';
export {
    ThemedCard,
    GlassCard,
    SurfaceCard,
    ElevatedCard,
    ThemedGlassCard
} from './ThemedCard';

// Legacy GlassCard (for backward compatibility)
export { GlassCard as LegacyGlassCard } from './GlassCard';
