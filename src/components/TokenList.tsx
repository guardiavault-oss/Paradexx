import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeStyles } from '../design-system';
import {
  Search, TrendingUp, TrendingDown, Star, CheckCircle,
  AlertCircle, Package, Eye, EyeOff, Filter, ChevronDown,
  RefreshCw, Send, ArrowRightLeft, EyeOff as HideIcon, Loader2
} from 'lucide-react';
import { useTokens, type TokenBalance } from '../hooks/useTokens';

interface TokenListProps {
  type?: 'degen' | 'regen';
  walletAddress?: string;
  chainId?: number;
  onTokenSelect?: (token: TokenBalance) => void;
}

const TokenList: React.FC<TokenListProps> = ({
  type = 'degen',
  walletAddress,
  chainId = 1,
  onTokenSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'name'>('value');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Fetch real token data from API
  const { tokens, isLoading, isRefreshing, refetch } = useTokens(
    walletAddress || localStorage.getItem('walletAddress') || undefined,
    chainId
  );

  // Accent colors based on mode
  const accentColor = type === 'degen' ? '#ff3366' : '#00d4ff';
  const accentSecondary = type === 'degen' ? '#ff9500' : '#00ff88';
  const accentGlow = type === 'degen'
    ? '0 0 40px rgba(255, 51, 102, 0.4)'
    : '0 0 40px rgba(0, 212, 255, 0.4)';

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  // Calculate portfolio summary
  const portfolioSummary = useMemo(() => {
    const totalValue = tokens.reduce((acc, token) => acc + (token.value || 0), 0);
    const totalChange = tokens.reduce((acc, token) => {
      const tokenValue = token.value || 0;
      const change = (token.priceChange24h || 0) * tokenValue / 100;
      return acc + change;
    }, 0);
    const totalChangePercent = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0;

    const validTokens = tokens.filter(t => t.priceChange24h !== undefined && !t.isScam);
    const topGainer = validTokens.reduce((max, token) =>
      !max || (token.priceChange24h || 0) > (max.priceChange24h || 0) ? token : max
      , validTokens[0]);
    const topLoser = validTokens.reduce((min, token) =>
      !min || (token.priceChange24h || 0) < (min.priceChange24h || 0) ? token : min
      , validTokens[0]);

    return {
      totalValue,
      totalChange,
      totalChangePercent,
      topGainer,
      topLoser,
      tokenCount: tokens.length
    };
  }, [tokens]);

  // Filter and sort tokens
  const processedTokens = useMemo(() => {
    let filtered = tokens.filter(t => !t.isScam); // Hide scam tokens by default

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(token =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Favorites filter
    if (filterFavorites) {
      filtered = filtered.filter(token => token.favorite);
    }

    // Sort
    if (sortBy === 'value') {
      filtered.sort((a, b) => (b.value || 0) - (a.value || 0));
    } else if (sortBy === 'change') {
      filtered.sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0));
    } else {
      filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    return filtered;
  }, [tokens, searchQuery, filterFavorites, sortBy]);

  // Handle refresh - use hook's refetch
  const handleRefresh = () => {
    if (isRefreshing) return;
    refetch();
  };

  return (
    <main className="min-h-screen bg-[var(--bg-base)] p-4 md:p-6 lg:p-8" data-mode={type}>
      <div className="max-w-5xl mx-auto">
        {/* Header with Portfolio Summary */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Title Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-2">
                Your Tokens
              </h1>
              <p className="text-sm text-[var(--text-primary)]/50">
                {processedTokens.length} {processedTokens.length === 1 ? 'asset' : 'assets'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Hide Values */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setHideValues(!hideValues)}
                className="p-3 rounded-xl transition-all"
                style={{
                  background: hideValues ? accentColor + '20' : 'rgba(0, 0, 0, 0.4)',
                  border: `1px solid ${hideValues ? accentColor + '40' : 'rgba(255, 255, 255, 0.1)'}`,
                }}
              >
                {hideValues ? (
                  <EyeOff className="w-5 h-5" style={{ color: accentColor }} />
                ) : (
                  <Eye className="w-5 h-5 text-[var(--text-primary)]/70" />
                )}
              </motion.button>

              {/* Refresh */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95, rotate: 180 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-3 rounded-xl transition-all"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <RefreshCw
                  className={`w-5 h-5 text-[var(--text-primary)]/70 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </motion.button>
            </div>
          </div>

          {/* Portfolio Value Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl relative overflow-hidden mb-6"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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
              <p className="text-xs text-[var(--text-primary)]/40 mb-2 uppercase tracking-wider">Total Balance</p>
              {hideValues ? (
                <div className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-3">••••••</div>
              ) : (
                <div className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-3">
                  ${portfolioSummary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {portfolioSummary.totalChangePercent >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <span
                    className={`text-lg font-bold ${portfolioSummary.totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                  >
                    {portfolioSummary.totalChangePercent >= 0 ? '+' : ''}
                    {portfolioSummary.totalChangePercent.toFixed(2)}%
                  </span>
                  <span className="text-sm text-[var(--text-primary)]/40">24h</span>
                </div>
                {!hideValues && (
                  <span className="text-sm text-[var(--text-primary)]/50">
                    ({portfolioSummary.totalChange >= 0 ? '+' : ''}
                    ${Math.abs(portfolioSummary.totalChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Top Gainer/Loser */}
          {portfolioSummary.topGainer && portfolioSummary.topLoser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-3"
            >
              {/* Top Gainer */}
              <div
                className="p-4 rounded-xl relative overflow-hidden group cursor-pointer"
                style={{
                  background: 'rgba(0, 200, 83, 0.1)',
                  border: '1px solid rgba(0, 200, 83, 0.3)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400 font-bold uppercase tracking-wider">Top Gainer</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{portfolioSummary.topGainer.icon}</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{portfolioSummary.topGainer.symbol}</span>
                </div>
                <div className="text-lg font-black text-green-400">
                  +{portfolioSummary.topGainer.priceChange24h?.toFixed(2)}%
                </div>
              </div>

              {/* Top Loser */}
              <div
                className="p-4 rounded-xl relative overflow-hidden group cursor-pointer"
                style={{
                  background: 'rgba(255, 77, 77, 0.1)',
                  border: '1px solid rgba(255, 77, 77, 0.3)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Top Loser</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{portfolioSummary.topLoser.icon}</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{portfolioSummary.topLoser.symbol}</span>
                </div>
                <div className="text-lg font-black text-red-400">
                  {portfolioSummary.topLoser.priceChange24h?.toFixed(2)}%
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 space-y-3"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tokens..."
              className="
                w-full pl-12 pr-4 py-3.5
                bg-[var(--bg-base)]/40
                border border-[var(--border-neutral)]/10
                rounded-xl
                text-[var(--text-primary)]
                placeholder:text-[var(--text-primary)]/30
                focus:outline-none
                focus:border-[var(--border-neutral)]/20
                transition-all duration-200
                backdrop-blur-md
              "
              style={{
                boxShadow: searchQuery ? `0 0 20px ${accentColor}20` : 'none'
              }}
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <span className="text-[var(--text-primary)]/60 text-sm">×</span>
              </motion.button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-2">
            {/* Favorites Filter */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterFavorites(!filterFavorites)}
              className="px-4 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2"
              style={{
                background: filterFavorites ? accentColor : 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${filterFavorites ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                color: filterFavorites ? 'white' : 'rgba(255, 255, 255, 0.7)',
                boxShadow: filterFavorites ? accentGlow : 'none'
              }}
            >
              <Star className={`w-4 h-4 ${filterFavorites ? 'fill-white' : ''}`} />
              <span className="hidden sm:inline">Favorites</span>
            </motion.button>

            {/* Sort Menu */}
            <div className="relative flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="w-full px-4 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-between gap-2"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="capitalize">{sortBy}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </motion.button>

              {/* Sort Dropdown */}
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-20"
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
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Token List */}
        <AnimatePresence mode="popLayout">
          {processedTokens.length > 0 ? (
            <motion.div className="space-y-3">
              {processedTokens.map((token, index) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                >
                  <TokenCard
                    token={token}
                    hideValues={hideValues}
                    accentColor={accentColor}
                    onClick={() => onTokenSelect?.(token)}
                  />
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
                <Package className="w-10 h-10 text-[var(--text-primary)]/30" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
                No Tokens Found
              </h3>
              <p className="text-sm text-[var(--text-primary)]/50 max-w-sm">
                {searchQuery
                  ? `No tokens matching "${searchQuery}"`
                  : filterFavorites
                    ? 'No favorite tokens yet'
                    : 'Your wallet is empty'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

// Token Card Component
interface TokenCardProps {
  token: TokenBalance;
  hideValues: boolean;
  accentColor: string;
  onClick?: () => void;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, hideValues, accentColor, onClick }) => {
  const [showActions, setShowActions] = useState(false);
  const balance = parseFloat(token.balance) / Math.pow(10, token.decimals);

  return (
    <div className="relative">
      {/* Quick Actions Overlay */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4 z-10"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-xl"
              style={{
                background: accentColor + '20',
                border: `1px solid ${accentColor}40`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Send', token.symbol);
              }}
            >
              <Send className="w-5 h-5" style={{ color: accentColor }} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-xl"
              style={{
                background: 'rgba(138, 43, 226, 0.2)',
                border: '1px solid rgba(138, 43, 226, 0.4)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Swap', token.symbol);
              }}
            >
              <ArrowRightLeft className="w-5 h-5 text-purple-400" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Card */}
      <motion.button
        onClick={onClick}
        onHoverStart={() => setShowActions(true)}
        onHoverEnd={() => setShowActions(false)}
        className="w-full p-4 rounded-xl text-left group relative overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease'
        }}
        whileHover={{
          scale: 1.01,
          x: 4,
          borderColor: accentColor + '40',
          boxShadow: `0 0 30px ${accentColor}20`
        }}
      >
        {/* Hover gradient */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, transparent)`
          }}
        />

        <div className="flex items-center gap-4 relative">
          {/* Token Icon */}
          <div className="relative">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {token.icon}
            </div>
            {token.favorite && (
              <div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: accentColor,
                  boxShadow: `0 0 20px ${accentColor}60`
                }}
              >
                <Star className="w-3 h-3 text-[var(--text-primary)] fill-white" />
              </div>
            )}
          </div>

          {/* Token Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-black text-[var(--text-primary)]">{token.symbol}</span>
              {token.verified && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              {token.isScam && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                  style={{
                    background: 'rgba(255, 77, 77, 0.2)',
                    color: '#ff4d4d'
                  }}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>SCAM</span>
                </div>
              )}
            </div>
            <div className="text-sm text-[var(--text-primary)]/40 mb-2 truncate">{token.name}</div>
            <div className="text-sm text-[var(--text-primary)]/60">
              {balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token.symbol}
            </div>
          </div>

          {/* Value & Change */}
          <div className="text-right">
            {hideValues ? (
              <div className="text-lg font-bold text-[var(--text-primary)]">••••</div>
            ) : (
              <>
                <div className="text-lg font-bold text-[var(--text-primary)] mb-1">
                  ${token.value?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                {token.price && (
                  <div className="text-xs text-[var(--text-primary)]/40 mb-2">
                    @ ${token.price.toLocaleString()}
                  </div>
                )}
                {token.priceChange24h !== undefined && (
                  <div className="flex items-center justify-end gap-1">
                    {token.priceChange24h >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span
                      className={`text-sm font-bold ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                    >
                      {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Scam Warning */}
        {token.isScam && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 rounded-lg"
            style={{
              background: 'rgba(255, 77, 77, 0.1)',
              border: '1px solid rgba(255, 77, 77, 0.3)'
            }}
          >
            <p className="text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>This token shows signs of being a scam. Do not interact with it.</span>
            </p>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

export default TokenList;
