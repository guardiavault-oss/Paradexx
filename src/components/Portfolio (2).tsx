import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, TrendingUp, TrendingDown, Star, 
  Search, Filter, ChevronDown, ArrowUpRight, Package,
  Wallet, RefreshCw
} from 'lucide-react';

interface TokenHolding {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  value: number;
  price: number;
  change24h: number;
  allocation: number;
  favorite?: boolean;
}

interface PortfolioProps {
  type?: 'degen' | 'regen';
}

const Portfolio: React.FC<PortfolioProps> = ({ type = 'degen' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'name'>('value');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Accent color based on mode
  const accentColor = type === 'degen' ? '#ff3366' : '#00d4ff';
  const accentSecondary = type === 'degen' ? '#ff9500' : '#00ff88';
  const accentGlow = type === 'degen' 
    ? '0 0 40px rgba(255, 51, 102, 0.4)' 
    : '0 0 40px rgba(0, 212, 255, 0.4)';

  const holdings: TokenHolding[] = [
    {
      id: '1',
      symbol: 'ETH',
      name: 'Ethereum',
      icon: '🔷',
      balance: '2.5',
      value: 4125.00,
      price: 1650.00,
      change24h: 5.2,
      allocation: 33.4,
      favorite: true
    },
    {
      id: '2',
      symbol: 'BTC',
      name: 'Bitcoin',
      icon: '₿',
      balance: '0.05',
      value: 2150.00,
      price: 43000.00,
      change24h: -2.1,
      allocation: 17.4
    },
    {
      id: '3',
      symbol: 'USDC',
      name: 'USD Coin',
      icon: '💵',
      balance: '3,000',
      value: 3000.00,
      price: 1.00,
      change24h: 0,
      allocation: 24.3
    },
    {
      id: '4',
      symbol: 'SOL',
      name: 'Solana',
      icon: '☀️',
      balance: '45',
      value: 1350.00,
      price: 30.00,
      change24h: 8.7,
      allocation: 10.9,
      favorite: true
    },
    {
      id: '5',
      symbol: 'MATIC',
      name: 'Polygon',
      icon: '🔮',
      balance: '1,250',
      value: 875.00,
      price: 0.70,
      change24h: 3.4,
      allocation: 7.1
    },
    {
      id: '6',
      symbol: 'LINK',
      name: 'Chainlink',
      icon: '🔗',
      balance: '42',
      value: 630.00,
      price: 15.00,
      change24h: -1.2,
      allocation: 5.1
    },
  ];

  const filteredHoldings = holdings
    .filter(token => !filterFavorites || token.favorite)
    .filter(token => 
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'value') return b.value - a.value;
      if (sortBy === 'change') return b.change24h - a.change24h;
      return a.name.localeCompare(b.name);
    });

  const totalValue = holdings.reduce((acc, token) => acc + token.value, 0);
  const totalChange = 3.2;

  const chartColors = [
    accentColor,
    accentSecondary,
    type === 'degen' ? '#ff6b6b' : '#00aaff',
    'rgba(255, 255, 255, 0.3)',
    'rgba(255, 255, 255, 0.2)',
    'rgba(255, 255, 255, 0.1)',
  ];

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8" data-mode={type}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-2xl"
                style={{
                  background: `rgba(255, 255, 255, 0.05)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${accentColor}40`,
                  boxShadow: `0 0 20px ${accentColor}20`,
                }}
              >
                <Wallet className="w-6 h-6" style={{ color: accentColor }} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Portfolio
                </h1>
                <p className="text-sm text-white/50 mt-1">
                  Track your crypto holdings
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="p-3 rounded-xl"
              style={{
                background: `rgba(0, 0, 0, 0.4)`,
                border: `1px solid rgba(255, 255, 255, 0.1)`,
              }}
            >
              <RefreshCw className="w-5 h-5 text-white/70" />
            </motion.button>
          </div>

          {/* Total Value Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl relative overflow-hidden"
            style={{
              background: `rgba(255, 255, 255, 0.08)`,
              backdropFilter: 'blur(30px)',
              border: `1px solid rgba(255, 255, 255, 0.15)`,
            }}
          >
            {/* Gradient overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                background: type === 'degen'
                  ? 'linear-gradient(135deg, rgba(255, 51, 102, 0.2), rgba(255, 107, 107, 0.05))'
                  : 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 255, 136, 0.05))'
              }}
            />
            
            <div className="relative">
              <p className="text-sm text-white/50 mb-2 uppercase tracking-wider">Total Value</p>
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-3">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  <div className="flex items-center gap-2">
                    {totalChange >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <span 
                      className={`text-lg font-bold ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {totalChange >= 0 ? '+' : ''}{totalChange}%
                    </span>
                    <span className="text-sm text-white/40">24h</span>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Assets</p>
                    <p className="text-xl font-bold text-white">{holdings.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Favorites</p>
                    <p className="text-xl font-bold text-white">
                      {holdings.filter(h => h.favorite).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Holdings List */}
          <div className="xl:col-span-2 space-y-4">
            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tokens..."
                    className="
                      w-full pl-12 pr-4 py-3.5
                      bg-black/40
                      border border-white/10
                      rounded-xl
                      text-white
                      placeholder:text-white/30
                      focus:outline-none
                      focus:border-white/20
                      transition-all duration-200
                      backdrop-blur-md
                    "
                    style={{
                      boxShadow: searchQuery ? `0 0 20px ${accentColor}20` : 'none'
                    }}
                  />
                </div>
                
                {/* Filter Buttons */}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFilterFavorites(!filterFavorites)}
                    className="px-4 py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center gap-2"
                    style={{
                      background: filterFavorites 
                        ? accentColor
                        : 'rgba(0, 0, 0, 0.4)',
                      border: `1px solid ${filterFavorites ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                      color: filterFavorites ? 'white' : 'rgba(255, 255, 255, 0.7)',
                      boxShadow: filterFavorites ? accentGlow : 'none'
                    }}
                  >
                    <Star className={`w-4 h-4 ${filterFavorites ? 'fill-white' : ''}`} />
                    <span className="hidden sm:inline">Favorites</span>
                  </motion.button>
                  
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="px-4 py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center gap-2"
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline capitalize">{sortBy}</span>
                      <ChevronDown className="w-4 h-4" />
                    </motion.button>
                    
                    {/* Sort Menu */}
                    {showSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 mt-2 w-40 rounded-xl overflow-hidden z-10"
                        style={{
                          background: 'rgba(0, 0, 0, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {['value', 'change', 'name'].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSortBy(option as typeof sortBy);
                              setShowSortMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm capitalize transition-colors"
                            style={{
                              background: sortBy === option ? accentColor + '20' : 'transparent',
                              color: sortBy === option ? accentColor : 'white'
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Token List */}
            {filteredHoldings.length > 0 ? (
              <motion.div className="space-y-3">
                {filteredHoldings.map((token, index) => (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-4 rounded-xl cursor-pointer group relative overflow-hidden"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = accentColor + '40';
                      e.currentTarget.style.boxShadow = `0 0 30px ${accentColor}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Gradient overlay on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                      style={{
                        background: type === 'degen'
                          ? 'linear-gradient(90deg, #ff3366, #ff9500)'
                          : 'linear-gradient(90deg, #00d4ff, #00ff88)'
                      }}
                    />
                    
                    <div className="flex items-center gap-4 relative">
                      {/* Token Icon */}
                      <div className="relative">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <span className="text-2xl">{token.icon}</span>
                        </div>
                        {token.favorite && (
                          <div 
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                              background: accentColor,
                              boxShadow: accentGlow
                            }}
                          >
                            <Star className="w-3 h-3 text-white fill-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Token Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-black text-white">{token.symbol}</span>
                          <span className="text-sm text-white/40">{token.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-white/60">
                            {token.balance} {token.symbol}
                          </span>
                          <span className="text-white/30">
                            @ ${token.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Value & Change */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-white mb-1">
                          ${token.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        {token.change24h !== 0 && (
                          <div className="flex items-center justify-end gap-1">
                            {token.change24h >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                            <span className={`text-sm font-bold ${
                              token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <ArrowUpRight 
                        className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors"
                        style={{
                          color: accentColor + '00',
                          transition: 'color 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.2)'}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div 
                  className="w-20 h-20 mb-6 rounded-3xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Package className="w-10 h-10 text-white/30" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  No Tokens Found
                </h3>
                <p className="text-sm text-white/50 max-w-sm">
                  {searchQuery 
                    ? `No tokens matching "${searchQuery}"` 
                    : filterFavorites 
                      ? 'No favorite tokens yet'
                      : 'Add tokens to build your portfolio'
                  }
                </p>
              </motion.div>
            )}
          </div>

          {/* Allocation Chart Sidebar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6 h-fit sticky top-6"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">Allocation</h3>
              <div 
                className="p-2.5 rounded-xl"
                style={{
                  background: accentColor + '20',
                  border: `1px solid ${accentColor}40`
                }}
              >
                <PieChart className="w-5 h-5" style={{ color: accentColor }} />
              </div>
            </div>
            
            {/* Chart Visualization */}
            <div className="aspect-square mb-6 flex items-center justify-center relative">
              {/* Animated ring chart placeholder */}
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute w-44 h-44 rounded-full"
                  style={{
                    background: `conic-gradient(
                      ${accentColor} 0% ${holdings[0].allocation}%,
                      ${accentSecondary} ${holdings[0].allocation}% ${holdings[0].allocation + holdings[1].allocation}%,
                      ${chartColors[2]} ${holdings[0].allocation + holdings[1].allocation}% ${holdings[0].allocation + holdings[1].allocation + holdings[2].allocation}%,
                      ${chartColors[3]} ${holdings[0].allocation + holdings[1].allocation + holdings[2].allocation}% 100%
                    )`,
                    boxShadow: `0 0 40px ${accentColor}30`
                  }}
                />
                <div 
                  className="absolute w-28 h-28 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(0, 0, 0, 0.95)',
                    border: '2px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="text-center">
                    <p className="text-xs text-white/40 mb-1">Total</p>
                    <p className="text-sm font-black text-white">100%</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-3">
              {holdings.slice(0, 6).map((token, index) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: chartColors[index] }}
                    />
                    <span className="text-sm font-semibold text-white group-hover:text-white/80 transition-colors">
                      {token.symbol}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white/70">
                      {token.allocation.toFixed(1)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Total at bottom */}
            <div 
              className="mt-6 pt-6 flex items-center justify-between"
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <span className="text-sm font-bold text-white/60">Portfolio</span>
              <span className="text-sm font-black" style={{ color: accentColor }}>
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default Portfolio;