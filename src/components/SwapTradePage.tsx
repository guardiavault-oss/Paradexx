/**
 * SwapTradePage - Enhanced AI-Powered Trading Interface
 *
 * Features:
 * - Trending tokens with real-time data
 * - AI-powered savings recommendations
 * - Safe transaction analysis
 * - Beautiful modern UX/UI
 * - MEV protection integration
 */

import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getThemeStyles } from '../design-system';
import { toast } from '@/components/Toast';
import { useTokenBalances } from '@/hooks/api/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { useTrendingTokens } from '@/hooks/useMarketData';
import {
  ArrowLeft,
  Settings,
  Shield,
  ShieldCheck,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  ArrowDown,
  Search,
  Sparkles,
  Flame,
  Activity,
  DollarSign,
  Timer,
  Bot,
  Wallet,
  Rocket,
} from 'lucide-react';

interface SwapTradePageProps {
  type?: 'degen' | 'regen';
  onClose?: () => void;
  walletAddress?: string;
  chainId?: number;
}

interface Token {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  change24h: number;
  volume24h?: string;
  icon: string;
  trending?: boolean;
  address?: string;
  logo?: string;
}

interface AIRecommendation {
  type: 'savings' | 'safety' | 'timing' | 'route';
  title: string;
  description: string;
  savings?: string;
  impact?: 'positive' | 'negative' | 'neutral';
}

interface SwapRoute {
  protocol: string;
  percentage: number;
  estimatedGas: string;
}

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
  PEPE: '🐸',
  SHIB: '🐕',
  DOGE: '🐶',
  APE: '🦍',
  CRV: '📈',
  LDO: '🔷',
};

// Default tokens
const DEFAULT_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', balance: 0, price: 2340.5, change24h: 2.5, icon: '⟠' },
  { symbol: 'USDC', name: 'USD Coin', balance: 0, price: 1.0, change24h: 0, icon: '💵' },
  { symbol: 'USDT', name: 'Tether', balance: 0, price: 1.0, change24h: 0, icon: '₮' },
  { symbol: 'DAI', name: 'Dai', balance: 0, price: 1.0, change24h: 0, icon: '◈' },
];

