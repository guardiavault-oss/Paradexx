import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSettings,
  updateNotificationSettings,
  updateDisplaySettings,
  updateSecuritySettings,
  acceptLegalTerms,
  verifyAge,
  setJurisdiction,
  exportUserData,
  scheduleAccountDeletion,
  cancelAccountDeletion,
  getAppVersion,
  type NotificationSettings,
  type DisplaySettings,
  type SecuritySettings,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const settingsKeys = {
  all: ['settings'] as const,
  current: () => [...settingsKeys.all, 'current'] as const,
  appVersion: () => [...settingsKeys.all, 'app-version'] as const,
};

export function useSettings() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: settingsKeys.current(),
    queryFn: () => getSettings(session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

export function useUpdateNotificationSettings() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      updateNotificationSettings(settings, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.current() });
    },
  });
}

export function useUpdateDisplaySettings() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<DisplaySettings>) =>
      updateDisplaySettings(settings, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.current() });
    },
  });
}

export function useUpdateSecuritySettings() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<SecuritySettings>) =>
      updateSecuritySettings(settings, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.current() });
    },
  });
}

export function useAcceptLegalTerms() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { termsVersion: string; privacyVersion: string }) =>
      acceptLegalTerms(params, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.current() });
    },
  });
}

export function useVerifyAge() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { dateOfBirth: string; attestation?: string }) =>
      verifyAge(params, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.current() });
    },
  });
}

export function useSetJurisdiction() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { country: string; region?: string }) =>
      setJurisdiction(params, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.current() });
    },
  });
}

export function useExportUserData() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: () => exportUserData(session?.access_token || ''),
  });
}

export function useScheduleAccountDeletion() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => scheduleAccountDeletion(session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.current() });
    },
  });
}

export function useCancelAccountDeletion() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => cancelAccountDeletion(session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.current() });
    },
  });
}

export function useAppVersion() {
  return useQuery({
    queryKey: settingsKeys.appVersion(),
    queryFn: () => getAppVersion(),
  });
}

