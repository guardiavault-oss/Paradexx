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
  Droplets,
  BarChart3,
  Activity,
} from "lucide-react";

interface SwapPageProps {
  type: "degen" | "regen";
  onClose: () => void;
}

interface Token {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  change24h: number;
  icon: string;
  favorite?: boolean;
}

const TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", balance: 5.42, price: 2340.5, change24h: 3.2, icon: "⟠" },
  { symbol: "USDC", name: "USD Coin", balance: 12450.0, price: 1.0, change24h: 0.01, icon: "💵" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", balance: 0.15, price: 43250.0, change24h: 2.1, icon: "₿" },
  { symbol: "DAI", name: "Dai Stablecoin", balance: 5000.0, price: 1.0, change24h: -0.02, icon: "◈" },
  { symbol: "USDT", name: "Tether", balance: 8000.0, price: 1.0, change24h: 0.0, icon: "₮" },
  { symbol: "UNI", name: "Uniswap", balance: 250.0, price: 6.42, change24h: 5.7, icon: "🦄" },
  { symbol: "LINK", name: "Chainlink", balance: 150.0, price: 14.23, change24h: -1.2, icon: "⛓️" },
  { symbol: "AAVE", name: "Aave", balance: 45.0, price: 89.54, change24h: 4.3, icon: "👻" },
];

