import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Wallet,
  TrendingUp,
  Shield,
  Users,
  Target,
  Radar,
  Flame,
  Eye,
  DollarSign,
  Lock,
  Activity,
  Send,
  Download,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Zap,
  Fuel,
  Clock,
  Star,
  Bell,
  TrendingDown,
  Circle,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

// Import Header
import { Header } from "./Header";
import { ToastProvider } from "./Toast";
import { getRandomCharacter } from "./CharacterAvatar";
import { calculateScore, EXAMPLE_BADGES } from "./UserScore";

// Import effects
import { FireflyParticles } from "./effects/FireflyParticles";
import { WaterParticles } from "./effects/WaterParticles";
import TriangulatedBackground from "./TriangulatedBackground";

// Import pages
import TradingPage from "./TradingPage";
import { Activity as ActivityPage } from "./Activity";
import { NFTGallery } from "./NFTGallery";
import Portfolio from "./Portfolio";
import { MoreMenu } from "./MoreMenu";

// Import hooks
import { useDashboard } from "../hooks/useDashboard";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { SwapPageEnhanced } from "./SwapPageEnhanced";
import { TradingPageEnhanced } from "./TradingPageEnhanced";
import { BuyPage } from "./BuyPage";
import { AirdropPage } from "./AirdropPage";
import { HelpCenter } from "./features/HelpCenter";
import { MiniLineChart } from "./ui/MiniLineChart";

// Import modals
import { SendModal } from "./modals/SendModal";
import { ReceiveModal } from "./modals/ReceiveModal";

// Import features
import { SniperBot } from "./features/SniperBot";
import { MemeRadar } from "./features/MemeRadar";
import { WhaleTracker } from "./features/WhaleTracker";
import { WalletGuard } from "./features/WalletGuard";
import { MEVProtection } from "./MEVProtection";
import { PrivacyShield } from "./features/PrivacyShield";
import { DeFiDashboard } from "./features/DeFiDashboard";
import { LegacyVaults } from "./features/LegacyVaults";
import { CuratedDappLauncher } from "./features/CuratedDappLauncher";
import { GasManager } from "./features/GasManager";
import { PortfolioAnalytics } from "./features/PortfolioAnalytics";
import { CustomTokenImport } from "./features/CustomTokenImport";
import { HardwareWalletConnect } from "./HardwareWalletConnect";
import { BridgeSecurity } from "./BridgeSecurity";
import { NotificationCenter } from "./NotificationCenter";
import { Settings as SettingsPage } from "./Settings";

// Import security components
import { DecoyWalletMode } from "./security/DecoyWalletMode";

import {
  PageLayout,
  Section,
  Container,
  VStack,
  HStack,
  CardGrid,
} from "./layout";

import {
  Button,
  Avatar,
  Badge,
  GlassCard,
  NumberTicker,
} from "./ui";

import {
  Card3D,
  MovingBorder,
  BentoGrid,
  BentoGridItem,
  AnimatedGradientText,
} from "./effects";

import BottomNav from "./dashboard/BottomNav";
import { Mode } from "@/styles/tokens";
import SubtleGradientBackground from "./SubtleGradientBackground";

interface DashboardNewProps {
  type: Mode;
  degenPercent: number;
  regenPercent: number;
  onLogout?: () => void;
  onTribeSwitch?: () => void;
}

