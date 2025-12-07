import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  isTransitioning: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export function PageTransition({
  children,
  isTransitioning,
  direction = 'right',
}: PageTransitionProps) {
  return (
    <motion.div
      animate={{
        opacity: isTransitioning ? 0 : 1,
        y: isTransitioning ? 10 : 0,
        scale: isTransitioning ? 0.98 : 1,
        filter: isTransitioning ? 'blur(4px)' : 'blur(0px)',
      }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Minimal Page Fade Transition
export function PageFadeTransition({
  isTransitioning,
}: {
  isTransitioning: boolean;
}) {
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black pointer-events-none"
          style={{ zIndex: 100 }}
        />
      )}
    </AnimatePresence>
  );
}

// Loading Spinner Transition
export function LoadingTransition({
  isLoading,
  type = 'degen',
}: {
  isLoading: boolean;
  type?: 'degen' | 'regen';
}) {
  const accentColor = type === 'degen' ? '#DC143C' : '#0080FF';

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center"
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Loader2 className="w-12 h-12" style={{ color: accentColor }} />
            </motion.div>
            <motion.p
              className="text-sm text-white/60"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              Loading...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Slide Transition (for page changes)
export function SlideTransition({
  children,
  direction = 'left',
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
}) {
  const variants = {
    enter: (direction: string) => {
      return {
        x: direction === 'left' ? 1000 : direction === 'right' ? -1000 : 0,
        y: direction === 'up' ? 1000 : direction === 'down' ? -1000 : 0,
        opacity: 0,
      };
    },
    center: {
      x: 0,
      y: 0,
      opacity: 1,
    },
    exit: (direction: string) => {
      return {
        x: direction === 'left' ? -1000 : direction === 'right' ? 1000 : 0,
        y: direction === 'up' ? -1000 : direction === 'down' ? 1000 : 0,
        opacity: 0,
      };
    },
  };

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        y: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  );
}
