/**
 * useNotifications - Hook for fetching user notifications
 * Connects to the notification.service.ts backend
 *
 * Enhanced Features:
 * - WebSocket real-time push notifications
 * - Notification preferences management
 * - Sound/vibration alerts
 * - Grouped notifications
 * - Browser notification support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../services/logger.service';
import { API_URL, getWsUrl } from '../config/api';

const WS_URL = getWsUrl();

export type NotificationType =
  | 'transaction_confirmed'
  | 'transaction_failed'
  | 'price_alert'
  | 'security_alert'
  | 'guardian_request'
  | 'guardian_approved'
  | 'recovery_initiated'
  | 'wallet_locked'
  | 'large_transaction'
  | 'approval_detected'
  | 'phishing_detected'
  | 'whale_alert'
  | 'system'
  | 'info';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
}

interface UseNotificationsOptions {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
  limit?: number;
  enableWebSocket?: boolean;
  enableSounds?: boolean;
  enableVibration?: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  types: Record<string, boolean>;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  connected: boolean;
  preferences: NotificationPreferences;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  clearAll: () => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  types: {
    transaction_confirmed: true,
    transaction_failed: true,
    price_alert: true,
    security_alert: true,
    guardian_request: true,
    guardian_approved: true,
    recovery_initiated: true,
    wallet_locked: true,
    large_transaction: true,
    approval_detected: true,
    phishing_detected: true,
    whale_alert: true,
    system: true,
    info: true,
  },
  soundEnabled: true,
  vibrationEnabled: true,
  showPreview: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
};

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    userId,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    limit = 50,
    enableWebSocket = true,
    enableSounds = true,
    enableVibration = true,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if in quiet hours
  const isQuietHours = useCallback(() => {
    if (!preferences.quietHoursEnabled) return false;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;
    if (start <= end) {
      return currentTime >= start && currentTime < end;
    }
    return currentTime >= start || currentTime < end;
  }, [preferences.quietHoursEnabled, preferences.quietHoursStart, preferences.quietHoursEnd]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!enableSounds || !preferences.soundEnabled || isQuietHours()) return;
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // Ignore audio errors
    }
  }, [enableSounds, preferences.soundEnabled, isQuietHours]);

  // Vibrate device
  const vibrate = useCallback(() => {
    if (!enableVibration || !preferences.vibrationEnabled || isQuietHours()) return;
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }, [enableVibration, preferences.vibrationEnabled, isQuietHours]);

  // Handle incoming notification
  const handleNewNotification = useCallback((notification: Notification) => {
    if (!preferences.enabled || !preferences.types[notification.type]) return;

    setNotifications(prev => {
      if (prev.some(n => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });

    if (!isQuietHours()) {
      playNotificationSound();
      vibrate();
    }

    // Show browser notification
    if (preferences.showPreview && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png',
          tag: notification.id,
        });
      } catch {
        // Browser notifications may not be available
      }
    }
  }, [preferences, isQuietHours, playNotificationSound, vibrate]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket || !preferences.enabled) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const ws = new WebSocket(`${WS_URL}/notifications?token=${token}`);

      ws.onopen = () => {
        logger.info('Notification WebSocket connected');
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification' && data.data) {
            const notification: Notification = {
              ...data.data,
              createdAt: new Date(data.data.createdAt || data.data.timestamp),
            };
            handleNewNotification(notification);
          } else if (data.type === 'read' && data.data?.id) {
            setNotifications(prev =>
              prev.map(n => n.id === data.data.id ? { ...n, read: true } : n)
            );
          } else if (data.type === 'delete' && data.data?.id) {
            setNotifications(prev => prev.filter(n => n.id !== data.data.id));
          }
        } catch (err) {
          logger.warn('Failed to parse notification message:', err);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        logger.info('Notification WebSocket closed');
        setConnected(false);
        wsRef.current = null;
        if (preferences.enabled && mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      logger.error('Failed to connect WebSocket:', err);
    }
  }, [enableWebSocket, preferences.enabled, handleNewNotification]);

  // Update preferences
  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    const newPrefs = { ...preferences, ...prefs };
    setPreferences(newPrefs);
    localStorage.setItem('notificationPreferences', JSON.stringify(newPrefs));

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/user/notification-preferences`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prefs),
      });
    } catch (err) {
      logger.warn('Failed to sync notification preferences:', err);
    }
  }, [preferences]);

  // Load preferences from storage
  useEffect(() => {
    const stored = localStorage.getItem('notificationPreferences');
    if (stored) {
      try {
        setPreferences(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Connect WebSocket
  useEffect(() => {
    if (enableWebSocket && preferences.enabled) {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enableWebSocket, preferences.enabled, connectWebSocket]);

  // Request browser notification permission
  useEffect(() => {
    if (preferences.showPreview && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [preferences.showPreview]);

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (userId) params.append('userId', userId);

      const response = await fetch(`${API_URL}/api/notifications?${params}`);

      if (!mountedRef.current) return;

      if (response.ok) {
        const data = await response.json();
        const notificationList = (data.notifications || []).map((n: Notification) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
        setNotifications(notificationList);
        setError(null);
      } else if (response.status === 404) {
        // No notifications endpoint available - use empty state
        setNotifications([]);
        setError(null);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (err) {
      if (mountedRef.current) {
        logger.warn('Failed to fetch notifications:', err);
        // Don't show error for network issues, just use empty state
        if (notifications.length === 0) {
          setNotifications([]);
        }
        setError(null); // Don't show error to user for optional feature
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId, limit, notifications.length]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to mark notification as read:', err);
      // Optimistically update UI anyway
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      return true;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`${API_URL}/api/notifications/read-all${params}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to mark all notifications as read:', err);
      // Optimistically update UI anyway
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      return true;
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to delete notification:', err);
      // Optimistically update UI anyway
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      return true;
    }
  }, []);

  const clearAll = useCallback(async (): Promise<boolean> => {
    try {
      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`${API_URL}/api/notifications/clear${params}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to clear all notifications:', err);
      setNotifications([]);
      return true;
    }
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchNotifications, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    connected,
    preferences,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
  };
}

// Priority-based icon and color helpers
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    transaction_confirmed: '✅',
    transaction_failed: '❌',
    price_alert: '📈',
    security_alert: '🔒',
    guardian_request: '👥',
    guardian_approved: '✓',
    recovery_initiated: '🔄',
    wallet_locked: '🔐',
    large_transaction: '💰',
    approval_detected: '⚠️',
    phishing_detected: '🚨',
    whale_alert: '🐋',
    system: '⚙️',
    info: 'ℹ️',
  };
  return icons[type] || 'ℹ️';
}

export function getNotificationColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    low: '#6B7280',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
  };
  return colors[priority];
}

export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
