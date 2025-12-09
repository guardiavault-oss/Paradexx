import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Radar, Eye, TrendingUp, Send, Download, Repeat, Loader2 } from 'lucide-react';
import { useKnownWhales, useWhaleStats } from '../../hooks/useWhaleData';

interface WhaleTrackerProps {
  type: 'degen' | 'regen';
  onClose: () => void;
}

export function WhaleTracker({ type, onClose }: WhaleTrackerProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  
  const { whales, loading: whalesLoading } = useKnownWhales();
  const { stats, loading: statsLoading } = useWhaleStats();
  
  const loading = whalesLoading || statsLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white pb-24"
    >
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl" style={{ background: `${accentColor}20` }}>
            <Radar className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <div>
            <h1 className="text-lg font-black">WHALE TRACKER</h1>
            <p className="text-xs text-white/50">Follow smart money</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />
            <span className="ml-2 text-white/60">Loading whale data...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Monitored', value: stats.totalTracked?.toString() || '0' },
                { label: 'Alerts', value: stats.alertsToday?.toString() || '0' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5">
                  <div className="text-2xl font-black">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {whales.length > 0 ? (
                whales.slice(0, 10).map((whale, i) => (
                  <div key={whale.address || i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-base font-bold">{whale.label || 'Unknown Whale'}</div>
                        <div className="text-sm text-white/60 font-mono">
                          {whale.address ? `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold">{whale.balance || '$0'}</div>
                        <div className="text-xs text-white/40">Balance</div>
                      </div>
                    </div>
                    {whale.recentTx && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                        {whale.type === 'buy' ? (
                          <Download className="w-4 h-4 text-green-400" />
                        ) : (
                          <Send className="w-4 h-4 text-red-400" />
                        )}
                        <div className="flex-1 text-sm">{whale.recentTx}</div>
                        <div className="text-xs text-white/40">{whale.time || 'Just now'}</div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/40">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No whales being tracked</p>
                  <p className="text-xs mt-1">Add addresses to monitor</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
