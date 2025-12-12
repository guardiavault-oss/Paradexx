import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
import {
  Home,
  TrendingUp,
  Activity as ActivityIcon,
  MoreHorizontal,
  Settings,
  Shield,
  Users,
  Flame,
  Zap,
  Target,
  Wallet,
  Eye,
  PieChart,
  BarChart3,
  Image as ImageIcon,
  Clock,
  Lock,
  Sparkles,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Brain,
  Radar,
  User,
  Menu,
  X,
  LogOut,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { GuardianX } from "./GuardianX";
import { SwapPage } from "./SwapPage";
import { Activity } from "./Activity";
import { SniperBot } from "./SniperBot";
import { MEVProtection } from "./MEVProtection";
import { WalletGuardDashboard } from "./WalletGuardDashboard";
import { FireflyParticles } from "./effects/FireflyParticles";
import { WaterParticles } from "./effects/WaterParticles";
import Portfolio from "./Portfolio";
import BottomNav from "./dashboard/BottomNav";
import SettingsModal from "./SettingsModal";
import { MoreMenu } from "./MoreMenu";
import { SecurityCenter } from "./SecurityCenter";
import { BridgeSecurity } from "./BridgeSecurity";
import { NFTGallery } from "./NFTGallery";
import { ScarletteChat } from "./ScarletteChat";
import { GlowingBall } from "./ui/GlowingBall";
import { AirdropPage } from "./AirdropPage";
import { BuyPage } from "./BuyPage";
import { YieldOpportunities } from "./YieldOpportunities";
import { WhaleTracker } from "./WhaleTracker";
import { AddressBook } from "./AddressBook";
import { HardwareWalletConnect } from "./HardwareWalletConnect";
import { HelpCenter } from "./HelpCenter";
import { ParadexLogo } from "./ParadexLogo";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useMEVProtection } from "../hooks/useMEVProtection";
import { useDegenData } from "../hooks/useDegenData";
import { useWhaleData } from "../hooks/useWhaleData";
import { API_URL } from "../config/api";
import PrivacyShield from "./modals/PrivacyShield";
import LimitOrdersModal from "./modals/LimitOrdersModal";

interface DashboardProps {
  type: "degen" | "regen";
  degenPercent: number;
  regenPercent: number;
  onLogout?: () => void;
}

