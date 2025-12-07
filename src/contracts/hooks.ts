/**
 * DualGen Smart Contract Hooks
 * React hooks for interacting with deployed Sepolia contracts
 */

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

import { useState, useEffect, useCallback } from 'react';
import { logger } from '../services/logger.service';
import { ethers, BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID } from './config';
import { 
  GUARDIA_VAULT_ABI, 
  MULTI_SIG_RECOVERY_ABI, 
  GUARDIAN_ATTESTATION_ABI,
  YIELD_VAULT_ABI 
} from './abis';

// Types
interface VaultData {
  owner: string;
  beneficiaries: string[];
  allocations: bigint[];
  timelockDays: bigint;
  lastCheckIn: bigint;
  isActive: boolean;
}

interface RecoveryData {
  walletOwner: string;
  walletAddress: string;
  recoveryKeys: [string, string, string];
  createdAt: bigint;
  status: number;
  encryptedData: string;
}

type RecoveryStatus = 'Active' | 'Triggered' | 'Completed' | 'Cancelled';

// Helper to get provider
async function getProvider(): Promise<BrowserProvider | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  return new BrowserProvider(window.ethereum);
}

// Helper to get signer
async function getSigner() {
  const provider = await getProvider();
  if (!provider) return null;
  return provider.getSigner();
}

// Check if on Sepolia
async function ensureSepoliaNetwork(): Promise<boolean> {
  const provider = await getProvider();
  if (!provider) return false;
  
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      // Chain not added, try adding it
      if (error.code === 4902 && window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: 'Sepolia',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
        return true;
      }
      logger.error('Failed to switch network:', error);
      return false;
    }
  }
  return true;
}

/**
 * Hook for GuardiaVault contract interactions
 */
