/**
 * useMEVProtection Hook - Real API integration for MEV Protection Dashboard
 * 
 * Provides MEV protection data from backend API with fallback
 */

import { useState, useEffect, useCallback } from 'react';
import { mevService } from '../services/api-service-layer';

// Types
export interface ThreatAlert {
  id: string;
  type: 'sandwich' | 'frontrun' | 'backrun' | 'flashloan' | 'liquidation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  blocked: boolean;
  estimatedLoss: number;
  network: string;
  confidence: number;
  transactionHash?: string;
}

export interface NetworkStatus {
  name: string;
  chainId: number;
  active: boolean;
  latency: number;
  txCount: number;
  threatsDetected: number;
}

export interface MEVStats {
  threatsBlocked: number;
  valueProtected: number;
  mevSaved: number;
  successRate: number;
  avgResponseTime: number;
  activeProtections: number;
}

export interface ProtectionConfig {
  enabled: boolean;
  level: 'basic' | 'standard' | 'high' | 'maximum';
  autoProtect: boolean;
  privateMempool: boolean;
}

// Storage key
const STORAGE_KEY = 'paradex_mev_protection';

// Load config from localStorage
const loadConfig = (): ProtectionConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading MEV config:', error);
  }
  return {
    enabled: true,
    level: 'high',
    autoProtect: true,
    privateMempool: true,
  };
};

// Save config to localStorage
const saveConfig = (config: ProtectionConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving MEV config:', error);
  }
};