export default function Dashboard({ type, degenPercent, regenPercent, onLogout }: DashboardProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSecurityCenter, setShowSecurityCenter] = useState(false);
  const [showBridgeSecurity, setShowBridgeSecurity] = useState(false);
  const [showGuardianX, setShowGuardianX] = useState(false);
  const [showNFTGallery, setShowNFTGallery] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showSniper, setShowSniper] = useState(false);
  const [showMEV, setShowMEV] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showWalletGuard, setShowWalletGuard] = useState(false);
  const [showScarlette, setShowScarlette] = useState(false);
  const [showAirdrop, setShowAirdrop] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showYield, setShowYield] = useState(false);
  const [showWhaleTracker, setShowWhaleTracker] = useState(false);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [showHardwareWallet, setShowHardwareWallet] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showPrivacyShield, setShowPrivacyShield] = useState(false);
  const [showLimitOrders, setShowLimitOrders] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "trading" | "activity" | "more">("home");
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  // Real API data from useDashboardStats hook
  const walletAddress = localStorage.getItem('walletAddress') || undefined;
  const { stats, loading: statsLoading } = useDashboardStats(walletAddress);
  const portfolioValue = stats.portfolioValue || 0;
  const degenScore = stats.degenScore || 0; // Real score from API, no fallback
  const dailyPnL = stats.dailyPnL || 0;
  const securityScore = stats.securityScore || 0;
  const monthlyYield = stats.monthlyYield || 0;
  const averageAPY = stats.averageAPY || 0;

  // MEV Protection stats
  const { stats: mevStats } = useMEVProtection();
  
  // Degen stats for win rate
  const { stats: degenStats, pnl: degenPnL } = useDegenData();
  
  // Airdrop stats
  const [airdropStats, setAirdropStats] = useState({ eligible: 0, potential: 0 });
  
  // Whale tracker data
  const { whales, stats: whaleStats } = useWhaleData({ autoRefresh: false });
  const followingCount = whales.filter(w => w.following).length;
  const activeWhales = whales.length;
  
  useEffect(() => {
    const fetchAirdropStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        
        const response = await fetch(`${API_URL}/api/airdrop/active`, { headers });
        if (response.ok) {
          const data = await response.json();
          const airdrops = data.airdrops || [];
          const eligible = airdrops.filter((a: any) => a.status === 'active' || a.status === 'upcoming').length;
          // Calculate potential from estimated values
          const potential = airdrops.reduce((sum: number, a: any) => {
            const estValue = a.estimatedValue || '$0';
            const match = estValue.match(/\$([\d,]+)/);
            if (match) {
              const value = parseFloat(match[1].replace(/,/g, ''));
              return sum + (value || 0);
            }
            return sum;
          }, 0);
          setAirdropStats({ eligible, potential });
        }
      } catch (error) {
        console.error('Error fetching airdrop stats:', error);
      }
    };
    
    fetchAirdropStats();
  }, []);

  const handleTabChange = (tab: "home" | "trading" | "activity" | "more") => {
    setActiveTab(tab);

    // Handle tab changes
    if (tab === "more") {
      setShowMore(true);
    } else if (tab === "trading") {
      setShowSwap(true);
    } else if (tab === "activity") {
      setShowActivity(true);
    } else {
      // Home - close all modals
      setShowSettings(false);
      setShowMore(false);
      setShowPortfolio(false);
      setShowSwap(false);
      setShowActivity(false);
      setShowNFTGallery(false);
      setShowGuardianX(false);
      setShowSecurityCenter(false);
      setShowBridgeSecurity(false);
      setShowSniper(false);
      setShowMEV(false);
    }
  };

  const handleMoreMenuNavigate = (page: string) => {
    setShowMore(false);

    if (page === "portfolio") {
      setShowPortfolio(true);
    } else if (page === "inheritance") {
      setShowGuardianX(true);
    } else if (page === "security") {
      setShowWalletGuard(true);
    } else if (page === "bridge") {
      setShowBridgeSecurity(true);
    } else if (page === "nft") {
      setShowNFTGallery(true);
    } else if (page === "activity") {
      setShowActivity(true);
    } else if (page === "sniper") {
      setShowSniper(true);
    } else if (page === "mev") {
      setShowMEV(true);
    } else if (page === "whale") {
      setShowWhaleTracker(true);
    } else if (page === "defi" || page === "yield") {
      setShowYield(true);
    } else if (page === "airdrop") {
      setShowAirdrop(true);
    } else if (page === "buy") {
      setShowBuy(true);
    } else if (page === "contacts") {
      setShowAddressBook(true);
    } else if (page === "hardware") {
      setShowHardwareWallet(true);
    } else if (page === "help") {
      setShowHelpCenter(true);
    } else if (page === "privacy") {
      setShowPrivacyShield(true);
    } else if (page === "limit") {
      setShowLimitOrders(true);
    }
  };

  const handleSettingsNavigate = (page: string) => {
    setShowSettings(false);
    handleMoreMenuNavigate(page);
  };

  const handleCloseModal = () => {
    setActiveTab("home");
    handleTabChange("home");
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background: isDegen
            ? "radial-gradient(circle at top left, rgba(255, 51, 102, 0.15) 0%, rgba(0, 0, 0, 0.95) 50%)"
            : "radial-gradient(circle at top right, rgba(0, 212, 255, 0.15) 0%, rgba(0, 0, 0, 0.95) 50%)",
        }}
      />

      {/* Particle Effects */}
      {isDegen ? <FireflyParticles /> : <WaterParticles />}

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-50 border-b"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div
              className="rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                width: "40px",
                height: "40px",
                boxShadow: `0 0 20px ${primaryColor}40`,
              }}
            >
              <ParadexLogo
                className="w-full h-full object-contain"
                alt="Paradex"
              />
            </div>
            <div>
              <h1
                className="text-base sm:text-2xl font-bold bg-[var(--bg-base)] text-[var(--text-primary)] uppercase"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                Paradex <span className="hidden sm:inline">Wallet</span>
              </h1>
              <p className="text-[10px] sm:text-xs uppercase" style={{ color: primaryColor }}>
                {isDegen ? "Degen" : "Regen"} <span className="hidden sm:inline">Mode</span>
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User info - Desktop only */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                  ${portfolioValue.toLocaleString()}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                  Total Balance
                </div>
              </div>
            </div>

            {/* Settings */}
            <button
              className="p-3 rounded-xl transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
              onClick={() => setShowSettings(true)}
            >
              <Settings size={20} color="rgba(255, 255, 255, 0.8)" />
            </button>

            {/* Menu */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-3 rounded-xl transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
            >
              {showSidebar ? (
                <X size={20} color="rgba(255, 255, 255, 0.8)" />
              ) : (
                <Menu size={20} color="rgba(255, 255, 255, 0.8)" />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="space-y-4 sm:space-y-6">
            {/* Portfolio Value Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl border"
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(20px)",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-[var(--text-primary)]/60 mb-1">Total Portfolio</div>
                  <div className="text-4xl font-bold text-[var(--text-primary)]">${portfolioValue.toLocaleString()}</div>
                </div>
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`,
                  }}
                >
                  <Wallet className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {dailyPnL > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={dailyPnL > 0 ? "text-green-500" : "text-red-500"}>
                  {dailyPnL > 0 ? "+" : ""}${Math.abs(dailyPnL).toLocaleString()} (24h)
                </span>
              </div>
            </motion.div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSwap(true)}
                className="p-4 rounded-xl border text-left hover:border-[var(--border-neutral)]/30 transition-all"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <Zap className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <div className="text-sm text-[var(--text-primary)]">Swap</div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPortfolio(true)}
                className="p-4 rounded-xl border text-left hover:border-[var(--border-neutral)]/30 transition-all"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <PieChart className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <div className="text-sm text-[var(--text-primary)]">Portfolio</div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGuardianX(true)}
                className="p-4 rounded-xl border text-left hover:border-[var(--border-neutral)]/30 transition-all"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <Shield className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <div className="text-sm text-[var(--text-primary)]">GuardianX</div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNFTGallery(true)}
                className="p-4 rounded-xl border text-left hover:border-[var(--border-neutral)]/30 transition-all"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <ImageIcon className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <div className="text-sm text-[var(--text-primary)]">NFTs</div>
              </motion.button>
            </div>

            {/* Feature Widgets */}
            {isDegen ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sniper Bot Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setShowSniper(true)}
                  className="p-6 rounded-xl border cursor-pointer hover:border-[var(--border-neutral)]/30 transition-all"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(20px)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: `${primaryColor}40` }}
                      >
                        <Target className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <div className="text-[var(--text-primary)] font-bold">Sniper Bot</div>
                        <div className="text-xs text-[var(--text-primary)]/60">Auto-trade new launches</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/40" />
                  </div>
                  <div className="text-2xl text-[var(--text-primary)] font-bold mb-1">
                    {degenStats?.tradesCount || 0} Active
                  </div>
                  <div className="text-sm text-green-500">
                    {degenStats?.winRate ? `+${degenStats.winRate.toFixed(0)}% Win Rate` : 'No trades yet'}
                  </div>
                </motion.div>

                {/* MEV Shield Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => setShowMEV(true)}
                  className="p-6 rounded-xl border cursor-pointer hover:border-[var(--border-neutral)]/30 transition-all"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(20px)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: `${primaryColor}40` }}
                      >
                        <Shield className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <div className="text-[var(--text-primary)] font-bold">MEV Protection</div>
                        <div className="text-xs text-[var(--text-primary)]/60">Anti-frontrun</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/40" />
                  </div>
                  <div className="text-2xl text-[var(--text-primary)] font-bold mb-1">
                    {mevStats?.activeProtections ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-green-500">
                    ${mevStats?.mevSaved?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'} Saved
                  </div>
                </motion.div>

                {/* Whale Tracker Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => setShowWhaleTracker(true)}
                  className="p-6 rounded-xl border cursor-pointer hover:border-[var(--border-neutral)]/30 transition-all"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(20px)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: `${primaryColor}40` }}
                      >
                        <Eye className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <div className="text-[var(--text-primary)] font-bold">Whale Tracker</div>
                        <div className="text-xs text-[var(--text-primary)]/60">Monitor whales</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/40" />
                  </div>
                  <div className="text-2xl text-[var(--text-primary)] font-bold mb-1">
                    {activeWhales} Active
                  </div>
                  <div className="text-sm text-yellow-500">
                    🐋 Following {followingCount} whale{followingCount !== 1 ? 's' : ''}
                  </div>
                </motion.div>

                {/* Airdrop Hunter Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={() => setShowAirdrop(true)}
                  className="p-6 rounded-xl border cursor-pointer hover:border-[var(--border-neutral)]/30 transition-all"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(20px)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: `${primaryColor}40` }}
                      >
                        <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <div className="text-[var(--text-primary)] font-bold">Airdrop Hunter</div>
                        <div className="text-xs text-[var(--text-primary)]/60">Find free tokens</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/40" />
                  </div>
                  <div className="text-2xl text-[var(--text-primary)] font-bold mb-1">
                    {airdropStats.eligible} Eligible
                  </div>
                  <div className="text-sm text-green-500">
                    💰 ${airdropStats.potential.toLocaleString(undefined, { maximumFractionDigits: 0 })} potential
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Wallet Guard Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setShowWalletGuard(true)}
                  className="p-6 rounded-xl border cursor-pointer hover:border-[var(--border-neutral)]/30 transition-all"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(20px)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: `${primaryColor}40` }}
                      >
                        <Eye className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <div className="text-[var(--text-primary)] font-bold">Wallet Guard</div>
                        <div className="text-xs text-[var(--text-primary)]/60">24/7 Monitoring</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/40" />
                  </div>
                  <div className="text-2xl text-[var(--text-primary)] font-bold mb-1 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    Secure
                  </div>
                  <div className="text-sm text-[var(--text-primary)]/60">No threats detected</div>
                </motion.div>

                {/* GuardianX Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setShowGuardianX(true)}
                  className="p-6 rounded-xl border cursor-pointer hover:border-[var(--border-neutral)]/30 transition-all"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(20px)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: `${primaryColor}40` }}
                      >
                        <Users className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <div className="text-[var(--text-primary)] font-bold">Inheritance</div>
                        <div className="text-xs text-[var(--text-primary)]/60">Digital legacy</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/40" />
                  </div>
                  <div className="text-2xl text-[var(--text-primary)] font-bold mb-1">3 Heirs</div>
                  <div className="text-sm text-[var(--text-primary)]/60">Next check-in: 45 days</div>
                </motion.div>

                {/* MEV Shield Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => setShowMEV(true)}
                  className="p-6 rounded-xl border cursor-pointer hover:border-[var(--border-neutral)]/30 transition-all"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(20px)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: `${primaryColor}40` }}
                      >
                        <Shield className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <div className="text-[var(--text-primary)] font-bold">MEV Protection</div>
                        <div className="text-xs text-[var(--text-primary)]/60">Safe trading</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/40" />
                  </div>
                  <div className="text-2xl text-[var(--text-primary)] font-bold mb-1">Active</div>
                  <div className="text-sm text-green-500">
                    ${mevStats?.valueProtected?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'} Protected
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-80 max-w-sm"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                backdropFilter: "blur(40px)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div className="p-4 sm:p-6 h-full flex flex-col">
                {/* Profile */}
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="rounded-full flex items-center justify-center"
                      style={{
                        width: "64px",
                        height: "64px",
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      <User size={32} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                        Crypto Trader
                      </div>
                      <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
                        0x742d...3f4a
                      </div>
                    </div>
                  </div>

                  {/* Tribe Score */}
                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
                      border: `1px solid ${primaryColor}40`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.6)",
                        marginBottom: "8px",
                      }}
                    >
                      Tribe Balance
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: "14px", color: "#ff3366" }}>Degen</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                        {degenPercent}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden mb-2"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${degenPercent}%`,
                          background: "linear-gradient(90deg, #ff3366, #ff9500)",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "14px", color: "#00d4ff" }}>Regen</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                        {regenPercent}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${regenPercent}%`,
                          background: "linear-gradient(90deg, #00d4ff, #00ff88)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <nav className="flex-1 space-y-2">
                  {[
                    { label: "Portfolio", active: true },
                    { label: "Trading", active: false },
                    { label: "DeFi", active: false },
                    { label: "NFTs", active: false },
                    { label: "History", active: false },
                    { label: "Settings", active: false },
                  ].map((item, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-3 rounded-xl text-left transition-all"
                      style={{
                        backgroundColor: item.active ? `${primaryColor}20` : "transparent",
                        border: item.active
                          ? `1px solid ${primaryColor}`
                          : "1px solid transparent",
                        color: item.active ? primaryColor : "rgba(255, 255, 255, 0.6)",
                        fontWeight: item.active ? 700 : 400,
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* Logout */}
                <button
                  className="w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: "rgba(255, 51, 102, 0.2)",
                    border: "1px solid #ff3366",
                    color: "#ff3366",
                    fontWeight: 700,
                  }}
                  onClick={onLogout}
                >
                  <LogOut size={20} />
                  Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            type={type}
            isOpen={showSettings}
            onClose={() => {
              setShowSettings(false);
              setActiveTab("home");
            }}
            onLogout={() => {
              setShowSettings(false);
              onLogout?.();
            }}
            onNavigate={handleSettingsNavigate}
          />
        )}
      </AnimatePresence>

      {/* Security Center Modal */}
      <AnimatePresence>
        {showSecurityCenter && (
          <SecurityCenter
            type={type}
            onClose={() => setShowSecurityCenter(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tribe={type}
      />

      {/* More Menu Modal */}
      <AnimatePresence>
        {showMore && (
          <MoreMenu
            type={type}
            onClose={() => {
              setShowMore(false);
              setActiveTab("home");
            }}
            onNavigate={handleMoreMenuNavigate}
          />
        )}
      </AnimatePresence>

      {/* Bridge Security Modal */}
      <AnimatePresence>
        {showBridgeSecurity && (
          <BridgeSecurity
            type={type}
            onClose={() => setShowBridgeSecurity(false)}
          />
        )}
      </AnimatePresence>

      {/* GuardianX Modal */}
      <AnimatePresence>
        {showGuardianX && (
          <GuardianX
            type={type}
            onClose={() => setShowGuardianX(false)}
          />
        )}
      </AnimatePresence>

      {/* Swap Page Modal */}
      <AnimatePresence>
        {showSwap && (
          <SwapPage
            type={type}
            onClose={() => {
              setShowSwap(false);
              setActiveTab("home");
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </AnimatePresence>

      {/* NFT Gallery Modal */}
      <AnimatePresence>
        {showNFTGallery && (
          <NFTGallery
            type={type}
            onClose={() => {
              setShowNFTGallery(false);
              setActiveTab("home");
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </AnimatePresence>

      {/* Activity Modal */}
      <AnimatePresence>
        {showActivity && (
          <Activity
            type={type}
            onClose={() => {
              setShowActivity(false);
              setActiveTab("home");
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </AnimatePresence>

      {/* Sniper Bot Modal */}
      <AnimatePresence>
        {showSniper && (
          <SniperBot
            onClose={() => {
              setShowSniper(false);
              setActiveTab("home");
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            type={type}
          />
        )}
      </AnimatePresence>

      {/* MEV Protection Modal */}
      <AnimatePresence>
        {showMEV && (
          <MEVProtection
            type={type}
            onClose={() => {
              setShowMEV(false);
              setActiveTab("home");
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </AnimatePresence>

      {/* Portfolio Modal */}
      <AnimatePresence>
        {showPortfolio && (
          <Portfolio
            type={type}
            onClose={() => {
              setShowPortfolio(false);
              setActiveTab("home");
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </AnimatePresence>

      {/* Wallet Guard Modal */}
      <AnimatePresence>
        {showWalletGuard && (
          <WalletGuardDashboard
            onClose={() => {
              setShowWalletGuard(false);
              setActiveTab("home");
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </AnimatePresence>

      {/* Scarlette Chat Modal */}
      <AnimatePresence>
        {showScarlette && (
          <ScarletteChat
            isOpen={showScarlette}
            onClose={() => setShowScarlette(false)}
            type={type}
          />
        )}
      </AnimatePresence>

      {/* Whale Tracker Modal */}
      <AnimatePresence>
        {showWhaleTracker && (
          <WhaleTracker
            isOpen={showWhaleTracker}
            onClose={() => {
              setShowWhaleTracker(false);
              setActiveTab("home");
            }}
            type={type}
          />
        )}
      </AnimatePresence>

      {/* Airdrop Page Modal */}
      <AnimatePresence>
        {showAirdrop && (
          <AirdropPage
            type={type}
            onClose={() => {
              setShowAirdrop(false);
              setActiveTab("home");
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </AnimatePresence>

      {/* Buy Page Modal */}
      <AnimatePresence>
        {showBuy && (
          <BuyPage
            type={type}
            onClose={() => {
              setShowBuy(false);
              setActiveTab("home");
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </AnimatePresence>

      {/* Yield Opportunities Modal */}
      <AnimatePresence>
        {showYield && (
          <YieldOpportunities
            isOpen={showYield}
            onClose={() => {
              setShowYield(false);
              setActiveTab("home");
            }}
            type={type}
          />
        )}
      </AnimatePresence>

      {/* Address Book Modal */}
      <AnimatePresence>
        {showAddressBook && (
          <AddressBook
            isOpen={showAddressBook}
            onClose={() => {
              setShowAddressBook(false);
              setActiveTab("home");
            }}
            type={type}
          />
        )}
      </AnimatePresence>

      {/* Hardware Wallet Connect Modal */}
      <AnimatePresence>
        {showHardwareWallet && (
          <HardwareWalletConnect
            isOpen={showHardwareWallet}
            onClose={() => {
              setShowHardwareWallet(false);
              setActiveTab("home");
            }}
            type={type}
          />
        )}
      </AnimatePresence>

      {/* Help Center Modal */}
      <AnimatePresence>
        {showHelpCenter && (
          <HelpCenter
            isOpen={showHelpCenter}
            onClose={() => {
              setShowHelpCenter(false);
              setActiveTab("home");
            }}
            type={type}
          />
        )}
      </AnimatePresence>

      {/* Privacy Shield Modal */}
      <AnimatePresence>
        {showPrivacyShield && (
          <PrivacyShield
            isOpen={showPrivacyShield}
            onClose={() => {
              setShowPrivacyShield(false);
              setActiveTab("home");
            }}
            type={type}
          />
        )}
      </AnimatePresence>

      {/* Limit Orders Modal */}
      <AnimatePresence>
        {showLimitOrders && (
          <LimitOrdersModal
            isOpen={showLimitOrders}
            onClose={() => {
              setShowLimitOrders(false);
              setActiveTab("home");
            }}
            type={type}
          />
        )}
      </AnimatePresence>

      {/* Floating Scarlette Orb - Bottom Right */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowScarlette(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl"
        style={{
          boxShadow: `0 8px 32px ${primaryColor}60, 0 0 0 8px ${primaryColor}10`,
        }}
        title="Chat with Scarlette"
      >
        <GlowingBall className="w-full h-full" type={type} />
      </motion.button>
    </div>
  );
}
