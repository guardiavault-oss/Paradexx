// Toast Notification System
import { toast as sonnerToast } from 'sonner@2.0.3';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 4000,
      icon: <CheckCircle2 className="w-5 h-5" />,
      classNames: {
        toast: 'bg-[#1a1a1a] border-emerald-500/30 border',
        title: 'text-emerald-400',
        description: 'text-gray-400',
        icon: 'text-emerald-400',
      },
    });
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 6000,
      icon: <XCircle className="w-5 h-5" />,
      classNames: {
        toast: 'bg-[#1a1a1a] border-red-500/30 border',
        title: 'text-red-400',
        description: 'text-gray-400',
        icon: 'text-red-400',
      },
    });
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 5000,
      icon: <AlertTriangle className="w-5 h-5" />,
      classNames: {
        toast: 'bg-[#1a1a1a] border-orange-500/30 border',
        title: 'text-orange-400',
        description: 'text-gray-400',
        icon: 'text-orange-400',
      },
    });
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000,
      icon: <Info className="w-5 h-5" />,
      classNames: {
        toast: 'bg-[#1a1a1a] border-cyan-500/30 border',
        title: 'text-cyan-400',
        description: 'text-gray-400',
        icon: 'text-cyan-400',
      },
    });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message, {
      classNames: {
        toast: 'bg-[#1a1a1a] border-[#2a2a2a] border',
        title: 'text-white',
      },
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      classNames: {
        toast: 'bg-[#1a1a1a] border-[#2a2a2a] border',
        title: 'text-white',
        description: 'text-gray-400',
      },
    });
  },
};
