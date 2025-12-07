import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Radar, Eye, TrendingUp, Send, Download, Repeat } from 'lucide-react';

interface WhaleTrackerProps {
  type: 'degen' | 'regen';
  onClose: () => void;
}

export function WhaleTracker({ type, onClose }: WhaleTrackerProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const whales = [
    {
      address: '0x742d...3f4a',
      label: 'Vitalik.eth',
      balance: '$125M',
      recentTx: 'Bought 500 ETH',
      time: '5m ago',
      type: 'buy',
    },
    {
      address: '0x8b2a...9c1e',
      label: 'Unknown Whale',
      balance: '$85M',
      recentTx: 'Sold 1M USDC',
      time: '12m ago',
      type: 'sell',
    },
  ];

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
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Monitored', value: '12' },
            { label: 'Alerts', value: '47' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5">
              <div className="text-2xl font-black">{stat.value}</div>
              <div className="text-xs text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {whales.map((whale, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-base font-bold">{whale.label}</div>
                  <div className="text-sm text-white/60 font-mono">{whale.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold">{whale.balance}</div>
                  <div className="text-xs text-white/40">Balance</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                {whale.type === 'buy' ? (
                  <Download className="w-4 h-4 text-green-400" />
                ) : (
                  <Send className="w-4 h-4 text-red-400" />
                )}
                <div className="flex-1 text-sm">{whale.recentTx}</div>
                <div className="text-xs text-white/40">{whale.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
