/**
 * PrivacyShield Component
 * 
 * Provides privacy-focused features for wallet security:
 * - Balance/amount hiding (stealth mode)
 * - Anonymous transaction mixing
 * - Private RPC mode
 * - Screen capture protection indicators
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Server,
  Shuffle,
  X,
  ChevronRight,
  AlertTriangle,
  Check,
  Info,
  Zap,
} from 'lucide-react';

interface PrivacyShieldProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'degen' | 'regen';
}

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  premium?: boolean;
  dangerous?: boolean;
}

export default function PrivacyShield({ isOpen, onClose, type }: PrivacyShieldProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'hide_balances',
      title: 'Hide Balances',
      description: 'Replace all balance amounts with *** to prevent shoulder surfing',
      icon: <EyeOff className="w-5 h-5" />,
      enabled: false,
    },
    {
      id: 'private_rpc',
      title: 'Private RPC Mode',
      description: 'Route transactions through privacy-preserving RPC nodes',
      icon: <Server className="w-5 h-5" />,
      enabled: false,
    },
    {
      id: 'tx_mixing',
      title: 'Transaction Mixing',
      description: 'Use mixing services for enhanced transaction privacy',
      icon: <Shuffle className="w-5 h-5" />,
      enabled: false,
      premium: true,
    },
    {
      id: 'stealth_addresses',
      title: 'Stealth Addresses',
      description: 'Generate one-time addresses for receiving funds',
      icon: <Lock className="w-5 h-5" />,
      enabled: false,
      premium: true,
    },
    {
      id: 'anti_tracking',
      title: 'Anti-Tracking Mode',
      description: 'Block wallet fingerprinting and tracking attempts',
      icon: <Shield className="w-5 h-5" />,
      enabled: true,
    },
    {
      id: 'data_minimization',
      title: 'Data Minimization',
      description: 'Only collect essential data, no analytics',
      icon: <Zap className="w-5 h-5" />,
      enabled: true,
    },
  ]);

  const [showInfo, setShowInfo] = useState<string | null>(null);

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const privacyScore = Math.round(
    (settings.filter(s => s.enabled).length / settings.length) * 100
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/10"
        >
          {/* Header */}
          <div
            className="p-6 border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 100%)`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Shield className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Privacy Shield</h2>
                  <p className="text-sm text-white/60">Protect your financial privacy</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Privacy Score */}
            <div className="bg-black/40 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">Privacy Score</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: getScoreColor(privacyScore) }}
                >
                  {privacyScore}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${privacyScore}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: getScoreColor(privacyScore) }}
                />
              </div>
              <p className="text-xs text-white/40 mt-2">
                {privacyScore >= 80
                  ? '🛡️ Excellent privacy protection'
                  : privacyScore >= 50
                  ? '⚠️ Moderate privacy - consider enabling more features'
                  : '🔓 Low privacy - your activity may be tracked'}
              </p>
            </div>
          </div>

          {/* Settings List */}
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {settings.map((setting) => (
                <motion.div
                  key={setting.id}
                  layout
                  className={`rounded-xl p-4 border transition-all ${
                    setting.enabled
                      ? 'bg-white/5 border-white/20'
                      : 'bg-black/40 border-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        setting.enabled
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {setting.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{setting.title}</h3>
                        {setting.premium && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                            PRO
                          </span>
                        )}
                        {setting.dangerous && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-white/50 mt-0.5">{setting.description}</p>
                    </div>
                    <button
                      onClick={() => toggleSetting(setting.id)}
                      className={`w-12 h-7 rounded-full transition-all flex-shrink-0 ${
                        setting.enabled
                          ? 'bg-green-500'
                          : 'bg-white/10'
                      }`}
                    >
                      <motion.div
                        layout
                        className="w-5 h-5 rounded-full bg-white shadow-lg"
                        style={{
                          marginLeft: setting.enabled ? '24px' : '4px',
                          marginTop: '4px',
                        }}
                      />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-xl mb-4">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Privacy Note</p>
                <p className="text-blue-300/70">
                  Blockchain transactions are public by nature. These features help reduce
                  tracking and improve privacy but cannot provide complete anonymity.
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-medium text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${isDegen ? '#8B0000' : '#0056b3'} 100%)`,
              }}
            >
              Save Settings
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
