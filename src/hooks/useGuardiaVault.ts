/**
 * React hooks for GuardiaVault integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guardiaVaultAPI, type Vault, type Guardian, type Beneficiary, type CreateVaultParams, type InviteGuardianParams, type CheckInResponse } from '../services/guardiavault-api.service';
import { toast } from 'sonner';

// Query keys
export const guardiaVaultKeys = {
  all: ['guardiavault'] as const,
  vaults: () => [...guardiaVaultKeys.all, 'vaults'] as const,
  vault: (id: string) => [...guardiaVaultKeys.all, 'vault', id] as const,
  guardians: (vaultId: string) => [...guardiaVaultKeys.all, 'guardians', vaultId] as const,
  beneficiaries: (vaultId: string) => [...guardiaVaultKeys.all, 'beneficiaries', vaultId] as const,
  checkInStatus: (vaultId: string) => [...guardiaVaultKeys.all, 'checkin', vaultId] as const,
  recoveryMetrics: () => [...guardiaVaultKeys.all, 'recovery-metrics'] as const,
};

/**
 * Hook for managing vaults
 */
export function useVaults() {
  return useQuery({
    queryKey: guardiaVaultKeys.vaults(),
    queryFn: () => guardiaVaultAPI.getVaults(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for a single vault
 */
export function useVault(vaultId: string | null) {
  return useQuery({
    queryKey: guardiaVaultKeys.vault(vaultId || ''),
    queryFn: () => guardiaVaultAPI.getVault(vaultId!),
    enabled: !!vaultId,
  });
}

/**
 * Hook for creating a vault
 */
export function useCreateVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateVaultParams) => guardiaVaultAPI.createVault(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guardiaVaultKeys.vaults() });
      toast.success('Vault created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create vault');
    },
  });
}

/**
 * Hook for updating a vault
 */
export function useUpdateVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vaultId, updates }: { vaultId: string; updates: Partial<Vault> }) =>
      guardiaVaultAPI.updateVault(vaultId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: guardiaVaultKeys.vault(variables.vaultId) });
      queryClient.invalidateQueries({ queryKey: guardiaVaultKeys.vaults() });
      toast.success('Vault updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update vault');
    },
  });
}

/**
 * Hook for deleting a vault
 */
export function useDeleteVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vaultId: string) => guardiaVaultAPI.deleteVault(vaultId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guardiaVaultKeys.vaults() });
      toast.success('Vault deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vault');
    },
  });
}

/**
 * Hook for managing guardians
 */
export function useGuardians(vaultId: string | null) {
  return useQuery({
    queryKey: guardiaVaultKeys.guardians(vaultId || ''),
    queryFn: () => guardiaVaultAPI.getGuardians(vaultId!),
    enabled: !!vaultId,
  });
}

/**
 * Hook for inviting a guardian
 */
export function useInviteGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vaultId, params }: { vaultId: string; params: InviteGuardianParams }) =>
      guardiaVaultAPI.inviteGuardian(vaultId, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: guardiaVaultKeys.guardians(variables.vaultId) });
      toast.success('Guardian invitation sent!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to invite guardian');
    },
  });
}

/**
 * Hook for managing beneficiaries
 */
export function useBeneficiaries(vaultId: string | null) {
  return useQuery({
    queryKey: guardiaVaultKeys.beneficiaries(vaultId || ''),
    queryFn: () => guardiaVaultAPI.getBeneficiaries(vaultId!),
    enabled: !!vaultId,
  });
}

/**
 * Hook for adding a beneficiary
 */
export function useAddBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vaultId, beneficiary }: { vaultId: string; beneficiary: any }) =>
      guardiaVaultAPI.addBeneficiary(vaultId, beneficiary),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: guardiaVaultKeys.beneficiaries(variables.vaultId) });
      toast.success('Beneficiary added successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add beneficiary');
    },
  });
}

/**
 * Hook for check-in functionality
 */
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vaultId, options }: { vaultId: string; options?: any }) =>
      guardiaVaultAPI.performCheckIn(vaultId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: guardiaVaultKeys.checkInStatus(variables.vaultId) });
      queryClient.invalidateQueries({ queryKey: guardiaVaultKeys.vault(variables.vaultId) });
      toast.success('Check-in successful!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to perform check-in');
    },
  });
}

/**
 * Hook for check-in status
 */
export function useCheckInStatus(vaultId: string | null) {
  return useQuery({
    queryKey: guardiaVaultKeys.checkInStatus(vaultId || ''),
    queryFn: () => guardiaVaultAPI.getCheckInStatus(vaultId!),
    enabled: !!vaultId,
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook for recovery metrics
 */
export function useRecoveryMetrics() {
  return useQuery({
    queryKey: guardiaVaultKeys.recoveryMetrics(),
    queryFn: () => guardiaVaultAPI.getRecoveryMetrics(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for creating recovery
 */
export function useCreateRecovery() {
  return useMutation({
    mutationFn: (params: any) => guardiaVaultAPI.createRecovery(params),
    onSuccess: () => {
      toast.success('Recovery request created! Guardians have been notified.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create recovery request');
    },
  });
}

/**
 * Hook for wallet balance
 */
export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => guardiaVaultAPI.getWalletBalance(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for subscription status
 */
export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: () => guardiaVaultAPI.getSubscriptionStatus(),
    staleTime: 60000, // 1 minute
  });
}

