import React from 'react';
import { motion } from 'motion/react';
import { getThemeStyles } from '../design-system';
import { X, Bell, CheckCircle, AlertTriangle, Info, Zap, TrendingUp, Shield } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  type: 'degen' | 'regen';
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Transaction Confirmed',
    message: 'Your swap of 1.0 ETH → 3,600 USDC was successful',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'High Gas Alert',
    message: 'Network gas prices are elevated (45 Gwei)',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'New Feature Available',
    message: 'Transaction simulator is now live in Wallet Guard',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
];

export function NotificationCenter({ type, onClose }: NotificationCenterProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const getIcon = (notifType: Notification['type']) => {
    switch (notifType) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      case 'error':
        return <X className="w-5 h-5 text-red-400" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[var(--bg-base)]/95 backdrop-blur-xl rounded-2xl border border-[var(--border-neutral)]/10 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-neutral)]/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" style={{ color: accentColor }} />
          <h3 className="text-base font-black uppercase tracking-tight text-[var(--text-primary)]">Notifications</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-[var(--text-primary)]/50" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[500px] overflow-y-auto">
        {mockNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Bell className="w-8 h-8 text-[var(--text-primary)]/20" />
            </div>
            <p className="text-sm text-[var(--text-primary)]/50">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {mockNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${!notification.read ? 'bg-white/[0.02]' : ''
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{notification.title}</h4>
                      {!notification.read && (
                        <div
                          className="w-2 h-2 rounded-full shrink-0 mt-1"
                          style={{ background: accentColor }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-primary)]/60 mb-2 line-clamp-2">{notification.message}</p>
                    <span className="text-xs text-[var(--text-primary)]/40">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {mockNotifications.length > 0 && (
        <div className="p-3 border-t border-[var(--border-neutral)]/10">
          <button
            className="w-full text-center text-xs font-bold uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
            style={{ color: accentColor }}
          >
            Mark all as read
          </button>
        </div>
      )}
    </motion.div>
  );
}
