import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Sun, Moon, Monitor, DollarSign, Calendar, Globe } from 'lucide-react';
import { useLocalStorage } from '../lib/hooks';

type Theme = 'dark' | 'light' | 'system';
type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY';
type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
type TimeFormat = '12h' | '24h';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [currency, setCurrency] = useLocalStorage<Currency>('currency', 'USD');
  const [dateFormat, setDateFormat] = useLocalStorage<DateFormat>('date-format', 'MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useLocalStorage<TimeFormat>('time-format', '12h');
  const [compactMode, setCompactMode] = useLocalStorage('compact-mode', false);
  const [reducedMotion, setReducedMotion] = useLocalStorage('reduced-motion', false);

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Apply compact mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (compactMode) {
      root.classList.add('compact');
    } else {
      root.classList.remove('compact');
    }
  }, [compactMode]);

  // Apply reduced motion
  useEffect(() => {
    const root = window.document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  const formatCurrency = (amount: number): string => {
    const symbol = currencySymbols[currency];
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const formatTime = (date: Date): string => {
    if (timeFormat === '24h') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currency,
        setCurrency,
        dateFormat,
        setDateFormat,
        timeFormat,
        setTimeFormat,
        compactMode,
        setCompactMode,
        reducedMotion,
        setReducedMotion,
        formatCurrency,
        formatDate,
        formatTime,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeSettings() {
  const {
    theme,
    setTheme,
    currency,
    setCurrency,
    dateFormat,
    setDateFormat,
    timeFormat,
    setTimeFormat,
    compactMode,
    setCompactMode,
    reducedMotion,
    setReducedMotion,
  } = useTheme();

  const themeOptions = [
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl mb-1">Display Settings</h2>
        <p className="text-gray-400 text-sm">
          Customize how MEVGUARD looks and feels
        </p>
      </div>

      {/* Theme Selection */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === option.value
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-[#2a2a2a] bg-[#0f0f0f] hover:bg-[#1a1a1a]'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    theme === option.value ? 'text-emerald-400' : 'text-gray-400'
                  }`}
                />
                <div
                  className={`text-sm ${
                    theme === option.value ? 'text-emerald-400' : 'text-gray-400'
                  }`}
                >
                  {option.label}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Currency & Formats */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4">Regional Settings</h3>
        <div className="space-y-4">
          {/* Currency */}
          <div>
            <Label className="text-gray-400 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Currency
            </Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="CNY">CNY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div>
            <Label className="text-gray-400 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Format
            </Label>
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as DateFormat)}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Format */}
          <div>
            <Label className="text-gray-400 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Time Format
            </Label>
            <Select value={timeFormat} onValueChange={(v) => setTimeFormat(v as TimeFormat)}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Display Options */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4">Display Options</h3>
        <div className="space-y-4">
          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Compact Mode</Label>
              <p className="text-xs text-gray-500 mt-1">
                Reduce spacing and padding for more information density
              </p>
            </div>
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Reduced Motion</Label>
              <p className="text-xs text-gray-500 mt-1">
                Minimize animations and transitions for better accessibility
              </p>
            </div>
            <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4">Preview</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Currency:</span>
            <span className="text-white font-mono">
              {currencySymbols[currency]}1,234.56
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Date:</span>
            <span className="text-white font-mono">
              {(() => {
                const date = new Date();
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();

                switch (dateFormat) {
                  case 'DD/MM/YYYY':
                    return `${day}/${month}/${year}`;
                  case 'YYYY-MM-DD':
                    return `${year}-${month}-${day}`;
                  default:
                    return `${month}/${day}/${year}`;
                }
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Time:</span>
            <span className="text-white font-mono">
              {timeFormat === '24h' ? '14:30' : '2:30 PM'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