export function SwapPageEnhanced({ type, onClose }: SwapPageProps) {
  const [fromToken, setFromToken] = useState<Token>(TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [swapping, setSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [priceRefreshing, setPriceRefreshing] = useState(false);
  const [recentSwaps, setRecentSwaps] = useState<any[]>([]);

  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

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
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setSwapping(false);
    setSwapSuccess(true);

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
    setSearchQuery("");
  };

  const filteredTokens = TOKENS.filter(
    token =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exchangeRate = toToken.price / fromToken.price;
  const priceImpact = parseFloat(fromAmount) > 0 ? ((parseFloat(fromAmount) * fromToken.price) / 1000000) * 100 : 0;
  const networkFee = 2.5;
  const totalCost = parseFloat(fromAmount || "0") * fromToken.price + networkFee;
  const minReceived = toAmount ? parseFloat(toAmount) * (1 - slippage / 100) : 0;

  return (
    <div className="min-h-screen bg-black overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
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
                  <ArrowDownUp className="w-5 h-5" style={{ color: accentColor }} />
                  <h2 className="text-white text-xl">Swap</h2>
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  Trade tokens instantly
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRefreshPrice}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <RefreshCw
                  className={`w-5 h-5 text-white/60 ${priceRefreshing ? "animate-spin" : ""}`}
                />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-xl transition-all"
                style={{
                  background: showSettings ? `${accentColor}20` : "rgba(255, 255, 255, 0.05)",
                  borderColor: showSettings ? accentColor : "rgba(255, 255, 255, 0.1)",
                  border: "1px solid",
                }}
              >
                <Settings
                  className="w-5 h-5"
                  style={{ color: showSettings ? accentColor : "rgba(255, 255, 255, 0.6)" }}
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
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-900/50 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-white/70">Slippage Tolerance</label>
                  <span className="text-sm font-bold" style={{ color: accentColor }}>
                    {slippage}%
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[0.1, 0.5, 1.0, 3.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setSlippage(val);
                        setCustomSlippage("");
                      }}
                      className="py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: slippage === val ? `${accentColor}20` : "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${slippage === val ? accentColor : "rgba(255, 255, 255, 0.1)"}`,
                        color: slippage === val ? accentColor : "white",
                      }}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={customSlippage}
                  onChange={(e) => {
                    setCustomSlippage(e.target.value);
                    if (e.target.value) setSlippage(parseFloat(e.target.value));
                  }}
                  placeholder="Custom %"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/20"
                />
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-400 mb-1">Slippage Info</p>
                  <p className="text-xs text-white/60">
                    Your transaction will revert if the price changes unfavorably by more than this percentage.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto pb-24">
        {/* From Token Card */}
        <motion.div
          className="p-5 rounded-2xl border relative overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
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
              onClick={() => setShowFromTokens(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              <span className="text-2xl">{fromToken.icon}</span>
              <div className="text-left">
                <div className="text-white font-bold">{fromToken.symbol}</div>
                <div className="text-xs text-white/40">{fromToken.name}</div>
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
              Balance: {fromToken.balance.toFixed(4)} {fromToken.symbol}
            </span>
            <span className="text-white/60">
              {fromAmount ? `≈ $${(parseFloat(fromAmount) * fromToken.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
            </span>
          </div>
        </motion.div>

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
        <motion.div
          className="p-5 rounded-2xl border relative overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-white/60 font-medium">You Receive</label>
            <span className="text-xs text-white/40">
              Balance: {toToken.balance.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setShowToTokens(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              <span className="text-2xl">{toToken.icon}</span>
              <div className="text-left">
                <div className="text-white font-bold">{toToken.symbol}</div>
                <div className="text-xs text-white/40">{toToken.name}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </button>

            <div className="flex-1 text-right text-3xl text-white">
              {toAmount || "0.0"}
            </div>
          </div>

          <div className="flex items-center justify-end text-sm">
            <span className="text-white/60">
              {toAmount ? `≈ $${(parseFloat(toAmount) * toToken.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
            </span>
          </div>
        </motion.div>

        {/* Swap Details */}
        {fromAmount && parseFloat(fromAmount) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border space-y-3"
            style={{
              background: `${accentColor}05`,
              borderColor: `${accentColor}20`,
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Rate</span>
              <span className="text-white font-medium">
                1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-white/60">
                <span>Price Impact</span>
                <Info className="w-3.5 h-3.5" />
              </div>
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
              <span className="text-white font-medium">~${networkFee.toFixed(2)}</span>
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Minimum Received</span>
              <span className="text-white font-medium">
                {minReceived.toFixed(6)} {toToken.symbol}
              </span>
            </div>

            {priceImpact > 5 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">High Price Impact</p>
                  <p className="text-xs text-white/60 mt-0.5">
                    This trade will move the market significantly. Consider splitting into smaller trades.
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
            cursor:
              !fromAmount || swapping || swapSuccess || parseFloat(fromAmount) === 0
                ? "not-allowed"
                : "pointer",
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
              Swap Successful!
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              {fromAmount && parseFloat(fromAmount) > 0 ? "Swap Tokens" : "Enter Amount"}
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
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-white/40" />
              <h3 className="text-sm text-white/60 font-medium">Recent Swaps</h3>
            </div>
            <div className="space-y-2">
              {recentSwaps.map((swap, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-xl bg-white/3 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white">
                      {parseFloat(swap.fromAmount).toFixed(4)} {swap.from}
                    </span>
                    <ArrowDownUp className="w-3 h-3 text-white/40" />
                    <span className="text-white">
                      {parseFloat(swap.toAmount).toFixed(4)} {swap.to}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => {
                setShowFromTokens(false);
                setShowToTokens(false);
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
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl text-white font-bold">Select Token</h3>
                  <button
                    onClick={() => {
                      setShowFromTokens(false);
                      setShowToTokens(false);
                      setSearchQuery("");
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or symbol"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                    autoFocus
                  />
                </div>
              </div>

              {/* Token List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredTokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => selectToken(token, showFromTokens)}
                    className="w-full p-4 rounded-xl bg-white/3 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-3"
                  >
                    <span className="text-3xl">{token.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{token.symbol}</span>
                        {token.favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <div className="text-xs text-white/40">{token.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{token.balance.toFixed(4)}</div>
                      <div
                        className="text-xs"
                        style={{
                          color: token.change24h >= 0 ? "#22c55e" : "#ef4444",
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