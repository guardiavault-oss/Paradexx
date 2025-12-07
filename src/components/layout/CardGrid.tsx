'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/motion';

export interface CardGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    initial?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  staggerDelay?: number;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  className,
  columns = {
    initial: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
  },
  gap = 'lg',
  animated = true,
  staggerDelay = 0.1,
}) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
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
    return map[count] || 'grid-cols-4';
  };

  return (
    <motion.div
      className={cn(
        'grid',
        columns.initial && getGridCols(columns.initial),
        columns.sm && `sm:${getGridCols(columns.sm)}`,
        columns.md && `md:${getGridCols(columns.md)}`,
        columns.lg && `lg:${getGridCols(columns.lg)}`,
        columns.xl && `xl:${getGridCols(columns.xl)}`,
        gapClasses[gap],
        className
      )}
      variants={animated ? staggerContainerVariants : undefined}
      initial={animated ? 'initial' : undefined}
      animate={animated ? 'animate' : undefined}
      viewport={animated ? { once: true, margin: '-50px' } : undefined}
    >
      {React.Children.map(children, (child, index) =>
        animated ? (
          <motion.div
            key={index}
            variants={staggerItemVariants}
            custom={index * staggerDelay}
          >
            {child}
          </motion.div>
        ) : (
          <div key={index}>{child}</div>
        )
      )}
    </motion.div>
  );
};

CardGrid.displayName = 'CardGrid';

// Auto-fit grid (items will auto-size to fit)
export const CardGridAutoFit: React.FC<{
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  gap?: CardGridProps['gap'];
  animated?: boolean;
}> = ({ children, className, minWidth = 300, gap = 'lg', animated = true }) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <motion.div
      className={cn('grid', gapClasses[gap], className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
      }}
      variants={animated ? staggerContainerVariants : undefined}
      initial={animated ? 'initial' : undefined}
      whileInView={animated ? 'animate' : undefined}
      viewport={animated ? { once: true, margin: '-50px' } : undefined}
    >
      {React.Children.map(children, (child, index) =>
        animated ? (
          <motion.div key={index} variants={staggerItemVariants}>
            {child}
          </motion.div>
        ) : (
          <div key={index}>{child}</div>
        )
      )}
    </motion.div>
  );
};

CardGridAutoFit.displayName = 'CardGridAutoFit';

// Auto-fill grid (items will fill available space)
export const CardGridAutoFill: React.FC<{
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
  gap?: CardGridProps['gap'];
  animated?: boolean;
}> = ({ children, className, minWidth = 250, maxWidth = 400, gap = 'lg', animated = true }) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <motion.div
      className={cn('grid', gapClasses[gap], className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, ${maxWidth}px))`,
      }}
      variants={animated ? staggerContainerVariants : undefined}
      initial={animated ? 'initial' : undefined}
      whileInView={animated ? 'animate' : undefined}
      viewport={animated ? { once: true, margin: '-50px' } : undefined}
    >
      {React.Children.map(children, (child, index) =>
        animated ? (
          <motion.div key={index} variants={staggerItemVariants}>
            {child}
          </motion.div>
        ) : (
          <div key={index}>{child}</div>
        )
      )}
    </motion.div>
  );
};

CardGridAutoFill.displayName = 'CardGridAutoFill';

// Masonry-style grid
export const CardGridMasonry: React.FC<{
  children: React.ReactNode;
  className?: string;
  columns?: number;
  gap?: CardGridProps['gap'];
}> = ({ children, className, columns = 3, gap = 'lg' }) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const childrenArray = React.Children.toArray(children);
  const columnArrays = Array.from({ length: columns }, () => [] as React.ReactNode[]);

  // Distribute children across columns
  childrenArray.forEach((child, index) => {
    columnArrays[index % columns].push(child);
  });

  return (
    <div className={cn('grid', `grid-cols-${columns}`, gapClasses[gap], className)}>
      {columnArrays.map((columnChildren, columnIndex) => (
        <div key={columnIndex} className={cn('flex flex-col', gapClasses[gap])}>
          {columnChildren.map((child, childIndex) => (
            <motion.div
              key={childIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: childIndex * 0.1 }}
            >
              {child}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
};

CardGridMasonry.displayName = 'CardGridMasonry';
