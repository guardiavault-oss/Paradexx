import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  Eye,
  EyeOff,
  Send,
  Repeat,
  X as HideIcon,
  RefreshCw,
  Package,
} from 'lucide-react';
import type { TokenBalance } from '../../utils/tokenPriceService';
import {
  formatPrice,
  formatPriceChange,
  getPriceChangeColor,
  getPriceChangeEmoji,
  calculatePortfolioSummary,
  sortTokensByValue,
  filterDustTokens,
  getTokenLogoUrl,
  categorizeToken,
} from '../../utils/tokenPriceService';
import { StaleDataIndicator } from '../StaleDataIndicator';

interface TokenListProps {
  tokens: TokenBalance[];
  onTokenSelect?: (token: TokenBalance) => void;
  showValues?: boolean;
  lastUpdated?: number;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onSend?: (token: TokenBalance) => void;
  onSwap?: (token: TokenBalance) => void;
  onHide?: (token: TokenBalance) => void;
}

export function TokenList({
  tokens,
  onTokenSelect,
  showValues = true,
  lastUpdated = Date.now(),
  isLoading = false,
  onRefresh,
  onSend,
  onSwap,
  onHide,
}: TokenListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showZeroBalance, setShowZeroBalance] = useState(false);
  const [showDust, setShowDust] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'name'>('value');
  const [filterCategory, setFilterCategory] = useState<
    'all' | 'native' | 'stablecoin' | 'defi' | 'meme'
  >('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pullY = useMotionValue(0);
  const pullOpacity = useTransform(pullY, [0, 80], [0, 1]);
  const pullRotate = useTransform(pullY, [0, 80], [0, 360]);

  // Calculate portfolio summary
  const portfolioSummary = useMemo(
    () => calculatePortfolioSummary(tokens),
    [tokens]
  );

  // Filter and sort tokens
  const processedTokens = useMemo(() => {
    let filtered = tokens;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (token) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Zero balance filter
    if (!showZeroBalance) {
      filtered = filtered.filter((token) => parseFloat(token.balance) > 0);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(
        (token) => categorizeToken(token.symbol) === filterCategory
      );
    }

    // Separate dust tokens
    const { valuable, dust } = filterDustTokens(filtered, 1);

    // Sort valuable tokens
    let sorted = sortTokensByValue(valuable);

    if (sortBy === 'change') {
      sorted = [...sorted].sort(
        (a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0)
      );
    } else if (sortBy === 'name') {
      sorted = [...sorted].sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    // Add dust at the end if showing
    if (showDust) {
      sorted = [...sorted, ...dust];
    }

    return { valuable: sorted, dust, total: filtered.length };
  }, [tokens, searchQuery, showZeroBalance, showDust, sortBy, filterCategory]);

  // Pull to refresh handler
  const handlePullStart = useCallback(
    (event: any, info: PanInfo) => {
      if (
        scrollRef.current &&
        scrollRef.current.scrollTop <= 0 &&
        info.delta.y > 0
      ) {
        pullY.set(Math.min(info.offset.y, 100));
      }
    },
    [pullY]
  );

  const handlePullEnd = useCallback(
    async (event: any, info: PanInfo) => {
      if (pullY.get() >= 80 && onRefresh && !isRefreshing) {
        setIsRefreshing(true);
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      pullY.set(0);
    },
    [pullY, onRefresh, isRefreshing]
  );

  // Loading state
  if (isLoading && tokens.length === 0) {
    return (
      <div className="flex-1 p-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <TokenListItemSkeleton key={i} delay={i * 0.1} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Pull to Refresh Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center py-4"
        style={{
          opacity: pullOpacity,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 backdrop-blur-xl border border-[var(--accent-primary)]/30 flex items-center justify-center"
          style={{ rotate: pullRotate }}
        >
          <RefreshCw className="w-4 h-4 text-[var(--accent-primary)]" />
        </motion.div>
      </motion.div>

      {/* Portfolio Summary */}
      <motion.div
        className="p-6 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-surface)] border-b border-[var(--bg-elevated)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-2">
              <span>Total Portfolio Value</span>
              {isLoading && (
                <div className="w-3 h-3 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-9 w-40 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
                <div className="h-4 w-32 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
              </div>
            ) : hideValues ? (
              <div className="text-3xl text-[var(--text-secondary)] font-bold">****</div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="text-3xl text-[var(--text-secondary)] font-bold tracking-tight">
                  {formatPrice(portfolioSummary.totalValue)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <motion.span
                    className="text-sm font-medium"
                    style={{
                      color: getPriceChangeColor(
                        portfolioSummary.totalChangePercent24h
                      ),
                    }}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {formatPriceChange(portfolioSummary.totalChangePercent24h)}
                  </motion.span>
                  <span className="text-xs text-[var(--text-disabled)]">
                    ({portfolioSummary.totalChange24h >= 0 ? '+' : ''}
                    {formatPrice(Math.abs(portfolioSummary.totalChange24h))})
                  </span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    {getPriceChangeEmoji(portfolioSummary.totalChangePercent24h)}
                  </motion.span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setHideValues(!hideValues)}
              className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors relative group"
              title={hideValues ? 'Show values' : 'Hide values'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {hideValues ? (
                <EyeOff className="w-4 h-4 text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] transition-colors" />
              ) : (
                <Eye className="w-4 h-4 text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] transition-colors" />
              )}
            </motion.button>

            <StaleDataIndicator
              lastUpdate={lastUpdated}
              variant="badge"
              onRefresh={onRefresh}
            />
          </div>
        </div>

        {/* Top Gainer/Loser */}
        {!hideValues &&
          !isLoading &&
          (portfolioSummary.topGainer || portfolioSummary.topLoser) && (
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {portfolioSummary.topGainer && (
                <motion.div
                  className="p-3 bg-[var(--success-bright)]/10 border border-[var(--success-bright)]/30 rounded-xl relative overflow-hidden group cursor-pointer"
                  whileHover={{
                    scale: 1.02,
                    borderColor: 'rgba(0, 200, 83, 0.5)',
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--success-bright)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-[var(--success-bright)]" />
                      <span className="text-xs text-[var(--success-bright)] font-medium">
                        Top Gainer
                      </span>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] font-medium">
                      {portfolioSummary.topGainer.symbol}
                    </div>
                    <div className="text-xs text-[var(--success-bright)] font-medium">
                      {formatPriceChange(
                        portfolioSummary.topGainer.priceChange24h || 0
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {portfolioSummary.topLoser && (
                <motion.div
                  className="p-3 bg-[var(--error-bright)]/10 border border-[var(--error-bright)]/30 rounded-xl relative overflow-hidden group cursor-pointer"
                  whileHover={{ scale: 1.02, borderColor: 'rgba(255, 77, 77, 0.5)' }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--error-bright)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-3 h-3 text-[var(--error-bright)]" />
                      <span className="text-xs text-[var(--error-bright)] font-medium">
                        Top Loser
                      </span>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] font-medium">
                      {portfolioSummary.topLoser.symbol}
                    </div>
                    <div className="text-xs text-[var(--error-bright)] font-medium">
                      {formatPriceChange(portfolioSummary.topLoser.priceChange24h || 0)}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
      </motion.div>

      {/* Filters */}
      <motion.div
        className="p-4 border-b border-[var(--bg-elevated)] space-y-3 bg-[var(--bg-surface)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--bg-elevated)] rounded-xl text-sm text-[var(--text-secondary)] placeholder-[var(--text-disabled)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all"
          />
          {searchQuery && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors"
            >
              <span className="text-[var(--text-disabled)] text-xs">×</span>
            </motion.button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--bg-elevated)] rounded-lg text-xs text-[var(--text-secondary)] outline-none cursor-pointer hover:border-[var(--accent-primary)]/50 transition-colors focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
          >
            <option value="all">All Categories</option>
            <option value="native">Native</option>
            <option value="stablecoin">Stablecoins</option>
            <option value="defi">DeFi</option>
            <option value="meme">Meme</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--bg-elevated)] rounded-lg text-xs text-[var(--text-secondary)] outline-none cursor-pointer hover:border-[var(--accent-primary)]/50 transition-colors focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
          >
            <option value="value">Sort by Value</option>
            <option value="change">Sort by Change</option>
            <option value="name">Sort by Name</option>
          </select>

          {/* Toggles */}
          <motion.button
            onClick={() => setShowZeroBalance(!showZeroBalance)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
              showZeroBalance
                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                : 'bg-[var(--bg-surface)] text-[var(--text-disabled)] border border-[var(--bg-elevated)] hover:border-[var(--accent-primary)]/30'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            Zero Balance
          </motion.button>

          {processedTokens.dust.length > 0 && (
            <motion.button
              onClick={() => setShowDust(!showDust)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
                showDust
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                  : 'bg-[var(--bg-surface)] text-[var(--text-disabled)] border border-[var(--bg-elevated)] hover:border-[var(--accent-primary)]/30'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              Dust ({processedTokens.dust.length})
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Token List */}
      <motion.div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--bg-elevated)] scrollbar-track-transparent"
        onPan={handlePullStart}
        onPanEnd={handlePullEnd}
      >
        {processedTokens.valuable.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center h-full p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-6xl mb-4">🪙</div>
            <p className="text-sm text-[var(--text-muted)] mb-2 font-medium">
              {searchQuery ? 'No tokens found' : 'No tokens yet'}
            </p>
            <p className="text-xs text-[var(--text-disabled)]">
              {searchQuery
                ? 'Try adjusting your filters'
                : 'Receive tokens to get started'}
            </p>
          </motion.div>
        ) : (
          <div className="p-4 space-y-2">
            {processedTokens.valuable.map((token, index) => (
              <motion.div
                key={token.address}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <TokenListItem
                  token={token}
                  hideValues={hideValues}
                  onClick={() => onTokenSelect?.(token)}
                  onSend={onSend}
                  onSwap={onSwap}
                  onHide={onHide}
                />
              </motion.div>
            ))}

            {/* Dust Section */}
            {showDust && processedTokens.dust.length > 0 && (
              <motion.div
                className="pt-4 mt-4 border-t border-[var(--bg-elevated)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-xs text-[var(--text-disabled)] mb-3 px-2 flex items-center gap-2">
                  <span>Dust Tokens</span>
                  <span className="text-[var(--bg-elevated)]">•</span>
                  <span className="text-[var(--bg-elevated)]">
                    Value {'<'} $1
                  </span>
                </div>
                <div className="space-y-2">
                  {processedTokens.dust.map((token, index) => (
                    <motion.div
                      key={token.address}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <TokenListItem
                        token={token}
                        hideValues={hideValues}
                        isDust
                        onClick={() => onTokenSelect?.(token)}
                        onSend={onSend}
                        onSwap={onSwap}
                        onHide={onHide}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Skeleton Loading Component
function TokenListItemSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="w-full p-4 bg-[var(--bg-surface)] border border-[var(--bg-elevated)] rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-20 bg-[var(--bg-elevated)] rounded animate-pulse" />
          <div className="h-3 w-32 bg-[var(--bg-elevated)] rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-[var(--bg-elevated)] rounded animate-pulse ml-auto" />
          <div className="h-3 w-12 bg-[var(--bg-elevated)] rounded animate-pulse ml-auto" />
        </div>
      </div>
    </motion.div>
  );
}

// Individual Token List Item
interface TokenListItemProps {
  token: TokenBalance;
  hideValues?: boolean;
  isDust?: boolean;
  onClick?: () => void;
  onSend?: (token: TokenBalance) => void;
  onSwap?: (token: TokenBalance) => void;
  onHide?: (token: TokenBalance) => void;
}

function TokenListItem({
  token,
  hideValues,
  isDust,
  onClick,
  onSend,
  onSwap,
  onHide,
}: TokenListItemProps) {
  const [showActions, setShowActions] = useState(false);
  const balance = parseFloat(token.balance) / Math.pow(10, token.decimals);
  const x = useMotionValue(0);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -50) {
      setShowActions(true);
    } else {
      setShowActions(false);
    }
    x.set(0);
  };

  return (
    <div className="relative">
      {/* Quick Actions */}
      {showActions && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4 z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {onSend && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onSend(token);
                setShowActions(false);
              }}
              className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 flex items-center justify-center backdrop-blur-xl hover:bg-[var(--accent-primary)]/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Send className="w-5 h-5 text-[var(--accent-primary)]" />
            </motion.button>
          )}
          {onSwap && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onSwap(token);
                setShowActions(false);
              }}
              className="w-12 h-12 rounded-xl bg-[var(--color-purple)]/20 border border-[var(--color-purple)]/30 flex items-center justify-center backdrop-blur-xl hover:bg-[var(--color-purple)]/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Repeat className="w-5 h-5 text-[var(--color-purple)]" />
            </motion.button>
          )}
          {onHide && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onHide(token);
                setShowActions(false);
              }}
              className="w-12 h-12 rounded-xl bg-[var(--error-bright)]/20 border border-[var(--error-bright)]/30 flex items-center justify-center backdrop-blur-xl hover:bg-[var(--error-bright)]/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <HideIcon className="w-5 h-5 text-[var(--error-bright)]" />
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Token Card */}
      <motion.button
        onClick={onClick}
        className={`w-full p-4 bg-[var(--bg-surface)] border border-[var(--bg-elevated)] rounded-xl text-left group relative overflow-hidden ${
          isDust ? 'opacity-60' : ''
        }`}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        whileHover={{
          borderColor: 'rgba(0, 173, 239, 0.5)',
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-start gap-3 relative z-10">
          {/* Token Icon */}
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--color-purple)] flex items-center justify-center flex-shrink-0 text-xl relative overflow-hidden"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <span className="relative z-10">{getTokenLogoUrl(token.symbol)}</span>
          </motion.div>

          {/* Token Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-[var(--text-secondary)] font-medium">
                {token.symbol}
              </span>
            </div>

            <div className="text-xs text-[var(--text-disabled)] mb-2 truncate">
              {token.name}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
                {token.symbol}
              </span>

              {token.price && !hideValues && (
                <>
                  <span className="text-[var(--bg-elevated)]">•</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatPrice(token.price)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Value & Change */}
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
            {hideValues ? (
              <div className="text-sm text-[var(--text-secondary)] font-medium">****</div>
            ) : (
              <>
                <div className="text-sm text-[var(--text-secondary)] font-medium">
                  {token.value ? formatPrice(token.value) : '-'}
                </div>

                {token.priceChange24h !== undefined && (
                  <motion.div
                    className="text-xs font-medium flex items-center justify-end gap-1"
                    style={{ color: getPriceChangeColor(token.priceChange24h) }}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span>{formatPriceChange(token.priceChange24h)}</span>
                    <span>{getPriceChangeEmoji(token.priceChange24h)}</span>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.button>
    </div>
  );
}
