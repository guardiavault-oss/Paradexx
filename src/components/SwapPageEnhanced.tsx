import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useMemo } from 'react';
import { getThemeStyles } from '../design-system';
import { toast } from '@/components/Toast';
import { useTokenBalances } from '@/hooks/api/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  ArrowDownUp,
  Settings,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
  Repeat,
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  Zap,
  Info,
  Loader2,
  ArrowDown,
  RefreshCw,
  Search,
  Star,
  History,
  CheckCircle2,
  Flame,
  Droplets,
  BarChart3,
  Activity,
} from 'lucide-react';

interface SwapPageProps {
  type: 'degen' | 'regen';
  onClose: () => void;
  walletAddress?: string;
  chainId?: number;
}

interface Token {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  change24h: number;
  icon: string;
  favorite?: boolean;
  address?: string;
}

// Default tokens as fallback when API is unavailable
const DEFAULT_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', balance: 0, price: 2340.5, change24h: 0, icon: '⟠' },
  { symbol: 'USDC', name: 'USD Coin', balance: 0, price: 1.0, change24h: 0, icon: '💵' },
  { symbol: 'USDT', name: 'Tether', balance: 0, price: 1.0, change24h: 0, icon: '₮' },
  { symbol: 'DAI', name: 'Dai Stablecoin', balance: 0, price: 1.0, change24h: 0, icon: '◈' },
];

// Token icon mapping
const TOKEN_ICONS: Record<string, string> = {
  ETH: '⟠',
  WETH: '⟠',
  USDC: '💵',
  USDT: '₮',
  DAI: '◈',
  WBTC: '₿',
  UNI: '🦄',
  LINK: '⛓️',
  AAVE: '👻',
  ARB: '🔵',
  OP: '🔴',
  MATIC: '🟣',
  SOL: '◎',
  BNB: '💛',
};