export default function DashboardNew({
  type,
  degenPercent,
  regenPercent,
  onLogout,
  onTribeSwitch,
}: DashboardNewProps) {
  const [activeTab, setActiveTab] = useState<
    "home" | "trading" | "activity" | "more"
  >("home");
  const [activeFeaturePage, setActiveFeaturePage] = useState<
    string | null
  >(null);
  const [showScarlette, setShowScarlette] = useState(false);
  const [decoyWalletActive, setDecoyWalletActive] =
    useState(false);
  const isDegen = type === "degen";

  // Get wallet address from props or localStorage
  const walletAddress = localStorage.getItem('walletAddress') || undefined;
  
  // Fetch real dashboard data from hook
  const {
    tokens: myTokens,
    watchlist,
    pendingTxs,
    positions: activePositions,
    gasPrice,
    priceAlerts,
    totalBalance,
    totalChange24h,
    loading: dashboardLoading,
    refresh: refreshDashboard,
  } = useDashboard(walletAddress);

  // User data - fetch from API
  const user = {
    avatar: isDegen ? "😈" : "🧙",
    username: dashboardStats?.degenScore ? (isDegen ? "Degen" : "Regen") : (isDegen ? "Degen" : "Regen"), // Would come from /api/user/profile
    score: degenScore, // From API via useDashboardStats
    walletAddress: walletAddress || "0x0000...0000",
  };

  // Network state
  const [network, setNetwork] = useState({
    id: 1,
    name: "Ethereum",
    logo: "⟠",
    color: "#627EEA",
  });

  // Notifications count - TODO: Get from API
  const unreadNotifications = 0;

  const handleNavigate = (path: string) => {
    if (path === "/settings") {
      setActiveFeaturePage("settings");
      setActiveTab("home");
    } else if (path === "/profile") {
      // Navigate to profile page (could add a profile page)
      console.log("Navigate to profile");
    } else {
      console.log("Navigate to:", path);
    }
  };

  const handleNetworkChange = (newNetwork: any) => {
    setNetwork(newNetwork);
    console.log("Network changed to:", newNetwork.name);
    // In production, trigger wallet network switch
  };

  // Tab order for swipe navigation
  const tabOrder: Array<
    "home" | "trading" | "activity" | "more"
  > = ["home", "trading", "activity", "more"];

  const handleSwipe = (direction: "left" | "right") => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (
      direction === "left" &&
      currentIndex < tabOrder.length - 1
    ) {
      setActiveTab(tabOrder[currentIndex + 1]);
    } else if (direction === "right" && currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  // Render feature pages function
  const renderFeature = () => {
    switch (activeFeaturePage) {
      case "send":
        return (
          <SendModal
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "receive":
        return (
          <ReceiveModal
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "portfolio":
        return <Portfolio type={type} />;
      case "swap":
        return (
          <SwapPageEnhanced
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "buy":
        return (
          <BuyPage
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "nft":
        return (
          <NFTGallery
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "airdrop":
        return (
          <AirdropPage
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "sniper":
        return (
          <SniperBot
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "meme":
        return (
          <MemeRadar
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "whale":
        return (
          <WhaleTracker
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "security":
        return (
          <WalletGuard
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "mev":
        return (
          <MEVProtection
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "privacy":
        return (
          <PrivacyShield
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "defi":
        return (
          <DeFiDashboard
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "inheritance":
        return (
          <LegacyVaults
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "dapps":
        return (
          <CuratedDappLauncher
            isOpen={true}
            onClose={() => setActiveFeaturePage(null)}
            walletType={type}
          />
        );
      case "gas":
        return (
          <GasManager
            isOpen={true}
            onClose={() => setActiveFeaturePage(null)}
            walletType={type}
          />
        );
      case "analytics":
        return (
          <PortfolioAnalytics
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "tokens":
        return (
          <CustomTokenImport
            isOpen={true}
            onClose={() => setActiveFeaturePage(null)}
            walletType={type}
          />
        );
      case "hardware":
        return (
          <HardwareWalletConnect
            isOpen={true}
            onClose={() => setActiveFeaturePage(null)}
            type={type}
          />
        );
      case "bridge":
        return (
          <BridgeSecurity
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "help":
        return (
          <HelpCenter
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "notifications":
        return (
          <NotificationCenter
            type={type}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case "settings":
        return (
          <SettingsPage
            type={type}
            onClose={() => setActiveFeaturePage(null)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onTribeSwitch={onTribeSwitch}
          />
        );
      default:
        return null;
    }
  };

  // Fetch real scores from API
  const walletAddressForStats = walletAddress || localStorage.getItem('walletAddress') || undefined;
  const { stats: dashboardStats, loading: statsLoading } = useDashboardStats(walletAddressForStats);
  
  // Use real scores or defaults
  const degenScore = dashboardStats?.degenScore || 0;
  const securityScore = dashboardStats?.securityScore || 0;
  const dailyPnL = dashboardStats?.dailyPnL || 0;
  const dailyPnLPercent = dashboardStats?.dailyPnLPercent || 0;

  // Quick stats
  // Calculate stats from real data
  const totalBalance = myTokens.reduce((sum, t) => sum + (t.value || 0), 0);
  const totalChange = myTokens.length > 0
    ? myTokens.reduce((sum, t) => sum + ((t.value || 0) * (t.change24h || 0) / 100), 0) / totalBalance * 100
    : 0;

  // Calculate P&L from tokens (fallback if dashboardStats not available)
  const calculatedDailyPnL = myTokens.reduce((sum, t) => {
    const tokenValue = t.value || 0;
    const tokenChange = t.change24h || 0;
    return sum + (tokenValue * tokenChange / 100);
  }, 0);
  const calculatedDailyPnLPercent = totalBalance > 0 ? (calculatedDailyPnL / totalBalance) * 100 : 0;

  const stats = [
    {
      label: "Total Balance",
      value: totalBalance,
      change: totalChange,
      icon: Wallet,
      prefix: "$",
    },
    {
      label: isDegen ? "Degen Score" : "Regen Score",
      value: degenScore,
      change: 0, // Score change would need historical tracking
      icon: isDegen ? Flame : Radar,
    },
    {
      label: "24h P&L",
      value: dailyPnL || calculatedDailyPnL,
      change: dailyPnLPercent || calculatedDailyPnLPercent,
      icon: TrendingUp,
      prefix: "$",
    },
    {
      label: "Security Score",
      value: securityScore,
      change: 0, // Security score change would need historical tracking
      icon: Shield,
      suffix: "%",
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: "Send",
      icon: Send,
      color: isDegen ? "degen" : "regen",
      action: "send",
    },
    {
      label: "Receive",
      icon: Download,
      color: isDegen ? "degen" : "regen",
      action: "receive",
    },
    {
      label: "Swap",
      icon: TrendingUp,
      color: isDegen ? "degen" : "regen",
      action: "swap",
    },
    {
      label: "Buy",
      icon: Plus,
      color: isDegen ? "degen" : "regen",
      action: "buy",
    },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "send":
        setActiveFeaturePage("send");
        break;
      case "receive":
        setActiveFeaturePage("receive");
        break;
      case "swap":
        setActiveFeaturePage("swap");
        break;
      case "buy":
        setActiveFeaturePage("buy");
        break;
    }
  };

  // Featured widgets (tribe-specific)
  const degenWidgets = [
    {
      title: "Sniper Bot",
      description: "Hunt new tokens instantly",
      icon: Target,
      stats: "24 targets tracked",
      highlight: true,
      page: "sniper",
    },
    {
      title: "Meme Radar",
      description: "Trending meme coins",
      icon: Zap,
      stats: "156% avg gain",
      page: "meme",
    },
    {
      title: "Whale Tracker",
      description: "Follow smart money",
      icon: Eye,
      stats: "12 whales monitored",
      page: "whale",
    },
    {
      title: "MEV Shield",
      description: "Front-run protection",
      icon: Shield,
      stats: "24/7 active",
      page: "mev",
    },
  ];

  const regenWidgets = [
    {
      title: "Wallet Guard",
      description: "Multi-sig security",
      icon: Shield,
      stats: "99.9% secure",
      highlight: true,
      page: "security",
    },
    {
      title: "Legacy Vaults",
      description: "Inheritance platform",
      icon: Users,
      stats: "3 guardians active",
      page: "inheritance",
    },
    {
      title: "MEV Protection",
      description: "Transaction shield",
      icon: Lock,
      stats: "$2.4k saved",
      page: "mev",
    },
    {
      title: "Privacy Shield",
      description: "Anonymous transactions",
      icon: Shield,
      stats: "24/7 monitoring",
      page: "privacy",
    },
  ];

  const widgets = isDegen ? degenWidgets : regenWidgets;

  // Render the dashboard content
  const renderDashboardContent = () => (
    <div className="space-y-6 pb-6">
      {/* Welcome Message */}
      <Section padding="none">
        <div className="py-4">
          <h1 className="text-3xl md:text-4xl text-white font-bold font-[Bebas_Neue]">
            Welcome {isDegen ? "Degen" : "Regen"}{" "}
            <span
              style={{ color: isDegen ? "#DC143C" : "#0080FF" }}
            >
              {user.username}
            </span>
          </h1>
          <p className="text-white/60 mt-2 text-sm md:text-base">
            {isDegen
              ? "Ready to hunt those gains? 🔥"
              : "Building sustainable wealth 🌱"}
          </p>
        </div>
      </Section>

      {/* Score and Balance Card */}
      <Section padding="none">
        <GlassCard
          className="p-6 md:p-8"
          glowColor={isDegen ? "#DC143C" : "#0080FF"}
        >
          <VStack spacing="md">
            {/* Score Gauge */}
            <VStack spacing="xs" align="center">
              <p className="text-xs md:text-sm uppercase tracking-wider text-white/60 font-[Koulen] text-center">
                {isDegen ? "🔥 Degen Score" : "❄️ Regen Score"}
              </p>

              {/* Circular Progress Gauge */}
              <div className="relative w-32 h-32 md:w-40 md:h-40 my-4">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke={isDegen ? "#DC143C" : "#0080FF"}
                    strokeWidth="8"
                    strokeDasharray={`${(degenScore / 1000) * 283} 283`}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Score Number */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <NumberTicker
                    value={degenScore}
                    className="text-white text-4xl md:text-5xl font-[Bebas_Neue] font-bold"
                  />
                  <p className="text-xs text-white/40 mt-1">
                    / 1000
                  </p>
                </div>
              </div>

              <p className="text-xs text-white/50 text-center max-w-xs">
                {isDegen
                  ? "Your risk appetite and trading activity score"
                  : "Your security and long-term wealth score"}
              </p>
            </VStack>

            {/* Balance */}
            <VStack spacing="xs" align="center" className="mt-6">
              <p className="text-xs text-white/60 uppercase tracking-wider">
                Total Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl text-white font-[Bebas_Neue]">
                  $<NumberTicker value={Math.floor(totalBalance)} />
                </span>
                <span className="text-xl text-white/40">
                  .{Math.floor((totalBalance % 1) * 100).toString().padStart(2, '0')}
                </span>
              </div>
              <div className={`flex items-center gap-1 ${totalChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalChange24h >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {totalChange24h >= 0 ? '+' : ''}{totalChange24h.toFixed(2)}% (24h)
                </span>
              </div>
            </VStack>
          </VStack>
        </GlassCard>
      </Section>

      {/* Quick Actions */}
      <Section padding="none">
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickAction(action.action)}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl border transition-all backdrop-blur-md"
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                borderColor: isDegen
                  ? "rgba(220, 20, 60, 0.4)"
                  : "rgba(0, 128, 255, 0.4)",
                boxShadow: `0 4px 12px ${isDegen ? "rgba(220, 20, 60, 0.2)" : "rgba(0, 128, 255, 0.2)"}`,
              }}
            >
              <action.icon
                className="w-6 h-6"
                style={{
                  color: isDegen ? "#DC143C" : "#0080FF",
                }}
              />
              <span className="text-xs text-white font-medium font-[Bebas_Neue]">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </Section>

      {/* Shadow Mode Section */}
      <Section padding="none">
        <VStack spacing="sm">
          <h2 className="text-white font-[Koulen] text-lg">🎭 Shadow Mode</h2>
          <DecoyWalletMode
            isActive={decoyWalletActive}
            onToggle={setDecoyWalletActive}
            type={type}
          />
        </VStack>
      </Section>

      {/* Quick Info Widgets */}
      <Section padding="none">
        <VStack spacing="sm">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-[Koulen] text-lg">⚡ Quick Info</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshDashboard()}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>

          {/* Gas Price + Watchlist Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gas Price Widget */}
            <GlassCard
              className="p-6 cursor-pointer"
              onClick={() => setActiveFeaturePage("gas")}
              glowColor={isDegen ? "#DC143C" : "#0080FF"}
            >
              <VStack spacing="md">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Fuel
                      className="w-6 h-6"
                      style={{
                        color: isDegen ? "#DC143C" : "#0080FF",
                      }}
                    />
                    <span className="text-base text-white font-[Bebas_Neue]">
                      Gas
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">GWE</Badge>
                </div>
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40 font-[Bebas_Neue]">
                      Fast
                    </span>
                    <span className="text-lg text-white font-medium">
                      {gasPrice.fast}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40 font-[Bebas_Neue]">
                      Standard
                    </span>
                    <span className="text-lg text-white font-medium">
                      {gasPrice.standard}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40 font-[Bebas_Neue]">
                      Slow
                    </span>
                    <span className="text-lg text-white font-medium">
                      {gasPrice.slow}
                    </span>
                  </div>
                </div>
              </VStack>
            </GlassCard>

            {/* Watchlist Widget */}
            <GlassCard
              className="p-6 cursor-pointer"
              onClick={() => setActiveFeaturePage("portfolio")}
              glowColor={isDegen ? "#DC143C" : "#0080FF"}
            >
              <VStack spacing="md">
                <div className="flex items-center gap-3">
                  <Star
                    className="w-6 h-6"
                    style={{
                      color: isDegen ? "#DC143C" : "#0080FF",
                    }}
                  />
                  <span className="text-base text-white font-[Bebas_Neue]">
                    Watch
                  </span>
                </div>
                <div className="w-full space-y-3">
                  {watchlist.map((token) => (
                    <div
                      key={token.symbol}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-white/80">
                        {token.symbol}
                      </span>
                      <div
                        className={`flex items-center gap-2 ${token.change24h > 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {token.change24h > 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(token.change24h)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </VStack>
            </GlassCard>
          </div>

          {/* My Tokens Widget - Full Width */}
          <GlassCard
            className="p-6 cursor-pointer"
            onClick={() => setActiveFeaturePage("portfolio")}
            glowColor={isDegen ? "#DC143C" : "#0080FF"}
          >
            <VStack spacing="md">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Wallet
                    className="w-6 h-6"
                    style={{
                      color: isDegen ? "#DC143C" : "#0080FF",
                    }}
                  />
                  <span className="text-base text-white font-[Bebas_Neue]">
                    My Tokens
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {myTokens.length}
                </Badge>
              </div>
              <div className="w-full space-y-3">
                {myTokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {token.icon}
                      </span>
                      <div>
                        <p className="text-sm text-white font-medium">
                          {token.symbol}
                        </p>
                        <p className="text-xs text-white/40">
                          {token.balance}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Mini Chart */}
                      <div className="hidden md:block">
                        <MiniLineChart
                          data={token.chartData}
                          change={token.change24h}
                          width={80}
                          height={30}
                        />
                      </div>
                      {/* Value and Change */}
                      <div className="text-right">
                        <p className="text-sm text-white font-medium">
                          ${token.value.toLocaleString()}
                        </p>
                        <div
                          className={`flex items-center gap-1 justify-end ${token.change24h > 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {token.change24h > 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span className="text-xs font-medium">
                            {token.change24h > 0 ? "+" : ""}
                            {token.change24h}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </VStack>
          </GlassCard>
        </VStack>
      </Section>

      {/* Degen/Regen Widgets Section */}
      <Section padding="none">
        <VStack spacing="sm">
          <h2 className="text-white font-[Bebas_Neue] font-bold text-lg">
            {isDegen ? "🔥 Degen Tools" : "🛡️ Regen Tools"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map((widget, index) => (
              <motion.div
                key={widget.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  className="p-6 cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() =>
                    setActiveFeaturePage(widget.page)
                  }
                  glowColor={
                    widget.highlight
                      ? isDegen
                        ? "#DC143C"
                        : "#0080FF"
                      : undefined
                  }
                >
                  <VStack spacing="md">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            background: `${isDegen ? "#DC143C" : "#0080FF"}20`,
                            border: `1px solid ${isDegen ? "#DC143C" : "#0080FF"}40`,
                          }}
                        >
                          <widget.icon
                            className="w-5 h-5"
                            style={{
                              color: isDegen
                                ? "#DC143C"
                                : "#0080FF",
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm">
                            {widget.title}
                          </h3>
                          <p className="text-white/50 text-xs">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-white/30" />
                    </div>
                    <div className="flex items-center justify-between w-full pt-3 border-t border-white/10">
                      <span className="text-white/60 text-xs">
                        Status
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: isDegen
                            ? "#DC143C"
                            : "#0080FF",
                        }}
                      >
                        {widget.stats}
                      </span>
                    </div>
                  </VStack>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </VStack>
      </Section>
    </div>
  );

  const getPageContent = () => {
    if (activeFeaturePage) {
      return (
        <div className="min-h-screen pt-4">
          {renderFeature()}
        </div>
      );
    }

    if (activeTab === "trading") {
      return (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe > 10000) {
              handleSwipe("left");
            } else if (swipe < -10000) {
              handleSwipe("right");
            }
          }}
        >
          <TradingPageEnhanced
            type={type}
            onClose={() => setActiveTab("home")}
          />
        </motion.div>
      );
    }

    if (activeTab === "activity") {
      return (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe > 10000) {
              handleSwipe("left");
            } else if (swipe < -10000) {
              handleSwipe("right");
            }
          }}
        >
          <ActivityPage
            type={type}
            onClose={() => setActiveTab("home")}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </motion.div>
      );
    }

    if (activeTab === "more") {
      return (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe > 10000) {
              handleSwipe("left");
            } else if (swipe < -10000) {
              handleSwipe("right");
            }
          }}
        >
          <MoreMenu
            type={type}
            onClose={() => setActiveTab("home")}
            onNavigate={(page) => {
              console.log("Navigate to:", page);
              setActiveFeaturePage(page);
            }}
          />
        </motion.div>
      );
    }

    // Default: Home Dashboard
    return (
      <Container maxWidth="7xl" className="px-4 md:px-6">
        {renderDashboardContent()}
      </Container>
    );
  };

  return (
    <PageLayout
      mode={type}
      transition="none"
      backgroundPattern="none"
      maxWidth="full"
      className="min-h-screen bg-black pb-24 md:pb-20 overflow-x-hidden"
    >
      {/* Animated Background */}
      <SubtleGradientBackground
        type={type}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Circuit Background - replaces particle effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <TriangulatedBackground type={type} />
      </div>

      {/* Toast Provider */}
      <ToastProvider type={type} />

      {/* Permanent Header */}
      <div className="relative z-[100]">
        <Header
          type={type}
          onNavigate={handleNavigate}
          user={user}
          network={network}
          onNetworkChange={handleNetworkChange}
          unreadNotifications={unreadNotifications}
          onLogout={onLogout}
          onTribeSwitch={onTribeSwitch}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-6">
        {getPageContent()}
      </div>

      {/* Bottom Nav */}
      {!activeFeaturePage && (
        <div className="relative z-10">
          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            type={type}
            degenPercent={degenPercent}
            regenPercent={regenPercent}
          />
        </div>
      )}
      {activeFeaturePage && (
        <div className="relative z-10">
          <BottomNav
            activeTab="more"
            onTabChange={(tab) => {
              setActiveFeaturePage(null);
              setActiveTab(tab);
            }}
            type={type}
            degenPercent={degenPercent}
            regenPercent={regenPercent}
          />
        </div>
      )}
    </PageLayout>
  );
}
