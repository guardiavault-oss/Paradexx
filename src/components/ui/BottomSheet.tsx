import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Percentage heights: [50, 90]
  initialSnap?: number; // Index of snapPoints
  showHandle?: boolean;
  closeOnBackdrop?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [90],
  initialSnap = 0,
  showHandle = true,
  closeOnBackdrop = true,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = React.useState(initialSnap);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;

    // Close if dragged down significantly
    if (offset.y > 100 || velocity.y > 500) {
      onClose();
      return;
    }

    // Snap to nearest point
    if (snapPoints.length > 1) {
      const currentHeight = snapPoints[currentSnap];
      const nextSnap = offset.y < 0 && currentSnap < snapPoints.length - 1
        ? currentSnap + 1
        : currentSnap > 0
          ? currentSnap - 1
          : currentSnap;
      
      setCurrentSnap(nextSnap);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-3xl overflow-hidden shadow-2xl"
            style={{
              height: `${snapPoints[currentSnap]}vh`,
              maxHeight: `${snapPoints[currentSnap]}vh`,
              background: 'rgba(10, 10, 10, 0.98)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderBottom: 'none',
            }}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-white/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {title}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <X className="w-5 h-5 text-white/70" />
                </motion.button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain" style={{ height: title ? 'calc(100% - 80px)' : 'calc(100% - 40px)' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
