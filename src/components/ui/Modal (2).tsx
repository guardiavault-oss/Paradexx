'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { modalBackdropVariants, modalContentVariants, transitions } from '@/lib/motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const modalContentStyles = cva(
  `relative w-full max-h-[90vh] overflow-hidden
   bg-black/90 backdrop-blur-xl
   border rounded-2xl
   shadow-2xl`,
  {
    variants: {
      size: {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4',
      },
      mode: {
        degen: 'border-degen-primary/40',
        regen: 'border-regen-primary/40',
        neutral: 'border-white/10',
      },
    },
    defaultVariants: {
      size: 'md',
      mode: 'neutral',
    },
  }
);

export interface ModalProps extends VariantProps<typeof modalContentStyles> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  size,
  mode,
  className,
}) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isMounted) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.smooth}
            className="fixed inset-0 z-[1300] bg-black/70 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-[1400] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                variants={modalContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(modalContentStyles({ size, mode }), className)}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {(title || description || showCloseButton) && (
                  <div className="flex items-start justify-between p-6 border-b border-white/10">
                    <div className="flex-1">
                      {title && (
                        <h2 className="text-2xl font-black uppercase tracking-wide text-white">
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p className="mt-2 text-sm text-white/60">{description}</p>
                      )}
                    </div>

                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="ml-4 p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close modal"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

Modal.displayName = 'Modal';

// Modal sections for better composition
export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('p-6', className)}>{children}</div>;

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('flex items-center justify-end gap-3 p-6 border-t border-white/10', className)}>
    {children}
  </div>
);
