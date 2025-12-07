'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'main' | 'aside';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: boolean;
  center?: boolean;
}

export const Container = React.forwardRef<HTMLElement, ContainerProps>(
  (
    {
      children,
      className,
      as: Component = 'div',
      maxWidth = '7xl',
      padding = true,
      center = true,
      ...props
    },
    ref
  ) => {
    const maxWidthClasses = {
      sm: 'max-w-sm',       // 384px
      md: 'max-w-md',       // 448px
      lg: 'max-w-lg',       // 512px
      xl: 'max-w-xl',       // 576px
      '2xl': 'max-w-2xl',   // 672px
      '3xl': 'max-w-3xl',   // 768px
      '4xl': 'max-w-4xl',   // 896px
      '5xl': 'max-w-5xl',   // 1024px
      '6xl': 'max-w-6xl',   // 1152px
      '7xl': 'max-w-7xl',   // 1280px
      full: 'max-w-full',
    };

    return (
      <Component
        ref={ref as any}
        className={cn(
          maxWidthClasses[maxWidth],
          center && 'mx-auto',
          padding && 'px-4 sm:px-6 lg:px-8',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = 'Container';

// Narrow container for text-heavy content
export const ContainerNarrow: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <Container maxWidth="3xl" className={className}>
      {children}
    </Container>
  );
};

ContainerNarrow.displayName = 'ContainerNarrow';

// Wide container
export const ContainerWide: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <Container maxWidth="7xl" className={className}>
      {children}
    </Container>
  );
};

ContainerWide.displayName = 'ContainerWide';

// Full bleed container (no max-width)
export const ContainerFluid: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}> = ({ children, className, padding = true }) => {
  return (
    <Container maxWidth="full" padding={padding} center={false} className={className}>
      {children}
    </Container>
  );
};

ContainerFluid.displayName = 'ContainerFluid';
