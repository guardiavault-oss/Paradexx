/**
 * useWalletGuard Hook - Real API integration for Wallet Guard Dashboard
 * 
 * Provides security monitoring data from backend API with fallback
 */

import { useState, useEffect, useCallback } from 'react';
import { walletGuardService } from '../services/api-service-layer';
import { useWalletData } from '../contexts/WalletDataContext';

// Types
export interface MonitoredWallet {
  wallet_address: string;
  network: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  protection_enabled: boolean;
  threats_detected: number;
  last_scan?: string;
}

export interface WalletStatus {
  protection_enabled: boolean;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  threats_detected: number;
  last_scan: string;
  alerts_24h?: number;
}

export interface Threat {
  threat_id: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  confidence: number;
  wallet_address?: string;
  transaction_hash?: string;
  resolved?: boolean;
}

export interface SecurityAnalytics {
  total_monitored: number;
  threats_detected_24h: number;
  protection_actions_taken: number;
  average_threat_level: 'low' | 'medium' | 'high' | 'critical';
  blocked_transactions?: number;
  scan_count?: number;
}

export interface ProtectionAction {
  action_id: string;
  action_type: string;
  wallet_address: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  details?: string;
}

// Storage key for persisting monitored wallets
const STORAGE_KEY = 'paradex_monitored_wallets';

// Load monitored wallets from localStorage
const loadMonitoredWallets = (): MonitoredWallet[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading monitored wallets:', error);
  }
  return [];
};

// Save monitored wallets to localStorage
const saveMonitoredWallets = (wallets: MonitoredWallet[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error('Error saving monitored wallets:', error);
  }
};

