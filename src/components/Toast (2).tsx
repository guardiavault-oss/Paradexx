import { toast as sonnerToast, Toaster } from 'sonner@2.0.3';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

interface ToastOptions {
  type?: 'degen' | 'regen';
  duration?: number;
}

// Custom toast functions with Paradex styling
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    const type = options?.type || 'degen';
    const accentColor = type === 'degen' ? '#DC143C' : '#0080FF';

    return sonnerToast.success(message, {
      duration: options?.duration || 3000,
      className: 'toast-success',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        color: '#fff',
        backdropFilter: 'blur(12px)',
      },
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration || 4000,
      className: 'toast-error',
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#fff',
        backdropFilter: 'blur(12px)',
      },
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: options?.duration || 3500,
      className: 'toast-warning',
      icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(251, 146, 60, 0.3)',
        color: '#fff',
        backdropFilter: 'blur(12px)',
      },
    });
  },

  info: (message: string, options?: ToastOptions) => {
    const type = options?.type || 'degen';
    const accentColor = type === 'degen' ? '#DC143C' : '#0080FF';

    return sonnerToast.info(message, {
      duration: options?.duration || 3000,
      className: 'toast-info',
      icon: <Info className="w-5 h-5" style={{ color: accentColor }} />,
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: `1px solid ${accentColor}40`,
        color: '#fff',
        backdropFilter: 'blur(12px)',
      },
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    const type = options?.type || 'degen';
    const accentColor = type === 'degen' ? '#DC143C' : '#0080FF';

    return sonnerToast.loading(message, {
      duration: Infinity,
      className: 'toast-loading',
      icon: (
        <Loader2
          className="w-5 h-5 animate-spin"
          style={{ color: accentColor }}
        />
      ),
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: `1px solid ${accentColor}40`,
        color: '#fff',
        backdropFilter: 'blur(12px)',
      },
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
      type = 'degen',
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
      type?: 'degen' | 'regen';
    }
  ) => {
    const accentColor = type === 'degen' ? '#DC143C' : '#0080FF';

    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: `1px solid ${accentColor}40`,
        color: '#fff',
        backdropFilter: 'blur(12px)',
      },
    });
  },

  custom: (component: React.ReactNode, options?: ToastOptions) => {
    return sonnerToast.custom(component, {
      duration: options?.duration || 3000,
    });
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },
};

// Toaster component with Paradex styling
export function ToastProvider({ type = 'degen' }: { type?: 'degen' | 'regen' }) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(0, 0, 0, 0.95)',
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          color: '#fff',
          backdropFilter: 'blur(12px)',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
        },
        className: 'paradex-toast',
      }}
      closeButton
      richColors
      expand
    />
  );
}

// Pre-built transaction toasts
export const transactionToast = {
  pending: (hash: string, type: 'degen' | 'regen' = 'degen') => {
    return toast.loading(`Transaction pending...`, { type });
  },

  success: (hash: string, type: 'degen' | 'regen' = 'degen') => {
    return toast.success(`Transaction confirmed!`, { type });
  },

  failed: (error: string, type: 'degen' | 'regen' = 'degen') => {
    return toast.error(`Transaction failed: ${error}`, { type });
  },
};

// Pre-built wallet toasts
export const walletToast = {
  connected: (address: string, type: 'degen' | 'regen' = 'degen') => {
    return toast.success(
      `Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
      { type }
    );
  },

  disconnected: (type: 'degen' | 'regen' = 'degen') => {
    return toast.info('Wallet disconnected', { type });
  },

  switchNetwork: (network: string, type: 'degen' | 'regen' = 'degen') => {
    return toast.success(`Switched to ${network}`, { type });
  },
};

// Pre-built security toasts
export const securityToast = {
  warning: (message: string) => {
    return toast.warning(message, { duration: 5000 });
  },

  alert: (message: string) => {
    return toast.error(message, { duration: 6000 });
  },

  verified: (type: 'degen' | 'regen' = 'degen') => {
    return toast.success('Security verification passed', { type });
  },
};

// Custom toast components
export function CustomTransactionToast({
  hash,
  status,
  type = 'degen',
}: {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  type?: 'degen' | 'regen';
}) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const statusConfig = {
    pending: {
      icon: <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />,
      text: 'Transaction Pending',
      borderColor: `${accentColor}40`,
    },
    success: {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      text: 'Transaction Confirmed',
      borderColor: 'rgba(34, 197, 94, 0.4)',
    },
    failed: {
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      text: 'Transaction Failed',
      borderColor: 'rgba(239, 68, 68, 0.4)',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl"
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        border: `1px solid ${config.borderColor}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white mb-1">{config.text}</p>
        <p className="text-xs text-white/60 truncate font-mono">{hash}</p>
      </div>
      <button
        onClick={() => window.open(`https://etherscan.io/tx/${hash}`, '_blank')}
        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        View
      </button>
    </div>
  );
}

export function CustomAlertToast({
  title,
  message,
  severity = 'warning',
  action,
}: {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  const severityConfig = {
    info: {
      icon: <Info className="w-5 h-5 text-blue-400" />,
      borderColor: 'rgba(59, 130, 246, 0.4)',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
      borderColor: 'rgba(251, 146, 60, 0.4)',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      borderColor: 'rgba(239, 68, 68, 0.4)',
    },
  };

  const config = severityConfig[severity];

  return (
    <div
      className="p-4 rounded-xl max-w-md"
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        border: `1px solid ${config.borderColor}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        {config.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white mb-1">{title}</p>
          <p className="text-xs text-white/60">{message}</p>
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="w-full px-4 py-2 text-sm font-bold rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
