import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
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
  DollarSign,
  Percent,
  Calendar,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  Info,
  Loader2,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import BottomNav from "./dashboard/BottomNav";
import { useSwap, type SwapToken, type SwapQuote } from "../hooks/useSwap";
import { useOrders, useDCAPlans, type Order, type DCAPlan } from "../hooks/useOrders";

interface SwapPageProps {
  type: "degen" | "regen";
  onClose: () => void;
  walletAddress?: string;
  chainId?: number;
  activeTab?: "home" | "trading" | "activity" | "more";
  onTabChange?: (tab: "home" | "trading" | "activity" | "more") => void;
}

interface Token {
  symbol: string;
  name: string;
  address?: string;
  decimals?: number;
  balance?: number;
  price?: number;
  icon?: string;
}

// Use types from hooks instead of local interfaces

export function SwapPage({ type, onClose, walletAddress, chainId = 1, activeTab, onTabChange }: SwapPageProps) {
  const [currentTab, setCurrentTab] = useState<"swap" | "limit" | "dca">("swap");

  // Get wallet address from props or localStorage
  const address = walletAddress || localStorage.getItem('walletAddress') || undefined;

  // Use the swap hook for real data
  const {
    tokens: availableTokens,
    isLoadingTokens,
    quote,
    isQuoting,
    getQuote,
    executeSwap: executeSwapTx,
    isSwapping,
    swapError
  } = useSwap(address, chainId);

  // Use real order and DCA hooks
  const { 
    orders, 
    loading: ordersLoading, 
    createOrder: createOrderApi, 
    cancelOrder: cancelOrderApi 
  } = useOrders();
  
  const { 
    plans: dcaPlans, 
    loading: dcaLoading, 
    createPlan: createPlanApi, 
    pausePlan, 
    resumePlan, 
    cancelPlan: cancelPlanApi 
  } = useDCAPlans();

  // Local token state with defaults
  const [fromToken, setFromToken] = useState<Token>({
    symbol: "ETH",
    name: "Ethereum",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    balance: 0,
    price: 2500,
  });
  const [toToken, setToToken] = useState<Token>({
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    balance: 0,
    price: 1.0,
  });
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDCAModal, setShowDCAModal] = useState(false);

  // Update tokens when available from hook
  useEffect(() => {
    if (availableTokens.length > 0) {
      const eth = availableTokens.find(t => t.symbol === 'ETH');
      const usdc = availableTokens.find(t => t.symbol === 'USDC');
      if (eth) setFromToken({ ...eth, balance: eth.balance || 0, price: eth.price || 2500 });
      if (usdc) setToToken({ ...usdc, balance: usdc.balance || 0, price: usdc.price || 1 });
    }
  }, [availableTokens]);

  // Order form state
  const [orderForm, setOrderForm] = useState({
    type: "limit_buy" as Order["type"],
    tokenIn: "USDC",
    tokenOut: "ETH",
    amount: "",
    triggerPrice: "",
  });

  // DCA form state
  const [dcaForm, setDcaForm] = useState({
    tokenSymbol: "ETH",
    amount: "100",
    frequency: "weekly" as DCAPlan["frequency"],
    totalBudget: "",
  });

  const isDegen = type === "degen";

  const colors = {
    primary: isDegen ? "#DC143C" : "#0080FF",
    secondary: isDegen ? "#8B0000" : "#000080",
    gradient: isDegen
      ? "linear-gradient(135deg, rgba(220, 20, 60, 0.2) 0%, rgba(139, 0, 0, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(0, 128, 255, 0.2) 0%, rgba(0, 0, 128, 0.1) 100%)",
    border: isDegen ? "rgba(220, 20, 60, 0.2)" : "rgba(0, 128, 255, 0.2)",
    glow: isDegen
      ? "0 0 20px rgba(220, 20, 60, 0.3), 0 0 40px rgba(139, 0, 0, 0.2)"
      : "0 0 20px rgba(0, 128, 255, 0.3), 0 0 40px rgba(0, 0, 128, 0.2)",
  };

  // Calculate swap using real API quote
  useEffect(() => {
    const fetchQuote = async () => {
      if (fromAmount && parseFloat(fromAmount) > 0 && fromToken.address && toToken.address) {
        // Convert amount to wei/smallest unit
        const decimals = fromToken.decimals || 18;
        const amountWei = (parseFloat(fromAmount) * Math.pow(10, decimals)).toString();

        const newQuote = await getQuote(
          fromToken.address,
          toToken.address,
          amountWei,
          slippage
        );

        if (newQuote) {
          // Convert toAmount from wei to token units
          const toDecimals = toToken.decimals || 18;
          const toAmountFormatted = (parseFloat(newQuote.toAmount) / Math.pow(10, toDecimals)).toFixed(6);
          setToAmount(toAmountFormatted);
        } else {
          // Fallback to simple calculation if API fails
          const rate = (toToken.price || 1) / (fromToken.price || 1);
          setToAmount((parseFloat(fromAmount) * rate).toFixed(6));
        }
      } else {
        setToAmount("");
      }
    };

    // Debounce the quote request
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, slippage, getQuote]);

  const handleSwap = async () => {
    if (!quote || !address) {
      console.error('No quote or wallet address');
      return;
    }

    setSwapping(true);
    try {
      await executeSwapTx(quote);
      setFromAmount("");
      setToAmount("");
    } catch (error) {
      console.error('Swap failed:', error);
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

  const handleCreateOrder = async () => {
    await createOrderApi({
      type: orderForm.type,
      tokenIn: orderForm.tokenIn,
      tokenOut: orderForm.tokenOut,
      amountIn: orderForm.amount,
      triggerPrice: orderForm.triggerPrice,
    });
    setShowOrderModal(false);
    setOrderForm({
      type: "limit_buy",
      tokenIn: "USDC",
      tokenOut: "ETH",
      amount: "",
      triggerPrice: "",
    });
  };

  const handleCreateDCA = async () => {
    await createPlanApi({
      tokenSymbol: dcaForm.tokenSymbol,
      amountPerPurchase: dcaForm.amount,
      frequency: dcaForm.frequency,
      nextPurchaseAt: Date.now() + 1000 * 60 * 60 * 24,
    });
    setShowDCAModal(false);
    setDcaForm({
      tokenSymbol: "ETH",
      amount: "100",
      frequency: "weekly",
      totalBudget: "",
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    await cancelOrderApi(orderId);
  };

  const handleToggleDCA = async (planId: string, currentStatus: string) => {
    if (currentStatus === 'active') {
      await pausePlan(planId);
    } else {
      await resumePlan(planId);
    }
  };

  const handleDeleteDCA = async (planId: string) => {
    await cancelPlanApi(planId);
  };

  const getOrderTypeIcon = (orderType: Order["type"]) => {
    switch (orderType) {
      case "limit_buy":
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case "limit_sell":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case "stop_loss":
        return <Shield className="w-4 h-4 text-orange-400" />;
      case "take_profit":
        return <Target className="w-4 h-4" style={{ color: colors.secondary }} />;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "active":
        return { bg: `${colors.primary}20`, color: colors.primary };
      case "filled":
        return { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" };
      case "cancelled":
        return { bg: "rgba(156, 163, 175, 0.2)", color: "#9ca3af" };
      case "expired":
        return { bg: "rgba(249, 115, 22, 0.2)", color: "#f97316" };
      default:
        return { bg: "rgba(156, 163, 175, 0.2)", color: "#9ca3af" };
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatNextPurchase = (timestamp: number) => {
    const seconds = Math.floor((timestamp - Date.now()) / 1000);
    if (seconds < 60) return `in ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `in ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `in ${hours}h`;
    return `in ${Math.floor(hours / 24)}d`;
  };

  // Stats
  const stats = {
    activeOrders: orders.filter((o) => o.status === "active").length,
    executedOrders: orders.filter((o) => o.status === "filled").length,
    activeDCA: dcaPlans.filter((p) => p.status === "active").length,
    totalVolume: "$45.2K",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[var(--bg-base)] z-50 overflow-y-auto pb-24"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 backdrop-blur-xl border-b"
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          borderColor: colors.border,
        }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl transition-all"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: colors.primary }} />
              </motion.button>
              <div>
                <div className="flex items-center gap-2">
                  <ArrowDownUp className="w-5 h-5" style={{ color: colors.primary }} />
                  <h2 className="text-[var(--text-primary)]">Trading</h2>
                </div>
                <p className="text-xs text-[var(--text-primary)]/50 mt-0.5">
                  {isDegen ? "Fast swaps & aggressive strategies" : "Secure swaps & DCA automation"}
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl transition-all"
              style={{
                background: showSettings ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${showSettings ? colors.primary : colors.border}`,
              }}
            >
              <Settings className="w-5 h-5" style={{ color: showSettings ? colors.primary : "white" }} />
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div
              className="p-3 rounded-xl backdrop-blur-sm"
              style={{
                background: colors.gradient,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Active</div>
              <div className="text-lg text-[var(--text-primary)]">{stats.activeOrders}</div>
            </div>

            <div
              className="p-3 rounded-xl backdrop-blur-sm"
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Executed</div>
              <div className="text-lg text-emerald-400">{stats.executedOrders}</div>
            </div>

            <div
              className="p-3 rounded-xl backdrop-blur-sm"
              style={{
                background: colors.gradient,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">DCA Plans</div>
              <div className="text-lg" style={{ color: colors.secondary }}>
                {stats.activeDCA}
              </div>
            </div>

            <div
              className="p-3 rounded-xl backdrop-blur-sm"
              style={{
                background: colors.gradient,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="text-xs text-[var(--text-primary)]/60">Volume</div>
              <div className="text-lg text-[var(--text-primary)]">{stats.totalVolume}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "swap", label: "Swap", icon: ArrowDownUp },
              { id: "limit", label: "Limit Orders", icon: Target, badge: stats.activeOrders },
              { id: "dca", label: "DCA Bot", icon: Repeat, badge: stats.activeDCA },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm"
                style={{
                  background: activeTab === tab.id ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${activeTab === tab.id ? colors.primary : colors.border}`,
                  color: activeTab === tab.id ? colors.primary : "#9ca3af",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className="min-w-[18px] h-4 px-1.5 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{
                      background: activeTab === tab.id ? colors.primary : "rgba(255, 255, 255, 0.1)",
                      color: activeTab === tab.id ? "white" : "#9ca3af",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
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
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-[var(--border-neutral)] overflow-hidden"
            style={{ borderColor: colors.border }}
          >
            <div className="px-4 py-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--text-primary)]/70">Slippage Tolerance</span>
                  <span className="text-sm" style={{ color: colors.primary }}>
                    {slippage}%
                  </span>
                </div>
                <div className="flex gap-2">
                  {[0.5, 1, 2, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSlippage(val)}
                      className="flex-1 py-2 rounded-lg text-sm transition-all"
                      style={{
                        background: slippage === val ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${slippage === val ? colors.primary : colors.border}`,
                        color: slippage === val ? colors.primary : "white",
                      }}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === "swap" && (
            <motion.div
              key="swap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* From Token */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--text-primary)]/60">From</span>
                  <span className="text-xs text-[var(--text-primary)]/50">
                    Balance: {fromToken.balance.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    }}
                  >
                    {fromToken.symbol.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-[var(--text-primary)]">{fromToken.symbol}</div>
                    <div className="text-xs text-[var(--text-primary)]/50">{fromToken.name}</div>
                  </div>
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-32 bg-transparent text-right text-xl text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div className="text-right text-xs text-[var(--text-primary)]/50 mt-2">
                  ≈ ${fromAmount ? (parseFloat(fromAmount) * fromToken.price).toFixed(2) : "0.00"}
                </div>
              </div>

              {/* Flip Button */}
              <div className="flex justify-center -my-2 relative z-10">
                <motion.button
                  whileTap={{ scale: 0.9, rotate: 180 }}
                  onClick={handleFlipTokens}
                  className="p-2 rounded-xl"
                  style={{
                    background: colors.gradient,
                    border: `1px solid ${colors.primary}`,
                    boxShadow: colors.glow,
                  }}
                >
                  <ArrowDown className="w-5 h-5" style={{ color: colors.primary }} />
                </motion.button>
              </div>

              {/* To Token */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--text-primary)]/60">To</span>
                  <span className="text-xs text-[var(--text-primary)]/50">
                    Balance: {toToken.balance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    }}
                  >
                    {toToken.symbol.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-[var(--text-primary)]">{toToken.symbol}</div>
                    <div className="text-xs text-[var(--text-primary)]/50">{toToken.name}</div>
                  </div>
                  <div className="text-xl text-[var(--text-primary)]">{toAmount || "0.0"}</div>
                </div>
                <div className="text-right text-xs text-[var(--text-primary)]/50 mt-2">
                  ≈ ${toAmount ? (parseFloat(toAmount) * toToken.price).toFixed(2) : "0.00"}
                </div>
              </div>

              {/* Swap Info */}
              {fromAmount && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border space-y-2"
                  style={{
                    background: colors.gradient,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-primary)]/70">Rate</span>
                    <span className="text-[var(--text-primary)]">
                      1 {fromToken.symbol} = {(toToken.price / fromToken.price).toFixed(4)}{" "}
                      {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-primary)]/70">Slippage</span>
                    <span className="text-[var(--text-primary)]">{slippage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-primary)]/70">Network Fee</span>
                    <span className="text-[var(--text-primary)]">~$2.50</span>
                  </div>
                </motion.div>
              )}

              {/* Swap Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSwap}
                disabled={!fromAmount || swapping}
                className="w-full py-4 rounded-xl text-[var(--text-primary)] font-bold flex items-center justify-center gap-2"
                style={{
                  background: !fromAmount || swapping ? "rgba(100, 100, 100, 0.3)" : colors.gradient,
                  border: `1px solid ${!fromAmount || swapping ? "#555" : colors.primary}`,
                  boxShadow: !fromAmount || swapping ? "none" : colors.glow,
                  opacity: !fromAmount || swapping ? 0.5 : 1,
                  cursor: !fromAmount || swapping ? "not-allowed" : "pointer",
                }}
              >
                {swapping ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {fromAmount ? "Swap Now" : "Enter Amount"}
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {activeTab === "limit" && (
            <motion.div
              key="limit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Create Order Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowOrderModal(true)}
                className="w-full py-3 rounded-xl text-[var(--text-primary)] font-bold flex items-center justify-center gap-2"
                style={{
                  background: colors.gradient,
                  border: `1px solid ${colors.primary}`,
                  boxShadow: colors.glow,
                }}
              >
                <Plus className="w-5 h-5" />
                Create Limit Order
              </motion.button>

              {/* Orders List */}
              {orders.length === 0 ? (
                <div
                  className="p-12 rounded-xl border text-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    borderColor: colors.border,
                  }}
                >
                  <Target className="w-12 h-12 mx-auto mb-3 text-[var(--text-primary)]/20" />
                  <div className="text-[var(--text-primary)] mb-1">No Limit Orders</div>
                  <p className="text-sm text-[var(--text-primary)]/50">Create your first limit order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order, index) => {
                    const statusColor = getStatusColor(order.status);
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl border"
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          borderColor: colors.border,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getOrderTypeIcon(order.type)}
                            <div>
                              <div className="text-[var(--text-primary)]">
                                {order.type.replace("_", " ").toUpperCase()}
                              </div>
                              <div className="text-sm text-[var(--text-primary)]/50">
                                {order.amountIn} {order.tokenIn} → {order.tokenOut}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-[var(--text-primary)]">@ ${order.triggerPrice}</div>
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                background: statusColor.bg,
                                color: statusColor.color,
                              }}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-primary)]/40">{formatTimeAgo(order.createdAt)}</span>
                          {order.status === "active" && (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-3 py-1 rounded-lg text-red-400"
                              style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                              }}
                            >
                              Cancel
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "dca" && (
            <motion.div
              key="dca"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Info Banner */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: `${colors.primary}10`,
                  borderColor: `${colors.primary}30`,
                }}
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.primary }} />
                  <div>
                    <div className="text-sm mb-1" style={{ color: colors.primary }}>
                      Dollar Cost Averaging
                    </div>
                    <p className="text-xs text-[var(--text-primary)]/60">
                      Automatically buy crypto at regular intervals to reduce volatility impact
                    </p>
                  </div>
                </div>
              </div>

              {/* Create DCA Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDCAModal(true)}
                className="w-full py-3 rounded-xl text-[var(--text-primary)] font-bold flex items-center justify-center gap-2"
                style={{
                  background: colors.gradient,
                  border: `1px solid ${colors.primary}`,
                  boxShadow: colors.glow,
                }}
              >
                <Plus className="w-5 h-5" />
                Create DCA Plan
              </motion.button>

              {/* DCA Plans List */}
              {dcaPlans.length === 0 ? (
                <div
                  className="p-12 rounded-xl border text-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    borderColor: colors.border,
                  }}
                >
                  <Repeat className="w-12 h-12 mx-auto mb-3 text-[var(--text-primary)]/20" />
                  <div className="text-[var(--text-primary)] mb-1">No DCA Plans</div>
                  <p className="text-sm text-[var(--text-primary)]/50">Set up recurring purchases</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dcaPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            }}
                          >
                            <Repeat className="w-5 h-5 text-[var(--text-primary)]" />
                          </div>
                          <div>
                            <div className="text-[var(--text-primary)]">
                              ${plan.amountPerPurchase} → {plan.tokenSymbol}
                            </div>
                            <div className="text-sm text-[var(--text-primary)]/50 capitalize">
                              {plan.frequency} • {plan.purchases} purchases
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              background:
                                plan.status === "active"
                                  ? `${colors.primary}20`
                                  : "rgba(156, 163, 175, 0.2)",
                              color: plan.status === "active" ? colors.primary : "#9ca3af",
                            }}
                          >
                            {plan.status}
                          </span>
                          {plan.status === "active" ? (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleToggleDCA(plan.id, plan.status)}
                              className="p-2 rounded-lg text-orange-400"
                              style={{
                                background: "rgba(249, 115, 22, 0.1)",
                                border: "1px solid rgba(249, 115, 22, 0.3)",
                              }}
                            >
                              <Pause className="w-4 h-4" />
                            </motion.button>
                          ) : (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleToggleDCA(plan.id, plan.status)}
                              className="p-2 rounded-lg text-emerald-400"
                              style={{
                                background: "rgba(34, 197, 94, 0.1)",
                                border: "1px solid rgba(34, 197, 94, 0.3)",
                              }}
                            >
                              <Play className="w-4 h-4" />
                            </motion.button>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteDCA(plan.id)}
                            className="p-2 rounded-lg text-red-400"
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                      {plan.status === "active" && (
                        <div className="flex items-center gap-1 text-xs text-[var(--text-primary)]/50">
                          <Clock className="w-3 h-3" />
                          Next purchase: {formatNextPurchase(plan.nextPurchaseAt)}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderModal(false)}
              className="fixed inset-0 bg-[var(--bg-base)]/90 backdrop-blur-xl z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-2xl border z-50 overflow-hidden"
              style={{
                background: "rgba(0, 0, 0, 0.95)",
                borderColor: colors.border,
                boxShadow: colors.glow,
              }}
            >
              <div className="p-6">
                <h3 className="text-xl text-[var(--text-primary)] mb-4">Create Limit Order</h3>

                {/* Order Type */}
                <div className="mb-4">
                  <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">Order Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["limit_buy", "limit_sell", "stop_loss", "take_profit"].map((orderType) => (
                      <button
                        key={orderType}
                        onClick={() => setOrderForm({ ...orderForm, type: orderType as any })}
                        className="p-3 rounded-xl text-sm transition-all"
                        style={{
                          background:
                            orderForm.type === orderType ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                          border: `1px solid ${orderForm.type === orderType ? colors.primary : colors.border}`,
                          color: orderForm.type === orderType ? colors.primary : "white",
                        }}
                      >
                        {orderType.replace("_", " ").toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Token Pair */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">From</label>
                    <input
                      type="text"
                      value={orderForm.tokenIn}
                      onChange={(e) => setOrderForm({ ...orderForm, tokenIn: e.target.value })}
                      className="w-full bg-white/5 border rounded-xl p-3 text-[var(--text-primary)] outline-none"
                      style={{ borderColor: colors.border }}
                      placeholder="USDC"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">To</label>
                    <input
                      type="text"
                      value={orderForm.tokenOut}
                      onChange={(e) => setOrderForm({ ...orderForm, tokenOut: e.target.value })}
                      className="w-full bg-white/5 border rounded-xl p-3 text-[var(--text-primary)] outline-none"
                      style={{ borderColor: colors.border }}
                      placeholder="ETH"
                    />
                  </div>
                </div>

                {/* Amount & Price */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">Amount</label>
                    <input
                      type="number"
                      value={orderForm.amount}
                      onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                      className="w-full bg-white/5 border rounded-xl p-3 text-[var(--text-primary)] outline-none"
                      style={{ borderColor: colors.border }}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">Trigger Price</label>
                    <input
                      type="number"
                      value={orderForm.triggerPrice}
                      onChange={(e) => setOrderForm({ ...orderForm, triggerPrice: e.target.value })}
                      className="w-full bg-white/5 border rounded-xl p-3 text-[var(--text-primary)] outline-none"
                      style={{ borderColor: colors.border }}
                      placeholder="2200"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 py-3 rounded-xl text-[var(--text-primary)]"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateOrder}
                    className="flex-1 py-3 rounded-xl text-[var(--text-primary)]"
                    style={{
                      background: colors.gradient,
                      border: `1px solid ${colors.primary}`,
                      boxShadow: colors.glow,
                    }}
                  >
                    Create Order
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DCA Modal */}
      <AnimatePresence>
        {showDCAModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDCAModal(false)}
              className="fixed inset-0 bg-[var(--bg-base)]/90 backdrop-blur-xl z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-2xl border z-50 overflow-hidden"
              style={{
                background: "rgba(0, 0, 0, 0.95)",
                borderColor: colors.border,
                boxShadow: colors.glow,
              }}
            >
              <div className="p-6">
                <h3 className="text-xl text-[var(--text-primary)] mb-4">Create DCA Plan</h3>

                {/* Token */}
                <div className="mb-4">
                  <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">Token to Buy</label>
                  <div className="flex gap-2">
                    {["ETH", "BTC", "SOL", "ARB"].map((token) => (
                      <button
                        key={token}
                        onClick={() => setDcaForm({ ...dcaForm, tokenSymbol: token })}
                        className="flex-1 px-4 py-2 rounded-xl text-sm transition-all"
                        style={{
                          background:
                            dcaForm.tokenSymbol === token ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                          border: `1px solid ${dcaForm.tokenSymbol === token ? colors.primary : colors.border}`,
                          color: dcaForm.tokenSymbol === token ? colors.primary : "white",
                        }}
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">Amount per Purchase (USD)</label>
                  <div className="flex gap-2">
                    {["25", "50", "100", "250", "500"].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDcaForm({ ...dcaForm, amount: amt })}
                        className="flex-1 px-3 py-2 rounded-xl text-sm transition-all"
                        style={{
                          background: dcaForm.amount === amt ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                          border: `1px solid ${dcaForm.amount === amt ? colors.primary : colors.border}`,
                          color: dcaForm.amount === amt ? colors.primary : "white",
                        }}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div className="mb-4">
                  <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">Frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["daily", "weekly", "biweekly", "monthly"].map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setDcaForm({ ...dcaForm, frequency: freq as any })}
                        className="p-3 rounded-xl text-sm capitalize transition-all"
                        style={{
                          background:
                            dcaForm.frequency === freq ? colors.gradient : "rgba(255, 255, 255, 0.05)",
                          border: `1px solid ${dcaForm.frequency === freq ? colors.primary : colors.border}`,
                          color: dcaForm.frequency === freq ? colors.primary : "white",
                        }}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Budget */}
                <div className="mb-6">
                  <label className="text-sm text-[var(--text-primary)]/60 mb-2 block">Total Budget (optional)</label>
                  <input
                    type="number"
                    value={dcaForm.totalBudget}
                    onChange={(e) => setDcaForm({ ...dcaForm, totalBudget: e.target.value })}
                    className="w-full bg-white/5 border rounded-xl p-3 text-[var(--text-primary)] outline-none"
                    style={{ borderColor: colors.border }}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                {/* Summary */}
                <div
                  className="p-4 rounded-xl mb-6"
                  style={{
                    background: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}30`,
                  }}
                >
                  <div className="text-sm mb-1" style={{ color: colors.primary }}>
                    Plan Summary
                  </div>
                  <div className="text-sm text-[var(--text-primary)]/70">
                    Buy ${dcaForm.amount} of {dcaForm.tokenSymbol} every {dcaForm.frequency}
                    {dcaForm.totalBudget && ` until $${dcaForm.totalBudget} spent`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDCAModal(false)}
                    className="flex-1 py-3 rounded-xl text-[var(--text-primary)]"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateDCA}
                    className="flex-1 py-3 rounded-xl text-[var(--text-primary)]"
                    style={{
                      background: colors.gradient,
                      border: `1px solid ${colors.primary}`,
                      boxShadow: colors.glow,
                    }}
                  >
                    Start DCA
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {activeTab && onTabChange && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          tribe={type}
        />
      )}
    </motion.div>
  );
}