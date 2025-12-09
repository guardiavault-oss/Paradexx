import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeStyles, cn } from '../design-system';
import {
  Shield,
  Key,
  Bell,
  Globe,
  Palette,
  Zap,
  ChevronRight,
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
import { useSettings } from '../hooks/useSettings';

interface SettingsProps {
  type: 'degen' | 'regen';
  onClose: () => void;
  activeTab?: 'home' | 'trading' | 'activity' | 'more';
  onTabChange?: (tab: 'home' | 'trading' | 'activity' | 'more') => void;
}

type SettingsTab = 'profile' | 'security' | 'privacy' | 'notifications' | 'preferences' | 'advanced';

export function Settings({ type, onClose, activeTab, onTabChange }: SettingsProps) {
  const [currentTab, setCurrentTab] = useState<SettingsTab>('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const isDegen = type === 'degen';
  // Use design system theme styles
  const theme = getThemeStyles(type);
  const accentColor = theme.primaryColor;
  const secondaryColor = theme.secondaryColor;

  // Use real settings from hook with localStorage + backend sync
  const {
    settings,
    saving,
    toggleSetting,
    updateSetting,
    save,
    exportSettings,
    importSettings,
    generateApiKey,
  } = useSettings();

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Globe },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'advanced', label: 'Advanced', icon: Zap },
  ];

  const handleToggle = (key: string) => {
    toggleSetting(key as keyof typeof settings);
  };

  const handleSave = async () => {
    await save();
  };

  return (
    <div
      className="bg-[var(--bg-base)] text-[var(--text-primary)] pb-24 md:pb-20 pt-20"
    >
      {/* Settings Navigation Header (Inline) */}
      <div className="flex items-center justify-between px-4 mb-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-[var(--radius-lg)] bg-[var(--bg-hover)] border border-[var(--border-neutral)] focus-ring"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black uppercase">Settings</h1>
            <p className="text-[var(--text-sm)] text-[var(--text-muted)]">Customize your wallet</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm"
          style={{ background: accentColor }}
        >
          <Save className="w-4 h-4" />
          <span className="hidden md:inline">Save</span>
        </motion.button>
      </div>

      <div className="px-4 md:px-6 max-w-7xl mx-auto">
        {/* Tabs - Horizontal Scroll on Mobile */}
        <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all"
                style={{
                  background: currentTab === tab.id ? accentColor : 'var(--bg-hover)',
                  border: `1px solid ${currentTab === tab.id ? accentColor : 'var(--border-neutral)'}`,
                  color: currentTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}
              >
                <tab.icon className="w-4 h-4" />
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
                  className="p-6 rounded-xl border"
                  style={{
                    background: `${accentColor}10`,
                    borderColor: `${accentColor}40`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-[var(--text-primary)]/60 mb-1">Current Tribe</div>
                      <div className="text-2xl font-black uppercase" style={{ color: accentColor }}>
                        {isDegen ? '🔥 DEGEN' : '❄️ REGEN'}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg font-bold text-sm border"
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
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10 space-y-4">
                  <h3 className="text-base font-black uppercase mb-4">Profile Information</h3>

                  <div>
                    <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide mb-2 block">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => updateSetting('name', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-neutral)]/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-neutral)]/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide mb-2 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-neutral)]/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-neutral)]/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide mb-2 block">
                      Wallet Address
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settings.walletAddress}
                        disabled
                        className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-neutral)]/10 text-[var(--text-primary)]/50 font-mono text-sm"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(settings.walletAddress)}
                        className="p-3 rounded-lg bg-white/5 border border-[var(--border-neutral)]/10"
                      >
                        {copiedApiKey ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                    <p className="text-xs text-[var(--text-primary)]/40 mt-2">Connected wallet cannot be changed</p>
                  </div>
                </div>

                {/* Avatar/Profile Picture */}
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <h3 className="text-base font-black uppercase mb-4">Profile Picture</h3>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black"
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
                          className="px-4 py-2 rounded-lg font-bold text-sm bg-white/5 border border-[var(--border-neutral)]/10"
                        >
                          <Upload className="w-4 h-4 inline mr-2" />
                          Upload
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 rounded-lg font-bold text-sm bg-white/5 border border-[var(--border-neutral)]/10"
                        >
                          Remove
                        </motion.button>
                      </div>
                      <p className="text-xs text-[var(--text-primary)]/40 mt-2">JPG, PNG or GIF. Max 2MB</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Security Tab */}
            {currentTab === 'security' && (
              <>
                {/* 2FA */}
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold mb-1">Two-Factor Authentication</h3>
                      <p className="text-xs text-[var(--text-primary)]/60">Extra layer of security for your account</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('twoFactorEnabled')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.twoFactorEnabled ? accentColor : 'rgba(255, 255, 255, 0.1)',
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
                      className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30"
                    >
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <Check className="w-4 h-4" />
                        2FA is enabled and protecting your account
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Biometrics */}
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold mb-1">Biometric Authentication</h3>
                      <p className="text-xs text-[var(--text-primary)]/60">Use fingerprint or Face ID</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('biometricsEnabled')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.biometricsEnabled ? accentColor : 'rgba(255, 255, 255, 0.1)',
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
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <h3 className="text-base font-bold mb-4">Auto-Lock Timer</h3>
                  <div className="space-y-3">
                    {[1, 5, 15, 30, 60].map((minutes) => (
                      <motion.button
                        key={minutes}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateSetting('autoLockTime', minutes)}
                        className="w-full p-3 rounded-lg flex items-center justify-between transition-all"
                        style={{
                          background: settings.autoLockTime === minutes ? `${accentColor}20` : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${settings.autoLockTime === minutes ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                        }}
                      >
                        <span className="text-sm">{minutes} {minutes === 1 ? 'minute' : 'minutes'}</span>
                        {settings.autoLockTime === minutes && (
                          <Check className="w-5 h-5" style={{ color: accentColor }} />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Session Management */}
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <h3 className="text-base font-bold mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    {[
                      { device: 'iPhone 14 Pro', location: 'New York, US', active: true },
                      { device: 'MacBook Pro', location: 'New York, US', active: false },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-[var(--text-primary)]/40" />
                          <div>
                            <div className="text-sm text-[var(--text-primary)]">{session.device}</div>
                            <div className="text-xs text-[var(--text-primary)]/40">{session.location}</div>
                          </div>
                        </div>
                        {session.active ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">
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
                  className="w-full p-4 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-sm font-bold">Change Password</div>
                      <div className="text-xs text-[var(--text-primary)]/60">Update your account password</div>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </motion.button>
              </>
            )}

            {/* Privacy Tab */}
            {currentTab === 'privacy' && (
              <>
                {/* Privacy Mode */}
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <h3 className="text-base font-bold mb-4">Privacy Level</h3>
                  <div className="space-y-3">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <motion.button
                        key={level}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateSetting('privacyMode', level)}
                        className="w-full p-4 rounded-lg flex items-center justify-between transition-all"
                        style={{
                          background: settings.privacyMode === level ? `${accentColor}20` : 'rgba(255, 255, 255, 0.03)',
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
                          <Check className="w-5 h-5" style={{ color: accentColor }} />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Privacy Toggles */}
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold">Hide Balances</div>
                      <div className="text-xs text-[var(--text-primary)]/60">Blur amounts in your wallet</div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('hideBalances')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.hideBalances ? accentColor : 'rgba(255, 255, 255, 0.1)',
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
                      <div className="text-xs text-[var(--text-primary)]/60">Help improve Paradex Wallet</div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('analyticsEnabled')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.analyticsEnabled ? accentColor : 'rgba(255, 255, 255, 0.1)',
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
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10 space-y-3">
                  <h3 className="text-base font-bold mb-4">Data Management</h3>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 rounded-lg bg-white/5 border border-[var(--border-neutral)]/10 flex items-center justify-between"
                  >
                    <span className="text-sm">Export My Data</span>
                    <Download className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 rounded-lg bg-white/5 border border-[var(--border-neutral)]/10 flex items-center justify-between"
                  >
                    <span className="text-sm">Clear Cache</span>
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </>
            )}

            {/* Notifications Tab */}
            {currentTab === 'notifications' && (
              <>
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10 space-y-4">
                  <h3 className="text-base font-black uppercase mb-4">Notification Preferences</h3>

                  {[
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive mobile notifications' },
                    { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'Notify on order fills & failures' },
                    { key: 'securityAlerts', label: 'Security Alerts', desc: 'Critical security notifications' },
                    { key: 'priceAlerts', label: 'Price Alerts', desc: 'Track token price movements' },
                    { key: 'soundEnabled', label: 'Sound Effects', desc: 'Play sounds for notifications' },
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
                            background: settings[item.key as keyof typeof settings] ? accentColor : 'rgba(255, 255, 255, 0.1)',
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
                  className="w-full p-4 rounded-xl font-bold"
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
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide mb-3 block">
                    Default Network
                  </label>
                  <select
                    value={settings.defaultNetwork}
                    onChange={(e) => updateSetting('defaultNetwork', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-neutral)]/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-neutral)]/30"
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
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10 space-y-4">
                  <h3 className="text-base font-black uppercase">Trading Defaults</h3>

                  <div>
                    <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide mb-2 block">
                      Slippage Tolerance (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.slippageTolerance}
                      onChange={(e) => updateSetting('slippageTolerance', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-neutral)]/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-neutral)]/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide mb-3 block">
                      Gas Price Preset
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map((preset) => (
                        <motion.button
                          key={preset}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateSetting('gasPreset', preset)}
                          className="p-3 rounded-lg font-bold text-sm capitalize transition-all"
                          style={{
                            background: settings.gasPreset === preset ? accentColor : 'rgba(255, 255, 255, 0.05)',
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
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10 space-y-4">
                  <h3 className="text-base font-black uppercase">Display</h3>

                  <div>
                    <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide mb-3 block">
                      Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => updateSetting('currency', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-neutral)]/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-neutral)]/30"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide mb-3 block">
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-neutral)]/10 text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-neutral)]/30"
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
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold mb-1">Developer Mode</h3>
                      <p className="text-xs text-[var(--text-primary)]/60">Access advanced features & APIs</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle('developerMode')}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
                      style={{
                        background: settings.developerMode ? accentColor : 'rgba(255, 255, 255, 0.1)',
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
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide mb-3 block">
                    Custom RPC URL
                  </label>
                  <input
                    type="text"
                    value={settings.rpcUrl}
                    onChange={(e) => updateSetting('rpcUrl', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-neutral)]/10 text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--border-neutral)]/30"
                  />
                  <p className="text-xs text-[var(--text-primary)]/40 mt-2">Use custom RPC endpoint for transactions</p>
                </div>

                {/* API Key */}
                <div className="p-6 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-[var(--text-primary)]/60 uppercase tracking-wide">
                      API Key
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4 text-[var(--text-primary)]/60" />
                      ) : (
                        <Eye className="w-4 h-4 text-[var(--text-primary)]/60" />
                      )}
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.apiKey}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-neutral)]/10 text-[var(--text-primary)]/70 font-mono text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(settings.apiKey)}
                      className="p-3 rounded-lg bg-white/5 border border-[var(--border-neutral)]/10"
                    >
                      {copiedApiKey ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 rounded-lg bg-white/5 border border-[var(--border-neutral)]/10"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Reset Settings */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-4 rounded-xl bg-white/5 border border-[var(--border-neutral)]/10 flex items-center justify-center gap-2 text-[var(--text-primary)]/80"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reset to Defaults
                </motion.button>

                {/* Danger Zone */}
                <div
                  className="p-6 rounded-xl border"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-red-400 mb-1">Danger Zone</h3>
                      <p className="text-xs text-[var(--text-primary)]/60">
                        These actions are irreversible and will permanently affect your account
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 rounded-lg border border-red-500/50 text-red-400 font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect Wallet
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 rounded-lg border border-red-500/50 text-red-400 font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Help & Support */}
        <div className="mt-6 p-4 rounded-xl border" style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
        }}>
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-bold text-blue-400 mb-1">
                Need Help?
              </div>
              <p className="text-xs text-[var(--text-primary)]/60 mb-3">
                Visit our documentation or contact support for assistance
              </p>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 flex items-center gap-1"
                >
                  Docs
                  <ExternalLink className="w-3 h-3" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400"
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