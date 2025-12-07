import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Activity,
  TrendingUp,
  Zap,
  Lock,
  Unlock,
  Bell,
  Settings,
  ArrowLeft,
  Info,
  Clock,
  Network,
  Ban,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

interface WalletGuardDashboardProps {
  onClose?: () => void;
}

interface MonitoredWallet {
  wallet_address: string;
  network: string;
  threat_level: string;
  protection_enabled: boolean;
  threats_detected: number;
}

interface WalletStatus {
  protection_enabled: boolean;
  threat_level: string;
  threats_detected: number;
  last_scan: string;
}

interface Threat {
  threat_id: string;
  threat_type: string;
  severity: string;
  description: string;
  timestamp: string;
  confidence: number;
}

interface Analytics {
  total_monitored: number;
  threats_detected_24h: number;
  protection_actions_taken: number;
  average_threat_level: string;
}

export function WalletGuardDashboard({ onClose }: WalletGuardDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [monitoredWallets, setMonitoredWallets] = useState<MonitoredWallet[]>([
    {
      wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f3f4a",
      network: "ethereum",
      threat_level: "low",
      protection_enabled: true,
      threats_detected: 2,
    },
    {
      wallet_address: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
      network: "polygon",
      threat_level: "medium",
      protection_enabled: true,
      threats_detected: 5,
    },
  ]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(
    "0x742d35Cc6634C0532925a3b844Bc9e7595f3f4a"
  );
  const [walletStatus, setWalletStatus] = useState<WalletStatus>({
    protection_enabled: true,
    threat_level: "low",
    threats_detected: 2,
    last_scan: new Date().toISOString(),
  });
  const [threats, setThreats] = useState<Threat[]>([
    {
      threat_id: "1",
      threat_type: "Suspicious Transaction",
      severity: "medium",
      description: "Unusual transaction pattern detected from unknown contract",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      confidence: 0.85,
    },
    {
      threat_id: "2",
      threat_type: "Phishing Attempt",
      severity: "high",
      description: "Malicious approval request detected and blocked",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      confidence: 0.92,
    },
  ]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_monitored: 2,
    threats_detected_24h: 7,
    protection_actions_taken: 3,
    average_threat_level: "low",
  });
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddWallet = () => {
    if (!newWalletAddress) return;

    const newWallet: MonitoredWallet = {
      wallet_address: newWalletAddress,
      network: selectedNetwork,
      threat_level: "low",
      protection_enabled: true,
      threats_detected: 0,
    };

    setMonitoredWallets([...monitoredWallets, newWallet]);
    setNewWalletAddress("");
    setShowAddWallet(false);
  };

  const handleRemoveWallet = (walletAddress: string) => {
    setMonitoredWallets(monitoredWallets.filter((w) => w.wallet_address !== walletAddress));
    if (selectedWallet === walletAddress) {
      setSelectedWallet(monitoredWallets[0]?.wallet_address || null);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-[#DC143C] bg-[#DC143C]/10 border-[#DC143C]/20";
      case "high":
        return "text-[#FF6B6B] bg-[#FF6B6B]/10 border-[#FF6B6B]/20";
      case "medium":
        return "text-[#FFB84D] bg-[#FFB84D]/10 border-[#FFB84D]/20";
      default:
        return "text-[#0080FF] bg-[#0080FF]/10 border-[#0080FF]/20";
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case "critical":
      case "high":
        return <ShieldAlert className="w-5 h-5" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <ShieldCheck className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(0, 128, 255, 0.15) 0%, rgba(0, 0, 0, 0.95) 50%)",
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-50 border-b"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(0, 128, 255, 0.2)",
        }}
      >
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-all hover:bg-white/10"
                style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #0080FF 0%, #000080 100%)",
                boxShadow: "0 0 30px rgba(0, 128, 255, 0.5)",
              }}
            >
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase">
                Wallet Guard
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: "#0080FF" }}>
                24/7 Security Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 sm:p-3 rounded-xl transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(0, 128, 255, 0.2)" }}
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                style={{ color: "#0080FF" }}
              />
            </button>
            <button
              className="p-2 sm:p-3 rounded-xl transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Shield className="w-12 h-12" style={{ color: "#0080FF" }} />
          </motion.div>
        </div>
      ) : (
        <div className="relative z-10 pb-24 overflow-y-auto h-[calc(100vh-80px)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Analytics Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div
                className="p-4 sm:p-6 rounded-2xl border"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(0, 128, 255, 0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" style={{ color: "#0080FF" }} />
                  <span className="text-xs text-white/60">Monitored</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {analytics.total_monitored}
                </div>
              </div>

              <div
                className="p-4 sm:p-6 rounded-2xl border"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(220, 20, 60, 0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: "#DC143C" }} />
                  <span className="text-xs text-white/60">Threats (24h)</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {analytics.threats_detected_24h}
                </div>
              </div>

              <div
                className="p-4 sm:p-6 rounded-2xl border"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(0, 128, 255, 0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: "#00FF88" }} />
                  <span className="text-xs text-white/60">Protected</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {analytics.protection_actions_taken}
                </div>
              </div>

              <div
                className="p-4 sm:p-6 rounded-2xl border"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(0, 128, 255, 0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "#FFB84D" }} />
                  <span className="text-xs text-white/60">Risk Level</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white uppercase">
                  {analytics.average_threat_level}
                </div>
              </div>
            </motion.div>

            {/* Monitored Wallets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white uppercase">Monitored Wallets</h2>
                <button
                  onClick={() => setShowAddWallet(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #0080FF 0%, #000080 100%)",
                    color: "white",
                    boxShadow: "0 0 20px rgba(0, 128, 255, 0.3)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Wallet
                </button>
              </div>

              <div className="space-y-3">
                {monitoredWallets.map((wallet, index) => (
                  <motion.div
                    key={wallet.wallet_address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedWallet(wallet.wallet_address)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedWallet === wallet.wallet_address
                        ? "scale-[1.02]"
                        : "hover:scale-[1.01]"
                    }`}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(20px)",
                      borderColor:
                        selectedWallet === wallet.wallet_address
                          ? "#0080FF"
                          : "rgba(0, 128, 255, 0.2)",
                      boxShadow:
                        selectedWallet === wallet.wallet_address
                          ? "0 0 30px rgba(0, 128, 255, 0.3)"
                          : "none",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background: "linear-gradient(135deg, #0080FF 0%, #000080 100%)",
                          }}
                        >
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                          </div>
                          <div className="text-xs text-white/60 uppercase">{wallet.network}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase ${getThreatLevelColor(
                            wallet.threat_level
                          )}`}
                        >
                          {wallet.threat_level}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveWallet(wallet.wallet_address);
                          }}
                          className="p-2 rounded-lg transition-all hover:bg-[#DC143C]/20"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: "#DC143C" }} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Wallet Status */}
            {selectedWallet && walletStatus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl border space-y-6"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(0, 128, 255, 0.2)",
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase">Wallet Status</h3>
                  <div className="flex items-center gap-2">
                    {walletStatus.protection_enabled ? (
                      <div className="flex items-center gap-2 text-[#00FF88]">
                        <Lock className="w-5 h-5" />
                        <span className="text-sm font-bold">PROTECTED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[#FFB84D]">
                        <Unlock className="w-5 h-5" />
                        <span className="text-sm font-bold">UNPROTECTED</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-white/60 mb-2">Threat Level</div>
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold border ${getThreatLevelColor(
                        walletStatus.threat_level
                      )}`}
                    >
                      {getThreatIcon(walletStatus.threat_level)}
                      {walletStatus.threat_level.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60 mb-2">Threats Detected</div>
                    <div className="text-3xl font-black text-white">
                      {walletStatus.threats_detected}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    className="px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                    style={{
                      backgroundColor: "rgba(220, 20, 60, 0.2)",
                      border: "1px solid rgba(220, 20, 60, 0.4)",
                      color: "#DC143C",
                    }}
                  >
                    <Ban className="w-4 h-4 mx-auto mb-1" />
                    Freeze
                  </button>
                  <button
                    className="px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                    style={{
                      backgroundColor: "rgba(255, 184, 77, 0.2)",
                      border: "1px solid rgba(255, 184, 77, 0.4)",
                      color: "#FFB84D",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mx-auto mb-1" />
                    Quarantine
                  </button>
                  <button
                    className="px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                    style={{
                      backgroundColor: "rgba(0, 128, 255, 0.2)",
                      border: "1px solid rgba(0, 128, 255, 0.4)",
                      color: "#0080FF",
                    }}
                  >
                    <Bell className="w-4 h-4 mx-auto mb-1" />
                    Alert
                  </button>
                </div>
              </motion.div>
            )}

            {/* Recent Threats */}
            {selectedWallet && threats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl border"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(0, 128, 255, 0.2)",
                }}
              >
                <h3 className="text-xl font-black text-white uppercase mb-4">Recent Threats</h3>
                <div className="space-y-3">
                  {threats.map((threat) => (
                    <div
                      key={threat.threat_id}
                      className={`p-4 rounded-xl border ${getThreatLevelColor(threat.severity)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getThreatIcon(threat.severity)}
                          <span className="font-bold uppercase">{threat.threat_type}</span>
                        </div>
                        <span className="text-xs text-white/60">
                          {new Date(threat.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 mb-3">{threat.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60">Confidence:</span>
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${threat.confidence * 100}%`,
                              background: "linear-gradient(90deg, #0080FF, #000080)",
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold" style={{ color: "#0080FF" }}>
                          {Math.round(threat.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Add Wallet Modal */}
      <AnimatePresence>
        {showAddWallet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddWallet(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="p-6 rounded-2xl w-full max-w-md border"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                backdropFilter: "blur(40px)",
                borderColor: "rgba(0, 128, 255, 0.3)",
              }}
            >
              <h3 className="text-2xl font-black text-white mb-6 uppercase">Add Wallet</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block uppercase font-bold">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(0, 128, 255, 0.3)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block uppercase font-bold">
                    Network
                  </label>
                  <select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none transition-all"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(0, 128, 255, 0.3)",
                    }}
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                    <option value="bsc">BSC</option>
                    <option value="arbitrum">Arbitrum</option>
                    <option value="optimism">Optimism</option>
                    <option value="avalanche">Avalanche</option>
                    <option value="base">Base</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddWallet(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold transition-all hover:scale-105"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddWallet}
                    disabled={!newWalletAddress}
                    className="flex-1 px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #0080FF 0%, #000080 100%)",
                      color: "white",
                      boxShadow: "0 0 20px rgba(0, 128, 255, 0.3)",
                    }}
                  >
                    Add Wallet
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