export function useMEVProtection() {
  const [config, setConfig] = useState<ProtectionConfig>(() => loadConfig());
  const [stats, setStats] = useState<MEVStats>({
    threatsBlocked: 0,
    valueProtected: 0,
    mevSaved: 0,
    successRate: 0,
    avgResponseTime: 0,
    activeProtections: 0,
  });
  const [threats, setThreats] = useState<ThreatAlert[]>([]);
  const [networks, setNetworks] = useState<NetworkStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await mevService.getDashboard();
      if (response.success && response.data) {
        const data = response.data as {
          stats?: MEVStats;
          threats?: ThreatAlert[];
          networks?: NetworkStatus[];
        };
        
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.threats) {
          setThreats(data.threats);
        }
        if (data.networks) {
          setNetworks(data.networks);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch MEV dashboard:', err);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await mevService.getStats(undefined, '24h');
      if (response.success && response.data) {
        const data = response.data as MEVStats;
        setStats(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Failed to fetch MEV stats:', err);
    }
  }, []);

  // Fetch threats
  const fetchThreats = useCallback(async () => {
    try {
      const response = await mevService.getThreats({ limit: 50 });
      if (response.success && response.data) {
        const threatData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as { threats?: ThreatAlert[] }).threats || [];
        setThreats(threatData as ThreatAlert[]);
      }
    } catch (err) {
      console.warn('Failed to fetch MEV threats:', err);
    }
  }, []);

  // Fetch protection status and networks
  const fetchProtectionStatus = useCallback(async () => {
    try {
      const response = await mevService.getProtectionStatus();
      if (response.success && response.data) {
        const data = response.data as {
          enabled?: boolean;
          networks?: NetworkStatus[];
          protection_level?: string;
        };
        
        if (data.networks) {
          setNetworks(data.networks);
        }
        
        // Update config from server
        setConfig(prev => ({
          ...prev,
          enabled: data.enabled ?? prev.enabled,
          level: (data.protection_level as ProtectionConfig['level']) || prev.level,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch protection status:', err);
      // Use default network list as fallback
      setNetworks([
        { name: 'Ethereum', chainId: 1, active: true, latency: 0, txCount: 0, threatsDetected: 0 },
        { name: 'Polygon', chainId: 137, active: true, latency: 0, txCount: 0, threatsDetected: 0 },
        { name: 'Arbitrum', chainId: 42161, active: true, latency: 0, txCount: 0, threatsDetected: 0 },
        { name: 'Optimism', chainId: 10, active: true, latency: 0, txCount: 0, threatsDetected: 0 },
        { name: 'Base', chainId: 8453, active: true, latency: 0, txCount: 0, threatsDetected: 0 },
      ]);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchDashboard(),
          fetchStats(),
          fetchThreats(),
          fetchProtectionStatus(),
        ]);
      } catch (err) {
        console.error('Error fetching MEV protection data:', err);
        setError('Failed to load protection data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAll();
  }, [fetchDashboard, fetchStats, fetchThreats, fetchProtectionStatus]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchDashboard(),
        fetchStats(),
        fetchThreats(),
        fetchProtectionStatus(),
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh protection data');
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboard, fetchStats, fetchThreats, fetchProtectionStatus]);

  // Toggle protection enabled
  const toggleProtection = useCallback(async (enabled: boolean) => {
    const newConfig = { ...config, enabled };
    setConfig(newConfig);
    saveConfig(newConfig);
    
    try {
      if (enabled) {
        const activeNetworks = networks.filter(n => n.active).map(n => n.name.toLowerCase());
        await mevService.startProtection(activeNetworks, config.level);
      } else {
        await mevService.stopProtection();
      }
    } catch (err) {
      console.warn('Failed to toggle protection on server:', err);
    }
  }, [config, networks]);

  // Update protection level
  const setProtectionLevel = useCallback(async (level: ProtectionConfig['level']) => {
    const newConfig = { ...config, level };
    setConfig(newConfig);
    saveConfig(newConfig);
    
    try {
      if (config.enabled) {
        const activeNetworks = networks.filter(n => n.active).map(n => n.name.toLowerCase());
        await mevService.startProtection(activeNetworks, level);
      }
    } catch (err) {
      console.warn('Failed to update protection level:', err);
    }
  }, [config, networks]);

  // Toggle auto protect
  const toggleAutoProtect = useCallback((enabled: boolean) => {
    const newConfig = { ...config, autoProtect: enabled };
    setConfig(newConfig);
    saveConfig(newConfig);
  }, [config]);

  // Toggle private mempool
  const togglePrivateMempool = useCallback((enabled: boolean) => {
    const newConfig = { ...config, privateMempool: enabled };
    setConfig(newConfig);
    saveConfig(newConfig);
  }, [config]);

  // Toggle network protection
  const toggleNetwork = useCallback(async (chainId: number, active: boolean) => {
    setNetworks(prev => prev.map(n => 
      n.chainId === chainId ? { ...n, active } : n
    ));
    
    // Update server
    try {
      const network = networks.find(n => n.chainId === chainId);
      if (network) {
        if (active) {
          await mevService.startProtection([network.name.toLowerCase()], config.level);
        } else {
          await mevService.stopProtection([network.name.toLowerCase()]);
        }
      }
    } catch (err) {
      console.warn('Failed to toggle network protection:', err);
    }
  }, [networks, config.level]);

  // Protect a transaction
  const protectTransaction = useCallback(async (txHash: string) => {
    try {
      const response = await mevService.protectTransaction(txHash);
      return { success: response.success, data: response.data };
    } catch (err) {
      console.error('Failed to protect transaction:', err);
      return { success: false, error: 'Failed to protect transaction' };
    }
  }, []);

  // Route transaction through private mempool
  const routeTransaction = useCallback(async (transaction: Record<string, unknown>, chainId: number) => {
    try {
      const response = await mevService.routeTransaction({
        transaction,
        chain_id: chainId,
        protection_level: config.level,
      });
      return { success: response.success, data: response.data };
    } catch (err) {
      console.error('Failed to route transaction:', err);
      return { success: false, error: 'Failed to route transaction' };
    }
  }, [config.level]);

  return {
    // Data
    stats,
    threats,
    networks,
    config,
    
    // State
    loading,
    refreshing,
    error,
    
    // Config actions
    toggleProtection,
    setProtectionLevel,
    toggleAutoProtect,
    togglePrivateMempool,
    toggleNetwork,
    
    // Protection actions
    protectTransaction,
    routeTransaction,
    refresh,
  };
}

export default useMEVProtection;
