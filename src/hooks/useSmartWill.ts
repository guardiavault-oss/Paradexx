/**
 * useSmartWill Hook - Smart Contract Will Management
 *
 * Features:
 * - Deploy on-chain wills as smart contracts
 * - Manage beneficiaries and allocations
 * - Set up inheritance triggers (inactivity, dead man's switch)
 * - Monitor will status and execution
 * - Revoke or update existing wills
 */

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { API_URL } from '../config/api';

export interface Beneficiary {
  id: string;
  name: string;
  address: string;
  percentage: number;
  relationship: string;
  email?: string;
  phone?: string;
  verified?: boolean;
}

export interface WillTrigger {
  type: 'inactivity' | 'dead_man_switch' | 'multi_sig' | 'oracle' | 'manual';
  config: {
    // Inactivity trigger
    inactivityPeriodDays?: number;
    lastActivityCheck?: Date;
    // Dead man's switch
    checkInIntervalDays?: number;
    lastCheckIn?: Date;
    missedCheckInsToTrigger?: number;
    // Multi-sig
    requiredApprovals?: number;
    approvers?: string[];
    currentApprovals?: string[];
    // Oracle
    oracleAddress?: string;
    deathCertificateRequired?: boolean;
    // Manual
    trustedExecutors?: string[];
  };
}

export interface SmartWill {
  id: string;
  contractAddress?: string;
  chainId: number;
  ownerAddress: string;
  beneficiaries: Beneficiary[];
  totalAllocation: number;
  triggers: WillTrigger[];
  status: 'draft' | 'pending' | 'deployed' | 'triggered' | 'executed' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  executedAt?: Date;
  txHash?: string;
  templateType: string;
  customTerms?: string;
  assets?: WillAsset[];
  backupBeneficiary?: Beneficiary;
  cooldownPeriodDays?: number;
  estimatedGas?: string;
  deploymentFee?: string;
}

export interface WillAsset {
  type: 'token' | 'nft' | 'native';
  address?: string;
  tokenId?: string;
  amount?: string;
  symbol?: string;
  name?: string;
}

export interface WillDeploymentParams {
  beneficiaries: Beneficiary[];
  triggers: WillTrigger[];
  assets?: WillAsset[];
  templateType: string;
  customTerms?: string;
  backupBeneficiary?: Beneficiary;
  cooldownPeriodDays?: number;
}

export interface WillUpdateParams {
  beneficiaries?: Beneficiary[];
  triggers?: WillTrigger[];
  customTerms?: string;
  backupBeneficiary?: Beneficiary;
}

interface UseSmartWillReturn {
  wills: SmartWill[];
  activeWill: SmartWill | null;
  loading: boolean;
  deploying: boolean;
  error: string | null;
  deployWill: (params: WillDeploymentParams) => Promise<SmartWill | null>;
  updateWill: (willId: string, params: WillUpdateParams) => Promise<boolean>;
  revokeWill: (willId: string) => Promise<boolean>;
  checkIn: (willId: string) => Promise<boolean>;
  estimateDeploymentCost: (params: WillDeploymentParams) => Promise<{ gas: string; fee: string } | null>;
  getWillStatus: (willId: string) => Promise<SmartWill | null>;
  triggerManualExecution: (willId: string) => Promise<boolean>;
  refreshWills: () => Promise<void>;
  setActiveWill: (will: SmartWill | null) => void;
  validateBeneficiaries: (beneficiaries: Beneficiary[]) => { valid: boolean; errors: string[] };
}

// Smart Will ABI (simplified for interface)
const SMART_WILL_ABI = [
  "function owner() view returns (address)",
  "function getBeneficiaries() view returns (tuple(address addr, uint256 percentage, string name)[])",
  "function getStatus() view returns (uint8)",
  "function lastActivity() view returns (uint256)",
  "function triggerWill()",
  "function executeWill()",
  "function revoke()",
  "function checkIn()",
  "function updateBeneficiaries(tuple(address addr, uint256 percentage, string name)[])",
  "event WillTriggered(address indexed triggeredBy, uint256 timestamp)",
  "event WillExecuted(uint256 timestamp)",
  "event WillRevoked(uint256 timestamp)",
  "event CheckIn(uint256 timestamp)",
];

// Will Factory ABI
const WILL_FACTORY_ABI = [
  "function createWill(tuple(address addr, uint256 percentage, string name)[] beneficiaries, uint256 triggerType, uint256 triggerConfig) payable returns (address)",
  "function getDeploymentFee(uint256 triggerType) view returns (uint256)",
  "function getUserWills(address user) view returns (address[])",
];

