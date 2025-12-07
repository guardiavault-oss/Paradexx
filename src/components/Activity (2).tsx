import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Filter,
  ArrowUpDown,
  Send,
  Download,
  Repeat,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  Copy,
  Download as DownloadIcon,
  ArrowLeft,
  ArrowDownLeft,
  CheckCircle2,
  Zap,
  Calendar,
} from 'lucide-react';
import { PullToRefresh } from './ui/PullToRefresh';
import BottomNav from "./dashboard/BottomNav";

export interface Transaction {
  hash: string;
  type: "send" | "receive" | "swap" | "approve" | "contract";
  status: "pending" | "confirming" | "success" | "failed";
  from: string;
  to: string;
  value: string;
  token: string;
  valueUSD?: number;
  gasUsed?: string;
  gasPrice?: string;
  gasCostUSD?: number;
  timestamp: number;
  confirmations?: number;
  blockNumber?: number;
  error?: string;
  swapDetails?: {
    fromToken: string;
    fromAmount: string;
    toToken: string;
    toAmount: string;
  };
}

interface ActivityProps {
  type: "degen" | "regen";
  onClose: () => void;
  userAddress?: string;
  activeTab?: "home" | "trading" | "activity" | "more";
  onTabChange?: (tab: "home" | "trading" | "activity" | "more") => void;
}

