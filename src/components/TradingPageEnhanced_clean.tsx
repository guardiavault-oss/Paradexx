import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
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
}

const TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", balance: 5.42, price: 2340.5, change24h: 3.2, volume24h: "$18.4B", icon: "⟠", trending: true },
  { symbol: "USDC", name: "USD Coin", balance: 12450.0, price: 1.0, change24h: 0.01, volume24h: "$4.2B", icon: "💵" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", balance: 0.15, price: 43250.0, change24h: 2.1, volume24h: "$1.8B", icon: "₿", trending: true },
  { symbol: "UNI", name: "Uniswap", balance: 250.0, price: 6.42, change24h: 5.7, volume24h: "$245M", icon: "🦄", trending: true },
  { symbol: "LINK", name: "Chainlink", balance: 150.0, price: 14.23, change24h: -1.2, volume24h: "$512M", icon: "⛓️" },
  { symbol: "AAVE", name: "Aave", balance: 45.0, price: 89.54, change24h: 4.3, volume24h: "$156M", icon: "👻", trending: true },
  { symbol: "PEPE", name: "Pepe", balance: 1000000.0, price: 0.0000012, change24h: 12.4, volume24h: "$890M", icon: "🐸", trending: true },
  { symbol: "ARB", name: "Arbitrum", balance: 2500.0, price: 1.23, change24h: 8.1, volume24h: "$345M", icon: "🔷", trending: true },
];

