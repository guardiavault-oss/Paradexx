import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeStyles } from '../design-system';
import {
  Shield,
  Key,
  Bell,
  Globe,
  Zap,
  Settings as SettingsIcon,
  Copy,
  Check,
  Save,
  Upload,
  Smartphone,
  Lock,
  ArrowLeft,
  Download,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  LogOut,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { useSettings, UserSettings } from '../hooks/useSettings';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsProps {
  type: 'degen' | 'regen';
  onClose: () => void;
  activeTab?: 'home' | 'trading' | 'activity' | 'more';
  onTabChange?: (tab: 'home' | 'trading' | 'activity' | 'more') => void;
}

type SettingsTab =
  | 'profile'
  | 'security'
  | 'privacy'
  | 'notifications'
  | 'preferences'
  | 'advanced';

export function Settings({
  type,
  onClose,
  activeTab: _activeTab,
  onTabChange: _onTabChange,
}: SettingsProps) {
  const [currentTab, setCurrentTab] = useState<SettingsTab>('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDegen = type === 'degen';
  const { logout } = useAuth();

  // Use design system theme styles
  const theme = getThemeStyles(type);
  const accentColor = theme.primaryColor;
  const secondaryColor = theme.secondaryColor;

  // Use real settings from hook with localStorage + backend sync
  const {
    settings,
    saving: _saving,
    toggleSetting,
    updateSetting,
    save,
    exportSettings,
    importSettings,
    generateApiKey,
    resetToDefaults,
  } = useSettings();

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'profile', label: 'Profile', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Globe },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'advanced', label: 'Advanced', icon: Zap },
  ];

  const handleToggle = (key: string) => {
    toggleSetting(key as keyof UserSettings);
    toast.success(`${key} updated`);
  };

  const handleSave = async () => {
    const result = await save();
    if (result.success) {
      toast.success('Settings saved successfully');
    } else {
      toast.error(result.error || 'Failed to save settings');
    }
  };

  const handleCopyAddress = async () => {
    await copyToClipboard(settings.walletAddress);
    setCopiedAddress(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyApiKey = async () => {
    await copyToClipboard(settings.apiKey);
    setCopiedApiKey(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  const handleGenerateApiKey = async () => {
    const newKey = await generateApiKey();
    if (newKey) {
      toast.success('New API key generated');
    } else {
      toast.error('Failed to generate API key');
    }
  };

  const handleExportSettings = () => {
    exportSettings();
    toast.success('Settings exported');
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const result = await importSettings(file);
      if (result.success) {
        toast.success('Settings imported successfully');
      } else {
        toast.error(result.error || 'Failed to import settings');
      }
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetToDefaults();
      toast.success('Settings reset to defaults');
    }
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear cache? This will log you out.')) {
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Cache cleared. Please log in again.');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleDisconnectWallet = () => {
    if (confirm('Are you sure you want to disconnect your wallet?')) {
      logout();
      toast.success('Wallet disconnected');
      onClose();
    }
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        'This action is IRREVERSIBLE. Are you absolutely sure you want to delete your account?'
      )
    ) {
      if (confirm('Final confirmation: This will permanently delete all your data. Continue?')) {
        localStorage.clear();
        sessionStorage.clear();
        toast.success('Account deleted');
        setTimeout(() => (window.location.href = '/'), 1500);
      }
    }
  };

  const handleSendTestNotification = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Paradex Wallet Test', {
            body: 'This is a test notification from your wallet.',
            icon: '/favicon.ico',
          });
          toast.success('Test notification sent');
        } else {
          toast.warning('Please enable notifications in your browser');
        }
      });
    } else {
      toast.warning('Notifications not supported in this browser');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-4 pb-24 text-[var(--text-primary)] md:pb-20">
      {/* Settings Navigation Header (Inline) */}
      <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="focus-ring rounded-[var(--radius-lg)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black uppercase">Settings</h1>
            <p className="text-[var(--text-muted)] text-[var(--text-sm)]">Customize your wallet</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold"
          style={{ background: accentColor }}
        >
          <Save className="h-4 w-4" />
          <span className="hidden md:inline">Save</span>
        </motion.button>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Tabs - Horizontal Scroll on Mobile */}
        <div className="-mx-4 mb-6 px-4 md:mx-0 md:px-0">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentTab(tab.id)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold whitespace-nowrap transition-all"
                style={{
                  background: currentTab === tab.id ? accentColor : 'var(--bg-hover)',
                  border: `1px solid ${currentTab === tab.id ? accentColor : 'var(--border-neutral)'}`,
                  color: currentTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Profile Tab */}
            {currentTab === 'profile' && (
              <>
                {/* Tribe Badge */}
                <div
                  className="rounded-xl border p-6"
                  style={{
                    background: `${accentColor}10`,
                    borderColor: `${accentColor}40`,
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="mb-1 text-sm text-[var(--text-primary)]/60">
                        Current Tribe
                      </div>
                      <div className="text-2xl font-black uppercase" style={{ color: accentColor }}>
                        {isDegen ? '🔥 DEGEN' : '❄️ REGEN'}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-lg border px-4 py-2 text-sm font-bold"
                      style={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      Switch Tribe
                    </motion.button>
                  </div>
                  <p className="text-xs text-[var(--text-primary)]/60">
                    {isDegen
                      ? 'High-risk, high-reward trading with advanced tools'
                      : 'Safety-first approach with long-term wealth protection'}
                  </p>
                </div>

                {/* Profile Info */}
                <div className="space-y-4 rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-base font-black uppercase">Profile Information</h3>

                  <div>
                    <label className="mb-2 block text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={e => updateSetting('name', e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-neutral)]/10 bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-neutral)]/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={e => updateSetting('email', e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-neutral)]/10 bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-neutral)]/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                      Wallet Address
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settings.walletAddress}
                        disabled
                        title="Connected wallet address"
                        className="flex-1 rounded-lg border border-[var(--border-neutral)]/10 bg-[var(--bg-base)] px-4 py-3 font-mono text-sm text-[var(--text-primary)]/50"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyAddress}
                        className="rounded-lg border border-[var(--border-neutral)]/10 bg-white/5 p-3"
                      >
                        {copiedAddress ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </motion.button>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-primary)]/40">
                      Connected wallet cannot be changed
                    </p>
                  </div>
                </div>

                {/* Avatar/Profile Picture */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-base font-black uppercase">Profile Picture</h3>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                      }}
                    >
                      {settings.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="rounded-lg border border-[var(--border-neutral)]/10 bg-white/5 px-4 py-2 text-sm font-bold"
                        >
                          <Upload className="mr-2 inline h-4 w-4" />
                          Upload
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="rounded-lg border border-[var(--border-neutral)]/10 bg-white/5 px-4 py-2 text-sm font-bold"
                        >
                          Remove
                        </motion.button>
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-primary)]/40">
                        JPG, PNG or GIF. Max 2MB
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Security Tab */}
            {currentTab === 'security' && (
              <>
                {/* 2FA */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="mb-1 text-base font-bold">Two-Factor Authentication</h3>
                      <p className="text-xs text-[var(--text-primary)]/60">
                        Extra layer of security for your account
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('twoFactorEnabled')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.twoFactorEnabled
                          ? accentColor
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <motion.span
                        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                        animate={{ x: settings.twoFactorEnabled ? 28 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>
                  {settings.twoFactorEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4"
                    >
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <Check className="h-4 w-4" />
                        2FA is enabled and protecting your account
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Biometrics */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="mb-1 text-base font-bold">Biometric Authentication</h3>
                      <p className="text-xs text-[var(--text-primary)]/60">
                        Use fingerprint or Face ID
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('biometricsEnabled')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.biometricsEnabled
                          ? accentColor
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <motion.span
                        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                        animate={{ x: settings.biometricsEnabled ? 28 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>
                </div>

                {/* Auto Lock */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-base font-bold">Auto-Lock Timer</h3>
                  <div className="space-y-3">
                    {[1, 5, 15, 30, 60].map(minutes => (
                      <motion.button
                        key={minutes}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateSetting('autoLockTime', minutes)}
                        className="flex w-full items-center justify-between rounded-lg p-3 transition-all"
                        style={{
                          background:
                            settings.autoLockTime === minutes
                              ? `${accentColor}20`
                              : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${settings.autoLockTime === minutes ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                        }}
                      >
                        <span className="text-sm">
                          {minutes} {minutes === 1 ? 'minute' : 'minutes'}
                        </span>
                        {settings.autoLockTime === minutes && (
                          <Check className="h-5 w-5" style={{ color: accentColor }} />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Session Management */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-base font-bold">Active Sessions</h3>
                  <div className="space-y-3">
                    {[
                      { device: 'iPhone 14 Pro', location: 'New York, US', active: true },
                      { device: 'MacBook Pro', location: 'New York, US', active: false },
                    ].map((session, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-[var(--text-primary)]/40" />
                          <div>
                            <div className="text-sm text-[var(--text-primary)]">
                              {session.device}
                            </div>
                            <div className="text-xs text-[var(--text-primary)]/40">
                              {session.location}
                            </div>
                          </div>
                        </div>
                        {session.active ? (
                          <span className="rounded bg-green-500/20 px-2 py-1 text-xs font-bold text-green-400">
                            Current
                          </span>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs text-red-400"
                          >
                            Revoke
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Change Password */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5" />
                    <div className="text-left">
                      <div className="text-sm font-bold">Change Password</div>
                      <div className="text-xs text-[var(--text-primary)]/60">
                        Update your account password
                      </div>
                    </div>
                  </div>
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </motion.button>
              </>
            )}

            {/* Privacy Tab */}
            {currentTab === 'privacy' && (
              <>
                {/* Privacy Mode */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-base font-bold">Privacy Level</h3>
                  <div className="space-y-3">
                    {(['low', 'medium', 'high'] as const).map(level => (
                      <motion.button
                        key={level}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateSetting('privacyMode', level)}
                        className="flex w-full items-center justify-between rounded-lg p-4 transition-all"
                        style={{
                          background:
                            settings.privacyMode === level
                              ? `${accentColor}20`
                              : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${settings.privacyMode === level ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                        }}
                      >
                        <div className="text-left">
                          <div className="text-sm font-bold capitalize">{level} Privacy</div>
                          <div className="text-xs text-[var(--text-primary)]/60">
                            {level === 'low' && 'Basic privacy features'}
                            {level === 'medium' && 'Balanced privacy & functionality'}
                            {level === 'high' && 'Maximum privacy protection'}
                          </div>
                        </div>
                        {settings.privacyMode === level && (
                          <Check className="h-5 w-5" style={{ color: accentColor }} />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Privacy Toggles */}
                <div className="space-y-4 rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold">Hide Balances</div>
                      <div className="text-xs text-[var(--text-primary)]/60">
                        Blur amounts in your wallet
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('hideBalances')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.hideBalances
                          ? accentColor
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <motion.span
                        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                        animate={{ x: settings.hideBalances ? 28 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold">Usage Analytics</div>
                      <div className="text-xs text-[var(--text-primary)]/60">
                        Help improve Paradex Wallet
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('analyticsEnabled')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.analyticsEnabled
                          ? accentColor
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <motion.span
                        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                        animate={{ x: settings.analyticsEnabled ? 28 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>
                </div>

                {/* Data Management */}
                <div className="space-y-3 rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-base font-bold">Data Management</h3>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExportSettings}
                    className="flex w-full items-center justify-between rounded-lg border border-[var(--border-neutral)]/10 bg-white/5 p-3"
                  >
                    <span className="text-sm">Export My Data</span>
                    <Download className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClearCache}
                    className="flex w-full items-center justify-between rounded-lg border border-[var(--border-neutral)]/10 bg-white/5 p-3"
                  >
                    <span className="text-sm">Clear Cache</span>
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </>
            )}

            {/* Notifications Tab */}
            {currentTab === 'notifications' && (
              <>
                <div className="space-y-4 rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-base font-black uppercase">Notification Preferences</h3>

                  {[
                    {
                      key: 'pushNotifications',
                      label: 'Push Notifications',
                      desc: 'Receive mobile notifications',
                    },
                    {
                      key: 'tradeAlerts',
                      label: 'Trade Alerts',
                      desc: 'Notify on order fills & failures',
                    },
                    {
                      key: 'securityAlerts',
                      label: 'Security Alerts',
                      desc: 'Critical security notifications',
                    },
                    {
                      key: 'priceAlerts',
                      label: 'Price Alerts',
                      desc: 'Track token price movements',
                    },
                    {
                      key: 'soundEnabled',
                      label: 'Sound Effects',
                      desc: 'Play sounds for notifications',
                    },
                  ].map((item, i) => (
                    <React.Fragment key={item.key}>
                      {i > 0 && <div className="h-px bg-white/10" />}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold">{item.label}</div>
                          <div className="text-xs text-[var(--text-primary)]/60">{item.desc}</div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggle(item.key)}
                          className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                          style={{
                            background: settings[item.key as keyof typeof settings]
                              ? accentColor
                              : 'rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <motion.span
                            className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                            animate={{ x: settings[item.key as keyof typeof settings] ? 28 : 4 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {/* Test Notification */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendTestNotification}
                  className="w-full rounded-xl p-4 font-bold"
                  style={{
                    background: `${accentColor}20`,
                    border: `1px solid ${accentColor}`,
                  }}
                >
                  Send Test Notification
                </motion.button>
              </>
            )}

            {/* Preferences Tab */}
            {currentTab === 'preferences' && (
              <>
                {/* Network */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <label className="mb-3 block text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                    Default Network
                  </label>
                  <select
                    value={settings.defaultNetwork}
                    onChange={e => updateSetting('defaultNetwork', e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-neutral)]/10 bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-neutral)]/30 focus:outline-none"
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                    <option value="bsc">BSC</option>
                    <option value="arbitrum">Arbitrum</option>
                    <option value="optimism">Optimism</option>
                    <option value="base">Base</option>
                  </select>
                </div>

                {/* Trading Preferences */}
                <div className="space-y-4 rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="text-base font-black uppercase">Trading Defaults</h3>

                  <div>
                    <label className="mb-2 block text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                      Slippage Tolerance (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.slippageTolerance}
                      onChange={e => updateSetting('slippageTolerance', parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-[var(--border-neutral)]/10 bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-neutral)]/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                      Gas Price Preset
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map(preset => (
                        <motion.button
                          key={preset}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateSetting('gasPreset', preset)}
                          className="rounded-lg p-3 text-sm font-bold capitalize transition-all"
                          style={{
                            background:
                              settings.gasPreset === preset
                                ? accentColor
                                : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${settings.gasPreset === preset ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                          }}
                        >
                          {preset}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Display Preferences */}
                <div className="space-y-4 rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="text-base font-black uppercase">Display</h3>

                  <div>
                    <label className="mb-3 block text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                      Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={e => updateSetting('currency', e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-neutral)]/10 bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-neutral)]/30 focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-3 block text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={e => updateSetting('language', e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-neutral)]/10 bg-[var(--bg-base)] px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-neutral)]/30 focus:outline-none"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="zh">中文</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Advanced Tab */}
            {currentTab === 'advanced' && (
              <>
                {/* Developer Mode */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="mb-1 text-base font-bold">Developer Mode</h3>
                      <p className="text-xs text-[var(--text-primary)]/60">
                        Access advanced features & APIs
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('developerMode')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.developerMode
                          ? accentColor
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <motion.span
                        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                        animate={{ x: settings.developerMode ? 28 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>
                </div>

                {/* Custom RPC */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <label className="mb-3 block text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                    Custom RPC URL
                  </label>
                  <input
                    type="text"
                    value={settings.rpcUrl}
                    onChange={e => updateSetting('rpcUrl', e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-neutral)]/10 bg-[var(--bg-base)] px-4 py-3 font-mono text-sm text-[var(--text-primary)] focus:border-[var(--border-neutral)]/30 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-[var(--text-primary)]/40">
                    Use custom RPC endpoint for transactions
                  </p>
                </div>

                {/* API Key */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs tracking-wide text-[var(--text-primary)]/60 uppercase">
                      API Key
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4 text-[var(--text-primary)]/60" />
                      ) : (
                        <Eye className="h-4 w-4 text-[var(--text-primary)]/60" />
                      )}
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.apiKey || 'No API key generated'}
                      readOnly
                      title="API Key"
                      className="flex-1 rounded-lg border border-[var(--border-neutral)]/10 bg-[var(--bg-base)] px-4 py-3 font-mono text-sm text-[var(--text-primary)]/70"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyApiKey}
                      className="rounded-lg border border-[var(--border-neutral)]/10 bg-white/5 p-3"
                    >
                      {copiedApiKey ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerateApiKey}
                      className="rounded-lg border border-[var(--border-neutral)]/10 bg-white/5 p-3"
                      title="Generate new API key"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Import Settings */}
                <div className="rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-base font-bold">Import Settings</h3>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportSettings}
                    accept=".json"
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-neutral)]/10 bg-white/5 p-3"
                  >
                    <Upload className="h-5 w-5" />
                    Import from JSON
                  </motion.button>
                </div>

                {/* Reset Settings */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResetToDefaults}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 p-4 text-[var(--text-primary)]/80"
                >
                  <RefreshCw className="h-5 w-5" />
                  Reset to Defaults
                </motion.button>

                {/* Danger Zone */}
                <div
                  className="rounded-xl border p-6"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
                    <div>
                      <h3 className="mb-1 text-base font-bold text-red-400">Danger Zone</h3>
                      <p className="text-xs text-[var(--text-primary)]/60">
                        These actions are irreversible and will permanently affect your account
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDisconnectWallet}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/50 p-3 text-sm font-bold text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect Wallet
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeleteAccount}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/50 p-3 text-sm font-bold text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Help & Support */}
        <div
          className="mt-6 rounded-xl border p-4"
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
          }}
        >
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 flex-shrink-0 text-blue-400" />
            <div className="flex-1">
              <div className="mb-1 text-sm font-bold text-blue-400">Need Help?</div>
              <p className="mb-3 text-xs text-[var(--text-primary)]/60">
                Visit our documentation or contact support for assistance
              </p>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400"
                >
                  Docs
                  <ExternalLink className="h-3 w-3" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400"
                >
                  Support
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="mt-4 text-center text-xs text-[var(--text-primary)]/40">
          Paradex Wallet v2.0.0 • Built with ❤️ for {isDegen ? 'Degens' : 'Regens'}
        </div>
      </div>
    </div>
  );
}
