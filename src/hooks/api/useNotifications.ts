import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getBadgeCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  badgeCount: () => [...notificationKeys.all, 'badge-count'] as const,
};

export function useNotifications() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => getNotifications(session?.access_token || ''),
    enabled: !!session?.access_token,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useBadgeCount() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.badgeCount(),
    queryFn: () => getBadgeCount(session?.access_token || ''),
    enabled: !!session?.access_token,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time badge updates
  });
}

export function useMarkNotificationRead() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(notificationId, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.badgeCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => markAllNotificationsRead(session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.badgeCount() });
    },
  });
}

export function useDeleteNotification() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      deleteNotification(notificationId, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.badgeCount() });
    },
  });
}

