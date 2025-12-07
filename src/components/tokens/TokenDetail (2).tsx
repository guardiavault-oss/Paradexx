import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  
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
    <main className="min-h-screen bg-black p-4 md:p-6 pb-24">
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
            className="flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors p-2 -ml-2 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Back</span>
          </motion.button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <span className="text-4xl">{token.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                    {token.symbol}
                  </h1>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} style={{ color: isFavorite ? accentColor : 'rgba(255,255,255,0.3)' }} />
                  </motion.button>
                </div>
                <p className="text-sm text-white/50 uppercase tracking-wider">{token.name}</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-white/50" />
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
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-sm text-white/50 mb-2 uppercase tracking-wider">Current Price</p>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                    {token.price}
                  </h2>
                  <div className="flex items-center gap-2">
                    {token.change24h >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`text-sm font-black uppercase tracking-wider ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                    </span>
                    <span className="text-sm text-white/50">24h</span>
                  </div>
                </div>
                
                {/* Timeframe Selector */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                  {timeframes.map((tf) => (
                    <motion.button
                      key={tf}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
                        timeframe === tf 
                          ? 'text-white' 
                          : 'text-white/40 hover:text-white/60'
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
              <div className="h-64 bg-black/40 rounded-xl flex items-center justify-center border border-white/10">
                <Activity className="w-8 h-8 text-white/20" />
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Market Cap</p>
                <p className="text-sm font-black text-white">{token.marketCap}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">24h Volume</p>
                <p className="text-sm font-black text-white">{token.volume24h}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">24h High</p>
                <p className="text-sm font-black text-white">$1,680.00</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">24h Low</p>
                <p className="text-sm font-black text-white">$1,580.00</p>
              </div>
            </motion.div>

            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5" style={{ color: accentColor }} />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">About {token.name}</h3>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
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
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-sm text-white/50 mb-4 uppercase tracking-wider">Your Balance</h3>
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-2xl font-black text-white">
                    {token.balance} {token.symbol}
                  </p>
                  <p className="text-sm text-white/50">
                    ≈ {token.value}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                >
                  <Send className="w-5 h-5 text-white" />
                  <span className="text-xs text-white/70 uppercase tracking-wider font-bold">Send</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                >
                  <Repeat className="w-5 h-5 text-white" />
                  <span className="text-xs text-white/70 uppercase tracking-wider font-bold">Swap</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                >
                  <Plus className="w-5 h-5 text-white" />
                  <span className="text-xs text-white/70 uppercase tracking-wider font-bold">Buy</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Quick Buy */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-sm text-white/50 mb-4 uppercase tracking-wider">Quick Buy</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${isDegen ? '#8B0000' : '#000080'} 100%)`,
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