// GuardiaVault deployed contract addresses by chain
// Sepolia testnet has the verified deployment
const FACTORY_ADDRESSES: Record<number, string> = {
  1: '0x0000000000000000000000000000000000000000', // Mainnet - not yet deployed
  11155111: '0x3D853c85Df825EA3CEd26040Cba0341778eAA891', // Sepolia (DEPLOYED)
  137: '0x0000000000000000000000000000000000000000', // Polygon - not yet deployed
  42161: '0x0000000000000000000000000000000000000000', // Arbitrum - not yet deployed
  10: '0x0000000000000000000000000000000000000000', // Optimism - not yet deployed
  8453: '0x0000000000000000000000000000000000000000', // Base - not yet deployed
};

// Additional deployed contracts for reference
export const DEPLOYED_CONTRACTS = {
  sepolia: {
    guardiaVault: '0x3D853c85Df825EA3CEd26040Cba0341778eAA891',
    yieldVault: '0xe63b2eaaE33fbe61C887235668ec0705bCFb463e',
    lifetimeAccess: '0x01eFA1b345f806cC847aa434FC99c255CDc02Da1',
    lidoAdapter: '0xC30F4DE8666c79757116517361dFE6764A6Dc128',
    aaveAdapter: '0xcc27a22d92a8B03D822974CDeD6BB74a63Ac0ae1',
  },
};