export function useWalletGuard() {
  const { walletData } = useWalletData();
  const connectedAddress = walletData?.address;
  
  const [monitoredWallets, setMonitoredWallets] = useState<MonitoredWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [analytics, setAnalytics] = useState<SecurityAnalytics | null>(null);
  const [actions, setActions] = useState<ProtectionAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with stored wallets and connected wallet
  useEffect(() => {
    const stored = loadMonitoredWallets();
    
    // If connected wallet exists and not in list, add it
    if (connectedAddress && !stored.some(w => w.wallet_address.toLowerCase() === connectedAddress.toLowerCase())) {
      const connectedWallet: MonitoredWallet = {
        wallet_address: connectedAddress,
        network: 'ethereum',
        threat_level: 'low',
        protection_enabled: true,
        threats_detected: 0,
        last_scan: new Date().toISOString(),
      };
      stored.unshift(connectedWallet);
      saveMonitoredWallets(stored);
    }
    
    setMonitoredWallets(stored);
    
    // Select first wallet or connected wallet
    if (!selectedWallet && stored.length > 0) {
      setSelectedWallet(stored[0].wallet_address);
    }
  }, [connectedAddress]);

  // Fetch analytics from API
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await walletGuardService.getAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data as SecurityAnalytics);
      }
    } catch (err) {
      console.warn('Failed to fetch analytics, using calculated values:', err);
      // Calculate from local data
      setAnalytics({
        total_monitored: monitoredWallets.length,
        threats_detected_24h: threats.filter(t => {
          const threatDate = new Date(t.timestamp);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return threatDate > dayAgo;
        }).length,
        protection_actions_taken: actions.filter(a => a.status === 'success').length,
        average_threat_level: calculateAverageThreatLevel(monitoredWallets),
      });
    }
  }, [monitoredWallets, threats, actions]);

  // Fetch threats from API
  const fetchThreats = useCallback(async () => {
    try {
      const response = await walletGuardService.getThreats({ limit: 50, hours: 48 });
      if (response.success && response.data) {
        const threatData = Array.isArray(response.data) ? response.data : (response.data as { threats?: Threat[] }).threats || [];
        setThreats(threatData as Threat[]);
      }
    } catch (err) {
      console.warn('Failed to fetch threats:', err);
      // Keep existing threats or empty
    }
  }, []);

  // Fetch wallet status from API
  const fetchWalletStatus = useCallback(async (walletAddress: string) => {
    try {
      const wallet = monitoredWallets.find(w => w.wallet_address === walletAddress);
      const response = await walletGuardService.getWalletStatus(walletAddress, wallet?.network);
      if (response.success && response.data) {
        setWalletStatus(response.data as WalletStatus);
        
        // Update wallet in list
        setMonitoredWallets(prev => {
          const updated = prev.map(w => {
            if (w.wallet_address === walletAddress) {
              const statusData = response.data as WalletStatus;
              return {
                ...w,
                threat_level: statusData.threat_level,
                protection_enabled: statusData.protection_enabled,
                threats_detected: statusData.threats_detected,
                last_scan: statusData.last_scan,
              };
            }
            return w;
          });
          saveMonitoredWallets(updated);
          return updated;
        });
      }
    } catch (err) {
      console.warn('Failed to fetch wallet status:', err);
      // Set default status based on local data
      const wallet = monitoredWallets.find(w => w.wallet_address === walletAddress);
      if (wallet) {
        setWalletStatus({
          protection_enabled: wallet.protection_enabled,
          threat_level: wallet.threat_level,
          threats_detected: wallet.threats_detected,
          last_scan: wallet.last_scan || new Date().toISOString(),
        });
      }
    }
  }, [monitoredWallets]);

  // Fetch actions from API  
  const fetchActions = useCallback(async () => {
    try {
      const response = await walletGuardService.getActions(25);
      if (response.success && response.data) {
        const actionData = Array.isArray(response.data) ? response.data : (response.data as { actions?: ProtectionAction[] }).actions || [];
        setActions(actionData as ProtectionAction[]);
      }
    } catch (err) {
      console.warn('Failed to fetch actions:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchAnalytics(),
          fetchThreats(),
          fetchActions(),
        ]);
        
        if (selectedWallet) {
          await fetchWalletStatus(selectedWallet);
        }
      } catch (err) {
        console.error('Error fetching wallet guard data:', err);
        setError('Failed to load security data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAll();
  }, []);

  // Fetch wallet status when selection changes
  useEffect(() => {
    if (selectedWallet && !loading) {
      fetchWalletStatus(selectedWallet);
    }
  }, [selectedWallet]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchAnalytics(),
        fetchThreats(),
        fetchActions(),
      ]);
      
      if (selectedWallet) {
        await fetchWalletStatus(selectedWallet);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh security data');
    } finally {
      setRefreshing(false);
    }
  }, [selectedWallet, fetchAnalytics, fetchThreats, fetchActions, fetchWalletStatus]);

  // Add wallet to monitoring
  const addWallet = useCallback(async (walletAddress: string, network: string = 'ethereum') => {
    if (!walletAddress) return { success: false, error: 'Invalid address' };
    
    // Check if already monitored
    if (monitoredWallets.some(w => w.wallet_address.toLowerCase() === walletAddress.toLowerCase())) {
      return { success: false, error: 'Wallet already monitored' };
    }
    
    try {
      // Try to start monitoring via API
      const response = await walletGuardService.startMonitoring({
        wallet_address: walletAddress,
        network,
        protection_level: 'standard',
      });
      
      const newWallet: MonitoredWallet = {
        wallet_address: walletAddress,
        network,
        threat_level: 'low',
        protection_enabled: true,
        threats_detected: 0,
        last_scan: new Date().toISOString(),
      };
      
      // If API returned data, merge it
      if (response.success && response.data) {
        Object.assign(newWallet, response.data);
      }
      
      const updated = [...monitoredWallets, newWallet];
      setMonitoredWallets(updated);
      saveMonitoredWallets(updated);
      
      // Select the new wallet
      setSelectedWallet(walletAddress);
      
      return { success: true };
    } catch (err) {
      console.warn('API monitoring failed, adding locally:', err);
      
      // Add locally anyway
      const newWallet: MonitoredWallet = {
        wallet_address: walletAddress,
        network,
        threat_level: 'low',
        protection_enabled: true,
        threats_detected: 0,
        last_scan: new Date().toISOString(),
      };
      
      const updated = [...monitoredWallets, newWallet];
      setMonitoredWallets(updated);
      saveMonitoredWallets(updated);
      setSelectedWallet(walletAddress);
      
      return { success: true };
    }
  }, [monitoredWallets]);

  // Remove wallet from monitoring
  const removeWallet = useCallback((walletAddress: string) => {
    const updated = monitoredWallets.filter(w => w.wallet_address !== walletAddress);
    setMonitoredWallets(updated);
    saveMonitoredWallets(updated);
    
    // Update selection if removed wallet was selected
    if (selectedWallet === walletAddress) {
      setSelectedWallet(updated[0]?.wallet_address || null);
    }
  }, [monitoredWallets, selectedWallet]);

  // Toggle protection for wallet
  const toggleProtection = useCallback(async (walletAddress: string, enable: boolean) => {
    const wallet = monitoredWallets.find(w => w.wallet_address === walletAddress);
    if (!wallet) return { success: false, error: 'Wallet not found' };
    
    try {
      // Try API call
      await walletGuardService.applyProtection({
        wallet_address: walletAddress,
        action_type: enable ? 'enable_protection' : 'disable_protection',
        network: wallet.network,
      });
    } catch (err) {
      console.warn('API protection toggle failed, updating locally:', err);
    }
    
    // Update locally
    const updated = monitoredWallets.map(w => {
      if (w.wallet_address === walletAddress) {
        return { ...w, protection_enabled: enable };
      }
      return w;
    });
    
    setMonitoredWallets(updated);
    saveMonitoredWallets(updated);
    
    // Update wallet status if this is the selected wallet
    if (selectedWallet === walletAddress && walletStatus) {
      setWalletStatus({ ...walletStatus, protection_enabled: enable });
    }
    
    return { success: true };
  }, [monitoredWallets, selectedWallet, walletStatus]);

  // Simulate transaction
  const simulateTransaction = useCallback(async (transaction: Record<string, unknown>) => {
    if (!selectedWallet) return { success: false, error: 'No wallet selected' };
    
    const wallet = monitoredWallets.find(w => w.wallet_address === selectedWallet);
    
    try {
      const response = await walletGuardService.simulateTransaction({
        wallet_address: selectedWallet,
        transaction,
        network: wallet?.network,
        simulation_depth: 3,
      });
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Transaction simulation failed:', err);
      return { success: false, error: 'Simulation failed' };
    }
  }, [selectedWallet, monitoredWallets]);

  return {
    // Data
    monitoredWallets,
    selectedWallet,
    walletStatus,
    threats,
    analytics,
    actions,
    
    // State
    loading,
    refreshing,
    error,
    
    // Actions
    setSelectedWallet,
    addWallet,
    removeWallet,
    toggleProtection,
    simulateTransaction,
    refresh,
  };
}

// Helper function to calculate average threat level
function calculateAverageThreatLevel(wallets: MonitoredWallet[]): 'low' | 'medium' | 'high' | 'critical' {
  if (wallets.length === 0) return 'low';
  
  const levels = { low: 1, medium: 2, high: 3, critical: 4 };
  const sum = wallets.reduce((acc, w) => acc + (levels[w.threat_level] || 1), 0);
  const avg = sum / wallets.length;
  
  if (avg >= 3.5) return 'critical';
  if (avg >= 2.5) return 'high';
  if (avg >= 1.5) return 'medium';
  return 'low';
}

export default useWalletGuard;