export function SwapTradePage({
  type = 'degen',
  onClose,
  walletAddress,
  chainId = 1,
}: SwapTradePageProps) {
  const { session } = useAuth();
  const theme = getThemeStyles(type);
  const accentColor = theme.primaryColor;
  const isDegen = type === 'degen';

  // Chain mapping
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
  const {
    data: tokenData,
    isLoading: _tokensLoading,
    refetch: refetchTokens,
  } = useTokenBalances(walletAddress || '', chainName, { enabled: !!walletAddress && !!session });

  // Fetch trending tokens
  const { data: trendingData } = useTrendingTokens();

  // Transform tokens
  const tokens: Token[] = useMemo(() => {
    if (!tokenData || tokenData.length === 0) return DEFAULT_TOKENS;
    return tokenData.map((t: any) => ({
      symbol: t.symbol,
      name: t.name || t.symbol,
      balance: parseFloat(t.balance) || 0,
      price: t.price || 0,
      change24h: t.priceChange24h || 0,
      volume24h: t.volume24h ? `$${(parseFloat(t.volume24h) / 1e6).toFixed(1)}M` : undefined,
      icon: TOKEN_ICONS[t.symbol?.toUpperCase()] || '🪙',
      address: t.address,
      logo: t.logo,
    }));
  }, [tokenData]);

  // Trending tokens
  const trendingTokens: Token[] = useMemo(() => {
    if (trendingData?.data && Array.isArray(trendingData.data)) {
      return trendingData.data.slice(0, 8).map((t: any) => ({
        symbol: t.symbol || t.name?.substring(0, 4).toUpperCase(),
        name: t.name,
        balance: 0,
        price: t.price || 0,
        change24h: t.priceChange24h || t.change24h || 0,
        icon: TOKEN_ICONS[t.symbol?.toUpperCase()] || '🔥',
        trending: true,
        logo: t.logo || t.image,
      }));
    }
    // Fallback trending
    return [
      {
        symbol: 'PEPE',
        name: 'Pepe',
        balance: 0,
        price: 0.00001234,
        change24h: 15.5,
        icon: '🐸',
        trending: true,
      },
      {
        symbol: 'ARB',
        name: 'Arbitrum',
        balance: 0,
        price: 1.23,
        change24h: 8.2,
        icon: '🔵',
        trending: true,
      },
      {
        symbol: 'OP',
        name: 'Optimism',
        balance: 0,
        price: 2.45,
        change24h: 6.7,
        icon: '🔴',
        trending: true,
      },
      {
        symbol: 'LDO',
        name: 'Lido DAO',
        balance: 0,
        price: 2.15,
        change24h: 4.3,
        icon: '🔷',
        trending: true,
      },
    ];
  }, [trendingData]);

  // State
  const [activeView, setActiveView] = useState<'swap' | 'limit' | 'dca'>('swap');
  const [fromToken, setFromToken] = useState<Token>(DEFAULT_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(DEFAULT_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenSelect, setShowTokenSelect] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [mevProtection, setMevProtection] = useState(true);
  const [quote, setQuote] = useState<any>(null);
  const [_routes, setRoutes] = useState<SwapRoute[]>([]);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);

  // Update tokens when data loads
  useEffect(() => {
    if (tokens.length > 0 && tokens !== DEFAULT_TOKENS) {
      setFromToken(tokens[0]);
      if (tokens[1]) setToToken(tokens[1]);
    }
  }, [tokens]);

  // Fetch quote
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setQuote(null);
        setToAmount('');
        setAIRecommendations([]);
        return;
      }

      setIsFetchingQuote(true);

      try {
        const { apiServices } = await import('@/services');
        const response = await apiServices.trading.getSwapQuote({
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          amount: fromAmount,
          slippage,
          chainId,
        });

        if (response.success && response.data) {
          setQuote(response.data);
          const estimatedAmount = response.data.toAmount || response.data.estimatedAmount;
          setToAmount(estimatedAmount ? parseFloat(estimatedAmount).toFixed(6) : '');

          // Generate AI recommendations based on quote
          generateAIRecommendations(response.data);

          // Set routes if available
          if (response.data.routes) {
            setRoutes(response.data.routes);
          }
        } else {
          // Fallback calculation
          const rate = toToken.price > 0 ? toToken.price / fromToken.price : 1;
          const calculated = parseFloat(fromAmount) * rate;
          setToAmount(calculated.toFixed(6));
          generateAIRecommendations(null);
        }
      } catch (err) {
        console.error('Quote error:', err);
        const rate = toToken.price > 0 ? toToken.price / fromToken.price : 1;
        const calculated = parseFloat(fromAmount) * rate;
        setToAmount(calculated.toFixed(6));
        generateAIRecommendations(null);
      } finally {
        setIsFetchingQuote(false);
      }
    };

    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, slippage, chainId]);

  // Generate AI recommendations
  const generateAIRecommendations = useCallback(
    (quoteData: any) => {
      const recommendations: AIRecommendation[] = [];

      // Gas savings recommendation
      if (quoteData?.gasSavings) {
        recommendations.push({
          type: 'savings',
          title: 'Optimal Route Found',
          description: `Routing through ${quoteData.protocol || 'aggregator'} saves you gas fees`,
          savings: `$${quoteData.gasSavings.toFixed(2)}`,
          impact: 'positive',
        });
      }

      // MEV protection
      if (mevProtection) {
        recommendations.push({
          type: 'safety',
          title: 'MEV Protection Active',
          description: 'Your transaction is protected from sandwich attacks and front-running',
          impact: 'positive',
        });
      }

      // Timing recommendation
      const hour = new Date().getHours();
      if (hour >= 2 && hour <= 6) {
        recommendations.push({
          type: 'timing',
          title: 'Low Gas Period',
          description: 'Gas prices are typically lower right now - good time to swap!',
          impact: 'positive',
        });
      } else if (hour >= 14 && hour <= 18) {
        recommendations.push({
          type: 'timing',
          title: 'Peak Hours',
          description: 'Consider waiting for off-peak hours for lower gas fees',
          impact: 'neutral',
        });
      }

      // Price impact warning
      if (quoteData?.priceImpact && quoteData.priceImpact > 1) {
        recommendations.push({
          type: 'safety',
          title: 'Price Impact Warning',
          description: `This swap has ${quoteData.priceImpact.toFixed(2)}% price impact. Consider smaller amounts.`,
          impact: 'negative',
        });
      }

      // Slippage recommendation
      if (slippage > 1) {
        recommendations.push({
          type: 'safety',
          title: 'High Slippage Set',
          description: 'Consider lowering slippage to 0.5% for better execution',
          impact: 'neutral',
        });
      }

      setAIRecommendations(recommendations);
    },
    [mevProtection, slippage]
  );

  // Flip tokens
  const handleFlipTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount('');
  };

  // Execute swap
  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) === 0) {
      toast.error('Please enter an amount', { type });
      return;
    }

    if (!walletAddress) {
      toast.error('Please connect your wallet', { type });
      return;
    }

    setIsSwapping(true);

    try {
      const { apiServices } = await import('@/services');
      const response = await apiServices.trading.executeSwap({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: fromAmount,
        slippage,
        chainId,
        recipient: walletAddress,
        mevProtection,
      });

      if (response.success) {
        toast.success(
          `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
          { type }
        );
        setFromAmount('');
        setToAmount('');
        setQuote(null);
        refetchTokens();
      } else {
        throw new Error(response.message || 'Swap failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Swap failed', { type });
    } finally {
      setIsSwapping(false);
    }
  };

  // Select token
  const handleSelectToken = (token: Token) => {
    if (showTokenSelect === 'from') {
      if (token.symbol === toToken.symbol) {
        handleFlipTokens();
      } else {
        setFromToken(token);
      }
    } else {
      if (token.symbol === fromToken.symbol) {
        handleFlipTokens();
      } else {
        setToToken(token);
      }
    }
    setShowTokenSelect(null);
    setSearchQuery('');
  };

  // Filter tokens
  const filteredTokens = useMemo(() => {
    const allTokens = [
      ...tokens,
      ...trendingTokens.filter(t => !tokens.find(ut => ut.symbol === t.symbol)),
    ];
    if (!searchQuery) return allTokens;
    const query = searchQuery.toLowerCase();
    return allTokens.filter(
      t => t.symbol.toLowerCase().includes(query) || t.name.toLowerCase().includes(query)
    );
  }, [tokens, trendingTokens, searchQuery]);

  // Calculate values
  const fromValueUSD = parseFloat(fromAmount || '0') * fromToken.price;
  const toValueUSD = parseFloat(toAmount || '0') * toToken.price;
  const rate = toToken.price > 0 ? fromToken.price / toToken.price : 0;
  const networkFee = quote?.gasCost || 2.5;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[var(--border-neutral)] bg-[var(--bg-surface)]/95 backdrop-blur-xl">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="rounded-xl border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-2"
              >
                <ArrowLeft className="h-5 w-5" style={{ color: accentColor }} />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Trade</h1>
                <p className="text-xs text-[var(--text-muted)]">AI-Powered • MEV Protected</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAIInsights(!showAIInsights)}
                className={`rounded-xl border p-2 transition-all ${
                  showAIInsights
                    ? 'border-purple-500/50 bg-gradient-to-r from-purple-500/20 to-pink-500/20'
                    : 'border-[var(--border-neutral)] bg-[var(--bg-hover)]'
                }`}
              >
                <Sparkles
                  className={`h-5 w-5 ${showAIInsights ? 'text-purple-400' : 'text-[var(--text-tertiary)]'}`}
                />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="rounded-xl border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-2"
              >
                <Settings className="h-5 w-5 text-[var(--text-tertiary)]" />
              </motion.button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="mt-4 flex gap-2">
            {(['swap', 'limit', 'dca'] as const).map(view => (
              <motion.button
                key={view}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveView(view)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition-all ${
                  activeView === view
                    ? 'text-white'
                    : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
                }`}
                style={{
                  background: activeView === view ? accentColor : undefined,
                }}
              >
                {view === 'dca' ? 'DCA' : view}
              </motion.button>
            ))}
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
            className="overflow-hidden border-b border-[var(--border-neutral)]"
          >
            <div className="space-y-4 bg-[var(--bg-surface)]/50 p-4">
              {/* Slippage */}
              <div>
                <label className="mb-2 block text-sm text-[var(--text-secondary)]">
                  Slippage Tolerance
                </label>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0].map(val => (
                    <button
                      key={val}
                      onClick={() => setSlippage(val)}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                        slippage === val
                          ? 'text-white'
                          : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
                      }`}
                      style={{ background: slippage === val ? accentColor : undefined }}
                    >
                      {val}%
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom"
                    className="flex-1 rounded-lg border border-[var(--border-neutral)] bg-[var(--bg-hover)] px-3 py-2 text-center text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                    onChange={e => setSlippage(parseFloat(e.target.value) || 0.5)}
                  />
                </div>
              </div>

              {/* MEV Protection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-[var(--text-secondary)]">MEV Protection</span>
                </div>
                <button
                  onClick={() => setMevProtection(!mevProtection)}
                  className={`h-6 w-12 rounded-full transition-all ${
                    mevProtection ? 'bg-green-500' : 'bg-[var(--bg-hover)]'
                  }`}
                >
                  <motion.div
                    className="h-5 w-5 rounded-full bg-white shadow"
                    animate={{ x: mevProtection ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 px-4 py-4">
        {/* Trending Tokens */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Trending</span>
            </div>
            <button className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
            {trendingTokens.map(token => (
              <motion.button
                key={token.symbol}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setToToken(token);
                  setShowTokenSelect(null);
                }}
                className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-[var(--border-neutral)] bg-[var(--bg-surface)] px-3 py-2 transition-all hover:border-[var(--accent-primary)]/50"
              >
                <span className="text-lg">{token.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{token.symbol}</p>
                  <p
                    className={`text-xs ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {token.change24h >= 0 ? '+' : ''}
                    {token.change24h.toFixed(1)}%
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* AI Insights Panel */}
        <AnimatePresence>
          {showAIInsights && aiRecommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-purple-500/20 p-1.5">
                  <Bot className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-purple-300">AI Insights</span>
              </div>
              <div className="space-y-2">
                {aiRecommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 rounded-lg p-2 ${
                      rec.impact === 'positive'
                        ? 'bg-green-500/10'
                        : rec.impact === 'negative'
                          ? 'bg-red-500/10'
                          : 'bg-[var(--bg-hover)]'
                    }`}
                  >
                    {rec.type === 'savings' && (
                      <DollarSign className="mt-0.5 h-4 w-4 text-green-400" />
                    )}
                    {rec.type === 'safety' && (
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-400" />
                    )}
                    {rec.type === 'timing' && <Timer className="mt-0.5 h-4 w-4 text-yellow-400" />}
                    {rec.type === 'route' && (
                      <Activity className="mt-0.5 h-4 w-4 text-purple-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[var(--text-primary)]">{rec.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{rec.description}</p>
                      {rec.savings && (
                        <p className="mt-1 text-xs font-medium text-green-400">
                          Saves {rec.savings}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Card */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-neutral)] bg-[var(--bg-surface)]">
          {/* From Token */}
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">You Pay</span>
              <span className="text-xs text-[var(--text-muted)]">
                Balance: {fromToken.balance.toLocaleString()} {fromToken.symbol}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTokenSelect('from')}
                className="flex items-center gap-2 rounded-xl bg-[var(--bg-hover)] px-3 py-2 transition-all hover:bg-[var(--bg-active)]"
              >
                <span className="text-2xl">{fromToken.icon}</span>
                <span className="font-semibold text-[var(--text-primary)]">{fromToken.symbol}</span>
                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
              </motion.button>
              <div className="flex-1 text-right">
                <input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={e => setFromAmount(e.target.value)}
                  className="w-full bg-transparent text-right text-2xl font-bold text-[var(--text-primary)] focus:outline-none"
                />
                <p className="text-sm text-[var(--text-muted)]">
                  ${fromValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {/* Quick Amount Buttons */}
            <div className="mt-3 flex gap-2">
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  onClick={() => setFromAmount(((fromToken.balance * pct) / 100).toString())}
                  className="flex-1 rounded-lg bg-[var(--bg-hover)] py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-all hover:text-[var(--text-primary)]"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-x-0 border-t border-[var(--border-neutral)]" />
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFlipTokens}
              className="relative z-10 rounded-xl border-2 border-[var(--border-neutral)] bg-[var(--bg-surface)] p-2.5 transition-all hover:border-[var(--accent-primary)]"
              style={{ boxShadow: `0 0 20px ${accentColor}20` }}
            >
              <ArrowDown className="h-5 w-5" style={{ color: accentColor }} />
            </motion.button>
          </div>

          {/* To Token */}
          <div className="bg-[var(--bg-hover)]/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">You Receive</span>
              <span className="text-xs text-[var(--text-muted)]">
                Balance: {toToken.balance.toLocaleString()} {toToken.symbol}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTokenSelect('to')}
                className="flex items-center gap-2 rounded-xl bg-[var(--bg-surface)] px-3 py-2 transition-all hover:bg-[var(--bg-hover)]"
              >
                <span className="text-2xl">{toToken.icon}</span>
                <span className="font-semibold text-[var(--text-primary)]">{toToken.symbol}</span>
                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
              </motion.button>
              <div className="flex-1 text-right">
                {isFetchingQuote ? (
                  <div className="flex items-center justify-end gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
                    <span className="text-lg text-[var(--text-muted)]">Loading...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {toAmount || '0.0'}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      ${toValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trade Details */}
        {fromAmount && parseFloat(fromAmount) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-xl border border-[var(--border-neutral)] bg-[var(--bg-surface)] p-4"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">Rate</span>
              <span className="text-[var(--text-primary)]">
                1 {fromToken.symbol} = {rate.toFixed(6)} {toToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">Price Impact</span>
              <span
                className={`${(quote?.priceImpact || 0) > 1 ? 'text-red-400' : 'text-green-400'}`}
              >
                ~{(quote?.priceImpact || 0.1).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">Network Fee</span>
              <span className="text-[var(--text-primary)]">~${networkFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">Min. Received</span>
              <span className="text-[var(--text-primary)]">
                {(parseFloat(toAmount || '0') * (1 - slippage / 100)).toFixed(6)} {toToken.symbol}
              </span>
            </div>
            {mevProtection && (
              <div className="flex items-center gap-2 border-t border-[var(--border-neutral)] pt-2">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                <span className="text-xs text-green-400">MEV Protection Enabled</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Swap Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSwap}
          disabled={isSwapping || !fromAmount || parseFloat(fromAmount) === 0 || !walletAddress}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${isDegen ? '#ff6b6b' : '#00d4ff'})`,
            boxShadow: `0 4px 20px ${accentColor}40`,
          }}
        >
          {isSwapping ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Swapping...
            </>
          ) : !walletAddress ? (
            <>
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </>
          ) : (
            <>
              <Rocket className="h-5 w-5" />
              {isDegen ? 'Execute Swap 🚀' : 'Swap Tokens'}
            </>
          )}
        </motion.button>

        {/* Powered by Badge */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-xs text-[var(--text-muted)]">Powered by</span>
          <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-surface)] px-2 py-1">
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Scarlette AI</span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">+ DEX Aggregator</span>
        </div>
      </div>

      {/* Token Select Modal */}
      <AnimatePresence>
        {showTokenSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTokenSelect(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="absolute right-0 bottom-0 left-0 max-h-[80vh] overflow-hidden rounded-t-3xl bg-[var(--bg-surface)]"
            >
              <div className="border-b border-[var(--border-neutral)] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Select {showTokenSelect === 'from' ? 'Input' : 'Output'} Token
                  </h3>
                  <button onClick={() => setShowTokenSelect(null)}>
                    <X className="h-5 w-5 text-[var(--text-muted)]" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search by name or address..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-neutral)] bg-[var(--bg-hover)] py-3 pr-4 pl-10 text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Trending Section in Modal */}
              <div className="border-b border-[var(--border-neutral)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Popular</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['ETH', 'USDC', 'USDT', 'WBTC', 'ARB', 'OP'].map(symbol => {
                    const token = filteredTokens.find(t => t.symbol === symbol) || {
                      symbol,
                      name: symbol,
                      balance: 0,
                      price: 0,
                      change24h: 0,
                      icon: TOKEN_ICONS[symbol] || '🪙',
                    };
                    return (
                      <button
                        key={symbol}
                        onClick={() => handleSelectToken(token as Token)}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 transition-all hover:bg-[var(--bg-active)]"
                      >
                        <span>{TOKEN_ICONS[symbol] || '🪙'}</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {symbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Token List */}
              <div className="max-h-[50vh] space-y-2 overflow-y-auto p-4">
                {filteredTokens.map(token => (
                  <motion.button
                    key={token.symbol}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectToken(token)}
                    className="flex w-full items-center gap-3 rounded-xl bg-[var(--bg-hover)] p-3 transition-all hover:bg-[var(--bg-active)]"
                  >
                    <span className="text-2xl">{token.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-[var(--text-primary)]">{token.symbol}</p>
                      <p className="text-sm text-[var(--text-muted)]">{token.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[var(--text-primary)]">
                        {token.balance > 0 ? token.balance.toLocaleString() : '-'}
                      </p>
                      <p
                        className={`text-sm ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {token.change24h >= 0 ? '+' : ''}
                        {token.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SwapTradePage;
