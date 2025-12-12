import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useMemo } from "react";
import { getThemeStyles } from "../design-system";
import { useTokenBalances } from "@/hooks/api/useWallet";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";

interface TradingPageProps {
  type: "degen" | "regen";
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
  { symbol: "ETH", name: "Ethereum", balance: 0, price: 2340.5, change24h: 0, volume24h: "$0", icon: "⟠", trending: true },
  { symbol: "USDC", name: "USD Coin", balance: 0, price: 1.0, change24h: 0, volume24h: "$0", icon: "💵" },
  { symbol: "USDT", name: "Tether", balance: 0, price: 1.0, change24h: 0, volume24h: "$0", icon: "₮" },
  { symbol: "DAI", name: "Dai Stablecoin", balance: 0, price: 1.0, change24h: 0, volume24h: "$0", icon: "◈" },
];

// Token icon mapping
const TOKEN_ICONS: Record<string, string> = {
  ETH: "⟠", WETH: "⟠", USDC: "💵", USDT: "₮", DAI: "◈",
  WBTC: "₿", UNI: "🦄", LINK: "⛓️", AAVE: "👻", ARB: "🔷",
  OP: "🔴", MATIC: "🟣", SOL: "◎", BNB: "💛", PEPE: "🐸",
};

export function TradingPageEnhanced({ type, onClose, walletAddress, chainId = 1 }: TradingPageProps) {
  const { session } = useAuth();

  // Map chainId to chain name for API
  const chainName = useMemo(() => {
    const chains: Record<number, 'eth' | 'polygon' | 'arbitrum' | 'optimism' | 'base'> = {
      1: 'eth', 137: 'polygon', 42161: 'arbitrum', 10: 'optimism', 8453: 'base'
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
      volume24h: t.volume24h ? `$${(parseFloat(t.volume24h) / 1e6).toFixed(1)}M` : "$0",
      icon: TOKEN_ICONS[t.symbol?.toUpperCase()] || "🪙",
      trending: idx < 5 || (t.priceChange24h && Math.abs(t.priceChange24h) > 5),
      address: t.address,
    }));
  }, [tokenData]);

  const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple");
  const [fromToken, setFromToken] = useState<Token>(DEFAULT_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(DEFAULT_TOKENS[1]);

  // Update default tokens when real data loads
  useEffect(() => {
    if (tokens.length > 0 && tokens !== DEFAULT_TOKENS) {
      setFromToken(tokens[0]);
      setToToken(tokens[1] || tokens[0]);
    }
  }, [tokens]);

  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");
  const [searchQuery, setSearchQuery] = useState("");
  const [swapping, setSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);

  // Advanced trading state
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  // Use design system theme styles
  const theme = getThemeStyles(type);
  const accentColor = theme.primaryColor;
  const secondaryColor = theme.secondaryColor;
  const isDegen = type === "degen";

  const trendingTokens = tokens.filter(t => t.trending);

  // Get swap quote when amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0 || !walletAddress) {
        setQuote(null);
        setToAmount("");
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
          setToAmount(estimatedAmount ? parseFloat(estimatedAmount).toFixed(6) : "");
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
        toast.success(`Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`, { type, duration: 3000 });
        setTimeout(() => {
          setSwapSuccess(false);
          setFromAmount("");
          setToAmount("");
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
    if (selectingFor === "from") {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowTokenModal(false);
    setSearchQuery("");
  };

  const openTokenModal = (type: "from" | "to") => {
    setSelectingFor(type);
    setShowTokenModal(true);
  };

  const filteredTokens = tokens.filter(
    token =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exchangeRate = toToken.price / fromToken.price;
  const priceImpact = parseFloat(fromAmount) > 0 ? ((parseFloat(fromAmount) * fromToken.price) / 1000000) * 100 : 0;
  const networkFee = 2.5;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] overflow-y-auto pb-24">
      {/* Error Alert */}
      {swapError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-900/90 border border-red-500/50 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-red-100 text-sm">{swapError}</p>
              <button
                onClick={() => setSwapError(null)}
                className="text-red-300 hover:text-red-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Address Warning */}
      {!walletAddress && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-yellow-900/90 border border-yellow-500/50 rounded-xl p-4 backdrop-blur-xl">
            <p className="text-yellow-100 text-sm">
              ⚠️ Please connect your wallet to trade
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-16 z-[var(--z-sticky)] bg-[var(--bg-overlay)] backdrop-blur-[var(--blur-xl)] border-b border-[var(--border-neutral)]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] border border-[var(--border-neutral)] hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)]"
              >
                <ArrowLeft className="w-5 h-5" style={{ color: accentColor }} />
              </motion.button>
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: accentColor }} />
                  <h2 className="text-[var(--text-primary)] text-[var(--text-xl)]">Trading</h2>
                </div>
                <p className="text-[var(--text-xs)] text-[var(--text-muted)] mt-0.5">
                  {isDegen ? "Fast trades & high leverage" : "Smart trades & automation"}
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl transition-all"
              style={{
                background: showSettings ? `${accentColor}20` : "var(--bg-hover)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: showSettings ? accentColor : "var(--border-neutral)",
              }}
            >
              <Settings
                className="w-5 h-5"
                style={{ color: showSettings ? accentColor : "var(--text-tertiary)" }}
              />
            </motion.button>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 bg-[var(--bg-hover)] p-1 rounded-[var(--radius-xl)]">
            <button
              onClick={() => setActiveTab("simple")}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: activeTab === "simple" ? accentColor : "transparent",
                color: activeTab === "simple" ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              Simple
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: activeTab === "advanced" ? accentColor : "transparent",
                color: activeTab === "advanced" ? "var(--text-primary)" : "var(--text-tertiary)",
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
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[var(--bg-surface)] border-b border-[var(--border-neutral)] overflow-hidden"
          >
            <div className="px-4 py-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[var(--text-sm)] text-[var(--text-secondary)]">Slippage Tolerance</label>
                <span className="text-[var(--text-sm)] font-[var(--font-weight-bold)]" style={{ color: accentColor }}>
                  {slippage}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0.1, 0.5, 1.0, 3.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    className="py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: slippage === val ? `${accentColor}20` : "var(--bg-hover)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: slippage === val ? accentColor : "var(--border-neutral)",
                      color: slippage === val ? accentColor : "var(--text-primary)",
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
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-24">
        {/* Trending Tokens */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4" style={{ color: accentColor }} />
            <h3 className="text-[var(--text-sm)] text-[var(--text-primary)] font-[var(--font-weight-bold)]">Trending</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trendingTokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => {
                  setFromToken(token);
                  setToToken(TOKENS[1]);
                }}
                className="flex-shrink-0 p-3 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border-neutral)] transition-all duration-[var(--duration-normal)] min-w-[140px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{token.icon}</span>
                  <span className="text-[var(--text-primary)] font-[var(--font-weight-bold)] text-[var(--text-sm)]">{token.symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">${token.price.toLocaleString()}</span>
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: token.change24h >= 0 ? "var(--regen-primary)" : "var(--degen-primary)",
                    }}
                  >
                    {token.change24h >= 0 ? "+" : ""}
                    {token.change24h.toFixed(1)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Simple Trading View */}
        <AnimatePresence mode="wait">
          {activeTab === "simple" && (
            <motion.div
              key="simple"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* From Token Card */}
              <div className="p-5 rounded-[var(--radius-2xl)] border bg-[var(--bg-hover)] border-[var(--border-neutral)]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[var(--text-sm)] text-[var(--text-tertiary)] font-[var(--font-weight-medium)]">You Pay</label>
                  <button
                    onClick={() => setFromAmount(fromToken.balance.toString())}
                    className="text-[var(--text-xs)] px-2 py-1 rounded-[var(--radius-lg)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)]"
                    style={{ color: accentColor }}
                  >
                    Max
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => openTokenModal("from")}
                    className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)] border border-[var(--border-neutral)]"
                  >
                    <span className="text-2xl">{fromToken.icon}</span>
                    <div className="text-left">
                      <div className="text-[var(--text-primary)] font-[var(--font-weight-bold)]">{fromToken.symbol}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  </button>

                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-right text-[var(--text-3xl)] text-[var(--text-primary)] outline-none placeholder:[var(--text-muted)]"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">
                    Balance: {fromToken.balance.toFixed(4)}
                  </span>
                  <span className="text-[var(--text-tertiary)]">
                    {fromAmount ? `$${(parseFloat(fromAmount) * fromToken.price).toLocaleString()}` : "$0.00"}
                  </span>
                </div>
              </div>

              {/* Flip Button */}
              <div className="flex justify-center -my-2 relative z-10">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9, rotate: 180 }}
                  onClick={handleFlipTokens}
                  className="p-3 rounded-2xl shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
                    boxShadow: `0 0 30px ${accentColor}40`,
                  }}
                >
                  <ArrowDown className="w-5 h-5 text-[var(--text-primary)]" />
                </motion.button>
              </div>

              {/* To Token Card */}
              <div className="p-5 rounded-[var(--radius-2xl)] border bg-[var(--bg-hover)] border-[var(--border-neutral)]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[var(--text-sm)] text-[var(--text-tertiary)] font-[var(--font-weight-medium)]">You Receive</label>
                  <span className="text-[var(--text-xs)] text-[var(--text-muted)]">
                    Balance: {toToken.balance.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => openTokenModal("to")}
                    className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)] border border-[var(--border-neutral)]"
                  >
                    <span className="text-2xl">{toToken.icon}</span>
                    <div className="text-left">
                      <div className="text-[var(--text-primary)] font-[var(--font-weight-bold)]">{toToken.symbol}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  </button>

                  <div className="flex-1 text-right text-[var(--text-3xl)] text-[var(--text-primary)]">
                    {toAmount || "0.0"}
                  </div>
                </div>

                <div className="flex items-center justify-end text-sm">
                  <span className="text-[var(--text-tertiary)]">
                    {toAmount ? `$${(parseFloat(toAmount) * toToken.price).toLocaleString()}` : "$0.00"}
                  </span>
                </div>
              </div>

              {/* Quick Info */}
              {fromAmount && parseFloat(fromAmount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border space-y-2"
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
                className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all"
                style={{
                  background:
                    !fromAmount || swapping || parseFloat(fromAmount) === 0
                      ? "rgba(100, 100, 100, 0.3)"
                      : swapSuccess
                        ? "#22c55e"
                        : `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
                  boxShadow:
                    fromAmount && !swapping && parseFloat(fromAmount) > 0 && !swapSuccess
                      ? `0 0 40px ${accentColor}60`
                      : "none",
                  opacity: !fromAmount || swapping || parseFloat(fromAmount) === 0 ? 0.5 : 1,
                }}
              >
                {swapping ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Swapping...
                  </>
                ) : swapSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Success!
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {fromAmount && parseFloat(fromAmount) > 0 ? "Swap Now" : "Enter Amount"}
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Advanced Trading View */}
          {activeTab === "advanced" && (
            <motion.div
              key="advanced"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Trading Pair Selection */}
              <div className="p-5 rounded-[var(--radius-2xl)] border bg-[var(--bg-hover)] border-[var(--border-neutral)]">
                <label className="text-[var(--text-sm)] text-[var(--text-tertiary)] font-[var(--font-weight-medium)] mb-3 block">Trading Pair</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openTokenModal("from")}
                    className="flex-1 flex items-center gap-2 px-4 py-3 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)] border border-[var(--border-neutral)]"
                  >
                    <span className="text-2xl">{fromToken.icon}</span>
                    <span className="text-[var(--text-primary)] font-[var(--font-weight-bold)]">{fromToken.symbol}</span>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
                  </button>
                  <span className="text-[var(--text-muted)]">/</span>
                  <button
                    onClick={() => openTokenModal("to")}
                    className="flex-1 flex items-center gap-2 px-4 py-3 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)] border border-[var(--border-neutral)]"
                  >
                    <span className="text-2xl">{toToken.icon}</span>
                    <span className="text-[var(--text-primary)] font-[var(--font-weight-bold)]">{toToken.symbol}</span>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="p-5 rounded-[var(--radius-2xl)] border bg-[var(--bg-hover)] border-[var(--border-neutral)]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[var(--text-sm)] text-[var(--text-tertiary)] font-[var(--font-weight-medium)]">Amount</label>
                  <button
                    onClick={() => setFromAmount(fromToken.balance.toString())}
                    className="text-[var(--text-xs)] px-2 py-1 rounded-[var(--radius-lg)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)]"
                    style={{ color: accentColor }}
                  >
                    Max: {fromToken.balance.toFixed(4)}
                  </button>
                </div>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-[var(--text-2xl)] text-[var(--text-primary)] outline-none placeholder:[var(--text-muted)]"
                />
                <div className="text-[var(--text-sm)] text-[var(--text-muted)] mt-2">
                  {fromAmount ? `≈ $${(parseFloat(fromAmount) * fromToken.price).toLocaleString()}` : "$0.00"}
                </div>
              </div>

              {/* Limit Price */}
              <div className="p-5 rounded-[var(--radius-2xl)] border bg-[var(--bg-hover)] border-[var(--border-neutral)]">
                <label className="text-[var(--text-sm)] text-[var(--text-tertiary)] font-[var(--font-weight-medium)] mb-3 block">Limit Price (Optional)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="Market Price"
                    className="w-full bg-transparent text-[var(--text-xl)] text-[var(--text-primary)] outline-none placeholder:[var(--text-muted)]"
                  />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[var(--text-sm)]">
                    {toToken.symbol}
                  </span>
                </div>
                <div className="text-[var(--text-xs)] text-[var(--text-muted)] mt-2">
                  Current: {exchangeRate.toFixed(6)} {toToken.symbol}
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-white/3 border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-orange-400" />
                    <label className="text-xs text-white/60 font-medium">Stop Loss</label>
                  </div>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/20"
                  />
                </div>

                <div className="p-4 rounded-xl border bg-white/3 border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <label className="text-xs text-white/60 font-medium">Take Profit</label>
                  </div>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
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
                  className="p-4 rounded-xl border space-y-2"
                  style={{
                    background: `${accentColor}08`,
                    borderColor: `${accentColor}30`,
                  }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">You'll Receive</span>
                    <span className="text-[var(--text-primary)] font-[var(--font-weight-bold)]">
                      {toAmount} {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">Price Impact</span>
                    <span
                      className="font-medium"
                      style={{
                        color: priceImpact > 5 ? "var(--degen-primary)" : priceImpact > 2 ? "var(--degen-secondary)" : "var(--regen-primary)",
                      }}
                    >
                      {priceImpact < 0.01 ? "<0.01" : priceImpact.toFixed(2)}%
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
                className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all"
                style={{
                  background:
                    !fromAmount || swapping || parseFloat(fromAmount) === 0
                      ? "rgba(100, 100, 100, 0.3)"
                      : swapSuccess
                        ? "#22c55e"
                        : `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
                  boxShadow:
                    fromAmount && !swapping && parseFloat(fromAmount) > 0 && !swapSuccess
                      ? `0 0 40px ${accentColor}60`
                      : "none",
                  opacity: !fromAmount || swapping || parseFloat(fromAmount) === 0 ? 0.5 : 1,
                }}
              >
                {swapping ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Executing...
                  </>
                ) : swapSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Trade Executed!
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    {limitPrice ? "Place Limit Order" : "Execute Trade"}
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => {
                setShowTokenModal(false);
                setSearchQuery("");
              }}
            />

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-white/10 max-h-[80vh] flex flex-col"
              style={{
                boxShadow: `0 0 60px ${accentColor}40`,
              }}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl text-white font-bold">Select Token</h3>
                  <button
                    onClick={() => {
                      setShowTokenModal(false);
                      setSearchQuery("");
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    title="Close token selection modal"
                    aria-label="Close token selection modal"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tokens..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredTokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => selectToken(token)}
                    className="w-full p-4 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border-neutral)] transition-all duration-[var(--duration-normal)] flex items-center gap-3"
                  >
                    <span className="text-3xl">{token.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)] font-[var(--font-weight-bold)]">{token.symbol}</span>
                        {token.trending && <Flame className="w-4 h-4 text-orange-400" />}
                      </div>
                      <div className="text-[var(--text-xs)] text-[var(--text-muted)]">{token.name}</div>
                      <div className="text-[var(--text-xs)] text-[var(--text-muted)] mt-1">Vol: {token.volume24h}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[var(--text-primary)] font-[var(--font-weight-medium)]">${token.price.toLocaleString()}</div>
                      <div
                        className="text-xs font-bold"
                        style={{
                          color: token.change24h >= 0 ? "var(--regen-primary)" : "var(--degen-primary)",
                        }}
                      >
                        {token.change24h >= 0 ? "+" : ""}
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
