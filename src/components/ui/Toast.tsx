'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { toastVariants as motionVariants } from '@/lib/motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

const toastVariants = cva(
  `relative flex items-start gap-3 p-4 rounded-xl
   backdrop-blur-xl border shadow-2xl
   min-w-[320px] max-w-md`,
  {
    variants: {
      variant: {
        default: 'bg-black/90 border-white/20 text-white',
        success: 'bg-green-900/90 border-green-500/40 text-green-50',
        error: 'bg-red-900/90 border-red-500/40 text-red-50',
        warning: 'bg-yellow-900/90 border-yellow-500/40 text-yellow-50',
        info: 'bg-blue-900/90 border-blue-500/40 text-blue-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const toast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    if (toast.duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, toast.duration || 5000);
    }
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  const getIcon = (variant?: Toast['variant']) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const toastElements = isMounted && (
    <div className="fixed top-4 right-4 z-[1700] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            variants={motionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            className={toastVariants({ variant: toast.variant })}
          >
            {getIcon(toast.variant)}

            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="font-bold text-sm mb-1">{toast.title}</div>
              )}
              {toast.description && (
                <div className="text-sm opacity-90">{toast.description}</div>
              )}
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action!.onClick();
                    dismiss(toast.id);
                  }}
                  className="mt-2 text-xs font-bold uppercase tracking-wide underline hover:no-underline"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => dismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Close toast"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      {toastElements && createPortal(toastElements, document.body)}
    </ToastContext.Provider>
  );
};

// Helper function for quick toasts
export const toast = {
  success: (title: string, description?: string) => {
    // This will be implemented by the provider
    console.warn('toast.success called outside ToastProvider');
  },
  error: (title: string, description?: string) => {
    console.warn('toast.error called outside ToastProvider');
  },
  warning: (title: string, description?: string) => {
    console.warn('toast.warning called outside ToastProvider');
  },
  info: (title: string, description?: string) => {
    console.warn('toast.info called outside ToastProvider');
  },
};
