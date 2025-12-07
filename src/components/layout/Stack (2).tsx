'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/motion';

export interface StackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  divider?: React.ReactNode;
  animated?: boolean;
  as?: 'div' | 'section' | 'article' | 'nav' | 'ul' | 'ol';
}

export const Stack = React.forwardRef<HTMLElement, StackProps>(
  (
    {
      children,
      className,
      direction = 'vertical',
      spacing = 'md',
      align = 'stretch',
      justify = 'start',
      wrap = false,
      divider,
      animated = false,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    const spacingClasses = {
      vertical: {
        none: 'space-y-0',
        xs: 'space-y-1',
        sm: 'space-y-2',
        md: 'space-y-4',
        lg: 'space-y-6',
        xl: 'space-y-8',
        '2xl': 'space-y-12',
      },
      horizontal: {
        none: 'space-x-0',
        xs: 'space-x-1',
        sm: 'space-x-2',
        md: 'space-x-4',
        lg: 'space-x-6',
        xl: 'space-x-8',
        '2xl': 'space-x-12',
      },
    };

    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    };

    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    const childrenArray = React.Children.toArray(children);
    const childrenWithDividers = divider
      ? childrenArray.flatMap((child, index) =>
          index < childrenArray.length - 1 ? [child, <React.Fragment key={`divider-${index}`}>{divider}</React.Fragment>] : [child]
        )
      : childrenArray;

    const MotionComponent = animated ? (motion[Component] as any) : Component;

    return (
      <MotionComponent
        ref={ref}
        className={cn(
          'flex',
          direction === 'vertical' ? 'flex-col' : 'flex-row',
          !divider && spacingClasses[direction][spacing],
          alignClasses[align],
          justifyClasses[justify],
          wrap && 'flex-wrap',
          className
        )}
        variants={animated ? staggerContainerVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        {...props}
      >
        {animated
          ? childrenWithDividers.map((child, index) =>
              React.isValidElement(child) && child.key?.toString().startsWith('divider-') ? (
                child
              ) : (
                <motion.div key={index} variants={staggerItemVariants}>
                  {child}
                </motion.div>
              )
            )
          : childrenWithDividers}
      </MotionComponent>
    );
  }
);

Stack.displayName = 'Stack';

// Vertical stack (VStack)
export const VStack = React.forwardRef<HTMLElement, Omit<StackProps, 'direction'>>(
  (props, ref) => {
    return <Stack ref={ref} direction="vertical" {...props} />;
  }
);

VStack.displayName = 'VStack';

// Horizontal stack (HStack)
export const HStack = React.forwardRef<HTMLElement, Omit<StackProps, 'direction'>>(
  (props, ref) => {
    return <Stack ref={ref} direction="horizontal" {...props} />;
  }
);

HStack.displayName = 'HStack';

// Spacer component for use inside Stack
export const Spacer: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('flex-1', className)} />;
};

Spacer.displayName = 'Spacer';

// Divider component
export const Divider: React.FC<{
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  thickness?: 'thin' | 'medium' | 'thick';
  opacity?: number;
}> = ({ orientation = 'horizontal', className, thickness = 'thin', opacity = 0.1 }) => {
  const thicknessClasses = {
    horizontal: {
      thin: 'h-px',
      medium: 'h-0.5',
      thick: 'h-1',
    },
    vertical: {
      thin: 'w-px',
      medium: 'w-0.5',
      thick: 'w-1',
    },
  };

  return (
    <div
      className={cn(
        orientation === 'horizontal' ? 'w-full' : 'h-full',
        thicknessClasses[orientation][thickness],
        'bg-white',
        className
      )}
      style={{ opacity }}
    />
  );
};

Divider.displayName = 'Divider';

// Center component
export const Center: React.FC<{
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}> = ({ children, className, inline = false }) => {
  return (
    <div
      className={cn(
        inline ? 'inline-flex' : 'flex',
        'items-center justify-center',
        className
      )}
    >
      {children}
    </div>
  );
};

Center.displayName = 'Center';

// Grid stack (for grid-based layouts)
export const GridStack: React.FC<{
  children: React.ReactNode;
  className?: string;
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: StackProps['spacing'];
}> = ({ children, className, columns = 2, gap = 'md' }) => {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-12',
  };

  const getGridCols = (count: number) => {
    const map: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };
    return map[count] || 'grid-cols-2';
  };

  if (typeof columns === 'number') {
    return (
      <div className={cn('grid', getGridCols(columns), gapClasses[gap], className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid',
        columns.sm && `sm:${getGridCols(columns.sm)}`,
        columns.md && `md:${getGridCols(columns.md)}`,
        columns.lg && `lg:${getGridCols(columns.lg)}`,
        columns.xl && `xl:${getGridCols(columns.xl)}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

GridStack.displayName = 'GridStack';
