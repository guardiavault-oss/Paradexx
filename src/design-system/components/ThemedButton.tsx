import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn, getThemeStyles } from './ThemeProvider';

// ============================================
// TYPES
// ============================================

type ThemeMode = 'degen' | 'regen';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ThemedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    theme: ThemeMode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    glow?: boolean;
    loading?: boolean;
    children: React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export function ThemedButton({
    theme,
    variant = 'primary',
    size = 'md',
    glow = false,
    loading = false,
    className,
    children,
    disabled,
    ...props
}: ThemedButtonProps) {
    const styles = getThemeStyles(theme);

    // Size classes
    const sizeClasses = {
        sm: 'px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-sm)] min-h-[36px]',
        md: 'px-[var(--space-6)] py-[var(--space-3)] text-[var(--text-base)] min-h-[44px]',
        lg: 'px-[var(--space-8)] py-[var(--space-4)] text-[var(--text-lg)] min-h-[52px]',
    };

    // Variant classes
    const variantClasses = {
        primary: cn(
            'text-white font-medium',
            'bg-[var(--degen-primary)]',
            theme === 'degen'
                ? 'bg-[var(--degen-primary)] hover:bg-[var(--degen-secondary)]'
                : 'bg-[var(--regen-primary)] hover:bg-[var(--regen-secondary)]',
            glow && (theme === 'degen'
                ? 'shadow-[var(--shadow-degen-sm)] hover:shadow-[var(--shadow-degen-md)]'
                : 'shadow-[var(--shadow-regen-sm)] hover:shadow-[var(--shadow-regen-md)]'),
        ),
        secondary: cn(
            'font-medium',
            'bg-[var(--glass-light)]',
            'backdrop-blur-[var(--blur-md)]',
            'border border-[var(--border-neutral)]',
            'text-[var(--text-primary)]',
            'hover:bg-[var(--glass-medium)]',
            'hover:border-[var(--border-neutral-strong)]',
        ),
        ghost: cn(
            'font-medium',
            'text-[var(--text-secondary)]',
            'hover:bg-[var(--bg-hover)]',
            'hover:text-[var(--text-primary)]',
            'active:bg-[var(--bg-active)]',
        ),
        glass: cn(
            'font-medium',
            'backdrop-blur-[var(--blur-lg)]',
            'text-[var(--text-primary)]',
            theme === 'degen'
                ? 'bg-[var(--glass-degen-light)] border border-[var(--glass-border-degen)] hover:bg-[var(--glass-degen-medium)]'
                : 'bg-[var(--glass-regen-light)] border border-[var(--glass-border-regen)] hover:bg-[var(--glass-regen-medium)]',
        ),
        outline: cn(
            'font-medium',
            'bg-transparent',
            'text-[var(--text-primary)]',
            theme === 'degen'
                ? 'border-2 border-[var(--degen-primary)] hover:bg-[var(--degen-surface)]'
                : 'border-2 border-[var(--regen-primary)] hover:bg-[var(--regen-surface)]',
        ),
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            disabled={disabled || loading}
            className={cn(
                // Base styles
                'inline-flex items-center justify-center gap-[var(--space-2)]',
                'rounded-[var(--radius-xl)]',
                'transition-all',
                'duration-[var(--duration-normal)]',
                'ease-[var(--ease-out)]',
                // Focus
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                theme === 'degen'
                    ? 'focus-visible:ring-[var(--degen-primary)]'
                    : 'focus-visible:ring-[var(--regen-primary)]',
                'focus-visible:ring-offset-2',
                'focus-visible:ring-offset-[var(--bg-base)]',
                // Active state
                'active:scale-[0.98]',
                // Disabled
                'disabled:opacity-50',
                'disabled:cursor-not-allowed',
                'disabled:pointer-events-none',
                // Size
                sizeClasses[size],
                // Variant
                variantClasses[variant],
                className,
            )}
            {...props}
        >
            {loading ? (
                <>
                    <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span className="sr-only">Loading...</span>
                </>
            ) : (
                children
            )}
        </motion.button>
    );
}
