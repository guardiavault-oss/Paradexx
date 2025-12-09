/**
 * useNotifications - Hook for fetching user notifications
 * Connects to the notification.service.ts backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../services/logger.service';

const API_URL = import.meta.env?.VITE_API_URL || 'https://paradexx-production.up.railway.app';

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
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  clearAll: () => Promise<boolean>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    userId,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    limit = 50,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

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
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
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
