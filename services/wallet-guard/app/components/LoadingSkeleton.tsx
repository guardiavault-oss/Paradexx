'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  lines = 1 
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] animate-shimmer rounded'

  const variants = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: '',
    card: 'rounded-2xl',
    table: 'rounded',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variants[variant]} ${className}`}
            style={i === lines - 1 ? { width: '60%', ...style } : style}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={style}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl backdrop-blur-md border border-cyan-500/30" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
      <Skeleton variant="text" width="40%" className="mb-4" />
      <Skeleton variant="text" width="60%" className="mb-2" />
      <Skeleton variant="text" width="80%" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl backdrop-blur-md border border-cyan-500/30 overflow-hidden" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
      <div className="p-4 border-b border-cyan-500/30">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} variant="text" width="20%" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-cyan-500/10">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} variant="text" width="20%" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton variant="text" width="300px" height="32px" className="mb-2" />
        <Skeleton variant="text" width="200px" height="16px" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