export function SwapPageEnhanced({ type, onClose, walletAddress, chainId = 1 }: SwapPageProps) {
  const { session } = useAuth();

  // Map chainId to chain name for API
  const chainName = useMemo(() => {
    const chains: Record<number, 'eth' | 'polygon' | 'arbitrum' | 'optimism' | 'base'> = {
      1: 'eth',
      137: 'polygon',
      42161: 'arbitrum',
      10: 'optimism',
      8453: 'base',
    };
    return chains[chainId] || 'eth';
  }, [chainId]);

  // Fetch real token balances
  const { data: tokenData, isLoading: tokensLoading } = useTokenBalances(
    walletAddress || '',
    chainName,
    { enabled: !!walletAddress && !!session }
  );

  // Transform API tokens to component format
  const tokens: Token[] = useMemo(() => {
    if (!tokenData || tokenData.length === 0) return DEFAULT_TOKENS;

    return tokenData.map((t: any) => ({
      symbol: t.symbol,
      name: t.name || t.symbol,
      balance: parseFloat(t.balance) || 0,
      price: t.price || 0,
      change24h: t.priceChange24h || 0,
      icon: TOKEN_ICONS[t.symbol?.toUpperCase()] || '🪙',
      address: t.address,
    }));
  }, [tokenData]);

  const [fromToken, setFromToken] = useState<Token>(DEFAULT_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(DEFAULT_TOKENS[1]);

  // Update default tokens when real data loads
  useEffect(() => {
    if (tokens.length > 0 && tokens !== DEFAULT_TOKENS) {
      setFromToken(tokens[0]);
      setToToken(tokens[1] || tokens[0]);
    }
  }, [tokens]);

  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [priceRefreshing, setPriceRefreshing] = useState(false);
  const [recentSwaps, setRecentSwaps] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);

  // Use design system theme styles
  const theme = getThemeStyles(type);
  const accentColor = theme.primaryColor;
  const secondaryColor = theme.secondaryColor;

  // Get swap quote when amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0 || !walletAddress) {
        setQuote(null);
        setToAmount('');
        return;
      }

      try {
        const { apiServices } = await import('@/services');
        const response = await apiServices.trading.getSwapQuote({
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          amount: fromAmount,
          slippage: slippage,
          chainId: chainId,
        });

        if (response.success && response.data) {
          setQuote(response.data);
          const estimatedAmount = response.data.toAmount || response.data.estimatedAmount;
          setToAmount(estimatedAmount ? parseFloat(estimatedAmount).toFixed(6) : '');
        } else {
          // Fallback to simple calculation
          const rate = toToken.price / fromToken.price;
          const calculated = parseFloat(fromAmount) * rate;
          setToAmount(calculated.toFixed(6));
        }
      } catch (err) {
        console.error('Quote error:', err);
        // Fallback to simple calculation
        const rate = toToken.price / fromToken.price;
        const calculated = parseFloat(fromAmount) * rate;
        setToAmount(calculated.toFixed(6));
      }
    };

    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, slippage, chainId, walletAddress]);

  // Calculate exchange rate and amounts (fallback)
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const rate = toToken.price / fromToken.price;
      const calculated = parseFloat(fromAmount) * rate;
      setToAmount(calculated.toFixed(6));
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) === 0) {
      setSwapError('Please enter an amount');
      return;
    }

    if (!walletAddress) {
      setSwapError('Please connect your wallet');
      return;
    }

    if (!quote) {
      setSwapError('Please wait for quote to load');
      return;
    }

    setSwapping(true);
    setSwapError(null);

    try {
      const { apiServices } = await import('@/services');
      const response = await apiServices.trading.executeSwap({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: fromAmount,
        slippage: slippage,
        chainId: chainId,
        recipient: walletAddress,
      });

      if (response.success) {
        setSwapSuccess(true);
        toast.success(
          `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
          { type, duration: 3000 }
        );

        // Add to recent swaps
        setRecentSwaps(prev => [
          {
            from: fromToken.symbol,
            to: toToken.symbol,
            fromAmount,
            toAmount,
            timestamp: Date.now(),
          },
          ...prev.slice(0, 4),
        ]);

        setTimeout(() => {
          setSwapSuccess(false);
          setFromAmount('');
          setToAmount('');
          setQuote(null);
        }, 3000);
      } else {
        throw new Error(response.message || 'Swap failed');
      }
    } catch (err: any) {
      console.error('Swap error:', err);
      setSwapError(err.message || 'Swap failed. Please try again.');
    } finally {
      setSwapping(false);
    }
  };

  const handleFlipTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
  };

  const handleRefreshPrice = async () => {
    setPriceRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setPriceRefreshing(false);
  };

  const selectToken = (token: Token, isFrom: boolean) => {
    if (isFrom) {
      setFromToken(token);
      setShowFromTokens(false);
    } else {
      setToToken(token);
      setShowToTokens(false);
    }
    setSearchQuery('');
  };

  const filteredTokens = tokens.filter(
    token =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exchangeRate = toToken.price / fromToken.price;
  const priceImpact =
    parseFloat(fromAmount) > 0 ? ((parseFloat(fromAmount) * fromToken.price) / 1000000) * 100 : 0;
  const networkFee = 2.5;
  const totalCost = parseFloat(fromAmount || '0') * fromToken.price + networkFee;
  const minReceived = toAmount ? parseFloat(toAmount) * (1 - slippage / 100) : 0;

  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--bg-base)] pb-24">
      {/* Error Alert */}
      {swapError && (
        <div className="fixed top-4 left-1/2 z-50 mx-4 w-full max-w-md -translate-x-1/2 transform">
          <div className="rounded-xl border border-red-500/50 bg-red-900/90 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-100">{swapError}</p>
              <button
                onClick={() => setSwapError(null)}
                className="text-red-300 hover:text-red-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Address Warning */}
      {!walletAddress && (
        <div className="fixed top-4 left-1/2 z-50 mx-4 w-full max-w-md -translate-x-1/2 transform">
          <div className="rounded-xl border border-yellow-500/50 bg-yellow-900/90 p-4 backdrop-blur-xl">
            <p className="text-sm text-yellow-100">⚠️ Please connect your wallet to swap tokens</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="sticky top-16 z-[var(--z-sticky)] border-b border-[var(--border-neutral)] bg-[var(--bg-surface)]/90 backdrop-blur-[var(--blur-xl)]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
              >
                <ArrowLeft className="h-5 w-5" style={{ color: accentColor }} />
              </motion.button>
              <div>
                <div className="flex items-center gap-2">
                  <ArrowDownUp className="h-5 w-5" style={{ color: accentColor }} />
                  <h2 className="text-[var(--text-primary)] text-[var(--text-xl)]">Swap</h2>
                </div>
                <p className="mt-0.5 text-[var(--text-muted)] text-[var(--text-xs)]">
                  Trade tokens instantly
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRefreshPrice}
                className="rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
              >
                <RefreshCw
                  className={`h-5 w-5 text-[var(--text-tertiary)] ${priceRefreshing ? 'animate-spin' : ''}`}
                />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="rounded-xl p-2 transition-all"
                style={{
                  background: showSettings ? `${accentColor}20` : 'var(--bg-hover)',
                  borderColor: showSettings ? accentColor : 'var(--border-neutral)',
                  border: '1px solid',
                }}
              >
                <Settings
                  className="h-5 w-5"
                  style={{ color: showSettings ? accentColor : 'var(--text-tertiary)' }}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[var(--border-neutral)] bg-[var(--bg-surface)]/50"
          >
            <div className="space-y-4 px-4 py-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-[var(--text-secondary)] text-[var(--text-sm)]">
                    Slippage Tolerance
                  </label>
                  <span className="text-sm font-bold" style={{ color: accentColor }}>
                    {slippage}%
                  </span>
                </div>
                <div className="mb-2 grid grid-cols-4 gap-2">
                  {[0.1, 0.5, 1.0, 3.0].map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        setSlippage(val);
                        setCustomSlippage('');
                      }}
                      className="rounded-xl py-2.5 text-sm font-bold transition-all"
                      style={{
                        background: slippage === val ? `${accentColor}20` : 'var(--bg-hover)',
                        border: `1px solid ${slippage === val ? accentColor : 'var(--border-neutral)'}`,
                        color: slippage === val ? accentColor : 'var(--text-primary)',
                      }}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={customSlippage}
                  onChange={e => {
                    setCustomSlippage(e.target.value);
                    if (e.target.value) setSlippage(parseFloat(e.target.value));
                  }}
                  placeholder="Custom %"
                  className="placeholder:[var(--text-muted)] w-full rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] px-4 py-2.5 text-[var(--text-primary)] text-[var(--text-sm)] focus:border-[var(--border-strong)] focus:outline-none"
                />
              </div>

              <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--regen-primary)]/20 bg-[var(--regen-primary)]/10 p-4">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--regen-secondary)]" />
                <div>
                  <p className="mb-1 text-[var(--regen-secondary)] text-[var(--text-sm)]">
                    Slippage Info
                  </p>
                  <p className="text-[var(--text-tertiary)] text-[var(--text-xs)]">
                    Your transaction will revert if the price changes unfavorably by more than this
                    percentage.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 pb-24">
        {/* From Token Card */}
        <motion.div
          className="relative overflow-hidden rounded-2xl border p-5"
          style={{
            background: 'var(--bg-hover)',
            borderColor: 'var(--border-neutral)',
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <label className="font-medium text-[var(--text-sm)] text-[var(--text-tertiary)]">
              You Pay
            </label>
            <button
              onClick={() => setFromAmount(fromToken.balance.toString())}
              className="rounded-[var(--radius-lg)] bg-[var(--bg-hover)] px-2 py-1 text-[var(--text-xs)] transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
              style={{ color: accentColor }}
            >
              Max
            </button>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() => setShowFromTokens(true)}
              className="flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] px-3 py-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
            >
              <span className="text-2xl">{fromToken.icon}</span>
              <div className="text-left">
                <div className="font-bold text-[var(--text-primary)]">{fromToken.symbol}</div>
                <div className="text-[var(--text-muted)] text-[var(--text-xs)]">
                  {fromToken.name}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
            </button>

            <input
              type="number"
              value={fromAmount}
              onChange={e => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="placeholder:[var(--text-muted)] flex-1 bg-transparent text-right text-[var(--text-3xl)] text-[var(--text-primary)] outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">
              Balance: {fromToken.balance.toFixed(4)} {fromToken.symbol}
            </span>
            <span className="text-[var(--text-tertiary)]">
              {fromAmount
                ? `≈ $${(parseFloat(fromAmount) * fromToken.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '$0.00'}
            </span>
          </div>
        </motion.div>

        {/* Flip Button */}
        <div className="relative z-10 -my-2 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={handleFlipTokens}
            className="rounded-[var(--radius-2xl)] p-3 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
              boxShadow: `0 0 30px ${accentColor}40`,
            }}
          >
            <ArrowDown className="h-5 w-5 text-[var(--text-primary)]" />
          </motion.button>
        </div>

        {/* To Token Card */}
        <motion.div
          className="relative overflow-hidden rounded-2xl border p-5"
          style={{
            background: 'var(--bg-hover)',
            borderColor: 'var(--border-neutral)',
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <label className="font-medium text-[var(--text-sm)] text-[var(--text-tertiary)]">
              You Receive
            </label>
            <span className="text-[var(--text-muted)] text-[var(--text-xs)]">
              Balance: {toToken.balance.toFixed(2)}
            </span>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() => setShowToTokens(true)}
              className="flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] px-3 py-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
            >
              <span className="text-2xl">{toToken.icon}</span>
              <div className="text-left">
                <div className="font-bold text-[var(--text-primary)]">{toToken.symbol}</div>
                <div className="text-[var(--text-muted)] text-[var(--text-xs)]">{toToken.name}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
            </button>

            <div className="flex-1 text-right text-[var(--text-3xl)] text-[var(--text-primary)]">
              {toAmount || '0.0'}
            </div>
          </div>

          <div className="flex items-center justify-end text-sm">
            <span className="text-[var(--text-tertiary)]">
              {toAmount
                ? `≈ $${(parseFloat(toAmount) * toToken.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '$0.00'}
            </span>
          </div>
        </motion.div>

        {/* Swap Details */}
        {fromAmount && parseFloat(fromAmount) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-xl border p-4"
            style={{
              background: `${accentColor}05`,
              borderColor: `${accentColor}20`,
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-tertiary)]">Rate</span>
              <span className="font-medium text-[var(--text-primary)]">
                1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-white/60">
                <span>Price Impact</span>
                <Info className="h-3.5 w-3.5" />
              </div>
              <span
                className="font-medium"
                style={{
                  color: priceImpact > 5 ? '#ef4444' : priceImpact > 2 ? '#f59e0b' : '#22c55e',
                }}
              >
                {priceImpact < 0.01 ? '<0.01' : priceImpact.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-tertiary)]">Network Fee</span>
              <span className="font-medium text-[var(--text-primary)]">
                ~${networkFee.toFixed(2)}
              </span>
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-tertiary)]">Minimum Received</span>
              <span className="font-medium text-[var(--text-primary)]">
                {minReceived.toFixed(6)} {toToken.symbol}
              </span>
            </div>

            {priceImpact > 5 && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-400">High Price Impact</p>
                  <p className="mt-0.5 text-xs text-white/60">
                    This trade will move the market significantly. Consider splitting into smaller
                    trades.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Swap Button */}
        <motion.button
          whileHover={fromAmount && !swapping ? { scale: 1.02 } : {}}
          whileTap={fromAmount && !swapping ? { scale: 0.98 } : {}}
          onClick={handleSwap}
          disabled={!fromAmount || swapping || swapSuccess || parseFloat(fromAmount) === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white transition-all"
          style={{
            background:
              !fromAmount || swapping || parseFloat(fromAmount) === 0
                ? 'rgba(100, 100, 100, 0.3)'
                : swapSuccess
                  ? '#22c55e'
                  : `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
            boxShadow:
              fromAmount && !swapping && parseFloat(fromAmount) > 0 && !swapSuccess
                ? `0 0 40px ${accentColor}60`
                : 'none',
            opacity: !fromAmount || swapping || parseFloat(fromAmount) === 0 ? 0.5 : 1,
            cursor:
              !fromAmount || swapping || swapSuccess || parseFloat(fromAmount) === 0
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {swapping ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Swapping...
            </>
          ) : swapSuccess ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Swap Successful!
            </>
          ) : (
            <>
              <Zap className="h-5 w-5" />
              {fromAmount && parseFloat(fromAmount) > 0 ? 'Swap Tokens' : 'Enter Amount'}
            </>
          )}
        </motion.button>

        {/* Recent Swaps */}
        {recentSwaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-[var(--text-muted)]" />
              <h3 className="font-medium text-[var(--text-sm)] text-[var(--text-tertiary)]">
                Recent Swaps
              </h3>
            </div>
            <div className="space-y-2">
              {recentSwaps.map((swap, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/3 p-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white">
                      {parseFloat(swap.fromAmount).toFixed(4)} {swap.from}
                    </span>
                    <ArrowDownUp className="h-3 w-3 text-white/40" />
                    <span className="text-white">
                      {parseFloat(swap.toAmount).toFixed(4)} {swap.to}
                    </span>
                  </div>
                  <span className="text-[var(--text-muted)] text-[var(--text-xs)]">
                    {new Date(swap.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Token Selection Modal */}
      <AnimatePresence>
        {(showFromTokens || showToTokens) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => {
                setShowFromTokens(false);
                setShowToTokens(false);
                setSearchQuery('');
              }}
            />

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl sm:rounded-3xl"
              style={{
                boxShadow: `0 0 60px ${accentColor}40`,
              }}
            >
              {/* Modal Header */}
              <div className="border-b border-white/10 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Select Token</h3>
                  <button
                    onClick={() => {
                      setShowFromTokens(false);
                      setShowToTokens(false);
                      setSearchQuery('');
                    }}
                    className="rounded-xl bg-white/5 p-2 transition-colors hover:bg-white/10"
                  >
                    <X className="h-5 w-5 text-white/60" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or symbol"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-10 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Token List */}
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {filteredTokens.map(token => (
                  <button
                    key={token.symbol}
                    onClick={() => selectToken(token, showFromTokens)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/3 p-4 transition-all hover:bg-white/10"
                  >
                    <span className="text-3xl">{token.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)]">{token.symbol}</span>
                        {token.favorite && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <div className="text-[var(--text-muted)] text-[var(--text-xs)]">
                        {token.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[var(--text-primary)]">
                        {token.balance.toFixed(4)}
                      </div>
                      <div
                        className="text-xs"
                        style={{
                          color: token.change24h >= 0 ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {token.change24h >= 0 ? '+' : ''}
                        {token.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
