import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useMemo } from 'react';
import { getThemeStyles } from '../design-system';
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
  BarChart3,
  ChevronRight,
} from 'lucide-react';

interface TradingPageProps {
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
  volume24h: string;
  icon: string;
  trending?: boolean;
  address?: string;
}

// Default tokens as fallback when API is unavailable
const DEFAULT_TOKENS: Token[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 0,
    price: 2340.5,
    change24h: 0,
    volume24h: '$0',
    icon: '⟠',
    trending: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 0,
    price: 1.0,
    change24h: 0,
    volume24h: '$0',
    icon: '💵',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    balance: 0,
    price: 1.0,
    change24h: 0,
    volume24h: '$0',
    icon: '₮',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    balance: 0,
    price: 1.0,
    change24h: 0,
    volume24h: '$0',
    icon: '◈',
  },
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
  ARB: '🔷',
  OP: '🔴',
  MATIC: '🟣',
  SOL: '◎',
  BNB: '💛',
  PEPE: '🐸',
};

export function TradingPageEnhanced({
  type,
  onClose,
  walletAddress,
  chainId = 1,
}: TradingPageProps) {
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

    return tokenData.map((t: any, idx: number) => ({
      symbol: t.symbol,
      name: t.name || t.symbol,
      balance: parseFloat(t.balance) || 0,
      price: t.price || 0,
      change24h: t.priceChange24h || 0,
      volume24h: t.volume24h ? `$${(parseFloat(t.volume24h) / 1e6).toFixed(1)}M` : '$0',
      icon: TOKEN_ICONS[t.symbol?.toUpperCase()] || '🪙',
      trending: idx < 5 || (t.priceChange24h && Math.abs(t.priceChange24h) > 5),
      address: t.address,
    }));
  }, [tokenData]);

  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');
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
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'from' | 'to'>('from');
  const [searchQuery, setSearchQuery] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);

  // Advanced trading state
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  // Use design system theme styles
  const theme = getThemeStyles(type);
  const accentColor = theme.primaryColor;
  const secondaryColor = theme.secondaryColor;
  const isDegen = type === 'degen';

  const trendingTokens = tokens.filter(t => t.trending);

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

  const selectToken = (token: Token) => {
    if (selectingFor === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowTokenModal(false);
    setSearchQuery('');
  };

  const openTokenModal = (type: 'from' | 'to') => {
    setSelectingFor(type);
    setShowTokenModal(true);
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
            <p className="text-sm text-yellow-100">⚠️ Please connect your wallet to trade</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-16 z-[var(--z-sticky)] border-b border-[var(--border-neutral)] bg-[var(--bg-overlay)] backdrop-blur-[var(--blur-xl)]">
        <div className="px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
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
                  <BarChart3 className="h-5 w-5" style={{ color: accentColor }} />
                  <h2 className="text-[var(--text-primary)] text-[var(--text-xl)]">Trading</h2>
                </div>
                <p className="mt-0.5 text-[var(--text-muted)] text-[var(--text-xs)]">
                  {isDegen ? 'Fast trades & high leverage' : 'Smart trades & automation'}
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-xl p-2 transition-all"
              style={{
                background: showSettings ? `${accentColor}20` : 'var(--bg-hover)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: showSettings ? accentColor : 'var(--border-neutral)',
              }}
            >
              <Settings
                className="h-5 w-5"
                style={{ color: showSettings ? accentColor : 'var(--text-tertiary)' }}
              />
            </motion.button>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] p-1">
            <button
              onClick={() => setActiveTab('simple')}
              className="flex-1 rounded-lg py-2.5 text-sm font-bold transition-all"
              style={{
                background: activeTab === 'simple' ? accentColor : 'transparent',
                color: activeTab === 'simple' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              Simple
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className="flex-1 rounded-lg py-2.5 text-sm font-bold transition-all"
              style={{
                background: activeTab === 'advanced' ? accentColor : 'transparent',
                color: activeTab === 'advanced' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              Advanced
            </button>
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
            className="overflow-hidden border-b border-[var(--border-neutral)] bg-[var(--bg-surface)]"
          >
            <div className="px-4 py-6">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[var(--text-secondary)] text-[var(--text-sm)]">
                  Slippage Tolerance
                </label>
                <span
                  className="font-[var(--font-weight-bold)] text-[var(--text-sm)]"
                  style={{ color: accentColor }}
                >
                  {slippage}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0.1, 0.5, 1.0, 3.0].map(val => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    className="rounded-xl py-2.5 text-sm font-bold transition-all"
                    style={{
                      background: slippage === val ? `${accentColor}20` : 'var(--bg-hover)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: slippage === val ? accentColor : 'var(--border-neutral)',
                      color: slippage === val ? accentColor : 'var(--text-primary)',
                    }}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-24">
        {/* Trending Tokens */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4" style={{ color: accentColor }} />
            <h3 className="font-[var(--font-weight-bold)] text-[var(--text-primary)] text-[var(--text-sm)]">
              Trending
            </h3>
          </div>
          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {trendingTokens.map(token => (
              <button
                key={token.symbol}
                onClick={() => {
                  setFromToken(token);
                  setToToken(TOKENS[1]);
                }}
                className="min-w-[140px] flex-shrink-0 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-3 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xl">{token.icon}</span>
                  <span className="font-[var(--font-weight-bold)] text-[var(--text-primary)] text-[var(--text-sm)]">
                    {token.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-tertiary)] text-[var(--text-xs)]">
                    ${token.price.toLocaleString()}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: token.change24h >= 0 ? 'var(--regen-primary)' : 'var(--degen-primary)',
                    }}
                  >
                    {token.change24h >= 0 ? '+' : ''}
                    {token.change24h.toFixed(1)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Simple Trading View */}
        <AnimatePresence mode="wait">
          {activeTab === 'simple' && (
            <motion.div
              key="simple"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* From Token Card */}
              <div className="rounded-[var(--radius-2xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <label className="font-[var(--font-weight-medium)] text-[var(--text-sm)] text-[var(--text-tertiary)]">
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
                    onClick={() => openTokenModal('from')}
                    className="flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] px-3 py-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                  >
                    <span className="text-2xl">{fromToken.icon}</span>
                    <div className="text-left">
                      <div className="font-[var(--font-weight-bold)] text-[var(--text-primary)]">
                        {fromToken.symbol}
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
                    Balance: {fromToken.balance.toFixed(4)}
                  </span>
                  <span className="text-[var(--text-tertiary)]">
                    {fromAmount
                      ? `$${(parseFloat(fromAmount) * fromToken.price).toLocaleString()}`
                      : '$0.00'}
                  </span>
                </div>
              </div>

              {/* Flip Button */}
              <div className="relative z-10 -my-2 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9, rotate: 180 }}
                  onClick={handleFlipTokens}
                  className="rounded-2xl p-3 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
                    boxShadow: `0 0 30px ${accentColor}40`,
                  }}
                >
                  <ArrowDown className="h-5 w-5 text-[var(--text-primary)]" />
                </motion.button>
              </div>

              {/* To Token Card */}
              <div className="rounded-[var(--radius-2xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <label className="font-[var(--font-weight-medium)] text-[var(--text-sm)] text-[var(--text-tertiary)]">
                    You Receive
                  </label>
                  <span className="text-[var(--text-muted)] text-[var(--text-xs)]">
                    Balance: {toToken.balance.toFixed(2)}
                  </span>
                </div>

                <div className="mb-3 flex items-center gap-3">
                  <button
                    onClick={() => openTokenModal('to')}
                    className="flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] px-3 py-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                  >
                    <span className="text-2xl">{toToken.icon}</span>
                    <div className="text-left">
                      <div className="font-[var(--font-weight-bold)] text-[var(--text-primary)]">
                        {toToken.symbol}
                      </div>
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
                      ? `$${(parseFloat(toAmount) * toToken.price).toLocaleString()}`
                      : '$0.00'}
                  </span>
                </div>
              </div>

              {/* Quick Info */}
              {fromAmount && parseFloat(fromAmount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 rounded-xl border p-4"
                  style={{
                    background: `${accentColor}08`,
                    borderColor: `${accentColor}30`,
                  }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">Rate</span>
                    <span className="text-[var(--text-primary)]">
                      1 {fromToken.symbol} ≈ {exchangeRate.toFixed(4)} {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">Network Fee</span>
                    <span className="text-[var(--text-primary)]">~${networkFee.toFixed(2)}</span>
                  </div>
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
                    Success!
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    {fromAmount && parseFloat(fromAmount) > 0 ? 'Swap Now' : 'Enter Amount'}
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Advanced Trading View */}
          {activeTab === 'advanced' && (
            <motion.div
              key="advanced"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Trading Pair Selection */}
              <div className="rounded-[var(--radius-2xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-5">
                <label className="mb-3 block font-[var(--font-weight-medium)] text-[var(--text-sm)] text-[var(--text-tertiary)]">
                  Trading Pair
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openTokenModal('from')}
                    className="flex flex-1 items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] px-4 py-3 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                  >
                    <span className="text-2xl">{fromToken.icon}</span>
                    <span className="font-[var(--font-weight-bold)] text-[var(--text-primary)]">
                      {fromToken.symbol}
                    </span>
                    <ChevronDown className="ml-auto h-4 w-4 text-[var(--text-muted)]" />
                  </button>
                  <span className="text-[var(--text-muted)]">/</span>
                  <button
                    onClick={() => openTokenModal('to')}
                    className="flex flex-1 items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] px-4 py-3 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                  >
                    <span className="text-2xl">{toToken.icon}</span>
                    <span className="font-[var(--font-weight-bold)] text-[var(--text-primary)]">
                      {toToken.symbol}
                    </span>
                    <ChevronDown className="ml-auto h-4 w-4 text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="rounded-[var(--radius-2xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <label className="font-[var(--font-weight-medium)] text-[var(--text-sm)] text-[var(--text-tertiary)]">
                    Amount
                  </label>
                  <button
                    onClick={() => setFromAmount(fromToken.balance.toString())}
                    className="rounded-[var(--radius-lg)] bg-[var(--bg-hover)] px-2 py-1 text-[var(--text-xs)] transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                    style={{ color: accentColor }}
                  >
                    Max: {fromToken.balance.toFixed(4)}
                  </button>
                </div>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={e => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="placeholder:[var(--text-muted)] w-full bg-transparent text-[var(--text-2xl)] text-[var(--text-primary)] outline-none"
                />
                <div className="mt-2 text-[var(--text-muted)] text-[var(--text-sm)]">
                  {fromAmount
                    ? `≈ $${(parseFloat(fromAmount) * fromToken.price).toLocaleString()}`
                    : '$0.00'}
                </div>
              </div>

              {/* Limit Price */}
              <div className="rounded-[var(--radius-2xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-5">
                <label className="mb-3 block font-[var(--font-weight-medium)] text-[var(--text-sm)] text-[var(--text-tertiary)]">
                  Limit Price (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={e => setLimitPrice(e.target.value)}
                    placeholder="Market Price"
                    className="placeholder:[var(--text-muted)] w-full bg-transparent text-[var(--text-primary)] text-[var(--text-xl)] outline-none"
                  />
                  <span className="absolute top-1/2 right-0 -translate-y-1/2 text-[var(--text-muted)] text-[var(--text-sm)]">
                    {toToken.symbol}
                  </span>
                </div>
                <div className="mt-2 text-[var(--text-muted)] text-[var(--text-xs)]">
                  Current: {exchangeRate.toFixed(6)} {toToken.symbol}
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-400" />
                    <label className="text-xs font-medium text-white/60">Stop Loss</label>
                  </div>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/20"
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    <label className="text-xs font-medium text-white/60">Take Profit</label>
                  </div>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={e => setTakeProfit(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Advanced Info */}
              {fromAmount && parseFloat(fromAmount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 rounded-xl border p-4"
                  style={{
                    background: `${accentColor}08`,
                    borderColor: `${accentColor}30`,
                  }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">You'll Receive</span>
                    <span className="font-[var(--font-weight-bold)] text-[var(--text-primary)]">
                      {toAmount} {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">Price Impact</span>
                    <span
                      className="font-medium"
                      style={{
                        color:
                          priceImpact > 5
                            ? 'var(--degen-primary)'
                            : priceImpact > 2
                              ? 'var(--degen-secondary)'
                              : 'var(--regen-primary)',
                      }}
                    >
                      {priceImpact < 0.01 ? '<0.01' : priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">Network Fee</span>
                    <span className="text-[var(--text-primary)]">~${networkFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">Slippage Tolerance</span>
                    <span className="text-[var(--text-primary)]">{slippage}%</span>
                  </div>
                </motion.div>
              )}

              {/* Execute Button */}
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
                }}
              >
                {swapping ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Executing...
                  </>
                ) : swapSuccess ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Trade Executed!
                  </>
                ) : (
                  <>
                    <Target className="h-5 w-5" />
                    {limitPrice ? 'Place Limit Order' : 'Execute Trade'}
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Token Selection Modal */}
      <AnimatePresence>
        {showTokenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => {
                setShowTokenModal(false);
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
              <div className="border-b border-white/10 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Select Token</h3>
                  <button
                    onClick={() => {
                      setShowTokenModal(false);
                      setSearchQuery('');
                    }}
                    className="rounded-xl bg-white/5 p-2 transition-colors hover:bg-white/10"
                    title="Close token selection modal"
                    aria-label="Close token selection modal"
                  >
                    <X className="h-5 w-5 text-white/60" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tokens..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-10 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {filteredTokens.map(token => (
                  <button
                    key={token.symbol}
                    onClick={() => selectToken(token)}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-4 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                  >
                    <span className="text-3xl">{token.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-[var(--font-weight-bold)] text-[var(--text-primary)]">
                          {token.symbol}
                        </span>
                        {token.trending && <Flame className="h-4 w-4 text-orange-400" />}
                      </div>
                      <div className="text-[var(--text-muted)] text-[var(--text-xs)]">
                        {token.name}
                      </div>
                      <div className="mt-1 text-[var(--text-muted)] text-[var(--text-xs)]">
                        Vol: {token.volume24h}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-[var(--font-weight-medium)] text-[var(--text-primary)]">
                        ${token.price.toLocaleString()}
                      </div>
                      <div
                        className="text-xs font-bold"
                        style={{
                          color:
                            token.change24h >= 0 ? 'var(--regen-primary)' : 'var(--degen-primary)',
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
