import React, { useState } from 'react';
import { motion } from 'motion/react';
import { getThemeStyles } from '../../design-system';
import {
  ArrowLeft, Star, ExternalLink, Info, TrendingUp,
  TrendingDown, Send, Repeat, Plus, Activity, ChevronDown
} from 'lucide-react';

interface TokenInfo {
  symbol: string;
  name: string;
  icon: string;
  price: string;
  change24h: number;
  marketCap: string;
  volume24h: string;
  balance: string;
  value: string;
  description: string;
}

interface TokenDetailProps {
  onBack?: () => void;
  type?: 'degen' | 'regen';
}

export function TokenDetail({ onBack, type = 'degen' }: TokenDetailProps) {
  const [isFavorite, setIsFavorite] = useState(true);
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '1W' | '1M' | '1Y'>('1D');

  // Use design system theme styles
  const theme = getThemeStyles(type);
  const accentColor = theme.primaryColor;

  const token: TokenInfo = {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '⟠',
    price: '$1,650.00',
    change24h: 5.2,
    marketCap: '$198.5B',
    volume24h: '$12.3B',
    balance: '2.5',
    value: '$4,125.00',
    description: 'Ethereum is a decentralized platform that enables smart contracts and DApps.'
  };

  const timeframes = ['1H', '1D', '1W', '1M', '1Y'] as const;

  return (
    <main className="min-h-screen bg-[var(--bg-base)] p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-4 transition-all duration-[var(--duration-normal)] p-2 -ml-2 rounded-[var(--radius-lg)]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Back</span>
          </motion.button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[var(--bg-hover)] rounded-[var(--radius-2xl)] flex items-center justify-center border border-[var(--border-neutral)]">
                <span className="text-4xl">{token.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-black text-[var(--text-primary)] uppercase tracking-tight">
                    {token.symbol}
                  </h1>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-2 hover:bg-[var(--bg-hover)] rounded-[var(--radius-lg)] transition-all duration-[var(--duration-normal)]"
                  >
                    <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} style={{ color: isFavorite ? accentColor : 'var(--text-muted)' }} />
                  </motion.button>
                </div>
                <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] uppercase tracking-wider">{token.name}</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-[var(--radius-lg)] transition-all duration-[var(--duration-normal)]"
            >
              <ExternalLink className="w-5 h-5 text-[var(--text-tertiary)]" />
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--bg-hover)] backdrop-blur-[var(--blur-xl)] border border-[var(--border-neutral)] rounded-[var(--radius-2xl)] p-6"
            >
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mb-2 uppercase tracking-wider">Current Price</p>
                  <h2 className="text-[var(--text-3xl)] md:text-[var(--text-4xl)] font-black text-[var(--text-primary)] mb-2">
                    {token.price}
                  </h2>
                  <div className="flex items-center gap-2">
                    {token.change24h >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-[var(--regen-primary)]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[var(--degen-primary)]" />
                    )}
                    <span className={`text-sm font-black uppercase tracking-wider ${token.change24h >= 0 ? 'text-[var(--regen-primary)]' : 'text-[var(--degen-primary)]'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                    </span>
                    <span className="text-[var(--text-sm)] text-[var(--text-tertiary)]">24h</span>
                  </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex gap-1 p-1 bg-[var(--bg-hover)] rounded-[var(--radius-lg)] border border-[var(--border-neutral)]">
                  {timeframes.map((tf) => (
                    <motion.button
                      key={tf}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[var(--radius-lg)] transition-all duration-[var(--duration-normal)] ${timeframe === tf
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-tertiary)]'
                        }`}
                      style={timeframe === tf ? {
                        background: `linear-gradient(135deg, ${accentColor}40 0%, ${accentColor}20 100%)`,
                        borderColor: `${accentColor}60`,
                      } : {}}
                    >
                      {tf}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-64 bg-[var(--bg-surface)] rounded-[var(--radius-xl)] flex items-center justify-center border border-[var(--border-neutral)]">
                <Activity className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-[var(--bg-hover)] backdrop-blur-[var(--blur-xl)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] p-4">
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">Market Cap</p>
                <p className="text-[var(--text-sm)] font-black text-[var(--text-primary)]">{token.marketCap}</p>
              </div>
              <div className="bg-[var(--bg-hover)] backdrop-blur-[var(--blur-xl)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] p-4">
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">24h Volume</p>
                <p className="text-[var(--text-sm)] font-black text-[var(--text-primary)]">{token.volume24h}</p>
              </div>
              <div className="bg-[var(--bg-hover)] backdrop-blur-[var(--blur-xl)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] p-4">
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">24h High</p>
                <p className="text-[var(--text-sm)] font-black text-[var(--text-primary)]">$1,680.00</p>
              </div>
              <div className="bg-[var(--bg-hover)] backdrop-blur-[var(--blur-xl)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] p-4">
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">24h Low</p>
                <p className="text-[var(--text-sm)] font-black text-[var(--text-primary)]">$1,580.00</p>
              </div>
            </motion.div>

            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--bg-hover)] backdrop-blur-[var(--blur-xl)] border border-[var(--border-neutral)] rounded-[var(--radius-2xl)] p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5" style={{ color: accentColor }} />
                <h3 className="text-[var(--text-lg)] font-black text-[var(--text-primary)] uppercase tracking-tight">About {token.name}</h3>
              </div>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
                {token.description}
              </p>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Balance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--bg-hover)] backdrop-blur-[var(--blur-xl)] border border-[var(--border-neutral)] rounded-[var(--radius-2xl)] p-6"
            >
              <h3 className="text-[var(--text-sm)] text-[var(--text-tertiary)] mb-4 uppercase tracking-wider">Your Balance</h3>
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-[var(--text-2xl)] font-black text-[var(--text-primary)]">
                    {token.balance} {token.symbol}
                  </p>
                  <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                    ≈ {token.value}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 p-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-[var(--radius-xl)] transition-all duration-[var(--duration-normal)] border border-[var(--border-neutral)]"
                >
                  <Send className="w-5 h-5 text-[var(--text-primary)]" />
                  <span className="text-[var(--text-xs)] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Send</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 p-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-[var(--radius-xl)] transition-all duration-[var(--duration-normal)] border border-[var(--border-neutral)]"
                >
                  <Repeat className="w-5 h-5 text-[var(--text-primary)]" />
                  <span className="text-[var(--text-xs)] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Swap</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 p-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-[var(--radius-xl)] transition-all duration-[var(--duration-normal)] border border-[var(--border-neutral)]"
                >
                  <Plus className="w-5 h-5 text-[var(--text-primary)]" />
                  <span className="text-[var(--text-xs)] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Buy</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Quick Buy */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--bg-hover)] backdrop-blur-[var(--blur-xl)] border border-[var(--border-neutral)] rounded-[var(--radius-2xl)] p-6"
            >
              <h3 className="text-[var(--text-sm)] text-[var(--text-tertiary)] mb-4 uppercase tracking-wider">Quick Buy</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] text-[var(--text-primary)] placeholder:[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-all duration-[var(--duration-normal)]"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 text-[var(--text-primary)] font-black uppercase tracking-wider rounded-[var(--radius-xl)] shadow-lg transition-all duration-[var(--duration-normal)]"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${theme.secondaryColor} 100%)`,
                    boxShadow: `0 0 30px ${accentColor}40`,
                  }}
                >
                  Buy {token.symbol}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default TokenDetail;
