// User Preferences Management
export interface UserPreferences {
  theme: 'dark' | 'light';
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    threats: boolean;
    mev: boolean;
    transactions: boolean;
  };
  dashboard: {
    refreshInterval: number; // in seconds
    defaultTimeRange: '1h' | '24h' | '7d' | '30d';
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  language: 'en',
  notifications: {
    email: true,
    push: true,
    inApp: true,
    threats: true,
    mev: true,
    transactions: true,
  },
  dashboard: {
    refreshInterval: 30,
    defaultTimeRange: '24h',
  },
};

const STORAGE_KEY = 'mevguard_preferences';

export const preferences = {
  get: (): UserPreferences => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_PREFERENCES;
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  set: (prefs: Partial<UserPreferences>) => {
    if (typeof window === 'undefined') return;
    
    try {
      const current = preferences.get();
      const updated = { ...current, ...prefs };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // Dispatch event for listeners
      window.dispatchEvent(new CustomEvent('preferences-changed', { detail: updated }));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  },

  reset: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('preferences-changed', { detail: DEFAULT_PREFERENCES }));
  },

  subscribe: (callback: (prefs: UserPreferences) => void) => {
    const handler = (event: Event) => {
      callback((event as CustomEvent).detail);
    };
    window.addEventListener('preferences-changed', handler);
    return () => window.removeEventListener('preferences-changed', handler);
  },
};

// Formatting utilities
export function formatDate(date: Date | string, format?: UserPreferences['dateFormat']): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const prefs = preferences.get();
  const fmt = format || prefs.dateFormat;

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  switch (fmt) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`;
  }
}

export function formatTime(date: Date | string, format?: UserPreferences['timeFormat']): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const prefs = preferences.get();
  const fmt = format || prefs.timeFormat;

  if (fmt === '24h') {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(d);
}

// Number formatting
export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
