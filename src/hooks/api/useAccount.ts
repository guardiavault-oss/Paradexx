import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccountInfo,
  getUserWallets,
  createWallet,
  renameWallet,
  archiveWallet,
  getDevices,
  registerDevice,
  trustDevice,
  getSessions,
  revokeSession,
  revokeAllSessions,
  type AccountInfo,
  type UserWallet,
  type CreateWalletParams,
  type Device,
  type RegisterDeviceParams,
  type Session,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

// Query keys
export const accountKeys = {
  all: ['account'] as const,
  info: () => [...accountKeys.all, 'info'] as const,
  wallets: () => [...accountKeys.all, 'wallets'] as const,
  devices: () => [...accountKeys.all, 'devices'] as const,
  sessions: () => [...accountKeys.all, 'sessions'] as const,
};

// Account Info
export function useAccountInfo() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: accountKeys.info(),
    queryFn: () => getAccountInfo(session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

// User Wallets
export function useUserWallets() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: accountKeys.wallets(),
    queryFn: () => getUserWallets(session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

export function useCreateWallet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: CreateWalletParams) =>
      createWallet(params, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.wallets() });
    },
  });
}

export function useRenameWallet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ walletId, name }: { walletId: string; name: string }) =>
      renameWallet(walletId, name, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.wallets() });
    },
  });
}

export function useArchiveWallet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (walletId: string) =>
      archiveWallet(walletId, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.wallets() });
    },
  });
}

// Devices
export function useDevices() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: accountKeys.devices(),
    queryFn: () => getDevices(session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

export function useRegisterDevice() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: RegisterDeviceParams) =>
      registerDevice(params, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.devices() });
    },
  });
}

export function useTrustDevice() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (deviceId: string) =>
      trustDevice(deviceId, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.devices() });
    },
  });
}

// Sessions
export function useSessions() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: accountKeys.sessions(),
    queryFn: () => getSessions(session?.access_token || ''),
    enabled: !!session?.access_token,
  });
}

export function useRevokeSession() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) =>
      revokeSession(sessionId, session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.sessions() });
    },
  });
}

export function useRevokeAllSessions() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => revokeAllSessions(session?.access_token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.sessions() });
    },
  });
}