export function useSmartWill(): UseSmartWillReturn {
  const [wills, setWills] = useState<SmartWill[]>([]);
  const [activeWill, setActiveWill] = useState<SmartWill | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate beneficiary allocations
  const validateBeneficiaries = useCallback((beneficiaries: Beneficiary[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (beneficiaries.length === 0) {
      errors.push('At least one beneficiary is required');
    }

    const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    if (totalPercentage !== 100) {
      errors.push(`Total allocation must equal 100% (current: ${totalPercentage}%)`);
    }

    const invalidAddresses = beneficiaries.filter(b => !ethers.isAddress(b.address));
    if (invalidAddresses.length > 0) {
      errors.push(`Invalid addresses for: ${invalidAddresses.map(b => b.name).join(', ')}`);
    }

    const duplicateAddresses = beneficiaries.filter((b, i, arr) =>
      arr.findIndex(x => x.address.toLowerCase() === b.address.toLowerCase()) !== i
    );
    if (duplicateAddresses.length > 0) {
      errors.push('Duplicate beneficiary addresses detected');
    }

    return { valid: errors.length === 0, errors };
  }, []);

  // Get provider
  const getProvider = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return provider;
    }
    return null;
  }, []);

  // Fetch user's wills from API
  const fetchWills = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/wills`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.wills) {
          const fetchedWills = data.data.wills.map((w: Record<string, unknown>) => ({
            ...w,
            createdAt: new Date(w.createdAt as string),
            updatedAt: new Date(w.updatedAt as string),
            deployedAt: w.deployedAt ? new Date(w.deployedAt as string) : undefined,
            executedAt: w.executedAt ? new Date(w.executedAt as string) : undefined,
          }));
          setWills(fetchedWills);
        }
      }
    } catch (err) {
      console.error('Failed to fetch wills:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Estimate deployment cost
  const estimateDeploymentCost = useCallback(async (params: WillDeploymentParams): Promise<{ gas: string; fee: string } | null> => {
    try {
      const provider = await getProvider();
      if (!provider) {
        throw new Error('Wallet not connected');
      }

      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const factoryAddress = FACTORY_ADDRESSES[chainId];
      const isValidFactory = factoryAddress &&
        factoryAddress !== '0x...' &&
        factoryAddress !== '0x0000000000000000000000000000000000000000';

      if (!isValidFactory) {
        // Use API estimation for unsupported chains or development
        const response = await fetch(`${API_URL}/api/wills/estimate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            return {
              gas: data.data.estimatedGas || '0.005',
              fee: data.data.platformFee || '0.01',
            };
          }
        }

        // Fallback estimation
        return {
          gas: '0.005 ETH',
          fee: '0.01 ETH',
        };
      }

      const factory = new ethers.Contract(factoryAddress, WILL_FACTORY_ABI, provider);
      const triggerType = params.triggers[0]?.type === 'inactivity' ? 0 : 1;
      const deploymentFee = await factory.getDeploymentFee(triggerType);
      const feePrice = await provider.getFeeData();
      const estimatedGas = BigInt(300000); // Approximate gas for deployment

      return {
        gas: ethers.formatEther(estimatedGas * (feePrice.gasPrice || BigInt(0))),
        fee: ethers.formatEther(deploymentFee),
      };
    } catch (err) {
      console.error('Failed to estimate deployment cost:', err);
      return null;
    }
  }, [getProvider]);

  // Deploy will to blockchain
  const deployWill = useCallback(async (params: WillDeploymentParams): Promise<SmartWill | null> => {
    setDeploying(true);
    setError(null);

    try {
      // Validate beneficiaries
      const validation = validateBeneficiaries(params.beneficiaries);
      if (!validation.valid) {
        throw new Error(validation.errors.join('. '));
      }

      const provider = await getProvider();
      if (!provider) {
        throw new Error('Wallet not connected');
      }

      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const ownerAddress = await signer.getAddress();

      // Create draft will in database first
      const token = localStorage.getItem('accessToken');
      const createResponse = await fetch(`${API_URL}/api/wills`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          chainId,
          ownerAddress,
          status: 'pending',
        }),
      });

      let willId: string;
      if (createResponse.ok) {
        const createData = await createResponse.json();
        willId = createData.data?.id || crypto.randomUUID();
      } else {
        willId = crypto.randomUUID();
      }

      // Check if factory contract exists
      const factoryAddress = FACTORY_ADDRESSES[chainId];

      let contractAddress: string | undefined;
      let txHash: string | undefined;

      if (factoryAddress && factoryAddress !== '0x...') {
        // Deploy via factory contract
        const factory = new ethers.Contract(factoryAddress, WILL_FACTORY_ABI, signer);

        const beneficiaryData = params.beneficiaries.map(b => ({
          addr: b.address,
          percentage: b.percentage,
          name: b.name,
        }));

        const triggerType = params.triggers[0]?.type === 'inactivity' ? 0 : 1;
        const triggerConfig = params.triggers[0]?.config?.inactivityPeriodDays || 365;

        const deploymentFee = await factory.getDeploymentFee(triggerType);

        const tx = await factory.createWill(beneficiaryData, triggerType, triggerConfig, {
          value: deploymentFee,
        });

        const receipt = await tx.wait();
        txHash = receipt.hash;

        // Get contract address from event
        const event = receipt.logs.find((log: { fragment?: { name?: string } }) => log.fragment?.name === 'WillCreated');
        if (event) {
          contractAddress = event.args[0];
        }
      } else {
        // Mock deployment for development/unsupported chains
        console.info('Simulating will deployment (factory not available)');
        contractAddress = `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        txHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      }

      // Update will status in database
      const newWill: SmartWill = {
        id: willId,
        contractAddress,
        chainId,
        ownerAddress,
        beneficiaries: params.beneficiaries,
        totalAllocation: 100,
        triggers: params.triggers,
        status: 'deployed',
        createdAt: new Date(),
        updatedAt: new Date(),
        deployedAt: new Date(),
        txHash,
        templateType: params.templateType,
        customTerms: params.customTerms,
        assets: params.assets,
        backupBeneficiary: params.backupBeneficiary,
        cooldownPeriodDays: params.cooldownPeriodDays,
      };

      // Update in API
      await fetch(`${API_URL}/api/wills/${willId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWill),
      });

      setWills(prev => [...prev, newWill]);
      setActiveWill(newWill);

      return newWill;

    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to deploy will';
      setError(errorMessage);
      console.error('Will deployment failed:', err);
      return null;
    } finally {
      setDeploying(false);
    }
  }, [getProvider, validateBeneficiaries]);

  // Update existing will
  const updateWill = useCallback(async (willId: string, params: WillUpdateParams): Promise<boolean> => {
    try {
      const will = wills.find(w => w.id === willId);
      if (!will) {
        throw new Error('Will not found');
      }

      // Validate if beneficiaries are being updated
      if (params.beneficiaries) {
        const validation = validateBeneficiaries(params.beneficiaries);
        if (!validation.valid) {
          throw new Error(validation.errors.join('. '));
        }
      }

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/wills/${willId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to update will');
      }

      // Update on-chain if deployed
      if (will.contractAddress && will.status === 'deployed' && params.beneficiaries) {
        const provider = await getProvider();
        if (provider) {
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(will.contractAddress, SMART_WILL_ABI, signer);

          const beneficiaryData = params.beneficiaries.map(b => ({
            addr: b.address,
            percentage: b.percentage,
            name: b.name,
          }));

          try {
            const tx = await contract.updateBeneficiaries(beneficiaryData);
            await tx.wait();
          } catch {
            console.warn('On-chain update failed, only database updated');
          }
        }
      }

      // Update local state
      setWills(prev => prev.map(w =>
        w.id === willId ? { ...w, ...params, updatedAt: new Date() } : w
      ));

      if (activeWill?.id === willId) {
        setActiveWill(prev => prev ? { ...prev, ...params, updatedAt: new Date() } : null);
      }

      return true;

    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to update will');
      return false;
    }
  }, [wills, activeWill, getProvider, validateBeneficiaries]);

  // Revoke will
  const revokeWill = useCallback(async (willId: string): Promise<boolean> => {
    try {
      const will = wills.find(w => w.id === willId);
      if (!will) {
        throw new Error('Will not found');
      }

      // Revoke on-chain if deployed
      if (will.contractAddress && will.status === 'deployed') {
        const provider = await getProvider();
        if (provider) {
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(will.contractAddress, SMART_WILL_ABI, signer);

          try {
            const tx = await contract.revoke();
            await tx.wait();
          } catch {
            console.warn('On-chain revocation failed');
          }
        }
      }

      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/api/wills/${willId}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setWills(prev => prev.map(w =>
        w.id === willId ? { ...w, status: 'revoked', updatedAt: new Date() } : w
      ));

      if (activeWill?.id === willId) {
        setActiveWill(prev => prev ? { ...prev, status: 'revoked' } : null);
      }

      return true;

    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to revoke will');
      return false;
    }
  }, [wills, activeWill, getProvider]);

  // Check in (reset dead man's switch)
  const checkIn = useCallback(async (willId: string): Promise<boolean> => {
    try {
      const will = wills.find(w => w.id === willId);
      if (!will) {
        throw new Error('Will not found');
      }

      // Check in on-chain if deployed
      if (will.contractAddress && will.status === 'deployed') {
        const provider = await getProvider();
        if (provider) {
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(will.contractAddress, SMART_WILL_ABI, signer);

          try {
            const tx = await contract.checkIn();
            await tx.wait();
          } catch {
            console.warn('On-chain check-in failed');
          }
        }
      }

      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/api/wills/${willId}/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update trigger last check-in
      setWills(prev => prev.map(w => {
        if (w.id !== willId) return w;
        return {
          ...w,
          updatedAt: new Date(),
          triggers: w.triggers.map(t => ({
            ...t,
            config: {
              ...t.config,
              lastCheckIn: new Date(),
              lastActivityCheck: new Date(),
            },
          })),
        };
      }));

      return true;

    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to check in');
      return false;
    }
  }, [wills, getProvider]);

  // Get will status from blockchain
  const getWillStatus = useCallback(async (willId: string): Promise<SmartWill | null> => {
    try {
      const will = wills.find(w => w.id === willId);
      if (!will?.contractAddress) return will || null;

      const provider = await getProvider();
      if (!provider) return will;

      const contract = new ethers.Contract(will.contractAddress, SMART_WILL_ABI, provider);

      try {
        const status = await contract.getStatus();
        const statusMap: Record<number, SmartWill['status']> = {
          0: 'deployed',
          1: 'triggered',
          2: 'executed',
          3: 'revoked',
        };

        const updatedWill = {
          ...will,
          status: statusMap[status] || will.status,
        };

        setWills(prev => prev.map(w => w.id === willId ? updatedWill : w));
        if (activeWill?.id === willId) {
          setActiveWill(updatedWill);
        }

        return updatedWill;
      } catch {
        return will;
      }

    } catch (err) {
      console.error('Failed to get will status:', err);
      return null;
    }
  }, [wills, activeWill, getProvider]);

  // Trigger manual execution
  const triggerManualExecution = useCallback(async (willId: string): Promise<boolean> => {
    try {
      const will = wills.find(w => w.id === willId);
      if (!will) {
        throw new Error('Will not found');
      }

      if (will.contractAddress && will.status === 'deployed') {
        const provider = await getProvider();
        if (provider) {
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(will.contractAddress, SMART_WILL_ABI, signer);

          const tx = await contract.triggerWill();
          await tx.wait();
        }
      }

      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/api/wills/${willId}/trigger`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setWills(prev => prev.map(w =>
        w.id === willId ? { ...w, status: 'triggered', updatedAt: new Date() } : w
      ));

      return true;

    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to trigger will execution');
      return false;
    }
  }, [wills, getProvider]);

  // Refresh wills
  const refreshWills = useCallback(async () => {
    setLoading(true);
    await fetchWills();
  }, [fetchWills]);

  // Initial load
  useEffect(() => {
    fetchWills();
  }, [fetchWills]);

  return {
    wills,
    activeWill,
    loading,
    deploying,
    error,
    deployWill,
    updateWill,
    revokeWill,
    checkIn,
    estimateDeploymentCost,
    getWillStatus,
    triggerManualExecution,
    refreshWills,
    setActiveWill,
    validateBeneficiaries,
  };
}

export default useSmartWill;