export function Activity({ type, onClose, userAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f3f4a", activeTab, onTabChange }: ActivityProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<Transaction["type"] | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Transaction["status"] | "all">("all");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const isDegen = type === "degen";

  // Color system based on tribe
  const colors = {
    primary: isDegen ? "#ff3366" : "#00d4ff",
    secondary: isDegen ? "#ff9500" : "#00ff88",
    gradient: isDegen
      ? "linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 149, 0, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 255, 136, 0.1) 100%)",
    border: isDegen ? "rgba(255, 51, 102, 0.2)" : "rgba(0, 212, 255, 0.2)",
    glow: isDegen
      ? "0 0 20px rgba(255, 51, 102, 0.3), 0 0 40px rgba(255, 149, 0, 0.2)"
      : "0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 255, 136, 0.2)",
  };

  // Mock transaction data
  const mockTransactions: Transaction[] = [
    {
      hash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
      type: "swap",
      status: "success",
      from: userAddress,
      to: "0x1234567890abcdef1234567890abcdef12345678",
      value: "1.5",
      token: "ETH",
      valueUSD: 4725.50,
      gasCostUSD: 12.45,
      timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
      confirmations: 45,
      swapDetails: {
        fromToken: "ETH",
        fromAmount: "1.5",
        toToken: "USDC",
        toAmount: "4,725.50",
      },
    },
    {
      hash: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      type: "receive",
      status: "success",
      from: "0xabcdef1234567890abcdef1234567890abcdef12",
      to: userAddress,
      value: "0.5",
      token: "ETH",
      valueUSD: 1575.25,
      gasCostUSD: 0,
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      confirmations: 120,
    },
    {
      hash: "0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
      type: "send",
      status: "success",
      from: userAddress,
      to: "0x9876543210fedcba9876543210fedcba98765432",
      value: "250.00",
      token: "USDC",
      valueUSD: 250.00,
      gasCostUSD: 8.32,
      timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
      confirmations: 240,
    },
    {
      hash: "0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      type: "swap",
      status: "pending",
      from: userAddress,
      to: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      value: "100.00",
      token: "USDC",
      valueUSD: 100.00,
      timestamp: Date.now() - 1000 * 60 * 2, // 2 mins ago
      swapDetails: {
        fromToken: "USDC",
        fromAmount: "100.00",
        toToken: "DAI",
        toAmount: "100.15",
      },
    },
    {
      hash: "0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      type: "approve",
      status: "success",
      from: userAddress,
      to: "0x1inch1111111111111111111111111111111111",
      value: "0.00",
      token: "USDC",
      gasCostUSD: 5.67,
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // Yesterday
      confirmations: 1500,
    },
    {
      hash: "0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
      type: "receive",
      status: "success",
      from: "0xdeadbeef1234567890abcdef1234567890abcdef",
      to: userAddress,
      value: "1000.00",
      token: "USDT",
      valueUSD: 1000.00,
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
      confirmations: 3000,
    },
    {
      hash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
      type: "swap",
      status: "failed",
      from: userAddress,
      to: "0x1234567890abcdef1234567890abcdef12345678",
      value: "0.1",
      token: "ETH",
      valueUSD: 315.00,
      gasCostUSD: 18.90,
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
      error: "Transaction failed: Insufficient liquidity",
      swapDetails: {
        fromToken: "ETH",
        fromAmount: "0.1",
        toToken: "SHIB",
        toAmount: "0",
      },
    },
    {
      hash: "0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567",
      type: "contract",
      status: "success",
      from: userAddress,
      to: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      value: "0.05",
      token: "ETH",
      valueUSD: 157.50,
      gasCostUSD: 22.15,
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
      confirmations: 7500,
    },
  ];

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = mockTransactions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.hash.toLowerCase().includes(query) ||
          tx.from.toLowerCase().includes(query) ||
          tx.to.toLowerCase().includes(query) ||
          tx.token.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.type === filterType);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((tx) => tx.status === filterStatus);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = Date.now();
      const ranges = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - ranges[dateRange];
      filtered = filtered.filter((tx) => tx.timestamp >= cutoff);
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [searchQuery, filterType, filterStatus, dateRange]);

  // Separate pending from completed
  const pendingTxs = filteredTransactions.filter(
    (tx) => tx.status === "pending" || tx.status === "confirming"
  );
  const completedTxs = filteredTransactions.filter(
    (tx) => tx.status === "success" || tx.status === "failed"
  );

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};

    completedTxs.forEach((tx) => {
      const date = new Date(tx.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tx);
    });

    return groups;
  }, [completedTxs]);

  // Calculate stats
  const totalValue = filteredTransactions.reduce((sum, tx) => sum + (tx.valueUSD || 0), 0);
  const totalGas = filteredTransactions.reduce((sum, tx) => sum + (tx.gasCostUSD || 0), 0);
  const successRate = (filteredTransactions.filter(tx => tx.status === "success").length / filteredTransactions.length) * 100 || 0;

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Type",
      "Hash",
      "From",
      "To",
      "Amount",
      "Token",
      "Value (USD)",
      "Gas (USD)",
      "Status",
    ];
    const rows = filteredTransactions.map((tx) => [
      new Date(tx.timestamp).toISOString(),
      tx.type,
      tx.hash,
      tx.from,
      tx.to,
      tx.value,
      tx.token,
      tx.valueUSD?.toFixed(2) || "",
      tx.gasCostUSD?.toFixed(2) || "",
      tx.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paradex_transactions_${Date.now()}.csv`;
    a.click();
  };

  const getTypeIcon = (txType: Transaction["type"]) => {
    switch (txType) {
      case "send":
        return <Send className="w-5 h-5" />;
      case "receive":
        return <ArrowDownLeft className="w-5 h-5" />;
      case "swap":
        return <Repeat className="w-5 h-5" />;
      case "approve":
        return <CheckCircle2 className="w-5 h-5" />;
      case "contract":
        return <Zap className="w-5 h-5" />;
    }
  };

  const getTypeColor = (txType: Transaction["type"]) => {
    switch (txType) {
      case "send":
        return "#ef4444";
      case "receive":
        return colors.secondary;
      case "swap":
        return colors.primary;
      case "approve":
        return "#a855f7";
      case "contract":
        return "#f59e0b";
    }
  };

  const getTypeLabel = (txType: Transaction["type"]) => {
    switch (txType) {
      case "send":
        return "Sent";
      case "receive":
        return "Received";
      case "swap":
        return "Swapped";
      case "approve":
        return "Approved";
      case "contract":
        return "Contract";
    }
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    const styles = {
      pending: {
        bg: "rgba(249, 115, 22, 0.1)",
        border: "#f97316",
        color: "#f97316",
        icon: <Clock className="w-3 h-3" />,
      },
      confirming: {
        bg: "rgba(249, 115, 22, 0.1)",
        border: "#f97316",
        color: "#f97316",
        icon: <Clock className="w-3 h-3" />,
      },
      success: {
        bg: isDegen ? "rgba(255, 149, 0, 0.1)" : "rgba(0, 255, 136, 0.1)",
        border: colors.secondary,
        color: colors.secondary,
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      failed: {
        bg: "rgba(239, 68, 68, 0.1)",
        border: "#ef4444",
        color: "#ef4444",
        icon: <AlertCircle className="w-3 h-3" />,
      },
    };

    const style = styles[status];

    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs"
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          color: style.color,
        }}
      >
        {style.icon}
        <span className="capitalize text-[rgb(255,255,255)]">{status}</span>
      </div>
    );
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isOutgoing = (tx: Transaction) =>
    tx.from.toLowerCase() === userAddress.toLowerCase();

  return (
    <>
      {/* Page Wrapper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen text-white pb-24 md:pb-20"
      >
        {/* Header */}
        <div className="sticky top-16 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10 rounded-[83px] px-[10px] py-[-16px] mx-[5px] my-[31px]">
          <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 max-w-7xl mx-auto rounded-[58px]">
            <div className="flex items-center gap-3 md:gap-4 flex-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Activity
                </h1>
                <p className="text-sm text-white/50 mt-1">
                  Transaction History
                </p>
              </div>
            </div>

            {/* Filter Toggle - Mobile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg md:hidden"
              style={{
                background: showFilters ? colors.primary + "40" : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${showFilters ? colors.primary : "rgba(255, 255, 255, 0.1)"}`,
              }}
            >
              <Filter className="w-5 h-5" />
            </motion.button>

            {/* Export Button - Desktop */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm"
              style={{
                background: colors.primary,
                color: "white",
              }}
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="px-4 pt-[0px] space-y-6 bg-[rgb(0,0,0)] rounded-[58px] pr-[16px] pb-[9px] pl-[16px] mx-[-8px] my-[0px]">
          {/* Pending Transactions */}
          {pendingTxs.length > 0 && (
            <div className="px-[-77px] py-[0px] mt-[0px] mr-[-33px] mb-[7px] ml-[-29px]">
              <div className="flex items-center gap-2 mb-[12px] px-[79px] py-[-15px] bg-[rgba(0,0,0,0)] mt-[-5px] mr-[0px] ml-[-31px]">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm text-white/60 px-[-8px] py-[-16px] mx-[-5px] my-[17px]">Pending</h3>
              </div>
              <div className="space-y-3 bg-[rgba(0,0,0,0)] px-[-10px] py-[0px] rounded-[125px] mx-[37px] my-[0px]">
                <AnimatePresence mode="popLayout">
                  {pendingTxs.map((tx, index) => (
                    <TransactionItem
                      key={tx.hash}
                      transaction={tx}
                      userAddress={userAddress}
                      colors={colors}
                      onClick={() => setSelectedTx(tx)}
                      index={index}
                      getTypeIcon={getTypeIcon}
                      getTypeColor={getTypeColor}
                      getTypeLabel={getTypeLabel}
                      getStatusBadge={getStatusBadge}
                      formatAddress={formatAddress}
                      isOutgoing={isOutgoing(tx)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Grouped Transactions */}
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-[-21px] px-[25px] py-[0px] mt-[1px] mr-[0px] ml-[0px]">
                <Calendar className="w-4 h-4 text-white/60" />
                <h3 className="text-sm text-white/60">{date}</h3>
              </div>
              <div className="space-y-3 bg-[rgba(0,0,0,0.8)] px-[0px] py-[6px] mx-[7px] my-[25px]">
                <AnimatePresence mode="popLayout">
                  {txs.map((tx, index) => (
                    <TransactionItem
                      key={tx.hash}
                      transaction={tx}
                      userAddress={userAddress}
                      colors={colors}
                      onClick={() => setSelectedTx(tx)}
                      index={index}
                      getTypeIcon={getTypeIcon}
                      getTypeColor={getTypeColor}
                      getTypeLabel={getTypeLabel}
                      getStatusBadge={getStatusBadge}
                      formatAddress={formatAddress}
                      isOutgoing={isOutgoing(tx)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Clock className="w-16 h-16 text-white/20 mb-4" />
              <h3 className="text-lg text-white/60 mb-2">No transactions found</h3>
              <p className="text-sm text-white/40">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        <AnimatePresence>
          {selectedTx && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTx(null)}
                className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50"
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
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: `${getTypeColor(selectedTx.type)}20`,
                          color: getTypeColor(selectedTx.type),
                        }}
                      >
                        {getTypeIcon(selectedTx.type)}
                      </div>
                      <div>
                        <h3 className="text-lg text-white">{getTypeLabel(selectedTx.type)}</h3>
                        {getStatusBadge(selectedTx.status)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-white/50 mb-1">Amount</div>
                      <div
                        className="text-2xl"
                        style={{
                          color: isOutgoing(selectedTx) ? "#ef4444" : colors.secondary,
                        }}
                      >
                        {isOutgoing(selectedTx) ? "-" : "+"}{selectedTx.value} {selectedTx.token}
                      </div>
                      {selectedTx.valueUSD && (
                        <div className="text-sm text-white/50">${selectedTx.valueUSD.toFixed(2)}</div>
                      )}
                    </div>

                    {selectedTx.swapDetails && (
                      <div
                        className="p-4 rounded-xl"
                        style={{
                          background: colors.gradient,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <div className="text-xs text-white/50 mb-2">Swap Details</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white">{selectedTx.swapDetails.fromAmount}</div>
                            <div className="text-xs text-white/50">{selectedTx.swapDetails.fromToken}</div>
                          </div>
                          <Repeat className="w-4 h-4 text-white/50" />
                          <div className="text-right">
                            <div className="text-white">{selectedTx.swapDetails.toAmount}</div>
                            <div className="text-xs text-white/50">{selectedTx.swapDetails.toToken}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-white/50 mb-1">Transaction Hash</div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs text-white/70 font-mono">
                          {formatAddress(selectedTx.hash)}
                        </code>
                        <a
                          href={`https://etherscan.io/tx/${selectedTx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-white/5"
                        >
                          <ExternalLink className="w-4 h-4 text-white/50" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-white/50 mb-1">From</div>
                        <code className="text-xs text-white/70 font-mono">
                          {formatAddress(selectedTx.from)}
                        </code>
                      </div>
                      <div>
                        <div className="text-xs text-white/50 mb-1">To</div>
                        <code className="text-xs text-white/70 font-mono">
                          {formatAddress(selectedTx.to)}
                        </code>
                      </div>
                    </div>

                    {selectedTx.gasCostUSD && (
                      <div>
                        <div className="text-xs text-white/50 mb-1">Gas Fee</div>
                        <div className="text-white">${selectedTx.gasCostUSD.toFixed(2)}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-white/50 mb-1">Timestamp</div>
                      <div className="text-white">
                        {new Date(selectedTx.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {selectedTx.error && (
                      <div
                        className="p-4 rounded-xl flex items-start gap-2"
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid #ef4444",
                        }}
                      >
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-500">{selectedTx.error}</p>
                      </div>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTx(null)}
                    className="w-full mt-6 py-3 rounded-xl transition-all text-white"
                    style={{
                      background: colors.gradient,
                      border: `1px solid ${colors.primary}`,
                      boxShadow: `0 0 20px ${colors.primary}40`,
                    }}
                  >
                    Close
                  </motion.button>
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
    </>
  );
}

// Transaction Item Component
interface TransactionItemProps {
  transaction: Transaction;
  userAddress: string;
  colors: any;
  onClick: () => void;
  index: number;
  getTypeIcon: (type: Transaction["type"]) => JSX.Element;
  getTypeColor: (type: Transaction["type"]) => string;
  getTypeLabel: (type: Transaction["type"]) => string;
  getStatusBadge: (status: Transaction["status"]) => JSX.Element;
  formatAddress: (address: string) => string;
  isOutgoing: boolean;
}

function TransactionItem({
  transaction,
  userAddress,
  colors,
  onClick,
  index,
  getTypeIcon,
  getTypeColor,
  getTypeLabel,
  getStatusBadge,
  formatAddress,
  isOutgoing,
}: TransactionItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 rounded-xl border backdrop-blur-sm cursor-pointer transition-all"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        borderColor: colors.border,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${getTypeColor(transaction.type)}20`,
            color: getTypeColor(transaction.type),
          }}
        >
          {getTypeIcon(transaction.type)}
        </div>

        <div className="flex-1 min-w-0 px-[-32px] py-[0px] mx-[-9px] my-[0px]">
          <div className="flex items-center gap-2 mb-1 bg-[rgba(0,0,0,0)]">
            <span className="text-sm text-white">{getTypeLabel(transaction.type)}</span>
            {getStatusBadge(transaction.status)}
          </div>

          {transaction.swapDetails ? (
            <div className="text-xs text-white/50 truncate">
              {transaction.swapDetails.fromToken} → {transaction.swapDetails.toToken}
            </div>
          ) : (
            <div className="text-xs text-white/50 truncate">
              {isOutgoing ? "To:" : "From:"}{" "}
              {formatAddress(isOutgoing ? transaction.to : transaction.from)}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
            <span>
              {new Date(transaction.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {transaction.gasCostUSD && transaction.gasCostUSD > 0 && (
              <>
                <span>•</span>
                <span>Gas: ${transaction.gasCostUSD.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>

        <div className="text-right shrink-0 px-[-2px] py-[0px] mx-[-37px] my-[-10px] px-[26px]">
          <div
            className="text-sm"
            style={{
              color: isOutgoing ? "#ef4444" : colors.secondary,
            }}
          >
            {isOutgoing ? "-" : "+"}
            {transaction.value} {transaction.token}
          </div>
          {transaction.valueUSD && (
            <div className="text-xs text-white/50 mt-[-2px] mr-[11px] mb-[0px] ml-[-31px]">
              ${transaction.valueUSD.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {transaction.error && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-500">{transaction.error}</p>
        </div>
      )}
    </motion.div>
  );
}