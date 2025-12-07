import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  type?: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce';
}

export function StaggeredList({
  children,
  staggerDelay = 0.1,
  className = '',
  itemClassName = '',
  direction = 'up',
  type = 'slide',
}: StaggeredListProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: 20, x: 0 };
      case 'down':
        return { y: -20, x: 0 };
      case 'left':
        return { x: 20, y: 0 };
      case 'right':
        return { x: -20, y: 0 };
      default:
        return { y: 20, x: 0 };
    }
  };

  const getInitialState = () => {
    const position = getInitialPosition();
    const baseState = { opacity: 0 };

    switch (type) {
      case 'fade':
        return baseState;
      case 'slide':
        return { ...baseState, ...position };
      case 'scale':
        return { ...baseState, scale: 0.9 };
      case 'rotate':
        return { ...baseState, rotate: -10, ...position };
      case 'bounce':
        return { ...baseState, y: -50 };
      default:
        return { ...baseState, ...position };
    }
  };

  const getAnimateState = () => {
    switch (type) {
      case 'fade':
        return { opacity: 1 };
      case 'slide':
        return { opacity: 1, x: 0, y: 0 };
      case 'scale':
        return { opacity: 1, scale: 1 };
      case 'rotate':
        return { opacity: 1, rotate: 0, x: 0, y: 0 };
      case 'bounce':
        return { opacity: 1, y: 0 };
      default:
        return { opacity: 1, x: 0, y: 0 };
    }
  };

  const getTransition = (index: number) => {
    const base = {
      delay: index * staggerDelay,
      duration: 0.5,
    };

    if (type === 'bounce') {
      return {
        ...base,
        type: 'spring',
        stiffness: 300,
        damping: 20,
      };
    }

    return {
      ...base,
      ease: 'easeOut',
    };
  };

  return (
    <div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={getInitialState()}
          animate={getAnimateState()}
          transition={getTransition(index)}
          className={itemClassName}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// Preset variants for common use cases
export function FadeInList({
  children,
  staggerDelay = 0.1,
  className = '',
  itemClassName = '',
}: Omit<StaggeredListProps, 'type'>) {
  return (
    <StaggeredList
      type="fade"
      staggerDelay={staggerDelay}
      className={className}
      itemClassName={itemClassName}
    >
      {children}
    </StaggeredList>
  );
}

export function SlideInList({
  children,
  staggerDelay = 0.1,
  className = '',
  itemClassName = '',
  direction = 'up',
}: Omit<StaggeredListProps, 'type'>) {
  return (
    <StaggeredList
      type="slide"
      direction={direction}
      staggerDelay={staggerDelay}
      className={className}
      itemClassName={itemClassName}
    >
      {children}
    </StaggeredList>
  );
}

export function ScaleInList({
  children,
  staggerDelay = 0.1,
  className = '',
  itemClassName = '',
}: Omit<StaggeredListProps, 'type' | 'direction'>) {
  return (
    <StaggeredList
      type="scale"
      staggerDelay={staggerDelay}
      className={className}
      itemClassName={itemClassName}
    >
      {children}
    </StaggeredList>
  );
}

export function BounceInList({
  children,
  staggerDelay = 0.1,
  className = '',
  itemClassName = '',
}: Omit<StaggeredListProps, 'type' | 'direction'>) {
  return (
    <StaggeredList
      type="bounce"
      staggerDelay={staggerDelay}
      className={className}
      itemClassName={itemClassName}
    >
      {children}
    </StaggeredList>
  );
}

// Advanced staggered grid
interface StaggeredGridProps {
  children: ReactNode[];
  columns?: number;
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
}

export function StaggeredGrid({
  children,
  columns = 3,
  staggerDelay = 0.05,
  className = '',
  itemClassName = '',
}: StaggeredGridProps) {
  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {children.map((child, index) => {
        // Calculate delay based on position in grid (diagonal wave effect)
        const row = Math.floor(index / columns);
        const col = index % columns;
        const delay = (row + col) * staggerDelay;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay,
              duration: 0.4,
              ease: 'easeOut',
            }}
            className={itemClassName}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}
