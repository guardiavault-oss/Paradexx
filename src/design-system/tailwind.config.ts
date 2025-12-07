import type { Config } from "tailwindcss";
import { palette, colors, typography, spacing, radius, blur, transitions } from "./tokens";

/**
 * Paradox Wallet Tailwind Configuration
 * 
 * Extends Tailwind with design system tokens for consistent theming.
 * All values are sourced from the centralized token system.
 */

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ============================================
      // COLORS
      // ============================================
      colors: {
        // Brand palette
        degen: {
          primary: palette.degen.primary,
          secondary: palette.degen.secondary,
          tertiary: palette.degen.tertiary,
          dark: palette.degen.dark,
          darker: palette.degen.darker,
          darkest: palette.degen.darkest,
        },
        regen: {
          primary: palette.regen.primary,
          secondary: palette.regen.secondary,
          tertiary: palette.regen.tertiary,
          dark: palette.regen.dark,
          darker: palette.regen.darker,
          darkest: palette.regen.darkest,
        },
        
        // Semantic colors
        background: {
          primary: colors.background.primary,
          secondary: colors.background.secondary,
          tertiary: colors.background.tertiary,
          overlay: colors.background.overlay,
        },
        surface: {
          base: colors.surface.base,
          elevated: colors.surface.elevated,
          overlay: colors.surface.overlay,
          hover: colors.surface.hover,
        },
        border: {
          subtle: colors.border.subtle,
          DEFAULT: colors.border.normal,
          strong: colors.border.strong,
          focus: colors.border.focus,
        },
        
        // Neutral scale (white-based)
        neutral: palette.neutral,
      },
      
      // ============================================
      // TYPOGRAPHY
      // ============================================
      fontFamily: {
        primary: [typography.fontFamily.primary],
        mono: [typography.fontFamily.mono],
        system: [typography.fontFamily.system],
      },
      
      fontSize: {
        hero: typography.fontSize.hero,
        title: typography.fontSize.title,
        heading: typography.fontSize.heading,
        subheading: typography.fontSize.subheading,
        body: typography.fontSize.body,
        small: typography.fontSize.small,
        xs: typography.fontSize.xs,
        // Fixed sizes
        '72': typography.fontSize.fixed['72'],
        '48': typography.fontSize.fixed['48'],
        '32': typography.fontSize.fixed['32'],
        '28': typography.fontSize.fixed['28'],
        '24': typography.fontSize.fixed['24'],
        '20': typography.fontSize.fixed['20'],
        '18': typography.fontSize.fixed['18'],
        '16': typography.fontSize.fixed['16'],
        '14': typography.fontSize.fixed['14'],
        '12': typography.fontSize.fixed['12'],
      },
      
      fontWeight: {
        black: typography.fontWeight.black,
        extrabold: typography.fontWeight.extrabold,
        bold: typography.fontWeight.bold,
        semibold: typography.fontWeight.semibold,
        medium: typography.fontWeight.medium,
        normal: typography.fontWeight.normal,
      },
      
      lineHeight: {
        tight: String(typography.lineHeight.tight),
        snug: String(typography.lineHeight.snug),
        normal: String(typography.lineHeight.normal),
        relaxed: String(typography.lineHeight.relaxed),
      },
      
      letterSpacing: {
        tighter: typography.letterSpacing.tighter,
        tight: typography.letterSpacing.tight,
        normal: typography.letterSpacing.normal,
        wide: typography.letterSpacing.wide,
        wider: typography.letterSpacing.wider,
        widest: typography.letterSpacing.widest,
      },
      
      // ============================================
      // SPACING
      // ============================================
      spacing: {
        ...spacing,
      },
      
      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        none: radius.none,
        sm: radius.sm,
        DEFAULT: radius.md,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
        '2xl': radius['2xl'],
        '3xl': radius['3xl'],
        full: radius.full,
        card: radius.card,
        tunnel: radius.tunnel,
      },
      
      // ============================================
      // SHADOWS
      // ============================================
      boxShadow: {
        sm: '0 10px 30px rgba(0, 0, 0, 0.3)',
        DEFAULT: '0 20px 60px rgba(0, 0, 0, 0.5)',
        md: '0 20px 60px rgba(0, 0, 0, 0.5)',
        lg: '0 20px 60px rgba(0, 0, 0, 0.9)',
        elevated: '-10px 0 40px rgba(0, 0, 0, 0.5)',
        
        // Glow shadows (degen)
        'glow-degen-sm': '0 0 20px rgba(255, 51, 102, 0.2)',
        'glow-degen-md': '0 0 40px rgba(255, 51, 102, 0.4)',
        'glow-degen-lg': '0 0 60px rgba(255, 51, 102, 0.4)',
        'glow-degen-xl': '0 0 80px rgba(255, 51, 102, 0.4)',
        
        // Glow shadows (regen)
        'glow-regen-sm': '0 0 20px rgba(0, 212, 255, 0.2)',
        'glow-regen-md': '0 0 40px rgba(0, 212, 255, 0.4)',
        'glow-regen-lg': '0 0 60px rgba(0, 212, 255, 0.4)',
        'glow-regen-xl': '0 0 80px rgba(0, 212, 255, 0.4)',
      },
      
      // ============================================
      // BACKDROP BLUR
      // ============================================
      backdropBlur: {
        none: blur.none,
        sm: blur.sm,
        DEFAULT: blur.md,
        md: blur.md,
        lg: blur.lg,
        xl: blur.xl,
      },
      
      // ============================================
      // TRANSITIONS
      // ============================================
      transitionDuration: {
        fast: transitions.duration.fast,
        DEFAULT: transitions.duration.normal,
        normal: transitions.duration.normal,
        slow: transitions.duration.slow,
        slower: transitions.duration.slower,
      },
      
      transitionTimingFunction: {
        DEFAULT: transitions.easing.default,
        in: transitions.easing.in,
        out: transitions.easing.out,
        'in-out': transitions.easing.inOut,
      },
      
      // ============================================
      // Z-INDEX
      // ============================================
      zIndex: {
        base: '0',
        dropdown: '10',
        sticky: '20',
        overlay: '40',
        modal: '50',
        popover: '60',
        tooltip: '70',
        notification: '80',
      },
      
      // ============================================
      // ANIMATIONS
      // ============================================
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      animation: {
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'fade-in': 'fade-in 300ms ease',
        'fade-out': 'fade-out 300ms ease',
        'slide-up': 'slide-up 300ms ease',
        'slide-down': 'slide-down 300ms ease',
      },
    },
  },
  plugins: [],
};

export default config;
