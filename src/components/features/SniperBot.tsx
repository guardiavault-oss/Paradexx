import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Target,
  Crosshair,
  Zap,
  Play,
  Pause,
  Settings,
  Plus,
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
} from 'lucide-react';

interface SniperBotProps {
  type: 'degen' | 'regen';
  onClose: () => void;
}

export function SniperBot({ type, onClose }: SniperBotProps) {
  const [isActive, setIsActive] = useState(false);
  const isDegen = type === 'degen';

  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const accentSecondary = isDegen ? '#8B0000' : '#000080';

  const targets = [
    {
      address: '0x1234...5678',
      tokenName: 'PEPE 2.0',
      liquidity: '$125K',
      gasPrice: '45 gwei',
      status: 'monitoring',
      triggerPrice: '$0.00001',
    },
    {
      address: '0xabcd...ef01',
      tokenName: 'SHIB KILLER',
      liquidity: '$85K',
      gasPrice: '52 gwei',
      status: 'ready',
      triggerPrice: '$0.000005',
    },
    {
      address: '0x9876...5432',
      tokenName: 'MOON TOKEN',
      liquidity: '$200K',
      gasPrice: '38 gwei',
      status: 'executed',
      triggerPrice: '$0.00002',
    },
  ];

  const stats = [
    { label: 'Active Targets', value: '24', icon: Target },
    { label: 'Success Rate', value: '87%', icon: TrendingUp },
    { label: 'Avg Response', value: '0.3s', icon: Clock },
    { label: 'Total Profit', value: '$12.5K', icon: DollarSign },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white pb-24 md:pb-20"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background: `${accentColor}20`,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                <Crosshair className="w-6 h-6" style={{ color: accentColor }} />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black uppercase tracking-tight">
                  Sniper Bot
                </h1>
                <p className="text-xs md:text-sm text-white/50">
                  Hunt new tokens instantly
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Bot */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsActive(!isActive)}
            className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
            style={{
              background: isActive ? accentColor : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isActive ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: isActive ? `0 0 20px ${accentColor}40` : 'none',
            }}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="hidden sm:inline">Active</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">Inactive</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Status Banner */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border"
            style={{
              background: `${accentColor}10`,
              borderColor: `${accentColor}30`,
            }}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5" style={{ color: accentColor }} />
              <div>
                <div className="text-sm font-bold" style={{ color: accentColor }}>
                  Bot Active - Monitoring 24 Targets
                </div>
                <p className="text-xs text-white/60">
                  Will auto-execute when conditions are met
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <stat.icon className="w-5 h-5 text-white/40 mb-2" />
              <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-white/60 uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Target Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-4 rounded-xl font-bold flex items-center justify-center gap-2"
          style={{
            background: accentColor,
            boxShadow: `0 0 20px ${accentColor}40`,
          }}
        >
          <Plus className="w-5 h-5" />
          Add New Target
        </motion.button>

        {/* Targets List */}
        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-white mb-4">
            Active Targets
          </h3>
          <div className="space-y-3">
            {targets.map((target, index) => (
              <motion.div
                key={target.address}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-white truncate">
                        {target.tokenName}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          background:
                            target.status === 'ready'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : target.status === 'executed'
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(251, 146, 60, 0.2)',
                          color:
                            target.status === 'ready'
                              ? '#22c55e'
                              : target.status === 'executed'
                                ? '#3b82f6'
                                : '#fb923c',
                        }}
                      >
                        {target.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 font-mono truncate">
                      {target.address}
                    </p>
                  </div>
                  <Target
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: accentColor }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Liquidity</p>
                    <p className="text-sm font-bold text-white">{target.liquidity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Gas Price</p>
                    <p className="text-sm font-bold text-white">{target.gasPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Trigger Price</p>
                    <p className="text-sm font-bold text-white">{target.triggerPrice}</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Settings className="w-4 h-4 text-white/70" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div
          className="p-4 rounded-xl border"
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-blue-400 mb-1">
                How Sniper Bot Works
              </div>
              <p className="text-xs text-white/60">
                Monitor new token launches and execute instant buys when your conditions are
                met. Configure gas settings, liquidity thresholds, and trigger prices for
                each target.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
