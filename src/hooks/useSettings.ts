/**
 * useSettings Hook - Real API integration for user settings
 * 
 * Provides settings management with localStorage persistence and backend sync
 */

import { useState, useEffect, useCallback } from 'react';

// Types
export interface UserSettings {
  // Profile
  name: string;
  email: string;
  walletAddress: string;

  // Security
  twoFactorEnabled: boolean;
  biometricsEnabled: boolean;
  autoLockTime: number;

  // Privacy
  privacyMode: 'low' | 'medium' | 'high';
  hideBalances: boolean;
  analyticsEnabled: boolean;

  // Notifications
  pushNotifications: boolean;
  tradeAlerts: boolean;
  securityAlerts: boolean;
  priceAlerts: boolean;
  soundEnabled: boolean;

  // Preferences
  defaultNetwork: string;
  slippageTolerance: number;
  gasPreset: string;
  currency: string;
  language: string;
  theme: string;

  // Advanced
  rpcUrl: string;
  apiKey: string;
  developerMode: boolean;
}

// Storage key
const STORAGE_KEY = 'paradex_user_settings';

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  // Profile
  name: '',
  email: '',
  walletAddress: '',

  // Security
  twoFactorEnabled: false,
  biometricsEnabled: false,
  autoLockTime: 5,

  // Privacy
  privacyMode: 'medium',
  hideBalances: false,
  analyticsEnabled: true,

  // Notifications
  pushNotifications: true,
  tradeAlerts: true,
  securityAlerts: true,
  priceAlerts: true,
  soundEnabled: true,

  // Preferences
  defaultNetwork: 'ethereum',
  slippageTolerance: 0.5,
  gasPreset: 'medium',
  currency: 'USD',
  language: 'en',
  theme: 'dark',

  // Advanced
  rpcUrl: '',
  apiKey: '',
  developerMode: false,
};

// API base URL
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) || 'https://paradexx-production.up.railway.app';

// Load settings from localStorage
const loadSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
};

// Save settings to localStorage
const saveSettings = (settings: UserSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Get wallet address from connected wallet
        const storedAddress = localStorage.getItem('paradex_wallet_address');
        
        if (storedAddress) {
          const response = await fetch(`${API_BASE}/api/user/settings`, {
            headers: {
              'Content-Type': 'application/json',
              'X-Wallet-Address': storedAddress,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const merged = { ...DEFAULT_SETTINGS, ...data.data };
              setSettings(merged);
              saveSettings(merged);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch settings from API, using local:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // Update multiple settings at once
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // Toggle boolean setting
  const toggleSetting = useCallback((key: keyof UserSettings) => {
    setSettings(prev => {
      const current = prev[key];
      if (typeof current === 'boolean') {
        const updated = { ...prev, [key]: !current };
        saveSettings(updated);
        return updated;
      }
      return prev;
    });
  }, []);

  // Save settings to backend
  const save = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setSaving(true);
    setError(null);

    try {
      // Always save locally first
      saveSettings(settings);

      // Try to sync with backend
      const storedAddress = localStorage.getItem('paradex_wallet_address');
      
      if (storedAddress) {
        const response = await fetch(`${API_BASE}/api/user/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': storedAddress,
          },
          body: JSON.stringify(settings),
        });

        if (!response.ok) {
          throw new Error('Failed to save to backend');
        }
      }

      setLastSaved(new Date());
      return { success: true };
    } catch (err) {
      console.error('Error saving settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      // Still saved locally, so partial success
      setLastSaved(new Date());
      return { success: true }; // Local save succeeded
    } finally {
      setSaving(false);
    }
  }, [settings]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    // Preserve wallet address and name
    const preserved = {
      name: settings.name,
      walletAddress: settings.walletAddress,
      email: settings.email,
    };
    const reset = { ...DEFAULT_SETTINGS, ...preserved };
    setSettings(reset);
    saveSettings(reset);
  }, [settings.name, settings.walletAddress, settings.email]);

  // Export settings as JSON
  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paradex-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  // Import settings from JSON
  const importSettings = useCallback(async (file: File): Promise<{ success: boolean; error?: string }> => {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      const merged = { ...DEFAULT_SETTINGS, ...imported };
      setSettings(merged);
      saveSettings(merged);
      return { success: true };
    } catch (err) {
      console.error('Failed to import settings:', err);
      return { success: false, error: 'Invalid settings file' };
    }
  }, []);

  // Generate new API key
  const generateApiKey = useCallback(async (): Promise<string | null> => {
    try {
      const storedAddress = localStorage.getItem('paradex_wallet_address');
      
      if (storedAddress) {
        const response = await fetch(`${API_BASE}/api/user/api-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': storedAddress,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.apiKey) {
            updateSetting('apiKey', data.data.apiKey);
            return data.data.apiKey;
          }
        }
      }

      // Generate local API key if backend unavailable
      const localKey = `pdx_local_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      updateSetting('apiKey', localKey);
      return localKey;
    } catch (err) {
      console.error('Failed to generate API key:', err);
      return null;
    }
  }, [updateSetting]);

  // Set wallet address (usually after connect)
  const setWalletAddress = useCallback((address: string) => {
    updateSetting('walletAddress', address);
    localStorage.setItem('paradex_wallet_address', address);
  }, [updateSetting]);

  return {
    // Data
    settings,
    
    // State
    loading,
    saving,
    error,
    lastSaved,
    
    // Actions
    updateSetting,
    updateSettings,
    toggleSetting,
    save,
    resetToDefaults,
    exportSettings,
    importSettings,
    generateApiKey,
    setWalletAddress,
  };
}

export default useSettings;
