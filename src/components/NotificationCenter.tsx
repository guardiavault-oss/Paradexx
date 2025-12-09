import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Bell, CheckCircle, AlertTriangle, Info, Wifi, WifiOff,
  Settings, Volume2, VolumeX, Vibrate, BellRing, Trash2,
  Filter, Check, RefreshCw, ExternalLink,
  DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, Shield, Zap
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

// Notification type icons and colors
const NOTIFICATION_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  success: { icon: CheckCircle, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
  info: { icon: Info, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  error: { icon: X, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
  transaction: { icon: ArrowUpRight, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  price_alert: { icon: TrendingUp, color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)' },
  security: { icon: Shield, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' },
  swap: { icon: RefreshCw, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  reward: { icon: Zap, color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)' },
  deposit: { icon: ArrowDownRight, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
  withdrawal: { icon: ArrowUpRight, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
};

// Category filters
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'price_alerts', label: 'Price Alerts' },
  { id: 'security', label: 'Security' },
  { id: 'system', label: 'System' },
];

interface NotificationCenterProps {
  type: 'degen' | 'regen';
  onClose: () => void;
}

export function NotificationCenter({ type, onClose }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const {
    notifications,
    loading,
    error,
    unreadCount,
    connected,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    refresh,
  } = useNotifications();

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (showUnreadOnly && notification.read) return false;
    if (selectedCategory === 'all') return true;

    // Map notification types to categories
    const categoryMap: Record<string, string[]> = {
      transactions: ['transaction', 'swap', 'deposit', 'withdrawal'],
      price_alerts: ['price_alert'],
      security: ['security', 'warning'],
      system: ['info', 'success', 'error'],
    };

    return categoryMap[selectedCategory]?.includes(notification.type) ?? false;
  });

  // Format timestamp - called only in event handlers and render, using current time
  const formatTimestamp = (date: Date) => {
    const diff = new Date().getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (notifType: string) => {
    const config = NOTIFICATION_CONFIG[notifType] || NOTIFICATION_CONFIG.info;
    const Icon = config.icon;
    return (
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: config.bgColor }}
      >
        <Icon className="w-4 h-4" style={{ color: config.color }} />
      </div>
    );
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    // Handle action URL if present
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[var(--bg-base)]/95 backdrop-blur-xl rounded-2xl border border-[var(--border-neutral)]/10 shadow-2xl overflow-hidden w-[400px] max-w-[95vw]"
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-neutral)]/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5" style={{ color: accentColor }} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <h3 className="text-base font-black uppercase tracking-tight text-[var(--text-primary)]">
              Notifications
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}
              title={connected ? 'Real-time connected' : 'Disconnected'}
            >
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Settings Toggle */}
            <button
              onClick={() => setActiveTab(activeTab === 'settings' ? 'notifications' : 'settings')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4 text-[var(--text-primary)]/50" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-[var(--text-primary)]/50" />
            </button>
          </div>
        </div>

        {/* Tabs / Filters */}
        {activeTab === 'notifications' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'text-white'
                    : 'text-[var(--text-primary)]/60 hover:text-[var(--text-primary)]'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? accentColor : 'transparent',
                }}
              >
                {category.label}
              </button>
            ))}

            {/* Unread Filter */}
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`p-1.5 rounded-lg transition-colors ${
                showUnreadOnly ? 'bg-white/10 text-white' : 'text-[var(--text-primary)]/40 hover:text-[var(--text-primary)]'
              }`}
              title="Show unread only"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[500px] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'settings' ? (
            // Settings Panel
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Notification Preferences
              </h4>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  {preferences.soundEnabled ? (
                    <Volume2 className="w-5 h-5" style={{ color: accentColor }} />
                  ) : (
                    <VolumeX className="w-5 h-5 text-[var(--text-primary)]/40" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Sound</p>
                    <p className="text-xs text-[var(--text-primary)]/50">Play sound for new notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                  title={preferences.soundEnabled ? 'Disable sound' : 'Enable sound'}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    preferences.soundEnabled ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Vibration Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Vibrate className="w-5 h-5" style={{ color: preferences.vibrationEnabled ? accentColor : 'var(--text-primary)' }} />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Vibration</p>
                    <p className="text-xs text-[var(--text-primary)]/50">Vibrate on mobile devices</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreferences({ vibrationEnabled: !preferences.vibrationEnabled })}
                  title={preferences.vibrationEnabled ? 'Disable vibration' : 'Enable vibration'}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    preferences.vibrationEnabled ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.vibrationEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Push Notifications Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <BellRing className="w-5 h-5" style={{ color: preferences.showPreview ? accentColor : 'var(--text-primary)' }} />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Show Preview</p>
                    <p className="text-xs text-[var(--text-primary)]/50">Show notification content preview</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreferences({ showPreview: !preferences.showPreview })}
                  title={preferences.showPreview ? 'Disable preview' : 'Enable preview'}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    preferences.showPreview ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.showPreview ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Notification Types */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-[var(--text-primary)]/60 uppercase tracking-wider">
                  Notification Types
                </h5>

                {Object.entries(preferences.types || {}).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
                    <span className="text-sm text-[var(--text-primary)] capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => updatePreferences({
                        types: { ...preferences.types, [key]: !enabled }
                      })}
                      title={`${enabled ? 'Disable' : 'Enable'} ${key.replace(/_/g, ' ')} notifications`}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        enabled ? 'bg-green-500' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Clear All */}
              <button
                onClick={clearAll}
                className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Notifications
              </button>
            </motion.div>
          ) : (
            // Notifications List
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {loading ? (
                <div className="p-12 text-center">
                  <div
                    className="w-8 h-8 mx-auto border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: accentColor }}
                  />
                  <p className="text-xs text-[var(--text-primary)]/50 mt-3">Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-sm text-red-400 mb-2">Failed to load notifications</p>
                  <button
                    onClick={refresh}
                    className="text-xs text-[var(--text-primary)]/60 hover:text-[var(--text-primary)] flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Try again
                  </button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-[var(--text-primary)]/20" />
                  </div>
                  <p className="text-sm text-[var(--text-primary)]/50">
                    {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  {connected && (
                    <p className="text-xs text-[var(--text-primary)]/30 mt-2">
                      Real-time updates enabled
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer group relative ${
                        !notification.read ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-bold text-[var(--text-primary)] line-clamp-1">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 shrink-0">
                              {!notification.read && (
                                <div
                                  className="w-2 h-2 rounded-full animate-pulse"
                                  style={{ background: accentColor }}
                                />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3 text-[var(--text-primary)]/40" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--text-primary)]/60 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-primary)]/40">
                              {formatTimestamp(notification.createdAt)}
                            </span>
                            {notification.actionUrl && (
                              <span className="text-xs flex items-center gap-1" style={{ color: accentColor }}>
                                View <ExternalLink className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          {/* Data (transaction details, etc.) */}
                          {notification.data && (
                            <div className="mt-2 p-2 bg-white/5 rounded-lg">
                              {Boolean((notification.data as Record<string, unknown>).amount) && (
                                <div className="flex items-center gap-2 text-xs">
                                  <DollarSign className="w-3 h-3 text-[var(--text-primary)]/40" />
                                  <span className="text-[var(--text-primary)]/60">
                                    {String((notification.data as Record<string, unknown>).amount)} {String((notification.data as Record<string, unknown>).token || '')}
                                  </span>
                                </div>
                              )}
                              {Boolean((notification.data as Record<string, unknown>).txHash) && (
                                <div className="text-xs text-[var(--text-primary)]/40 truncate mt-1">
                                  TX: {String((notification.data as Record<string, unknown>).txHash).slice(0, 10)}...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {activeTab === 'notifications' && filteredNotifications.length > 0 && (
        <div className="p-3 border-t border-[var(--border-neutral)]/10 flex items-center justify-between">
          <button
            onClick={refresh}
            className="text-xs text-[var(--text-primary)]/40 hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
              style={{ color: accentColor }}
            >
              <Check className="w-3 h-3" />
              Mark all as read
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
