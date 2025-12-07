import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn, getThemeStyles } from './ThemeProvider';

// ============================================
// TYPES
// ============================================

type ThemeMode = 'degen' | 'regen';
type CardVariant = 'surface' | 'glass' | 'elevated' | 'themed';
type CardSize = 'sm' | 'md' | 'lg' | 'none';

interface ThemedCardProps extends HTMLMotionProps<'div'> {
    theme?: ThemeMode;
    variant?: CardVariant;
    padding?: CardSize;
    hoverable?: boolean;
    glow?: boolean;
    animated?: boolean;
    children: React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export function ThemedCard({
    theme,
    variant = 'surface',
    padding = 'md',
    hoverable = false,
    glow = false,
    animated = true,
    className,
    children,
    ...props
}: ThemedCardProps) {
    const styles = theme ? getThemeStyles(theme) : null;

    // Padding classes
    const paddingClasses = {
        none: '',
        sm: 'p-[var(--space-4)]',
        md: 'p-[var(--space-6)]',
        lg: 'p-[var(--space-8)]',
    };

    // Variant classes
    const variantClasses = {
        surface: cn(
            'bg-[var(--bg-surface)]',
            'border border-[var(--border-neutral)]',
            hoverable && 'hover:border-[var(--border-neutral-strong)]',
        ),
        glass: cn(
            'bg-[var(--glass-medium)]',
            'backdrop-blur-[var(--blur-lg)]',
            'border border-[var(--glass-border)]',
            hoverable && 'hover:bg-[var(--glass-strong)] hover:border-[var(--glass-border-strong)]',
        ),
        elevated: cn(
            'bg-[var(--bg-elevated)]',
            'border border-[var(--border-neutral)]',
            'shadow-[var(--shadow-md)]',
            hoverable && 'hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-neutral-strong)]',
        ),
        themed: theme ? cn(
            theme === 'degen'
                ? 'bg-[var(--glass-degen-light)] border border-[var(--glass-border-degen)]'
                : 'bg-[var(--glass-regen-light)] border border-[var(--glass-border-regen)]',
            'backdrop-blur-[var(--blur-lg)]',
            hoverable && (theme === 'degen'
                ? 'hover:bg-[var(--glass-degen-medium)] hover:border-[var(--degen-border-hover)]'
                : 'hover:bg-[var(--glass-regen-medium)] hover:border-[var(--regen-border-hover)]'),
            glow && (theme === 'degen'
                ? 'shadow-[var(--shadow-degen-sm)] hover:shadow-[var(--shadow-degen-md)]'
                : 'shadow-[var(--shadow-regen-sm)] hover:shadow-[var(--shadow-regen-md)]'),
        ) : '',
    };

    const Component = animated ? motion.div : 'div';
    const motionProps = animated ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        whileHover: hoverable ? { y: -2 } : undefined,
    } : {};

    return (
        <Component
            className={cn(
                // Base
                'rounded-[var(--radius-xl)]',
                'transition-all',
                'duration-[var(--duration-normal)]',
                'ease-[var(--ease-out)]',
                // Padding
                paddingClasses[padding],
                // Variant
                variantClasses[variant],
                className,
            )}
            {...(animated ? motionProps : {})}
            {...props}
        >
            {children}
        </Component>
    );
}

// ============================================
// PRESET VARIANTS
// ============================================

interface PresetCardProps extends Omit<ThemedCardProps, 'variant'> { }

export function GlassCard(props: PresetCardProps) {
    return <ThemedCard variant="glass" {...props} />;
}

export function SurfaceCard(props: PresetCardProps) {
    return <ThemedCard variant="surface" {...props} />;
}

export function ElevatedCard(props: PresetCardProps) {
    return <ThemedCard variant="elevated" {...props} />;
}

export function ThemedGlassCard({ theme, ...props }: PresetCardProps & { theme: ThemeMode }) {
    return <ThemedCard variant="themed" theme={theme} {...props} />;
}
