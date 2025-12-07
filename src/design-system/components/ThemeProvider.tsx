import React, { createContext, useContext, useMemo } from 'react';

// ============================================
// TYPES
// ============================================

export type ThemeMode = 'degen' | 'regen';

interface ThemeContextValue {
    mode: ThemeMode;
    isDegen: boolean;
    isRegen: boolean;
    // CSS variable getters
    colors: {
        primary: string;
        secondary: string;
        tertiary: string;
        glow: string;
        surface: string;
        surfaceHover: string;
        border: string;
        borderHover: string;
    };
    // Shadow getters
    shadows: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    // Glass getters
    glass: {
        subtle: string;
        light: string;
        medium: string;
        strong: string;
        border: string;
    };
    // Utility classes
    classes: {
        primary: string;
        secondary: string;
        glass: string;
        glowShadow: string;
        focusRing: string;
        pulseGlow: string;
    };
}

// ============================================
// CONTEXT
// ============================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface ThemeProviderProps {
    mode: ThemeMode;
    children: React.ReactNode;
}

export function ThemeProvider({ mode, children }: ThemeProviderProps) {
    const isDegen = mode === 'degen';
    const isRegen = mode === 'regen';

    const value = useMemo<ThemeContextValue>(() => ({
        mode,
        isDegen,
        isRegen,
        colors: {
            primary: isDegen ? 'var(--degen-primary)' : 'var(--regen-primary)',
            secondary: isDegen ? 'var(--degen-secondary)' : 'var(--regen-secondary)',
            tertiary: isDegen ? 'var(--degen-tertiary)' : 'var(--regen-tertiary)',
            glow: isDegen ? 'var(--degen-glow)' : 'var(--regen-glow)',
            surface: isDegen ? 'var(--degen-surface)' : 'var(--regen-surface)',
            surfaceHover: isDegen ? 'var(--degen-surface-hover)' : 'var(--regen-surface-hover)',
            border: isDegen ? 'var(--degen-border)' : 'var(--regen-border)',
            borderHover: isDegen ? 'var(--degen-border-hover)' : 'var(--regen-border-hover)',
        },
        shadows: {
            sm: isDegen ? 'var(--shadow-degen-sm)' : 'var(--shadow-regen-sm)',
            md: isDegen ? 'var(--shadow-degen-md)' : 'var(--shadow-regen-md)',
            lg: isDegen ? 'var(--shadow-degen-lg)' : 'var(--shadow-regen-lg)',
            xl: isDegen ? 'var(--shadow-degen-xl)' : 'var(--shadow-regen-xl)',
        },
        glass: {
            subtle: isDegen ? 'var(--glass-degen-subtle)' : 'var(--glass-regen-subtle)',
            light: isDegen ? 'var(--glass-degen-light)' : 'var(--glass-regen-light)',
            medium: isDegen ? 'var(--glass-degen-medium)' : 'var(--glass-regen-medium)',
            strong: isDegen ? 'var(--glass-degen-strong)' : 'var(--glass-regen-strong)',
            border: isDegen ? 'var(--glass-border-degen)' : 'var(--glass-border-regen)',
        },
        classes: {
            primary: isDegen
                ? 'bg-[var(--degen-primary)] hover:bg-[var(--degen-secondary)]'
                : 'bg-[var(--regen-primary)] hover:bg-[var(--regen-secondary)]',
            secondary: isDegen
                ? 'bg-[var(--degen-surface)] hover:bg-[var(--degen-surface-hover)] border-[var(--degen-border)]'
                : 'bg-[var(--regen-surface)] hover:bg-[var(--regen-surface-hover)] border-[var(--regen-border)]',
            glass: isDegen ? 'glass-degen' : 'glass-regen',
            glowShadow: isDegen
                ? 'shadow-[var(--shadow-degen-md)]'
                : 'shadow-[var(--shadow-regen-md)]',
            focusRing: isDegen ? 'focus-ring-degen' : 'focus-ring-regen',
            pulseGlow: isDegen ? 'animate-pulse-glow-degen' : 'animate-pulse-glow-regen',
        },
    }), [mode, isDegen, isRegen]);

    return (
        <ThemeContext.Provider value={value}>
            <div data-theme={mode} className="contents">
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

// ============================================
// HOOKS
// ============================================

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

/**
 * Get theme-aware styles without using the provider
 * Useful for components that receive type as a prop
 */
export function getThemeStyles(type: ThemeMode) {
    const isDegen = type === 'degen';

    return {
        // Colors
        primaryColor: isDegen ? 'var(--degen-primary)' : 'var(--regen-primary)',
        secondaryColor: isDegen ? 'var(--degen-secondary)' : 'var(--regen-secondary)',
        tertiaryColor: isDegen ? 'var(--degen-tertiary)' : 'var(--regen-tertiary)',
        glowColor: isDegen ? 'var(--degen-glow)' : 'var(--regen-glow)',
        surfaceColor: isDegen ? 'var(--degen-surface)' : 'var(--regen-surface)',
        borderColor: isDegen ? 'var(--degen-border)' : 'var(--regen-border)',

        // Shadows
        shadowSm: isDegen ? 'var(--shadow-degen-sm)' : 'var(--shadow-regen-sm)',
        shadowMd: isDegen ? 'var(--shadow-degen-md)' : 'var(--shadow-regen-md)',
        shadowLg: isDegen ? 'var(--shadow-degen-lg)' : 'var(--shadow-regen-lg)',
        shadowXl: isDegen ? 'var(--shadow-degen-xl)' : 'var(--shadow-regen-xl)',

        // Glass
        glassLight: isDegen ? 'var(--glass-degen-light)' : 'var(--glass-regen-light)',
        glassMedium: isDegen ? 'var(--glass-degen-medium)' : 'var(--glass-regen-medium)',
        glassBorder: isDegen ? 'var(--glass-border-degen)' : 'var(--glass-border-regen)',

        // CSS Classes
        glassClass: isDegen ? 'glass-degen' : 'glass-regen',
        focusRingClass: isDegen ? 'focus-ring-degen' : 'focus-ring-regen',
        pulseGlowClass: isDegen ? 'animate-pulse-glow-degen' : 'animate-pulse-glow-regen',
    };
}

// ============================================
// UTILITY: cn() with theme support
// ============================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Theme-aware className builder
 * Automatically applies the correct theme class based on condition
 */
export function themeClass(
    type: ThemeMode,
    degenClass: string,
    regenClass: string
): string {
    return type === 'degen' ? degenClass : regenClass;
}
