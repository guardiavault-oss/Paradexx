import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Copy,
  X,
  Activity,
  Clock,
  DollarSign,
  Eye,
  Award,
  Zap,
  ChevronRight,
  RefreshCw,
  Users,
  AlertTriangle,
  Target,
  Shield,
} from "lucide-react";

interface WhaleTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  type: "degen" | "regen";
}

interface WhaleAlert {
  id: string;
  whaleAddress: string;
  whaleName?: string;
  action: "buy" | "sell" | "transfer";
  tokenSymbol: string;
  amount: string;
  valueUsd: string;
  significance: "massive" | "major" | "notable";
  timestamp: number;
}

interface KnownWhale {
  address: string;
  name: string;
  label: "smart_money" | "top_trader" | "institutional" | "degen" | "whale";
  winRate: number;
  totalPnL: string;
  totalTrades: number;
  followers: number;
}

const WHALE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  smart_money: { label: "Smart Money", color: "#10b981", icon: <Zap className="w-3 h-3" /> },
  top_trader: { label: "Top Trader", color: "#0080FF", icon: <Award className="w-3 h-3" /> },
  institutional: { label: "Institutional", color: "#8b5cf6", icon: <Target className="w-3 h-3" /> },
  degen: { label: "Degen", color: "#DC143C", icon: <Activity className="w-3 h-3" /> },
  whale: { label: "Whale", color: "#f59e0b", icon: <DollarSign className="w-3 h-3" /> },
};

const mockWhaleAlerts: WhaleAlert[] = [
  {
    id: "1",
    whaleAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a",
    whaleName: "Smart Money #1",
    action: "buy",
    tokenSymbol: "PEPE",
    amount: "1000000000",
    valueUsd: "450000",
    significance: "massive",
    timestamp: Date.now() - 300000,
  },
  {
    id: "2",
    whaleAddress: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
    whaleName: "Institutional Whale",
    action: "buy",
    tokenSymbol: "ETH",
    amount: "250",
    valueUsd: "850000",
    significance: "major",
    timestamp: Date.now() - 600000,
  },
  {
    id: "3",
    whaleAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    action: "sell",
    tokenSymbol: "UNI",
    amount: "50000",
    valueUsd: "125000",
    significance: "notable",
    timestamp: Date.now() - 900000,
  },
];

const mockKnownWhales: KnownWhale[] = [
  {
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a",
    name: "Smart Money #1",
    label: "smart_money",
    winRate: 85,
    totalPnL: "2450000",
    totalTrades: 142,
    followers: 3429,
  },
  {
    address: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
    name: "Top Degen Trader",
    label: "top_trader",
    winRate: 78,
    totalPnL: "1850000",
    totalTrades: 289,
    followers: 2156,
  },
  {
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    name: "Institutional Fund",
    label: "institutional",
    winRate: 72,
    totalPnL: "5200000",
    totalTrades: 95,
    followers: 4892,
  },
];

const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatAmount = (amount: string): string => {
  const num = parseFloat(amount);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
};

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

export function WhaleTracker({ isOpen, onClose, type }: WhaleTrackerProps) {
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";
  
  const [whaleAlerts] = useState<WhaleAlert[]>(mockWhaleAlerts);
  const [knownWhales] = useState<KnownWhale[]>(mockKnownWhales);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"activity" | "whales">("activity");

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getSignificanceColor = (significance: string): string => {
    switch (significance) {
      case "massive": return "#ef4444";
      case "major": return "#f59e0b";
      case "notable": return "#0080FF";
      default: return "rgba(255, 255, 255, 0.6)";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 md:inset-8 lg:inset-16 z-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${primaryColor}40`,
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-xl"
                style={{ background: `${primaryColor}20` }}
              >
                <Activity className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Whale Tracker</h2>
                <p className="text-sm text-white/60">Real-time whale activity & insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
              <span className="text-xs text-green-400">Live</span>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="ml-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-white/60 ${refreshing ? "animate-spin" : ""}`} />
              </motion.button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {[
              { id: "activity", label: "Live Activity", icon: Activity },
              { id: "whales", label: "Top Whales", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap`}
                  style={{
                    background: activeTab === tab.id ? primaryColor : "rgba(255, 255, 255, 0.05)",
                    color: activeTab === tab.id ? "white" : "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === "activity" && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {whaleAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl transition-all duration-200 hover:bg-white/5"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            alert.action === "buy"
                              ? "bg-green-400/20"
                              : alert.action === "sell"
                              ? "bg-red-400/20"
                              : "bg-yellow-400/20"
                          }`}
                        >
                          {alert.action === "buy" ? (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          ) : alert.action === "sell" ? (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                          ) : (
                            <Wallet className="w-5 h-5 text-yellow-400" />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {alert.whaleName || formatAddress(alert.whaleAddress)}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: `${getSignificanceColor(alert.significance)}20`,
                                color: getSignificanceColor(alert.significance),
                              }}
                            >
                              {alert.significance}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs font-medium ${
                                alert.action === "buy" ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {alert.action.toUpperCase()}
                            </span>
                            <span className="text-xs text-white/60">
                              {alert.tokenSymbol}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {formatAmount(alert.valueUsd)}
                        </div>
                        <div className="text-xs text-white/40 flex items-center gap-1 justify-end mt-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(alert.timestamp)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === "whales" && (
              <motion.div
                key="whales"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {knownWhales.map((whale, index) => {
                  const labelInfo = WHALE_LABELS[whale.label] || WHALE_LABELS.whale;
                  return (
                    <motion.div
                      key={whale.address}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 rounded-2xl backdrop-blur-xl hover:scale-[1.02] transition-all duration-300"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `${labelInfo.color}20` }}
                          >
                            <Wallet className="w-5 h-5" style={{ color: labelInfo.color }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">
                                {whale.name}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 w-fit"
                              style={{ background: `${labelInfo.color}20`, color: labelInfo.color }}
                            >
                              {labelInfo.icon}
                              <span>{labelInfo.label}</span>
                            </div>
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-lg transition-opacity"
                          style={{ background: primaryColor }}
                        >
                          <Copy className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-white/5">
                          <div className="text-xs text-white/60 mb-1">Win Rate</div>
                          <div className="text-sm font-bold text-green-400">{whale.winRate}%</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                          <div className="text-xs text-white/60 mb-1">Total PnL</div>
                          <div className="text-sm font-bold text-green-400">
                            +{formatAmount(whale.totalPnL)}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                          <div className="text-xs text-white/60 mb-1">Trades</div>
                          <div className="text-sm font-bold text-white">{whale.totalTrades}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Eye className="w-3 h-3" />
                          <span>{whale.followers.toLocaleString()} followers</span>
                        </div>
                        <button
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ color: primaryColor }}
                        >
                          Follow Whale
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Footer */}
        <div 
          className="p-4 border-t"
          style={{
            borderColor: `${primaryColor}20`,
            background: `${primaryColor}10`,
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
            <div>
              <div className="text-sm font-medium text-white">Risk Warning</div>
              <p className="text-xs text-white/70 mt-1">
                Whale tracking is for informational purposes only. Past performance does not guarantee future results.
                Always DYOR before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default WhaleTracker;
