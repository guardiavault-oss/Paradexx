import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { ReactNode, useState } from 'react';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  threshold?: number;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 100,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const leftActionOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  const rightActionOpacity = useTransform(x, [0, threshold], [0, 1]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    
    if (offset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (offset > threshold && onSwipeRight) {
      onSwipeRight();
    }
    
    x.set(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left Action Background */}
      {leftAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-end px-6 bg-red-500/20 rounded-xl"
          style={{ opacity: leftActionOpacity }}
        >
          {leftAction}
        </motion.div>
      )}

      {/* Right Action Background */}
      {rightAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-start px-6 bg-green-500/20 rounded-xl"
          style={{ opacity: rightActionOpacity }}
        >
          {rightAction}
        </motion.div>
      )}

      {/* Card Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        style={{ x }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`relative z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