export function TradingPageEnhanced({ type, onClose }: TradingPageProps) {
  const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple");
  const [fromToken, setFromToken] = useState<Token>(TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");
  const [searchQuery, setSearchQuery] = useState("");
  const [swapping, setSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);

  // Advanced trading state
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  const trendingTokens = TOKENS.filter(t => t.trending);

  // Calculate exchange rate and amounts
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const rate = toToken.price / fromToken.price;
      const calculated = parseFloat(fromAmount) * rate;
      setToAmount(calculated.toFixed(6));
    } else {
      setToAmount("");
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) === 0) return;
    setSwapping(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setSwapping(false);
    setSwapSuccess(true);
    setTimeout(() => {
      setSwapSuccess(false);
      setFromAmount("");
      setToAmount("");
    }, 2000);
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

  const filteredTokens = TOKENS.filter(
    token =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exchangeRate = toToken.price / fromToken.price;
  const priceImpact = parseFloat(fromAmount) > 0 ? ((parseFloat(fromAmount) * fromToken.price) / 1000000) * 100 : 0;
  const networkFee = 2.5;

  return (
    <div className="min-h-screen overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-16 z-20 backdrop-blur-xl border-b border-white/10 bg-black/80">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" style={{ color: accentColor }} />
              </motion.button>
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: accentColor }} />
                  <h2 className="text-2xl md:text-3xl font-bold text-white font-[Suez_One]">Trading</h2>
                </div>
                <p className="text-sm text-white/50 mt-1">
                  {isDegen ? "Fast trades & high leverage" : "Smart trades & automation"}
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl transition-all"
              style={{
                background: showSettings ? `${accentColor}20` : "rgba(255, 255, 255, 0.05)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: showSettings ? accentColor : "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Settings
                className="w-5 h-5"
                style={{ color: showSettings ? accentColor : "rgba(255, 255, 255, 0.6)" }}
              />
            </motion.button>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("simple")}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: activeTab === "simple" ? accentColor : "transparent",
                color: activeTab === "simple" ? "white" : "rgba(255, 255, 255, 0.6)",
              }}
            >
              Simple
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: activeTab === "advanced" ? accentColor : "transparent",
                color: activeTab === "advanced" ? "white" : "rgba(255, 255, 255, 0.6)",
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
            className="bg-black/50 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-white/70">Slippage Tolerance</label>
                <span className="text-sm font-bold" style={{ color: accentColor }}>
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
                      background: slippage === val ? `${accentColor}20` : "rgba(255, 255, 255, 0.05)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: slippage === val ? accentColor : "rgba(255, 255, 255, 0.1)",
                      color: slippage === val ? accentColor : "white",
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
      <div className="px-4 md:px-6 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Trending Tokens */}
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4" style={{ color: accentColor }} />
            <h3 className="text-sm text-white font-bold font-[Suez_One]">Trending</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trendingTokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => {
                  setFromToken(token);
                  setToToken(TOKENS[1]);
                }}
                className="flex-shrink-0 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all min-w-[140px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{token.icon}</span>
                  <span className="text-white font-bold text-sm">{token.symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">${token.price.toLocaleString()}</span>
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: token.change24h >= 0 ? "#22c55e" : "#ef4444",
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
        {activeTab === "simple" && (
          <div className="space-y-4">
            {/* From Token Card */}
            <div className="p-5 rounded-2xl border bg-black/60 backdrop-blur-md border-white/10">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-white/60 font-medium">You Pay</label>
                <button
                  onClick={() => setFromAmount(fromToken.balance.toString())}
                  className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  style={{ color: accentColor }}
                >
                  Max
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => openTokenModal("from")}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <span className="text-2xl">{fromToken.icon}</span>
                  <div className="text-left">
                    <div className="text-white font-bold">{fromToken.symbol}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>

                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-right text-3xl text-white outline-none placeholder:text-white/20"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">
                  Balance: {fromToken.balance.toFixed(4)}
                </span>
                <span className="text-white/60">
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
                <ArrowDown className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* To Token Card */}
            <div className="p-5 rounded-2xl border bg-black/60 backdrop-blur-md border-white/10">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-white/60 font-medium">You Receive</label>
                <span className="text-xs text-white/40">
                  Balance: {toToken.balance.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => openTokenModal("to")}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <span className="text-2xl">{toToken.icon}</span>
                  <div className="text-left">
                    <div className="text-white font-bold">{toToken.symbol}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>

                <div className="flex-1 text-right text-3xl text-white">
                  {toAmount || "0.0"}
                </div>
              </div>

              <div className="flex items-center justify-end text-sm">
                <span className="text-white/60">
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
                  <span className="text-white/60">Rate</span>
                  <span className="text-white">
                    1 {fromToken.symbol} ≈ {exchangeRate.toFixed(4)} {toToken.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Network Fee</span>
                  <span className="text-white">~${networkFee.toFixed(2)}</span>
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
          </div>
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
            <div className="p-5 rounded-2xl border bg-black/60 backdrop-blur-md border-white/10">
              <label className="text-sm text-white/60 font-medium mb-3 block">Trading Pair</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openTokenModal("from")}
                  className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <span className="text-2xl">{fromToken.icon}</span>
                  <span className="text-white font-bold">{fromToken.symbol}</span>
                  <ChevronDown className="w-4 h-4 text-white/40 ml-auto" />
                </button>
                <span className="text-white/40">/</span>
                <button
                  onClick={() => openTokenModal("to")}
                  className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <span className="text-2xl">{toToken.icon}</span>
                  <span className="text-white font-bold">{toToken.symbol}</span>
                  <ChevronDown className="w-4 h-4 text-white/40 ml-auto" />
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="p-5 rounded-2xl border bg-black/60 backdrop-blur-md border-white/10">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-white/60 font-medium">Amount</label>
                <button
                  onClick={() => setFromAmount(fromToken.balance.toString())}
                  className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
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
                className="w-full bg-transparent text-2xl text-white outline-none placeholder:text-white/20"
              />
              <div className="text-sm text-white/40 mt-2">
                {fromAmount ? `≈ $${(parseFloat(fromAmount) * fromToken.price).toLocaleString()}` : "$0.00"}
              </div>
            </div>

            {/* Limit Price */}
            <div className="p-5 rounded-2xl border bg-black/60 backdrop-blur-md border-white/10">
              <label className="text-sm text-white/60 font-medium mb-3 block">Limit Price (Optional)</label>
              <div className="relative">
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="Market Price"
                  className="w-full bg-transparent text-xl text-white outline-none placeholder:text-white/20"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  {toToken.symbol}
                </span>
              </div>
              <div className="text-xs text-white/40 mt-2">
                Current: {exchangeRate.toFixed(6)} {toToken.symbol}
              </div>
            </div>

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-black/60 backdrop-blur-md border-white/10">
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

              <div className="p-4 rounded-xl border bg-black/60 backdrop-blur-md border-white/10">
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
                  <span className="text-white/60">You'll Receive</span>
                  <span className="text-white font-bold">
                    {toAmount} {toToken.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Price Impact</span>
                  <span
                    className="font-medium"
                    style={{
                      color: priceImpact > 5 ? "#ef4444" : priceImpact > 2 ? "#f59e0b" : "#22c55e",
                    }}
                  >
                    {priceImpact < 0.01 ? "<0.01" : priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Network Fee</span>
                  <span className="text-white">~${networkFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Slippage Tolerance</span>
                  <span className="text-white">{slippage}%</span>
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
      </div>

      {/* Token Selection Modal */}
      <AnimatePresence>
        {showTokenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowTokenModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-black/90 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Select Token</h3>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-white/20"
                />
              </div>

              {/* Token List */}
              <div className="space-y-2 overflow-y-auto max-h-96">
                {filteredTokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => selectToken(token)}
                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{token.icon}</span>
                        <div>
                          <div className="text-white font-bold">{token.symbol}</div>
                          <div className="text-sm text-white/40">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{token.balance.toFixed(4)}</div>
                        <div className="text-sm text-white/40">${token.price.toLocaleString()}</div>
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
