import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createVault,
  getUserVaults,
  getVaultInfo,
  getContractAddresses,
  type VaultInfo,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const vaultKeys = {
  all: ['vault'] as const,
  userVaults: (owner: string, network: string) => [...vaultKeys.all, 'user-vaults', owner, network] as const,
  vaultInfo: (vaultAddress: string, network: string) => [...vaultKeys.all, 'info', vaultAddress, network] as const,
  contractAddresses: (network: string) => [...vaultKeys.all, 'contract-addresses', network] as const,
};

export function useCreateVault() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: {
      owner: string;
      guardians: string[];
      threshold: number;
      timelockPeriod: number;
      network: 'ethereum' | 'polygon' | 'arbitrum' | 'base';
    }) => createVault(params, session?.access_token || ''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.userVaults(variables.owner, variables.network) });
    },
  });
}

export function useUserVaults(
  owner: string,
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'base',
  options?: { enabled?: boolean }
) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: vaultKeys.userVaults(owner, network),
    queryFn: () => getUserVaults(owner, network, session?.access_token || ''),
    enabled: (options?.enabled ?? true) && !!session?.access_token && !!owner,
  });
}

export function useVaultInfo(
  vaultAddress: string,
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'base',
  options?: { enabled?: boolean }
) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: vaultKeys.vaultInfo(vaultAddress, network),
    queryFn: () => getVaultInfo(vaultAddress, network, session?.access_token || ''),
    enabled: (options?.enabled ?? true) && !!session?.access_token && !!vaultAddress,
  });
}

export function useContractAddresses(network: 'ethereum' | 'polygon' | 'arbitrum' | 'base') {
  return useQuery({
    queryKey: vaultKeys.contractAddresses(network),
    queryFn: () => getContractAddresses(network),
  });
}

