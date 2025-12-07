import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  maxPull?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform pull distance to rotation for refresh icon
  const rotate = useTransform(y, [0, maxPull], [0, 360]);
  const iconScale = useTransform(y, [0, threshold, maxPull], [0.5, 1, 1.2]);
  const iconOpacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      y.set(0);
      setIsPulling(false);
    }
  }, [onRefresh, y]);

  const handleDragEnd = useCallback(
    async (_: any, info: { offset: { y: number } }) => {
      if (info.offset.y >= threshold && !isRefreshing) {
        await handleRefresh();
      } else {
        y.set(0);
        setIsPulling(false);
      }
    },
    [threshold, isRefreshing, handleRefresh, y]
  );

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
        style={{
          height: y,
          opacity: iconOpacity,
        }}
      >
        <motion.div
          style={{
            rotate,
            scale: iconScale,
          }}
        >
          <RefreshCw
            className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.3, bottom: 0 }}
        onDragStart={(e, info) => {
          // Only allow pull down when scrolled to top
          const container = containerRef.current;
          if (container && container.scrollTop === 0 && info.offset.y > 0) {
            setIsPulling(true);
          }
        }}
        onDrag={(e, info) => {
          if (isPulling && info.offset.y > 0) {
            const pullDistance = Math.min(info.offset.y, maxPull);
            y.set(pullDistance);
          }
        }}
        onDragEnd={handleDragEnd}
        style={{ y: isRefreshing ? threshold : undefined }}
      >
        {children}
      </motion.div>
    </div>
  );
}
