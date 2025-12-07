import { motion } from 'motion/react';
import { ReactNode } from 'react';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  glowColor,
  onClick,
}: GlassCardProps) {
  const glowShadow = glowColor 
    ? `0 0 30px ${glowColor}40`
    : glow 
      ? '0 0 30px rgba(var(--accent-primary-rgb),0.2)' 
      : 'none';
  
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        relative
        bg-white/5
        backdrop-blur-xl
        border border-white/10
        rounded-2xl
        p-6
        transition-all
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        background: (glow || glowColor)
          ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          : undefined,
        boxShadow: glowShadow,
      }}
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
