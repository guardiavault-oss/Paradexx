/**
 * GlassCard Component
 * 
 * A reusable glassmorphism card component with mode-aware styling.
 * Supports multiple intensity levels and automatic accent color adaptation.
 * 
 * @example
 * ```tsx
 * <GlassCard mode="degen" intensity="medium" accent>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </GlassCard>
 * ```
 */

import React from 'react';
import { Mode, getAccentColor } from '../tokens';

export interface GlassCardProps {
  /** Content to render inside the card */
  children: React.ReactNode;
  
  /** Visual intensity of the glass effect */
  intensity?: 'subtle' | 'medium' | 'strong';
  
  /** Mode for accent colors (degen or regen) */
  mode?: Mode;
  
  /** Whether to use accent-colored border */
  accent?: boolean;
  
  /** Whether to show hover effects */
  hoverable?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Additional inline styles */
  style?: React.CSSProperties;
  
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  /** Border radius */
  rounded?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  
  /** Add glow shadow effect */
  glow?: boolean;
}

const intensityStyles = {
  subtle: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(20px)',
  },
  medium: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(20px)',
  },
  strong: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(40px)',
  },
} as const;

const paddingStyles = {
  none: '0',
  sm: '16px',
  md: '24px',
  lg: '32px',
} as const;

const roundedStyles = {
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
} as const;

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  mode,
  accent = false,
  hoverable = false,
  className = '',
  onClick,
  style = {},
  padding = 'md',
  rounded = 'xl',
  glow = false,
}) => {
  const baseStyles = intensityStyles[intensity];
  
  // Determine border color
  let borderColor = 'rgba(255, 255, 255, 0.1)';
  if (accent && mode) {
    const accentColor = getAccentColor(mode, 'primary');
    borderColor = mode === 'degen' 
      ? 'rgba(255, 51, 102, 0.4)' 
      : 'rgba(0, 212, 255, 0.4)';
  }
  
  // Determine box shadow
  let boxShadow = '0 20px 60px rgba(0, 0, 0, 0.5)';
  if (glow && mode) {
    boxShadow = mode === 'degen'
      ? '0 0 40px rgba(255, 51, 102, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)'
      : '0 0 40px rgba(0, 212, 255, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)';
  }
  
  const cardStyles: React.CSSProperties = {
    ...baseStyles,
    border: `1px solid ${borderColor}`,
    borderRadius: roundedStyles[rounded],
    padding: paddingStyles[padding],
    boxShadow,
    transition: 'all 300ms ease',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };
  
  const hoverStyles = hoverable ? {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      e.currentTarget.style.borderColor = accent && mode 
        ? (mode === 'degen' ? 'rgba(255, 51, 102, 0.6)' : 'rgba(0, 212, 255, 0.6)')
        : 'rgba(255, 255, 255, 0.2)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.backgroundColor = baseStyles.backgroundColor;
      e.currentTarget.style.borderColor = borderColor;
      e.currentTarget.style.transform = 'translateY(0)';
    },
  } : {};
  
  return (
    <div
      className={className}
      style={cardStyles}
      onClick={onClick}
      {...hoverStyles}
    >
      {children}
    </div>
  );
};

/**
 * GlassPanel - A variant optimized for sidebar/panel layouts
 */
export const GlassPanel: React.FC<Omit<GlassCardProps, 'rounded' | 'padding'>> = (props) => {
  return <GlassCard {...props} rounded="lg" padding="lg" />;
};

/**
 * GlassButton - A glass-styled button component
 */
export interface GlassButtonProps extends Omit<GlassCardProps, 'children' | 'padding'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  mode,
  disabled = false,
  onClick,
  className = '',
  style = {},
  ...rest
}) => {
  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '14px' },
    md: { padding: '12px 32px', fontSize: '16px' },
    lg: { padding: '16px 48px', fontSize: '18px' },
  };
  
  const variantStyles = {
    primary: mode ? {
      backgroundColor: mode === 'degen' ? '#ff3366' : '#00d4ff',
      color: '#ffffff',
      border: 'none',
      boxShadow: mode === 'degen' 
        ? '0 0 40px rgba(255, 51, 102, 0.4)' 
        : '0 0 40px rgba(0, 212, 255, 0.4)',
    } : {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    secondary: mode ? {
      backgroundColor: 'transparent',
      color: mode === 'degen' ? '#ff3366' : '#00d4ff',
      border: mode === 'degen' 
        ? '2px solid #ff3366' 
        : '2px solid #00d4ff',
    } : {
      backgroundColor: 'transparent',
      color: '#ffffff',
      border: '2px solid rgba(255, 255, 255, 0.3)',
    },
    ghost: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
  };
  
  const buttonStyles: React.CSSProperties = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    borderRadius: '9999px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 300ms ease',
    outline: 'none',
    ...style,
  };
  
  return (
    <button
      className={className}
      style={buttonStyles}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
          if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1)';
          if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }
        }
      }}
    >
      {children}
    </button>
  );
};

export default GlassCard;
