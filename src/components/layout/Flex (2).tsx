'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface FlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  as?: 'div' | 'section' | 'article' | 'nav' | 'header' | 'footer';
}

export const Flex = React.forwardRef<HTMLElement, FlexProps>(
  (
    {
      children,
      className,
      direction = 'row',
      align = 'stretch',
      justify = 'start',
      wrap = 'nowrap',
      gap = 'none',
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    const directionClasses = {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
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

    const wrapClasses = {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse',
    };

    const gapClasses = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    };

    return (
      <Component
        ref={ref as any}
        className={cn(
          'flex',
          directionClasses[direction],
          alignClasses[align],
          justifyClasses[justify],
          wrapClasses[wrap],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Flex.displayName = 'Flex';

// Flex item with flex properties
export const FlexItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  flex?: string | number;
  grow?: number;
  shrink?: number;
  basis?: string;
  order?: number;
}> = ({ children, className, flex, grow, shrink, basis, order }) => {
  const style: React.CSSProperties = {};

  if (flex !== undefined) style.flex = flex;
  if (grow !== undefined) style.flexGrow = grow;
  if (shrink !== undefined) style.flexShrink = shrink;
  if (basis !== undefined) style.flexBasis = basis;
  if (order !== undefined) style.order = order;

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

FlexItem.displayName = 'FlexItem';
