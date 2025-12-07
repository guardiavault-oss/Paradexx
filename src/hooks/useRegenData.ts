import { useState, useEffect, useCallback } from 'react';
import { logger } from '../services/logger.service';

export interface RegenStats {
  securityScore: number;
  mevAttacksBlocked: number;
  valueSaved: string;
  guardianConfirmations: string;
  protectionRate: number;
}

export interface MEVStats {
  attacksBlocked: number;
  valueSaved: string;
  protectionRate: number;
  lastBlocked?: string;
  recentBlocks: {
    type: string;
    saved: string;
    time: string;
  }[];
}

export interface Guardian {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'inactive';
  lastCheckIn?: string;
  addedAt: string;
}

export interface InheritanceVault {
  id: string;
  name: string;
  value: string;
  beneficiaries: number;
  triggerCondition: string;
  status: 'active' | 'pending' | 'locked';
}

export interface ProtectionActivity {
  id: string;
  type: 'mev' | 'phishing' | 'guardian' | 'inheritance';
  title: string;
  description: string;
  time: string;
  value?: string;
}

export interface UseRegenDataReturn {
  stats: RegenStats | null;
  mevStats: MEVStats | null;
  guardians: Guardian[];
  vaults: InheritanceVault[];
  activities: ProtectionActivity[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

async function fetchJson<T>(url: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return { data: null, error: 'Authentication required' };
      }
      return { data: null, error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    logger.warn(`[useRegenData] Fetch failed for ${url}:`, error);
    return { data: null, error: error instanceof Error ? error.message : 'Network error' };
  }
}

export function useRegenData(): UseRegenDataReturn {
  const [stats, setStats] = useState<RegenStats | null>(null);
  const [mevStats, setMevStats] = useState<MEVStats | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [vaults, setVaults] = useState<InheritanceVault[]>([]);
  const [activities, setActivities] = useState<ProtectionActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [guardiansResult, vaultsResult] = await Promise.all([
        fetchJson<any[]>('/api/guardian/'),
        fetchJson<any[]>('/api/contracts/my-vaults'),
      ]);

      let hasAnyData = false;

      if (guardiansResult.data && Array.isArray(guardiansResult.data)) {
        hasAnyData = true;
        const formattedGuardians: Guardian[] = guardiansResult.data.map((g: any, index: number) => ({
          id: g.id || `guardian-${index}`,
          name: g.name || `Guardian ${index + 1}`,
          address: g.address || g.walletAddress || '0x...',
          status: g.status || 'pending',
          lastCheckIn: g.lastCheckIn || g.lastActive,
          addedAt: g.addedAt || g.createdAt || 'Unknown',
        }));
        setGuardians(formattedGuardians);

        const activeGuardians = formattedGuardians.filter(g => g.status === 'active').length;
        const totalGuardians = formattedGuardians.length;

        const calculatedStats: RegenStats = {
          securityScore: totalGuardians >= 3 ? 95 : totalGuardians >= 2 ? 80 : totalGuardians >= 1 ? 60 : 40,
          mevAttacksBlocked: 0,
          valueSaved: '$0',
          guardianConfirmations: `${activeGuardians}/${totalGuardians}`,
          protectionRate: 100,
        };
        setStats(calculatedStats);

        setMevStats({
          attacksBlocked: 0,
          valueSaved: '$0',
          protectionRate: 100,
          recentBlocks: [],
        });
      } else {
        setStats({
          securityScore: 40,
          mevAttacksBlocked: 0,
          valueSaved: '$0',
          guardianConfirmations: '0/0',
          protectionRate: 100,
        });
        setMevStats({
          attacksBlocked: 0,
          valueSaved: '$0',
          protectionRate: 100,
          recentBlocks: [],
        });
      }

      if (vaultsResult.data && Array.isArray(vaultsResult.data)) {
        hasAnyData = true;
        const formattedVaults: InheritanceVault[] = vaultsResult.data.map((v: any, index: number) => ({
          id: v.id || `vault-${index}`,
          name: v.name || `Vault ${index + 1}`,
          value: v.value || v.balance || '$0',
          beneficiaries: v.beneficiaries?.length || v.beneficiaryCount || 0,
          triggerCondition: v.triggerCondition || v.inactivityPeriod || 'Not set',
          status: v.status || 'pending',
        }));
        setVaults(formattedVaults);
      }

      const recentActivities: ProtectionActivity[] = [];
      
      if (guardiansResult.data && Array.isArray(guardiansResult.data)) {
        guardiansResult.data.slice(0, 3).forEach((g: any, index: number) => {
          if (g.status === 'active') {
            recentActivities.push({
              id: `guardian-activity-${index}`,
              type: 'guardian',
              title: `${g.name || 'Guardian'} is active`,
              description: 'Guardian verified',
              time: g.lastCheckIn || 'Recently',
            });
          }
        });
      }
      setActivities(recentActivities);

      if (!hasAnyData) {
        const errorMessages = [
          guardiansResult.error,
          vaultsResult.error,
        ].filter(Boolean);
        
        if (errorMessages.length > 0 && errorMessages[0] !== 'Authentication required') {
          setError(errorMessages[0] || 'Failed to fetch data');
        }
      }

    } catch (err) {
      logger.error('[useRegenData] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    stats,
    mevStats,
    guardians,
    vaults,
    activities,
    isLoading,
    error,
    refresh,
  };
}
