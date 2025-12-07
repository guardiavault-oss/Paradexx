/**
 * useUserMode Hook - Manages user experience mode (Beginner/Pro/Guardian)
 * Provides consistent access to user mode across the app
 */

import { useState, useEffect, useCallback } from 'react';

export type UserMode = 'beginner' | 'pro' | 'guardian';

interface UserModeConfig {
  // UI Visibility
  showAdvancedDeFi: boolean;
  showGasControls: boolean;
  showSecurityDashboard: boolean;
  showInheritance: boolean;
  showPolicyEngine: boolean;
  showMevStats: boolean;
  
  // Guidance & Help
  showTooltips: boolean;
  showGuidedTasks: boolean;
  showFirstTimeWalkthroughs: boolean;
  
  // Safety
  requireExtraConfirmation: boolean;
  showWarningsForNewAddresses: boolean;
  defaultSlippageProtection: number; // percentage
  
  // Limits
  suggestLimitsOnLargeTransfers: boolean;
  largeTransferThreshold: number; // in USD
}

const MODE_CONFIGS: Record<UserMode, UserModeConfig> = {
  beginner: {
    showAdvancedDeFi: false,
    showGasControls: false,
    showSecurityDashboard: true,
    showInheritance: false,
    showPolicyEngine: false,
    showMevStats: false,
    showTooltips: true,
    showGuidedTasks: true,
    showFirstTimeWalkthroughs: true,
    requireExtraConfirmation: true,
    showWarningsForNewAddresses: true,
    defaultSlippageProtection: 1,
    suggestLimitsOnLargeTransfers: true,
    largeTransferThreshold: 500,
  },
  pro: {
    showAdvancedDeFi: true,
    showGasControls: true,
    showSecurityDashboard: true,
    showInheritance: true,
    showPolicyEngine: false,
    showMevStats: true,
    showTooltips: false,
    showGuidedTasks: false,
    showFirstTimeWalkthroughs: false,
    requireExtraConfirmation: false,
    showWarningsForNewAddresses: true,
    defaultSlippageProtection: 0.5,
    suggestLimitsOnLargeTransfers: false,
    largeTransferThreshold: 5000,
  },
  guardian: {
    showAdvancedDeFi: true,
    showGasControls: true,
    showSecurityDashboard: true,
    showInheritance: true,
    showPolicyEngine: true,
    showMevStats: true,
    showTooltips: false,
    showGuidedTasks: false,
    showFirstTimeWalkthroughs: false,
    requireExtraConfirmation: true,
    showWarningsForNewAddresses: true,
    defaultSlippageProtection: 0.3,
    suggestLimitsOnLargeTransfers: true,
    largeTransferThreshold: 10000,
  },
};

export function useUserMode() {
  const [mode, setModeState] = useState<UserMode>(() => {
    const stored = localStorage.getItem('paradox_user_mode');
    return (stored as UserMode) || 'beginner';
  });

  const [config, setConfig] = useState<UserModeConfig>(MODE_CONFIGS[mode]);

  // Update config when mode changes
  useEffect(() => {
    setConfig(MODE_CONFIGS[mode]);
  }, [mode]);

  // Persist mode changes
  const setMode = useCallback((newMode: UserMode) => {
    setModeState(newMode);
    localStorage.setItem('paradox_user_mode', newMode);
  }, []);

  // Listen for storage changes (sync across tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'paradox_user_mode' && e.newValue) {
        setModeState(e.newValue as UserMode);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    mode,
    setMode,
    config,
    isBeginner: mode === 'beginner',
    isPro: mode === 'pro',
    isGuardian: mode === 'guardian',
  };
}

// Export mode configs for reference
export { MODE_CONFIGS };
