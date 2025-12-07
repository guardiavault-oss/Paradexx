import { motion } from 'motion/react';
import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animate?: boolean;
}

export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true,
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <motion.div
      className={`bg-white/10 ${roundedClasses[rounded]} ${className}`}
      style={style}
      animate={
        animate
          ? {
              opacity: [0.5, 1, 0.5],
            }
          : undefined
      }
      transition={
        animate
          ? {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
    />
  );
}

// Card Skeleton
export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton width={48} height={48} rounded="lg" />
            <div className="flex-1 space-y-2">
              <Skeleton height={20} width="60%" />
              <Skeleton height={16} width="40%" />
            </div>
          </div>
          <Skeleton height={80} />
          <div className="flex gap-2">
            <Skeleton height={36} className="flex-1" rounded="lg" />
            <Skeleton height={36} className="flex-1" rounded="lg" />
          </div>
        </div>
      ))}
    </>
  );
}

// List Skeleton
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <Skeleton width={40} height={40} rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="70%" />
            <Skeleton height={14} width="40%" />
          </div>
          <Skeleton width={60} height={24} rounded="lg" />
        </div>
      ))}
    </div>
  );
}

// Table Skeleton
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid gap-4 p-4 rounded-xl bg-white/5 border border-white/10" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={16} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 p-4 rounded-xl bg-white/5 border border-white/10" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={20} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Stats Grid Skeleton
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton width={24} height={24} rounded="lg" />
            <Skeleton width={40} height={20} rounded="full" />
          </div>
          <Skeleton height={32} width="60%" />
          <Skeleton height={14} width="80%" />
        </div>
      ))}
    </div>
  );
}

// Chart Skeleton
export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton height={24} width={150} />
          <Skeleton height={32} width={100} rounded="lg" />
        </div>
        <div className="flex items-end gap-2" style={{ height }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              height={`${Math.random() * 80 + 20}%`}
              rounded="sm"
            />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={12} width={40} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Transaction List Skeleton
export function SkeletonTransactions({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <Skeleton width={48} height={48} rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="50%" />
            <Skeleton height={14} width="30%" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton height={18} width={80} />
            <Skeleton height={14} width={60} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard Skeleton
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton width={48} height={48} rounded="full" />
          <div className="space-y-2">
            <Skeleton height={24} width={150} />
            <Skeleton height={16} width={100} />
          </div>
        </div>
        <Skeleton width={40} height={40} rounded="lg" />
      </div>

      {/* Hero Card */}
      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-6">
        <div className="flex justify-center">
          <Skeleton width={160} height={160} rounded="full" />
        </div>
        <div className="text-center space-y-2">
          <Skeleton height={40} width={200} className="mx-auto" />
          <Skeleton height={24} width={150} className="mx-auto" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={60} rounded="lg" />
          ))}
        </div>
      </div>

      {/* Stats */}
      <SkeletonStats count={4} />

      {/* Chart */}
      <SkeletonChart />

      {/* Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton height={24} width={150} />
          <Skeleton height={32} width={80} rounded="lg" />
        </div>
        <SkeletonTransactions count={3} />
      </div>
    </div>
  );
}

// Profile Skeleton
export function SkeletonProfile() {
  return (
    <div className="space-y-6 p-6">
      {/* Cover */}
      <Skeleton height={200} rounded="xl" />

      {/* Avatar & Info */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 -mt-16 md:-mt-20">
        <Skeleton width={128} height={128} rounded="full" className="border-4 border-black" />
        <div className="flex-1 space-y-4 text-center md:text-left mt-16 md:mt-0">
          <Skeleton height={32} width={200} className="mx-auto md:mx-0" />
          <Skeleton height={20} width={300} className="mx-auto md:mx-0" />
          <div className="flex gap-2 justify-center md:justify-start">
            <Skeleton height={36} width={100} rounded="lg" />
            <Skeleton height={36} width={100} rounded="lg" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <SkeletonCard count={2} />
        </div>
        <div className="space-y-6">
          <SkeletonList count={4} />
        </div>
      </div>
    </div>
  );
}
