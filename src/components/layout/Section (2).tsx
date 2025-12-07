'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { fadeInUpVariants, transitions } from '@/lib/motion';

export interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: 'section' | 'div' | 'article';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  background?: 'transparent' | 'subtle' | 'medium' | 'strong';
  animated?: boolean;
  delay?: number;
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      children,
      className,
      id,
      as = 'section',
      padding = 'lg',
      maxWidth = '2xl',
      background = 'transparent',
      animated = true,
      delay = 0,
      ...props
    },
    ref
  ) => {
    const Component = motion[as] as any;

    const paddingClasses = {
      none: 'py-0',
      sm: 'py-8',
      md: 'py-12',
      lg: 'py-16',
      xl: 'py-24',
    };

    const maxWidthClasses = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      '2xl': 'max-w-[1400px]',
      full: 'max-w-full',
    };

    const backgroundClasses = {
      transparent: '',
      subtle: 'bg-white/[0.02]',
      medium: 'bg-white/[0.05]',
      strong: 'bg-white/10',
    };

    return (
      <Component
        ref={ref}
        id={id}
        className={cn(paddingClasses[padding], backgroundClasses[background], className)}
        variants={animated ? fadeInUpVariants : undefined}
        initial={animated ? 'initial' : undefined}
        whileInView={animated ? 'animate' : undefined}
        viewport={animated ? { once: true, margin: '-100px' } : undefined}
        transition={animated ? { ...transitions.smooth, delay } : undefined}
        {...props}
      >
        <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', maxWidthClasses[maxWidth])}>
          {children}
        </div>
      </Component>
    );
  }
);

Section.displayName = 'Section';

// Section header component
export const SectionHeader: React.FC<{
  title: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}> = ({ title, description, align = 'left', className }) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={cn('mb-12', alignClasses[align], className)}>
      <motion.h2
        className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          className="text-lg text-white/60 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
};

SectionHeader.displayName = 'SectionHeader';

// Full-width section without container
export const SectionFullWidth: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: SectionProps['padding'];
  background?: SectionProps['background'];
}> = ({ children, className, padding = 'lg', background = 'transparent' }) => {
  const paddingClasses = {
    none: 'py-0',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24',
  };

  const backgroundClasses = {
    transparent: '',
    subtle: 'bg-white/[0.02]',
    medium: 'bg-white/[0.05]',
    strong: 'bg-white/10',
  };

  return (
    <section className={cn(paddingClasses[padding], backgroundClasses[background], className)}>
      {children}
    </section>
  );
};

SectionFullWidth.displayName = 'SectionFullWidth';