export function useGuardiaVault() {
  const [vault, setVault] = useState<VaultData | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async (withSigner = false) => {
    const provider = await getProvider();
    if (!provider) throw new Error('No provider available');
    
    await ensureSepoliaNetwork();
    
    const signerOrProvider = withSigner 
      ? await provider.getSigner() 
      : provider;
    
    return new Contract(
      CONTRACT_ADDRESSES.GuardiaVault,
      GUARDIA_VAULT_ABI,
      signerOrProvider
    );
  }, []);

  const fetchVault = useCallback(async (userAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const vaultData = await contract.getUserVault(userAddress);
      setVault({
        owner: vaultData[0],
        beneficiaries: vaultData[1],
        allocations: vaultData[2],
        timelockDays: vaultData[3],
        lastCheckIn: vaultData[4],
        isActive: vaultData[5],
      });
      
      const bal = await contract.getVaultBalance(userAddress);
      setBalance(formatEther(bal));
    } catch (err: any) {
      logger.error('Error fetching vault:', err);
      setError(err.message || 'Failed to fetch vault');
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const createVault = useCallback(async (
    beneficiaries: string[],
    allocations: number[],
    timelockDays: number,
    depositAmount: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.createVault(
        beneficiaries,
        allocations,
        timelockDays,
        { value: parseEther(depositAmount) }
      );
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to create vault');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const checkIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.checkIn();
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const updateTimelock = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.updateTimelock(days);
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to update timelock');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const addBeneficiary = useCallback(async (address: string, allocation: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.addBeneficiary(address, allocation);
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to add beneficiary');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const removeBeneficiary = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.removeBeneficiary(address);
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to remove beneficiary');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  return {
    vault,
    balance,
    loading,
    error,
    fetchVault,
    createVault,
    checkIn,
    updateTimelock,
    addBeneficiary,
    removeBeneficiary,
  };
}

/**
 * Hook for MultiSigRecovery contract interactions
 */
export function useMultiSigRecovery() {
  const [recovery, setRecovery] = useState<RecoveryData | null>(null);
  const [attestationCount, setAttestationCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async (withSigner = false) => {
    const provider = await getProvider();
    if (!provider) throw new Error('No provider available');
    
    await ensureSepoliaNetwork();
    
    const signerOrProvider = withSigner 
      ? await provider.getSigner() 
      : provider;
    
    return new Contract(
      CONTRACT_ADDRESSES.MultiSigRecovery,
      MULTI_SIG_RECOVERY_ABI,
      signerOrProvider
    );
  }, []);

  const statusToString = (status: number): RecoveryStatus => {
    const statuses: RecoveryStatus[] = ['Active', 'Triggered', 'Completed', 'Cancelled'];
    return statuses[status] || 'Active';
  };

  const fetchRecovery = useCallback(async (recoveryId: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const data = await contract.getRecovery(recoveryId);
      setRecovery({
        walletOwner: data[0],
        walletAddress: data[1],
        recoveryKeys: data[2] as [string, string, string],
        createdAt: data[3],
        status: Number(data[4]),
        encryptedData: data[5],
      });

      const count = await contract.getRecoveryAttestationCount(recoveryId);
      setAttestationCount(Number(count));

      const time = await contract.getTimeUntilRecovery(recoveryId);
      setTimeRemaining(Number(time));
    } catch (err: any) {
      logger.error('Error fetching recovery:', err);
      setError(err.message || 'Failed to fetch recovery');
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const createRecovery = useCallback(async (
    walletAddress: string,
    recoveryKeys: [string, string, string],
    encryptedData: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.createRecovery(walletAddress, recoveryKeys, encryptedData);
      const receipt = await tx.wait();
      
      // Parse the event to get the recovery ID
      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === 'RecoveryCreated'
      );
      const recoveryId = event?.args?.[0];
      
      return { hash: tx.hash, recoveryId: Number(recoveryId) };
    } catch (err: any) {
      setError(err.message || 'Failed to create recovery');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const attestRecovery = useCallback(async (recoveryId: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.attestRecovery(recoveryId);
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to attest recovery');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const completeRecovery = useCallback(async (recoveryId: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.completeRecovery(recoveryId);
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to complete recovery');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const cancelRecovery = useCallback(async (recoveryId: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.cancelRecovery(recoveryId);
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel recovery');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  return {
    recovery,
    attestationCount,
    timeRemaining,
    loading,
    error,
    statusToString,
    fetchRecovery,
    createRecovery,
    attestRecovery,
    completeRecovery,
    cancelRecovery,
  };
}

/**
 * Hook for YieldVault contract interactions
 */
export function useYieldVault() {
  const [balance, setBalance] = useState<string>('0');
  const [pendingYield, setPendingYield] = useState<string>('0');
  const [apy, setApy] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async (withSigner = false) => {
    const provider = await getProvider();
    if (!provider) throw new Error('No provider available');
    
    await ensureSepoliaNetwork();
    
    const signerOrProvider = withSigner 
      ? await provider.getSigner() 
      : provider;
    
    return new Contract(
      CONTRACT_ADDRESSES.YieldVault,
      YIELD_VAULT_ABI,
      signerOrProvider
    );
  }, []);

  const fetchBalance = useCallback(async (userAddress: string) => {
    setLoading(true);
    try {
      const contract = await getContract();
      const bal = await contract.getBalance(userAddress);
      setBalance(formatEther(bal));
      
      const pending = await contract.getPendingYield(userAddress);
      setPendingYield(formatEther(pending));
      
      const currentApy = await contract.currentAPY();
      setApy(Number(currentApy) / 100); // Convert from basis points
    } catch (err: any) {
      logger.error('Error fetching yield vault:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const deposit = useCallback(async (amount: string) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.deposit(parseEther(amount), { value: parseEther(amount) });
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to deposit');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const withdraw = useCallback(async (amount: string) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.withdraw(parseEther(amount));
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const claimYield = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.claimYield();
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Failed to claim yield');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  return {
    balance,
    pendingYield,
    apy,
    loading,
    error,
    fetchBalance,
    deposit,
    withdraw,
    claimYield,
  };
}

/**
 * Hook for checking wallet connection and network
 */
export function useWalletConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isOnSepolia, setIsOnSepolia] = useState(false);
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0].address);
          
          const network = await provider.getNetwork();
          setIsOnSepolia(Number(network.chainId) === SEPOLIA_CHAIN_ID);
          
          const bal = await provider.getBalance(accounts[0].address);
          setBalance(formatEther(bal));
        }
      } catch (err) {
        logger.error('Error checking connection:', err);
      }
    };

    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', checkConnection);
      window.ethereum.on('chainChanged', checkConnection);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', checkConnection);
        window.ethereum.removeListener('chainChanged', checkConnection);
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask');
    }
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await ensureSepoliaNetwork();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to connect wallet');
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    return ensureSepoliaNetwork();
  }, []);

  return {
    isConnected,
    address,
    isOnSepolia,
    balance,
    connect,
    switchToSepolia,
  };
}

// Export types
export type { VaultData, RecoveryData, RecoveryStatus };
