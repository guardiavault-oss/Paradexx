/**
 * SmartSkeleton Component
 * Morphs smoothly from skeleton to actual content instead of abrupt replacement
 */

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface SmartSkeletonProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  morphDuration?: number;
  stagger?: number;
  className?: string;
}

export interface BoundingBox {
  width: number;
  height: number;
  x: number;
  y: number;
}

// ==============================================
// SKELETON MORPHING UTILITIES
// ==============================================

function captureBoundingBox(element: HTMLElement | null): BoundingBox | null {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    x: rect.left,
    y: rect.top,
  };
}

function morphAnimation(
  fromBox: BoundingBox,
  toBox: BoundingBox,
  duration: number
) {
  const scaleX = fromBox.width / toBox.width;
  const scaleY = fromBox.height / toBox.height;
  const translateX = fromBox.x - toBox.x;
  const translateY = fromBox.y - toBox.y;

  return {
    initial: {
      scaleX,
      scaleY,
      x: translateX,
      y: translateY,
      opacity: 0,
    },
    animate: {
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
      opacity: 1,
    },
    transition: {
      duration: duration / 1000,
      ease: [0.4, 0, 0.2, 1],
    },
  };
}

// ==============================================
// SMART SKELETON COMPONENT
// ==============================================

export function SmartSkeleton({
  isLoading,
  skeleton,
  children,
  morphDuration = 400,
  stagger = 0,
  className = '',
}: SmartSkeletonProps) {
  const skeletonRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [skeletonBox, setSkeletonBox] = useState<BoundingBox | null>(null);
  const [shouldMorph, setShouldMorph] = useState(false);

  // Capture skeleton dimensions when loading
  useEffect(() => {
    if (isLoading && skeletonRef.current) {
      const box = captureBoundingBox(skeletonRef.current);
      setSkeletonBox(box);
      setShouldMorph(false);
    } else if (!isLoading && skeletonBox) {
      // Trigger morph when loading completes
      setShouldMorph(true);
    }
  }, [isLoading, skeletonBox]);

  // Reset state when going back to loading
  useEffect(() => {
    if (isLoading) {
      setShouldMorph(false);
    }
  }, [isLoading]);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            ref={skeletonRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: morphDuration / 2000 },
            }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            ref={contentRef}
            initial={
              shouldMorph && skeletonBox && contentRef.current
                ? morphAnimation(
                    skeletonBox,
                    captureBoundingBox(contentRef.current)!,
                    morphDuration
                  ).initial
                : { opacity: 0 }
            }
            animate={
              shouldMorph && skeletonBox && contentRef.current
                ? morphAnimation(
                    skeletonBox,
                    captureBoundingBox(contentRef.current)!,
                    morphDuration
                  ).animate
                : { opacity: 1 }
            }
            transition={
              shouldMorph && skeletonBox && contentRef.current
                ? morphAnimation(
                    skeletonBox,
                    captureBoundingBox(contentRef.current)!,
                    morphDuration
                  ).transition
                : { duration: 0.3 }
            }
            style={{ transformOrigin: 'top left' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==============================================
// SKELETON LIST COMPONENT (with stagger)
// ==============================================

export interface SmartSkeletonListProps {
  isLoading: boolean;
  count: number;
  skeleton: ReactNode;
  children: ReactNode[];
  stagger?: number;
  morphDuration?: number;
  className?: string;
}

export function SmartSkeletonList({
  isLoading,
  count,
  skeleton,
  children,
  stagger = 50,
  morphDuration = 400,
  className = '',
}: SmartSkeletonListProps) {
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="skeleton-list">
            {Array.from({ length: count }).map((_, index) => (
              <motion.div
                key={`skeleton-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * (stagger / 1000) }}
              >
                {skeleton}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="content-list">
            {children.map((child, index) => (
              <motion.div
                key={`content-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * (stagger / 1000),
                  duration: morphDuration / 1000,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {child}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==============================================
// PRESET SKELETON SHAPES
// ==============================================

export function SkeletonBox({
  width = '100%',
  height = '20px',
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

export function SkeletonCircle({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={index}
          height="16px"
          width={index === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-start gap-4">
        <SkeletonCircle size={48} />
        <div className="flex-1 space-y-3">
          <SkeletonBox height="20px" width="60%" />
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

// ==============================================
// EXAMPLE USAGE COMPONENT
// ==============================================

export function WalletCardSkeleton() {
  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonCircle size={40} />
          <div className="space-y-2">
            <SkeletonBox width="120px" height="16px" />
            <SkeletonBox width="80px" height="12px" />
          </div>
        </div>
        <SkeletonBox width="60px" height="24px" />
      </div>
      <div className="space-y-2">
        <SkeletonBox width="100%" height="32px" />
        <SkeletonBox width="70%" height="16px" />
      </div>
    </div>
  );
}

// ==============================================
// EXPORTS
// ==============================================

export default SmartSkeleton;
