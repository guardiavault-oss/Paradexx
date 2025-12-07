import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  X,
  Search,
  Shield,
  Zap,
  Lock,
  Users,
  Eye,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Flame,
  Target,
  Crosshair,
  Radar,
  PieChart,
  Box,
  Settings,
  Wallet,
  Send,
  Download,
  ArrowLeftRight,
  Gift,
  Trophy,
  LineChart,
  Activity,
  History,
  Bell,
  FileText,
  Calculator,
  DollarSign,
  Coins,
  Smartphone,
  Globe,
  CreditCard,
  Repeat,
  TrendingDown,
  Gauge,
  LayoutDashboard,
  Briefcase,
  Building2,
  Sparkles,
  MessageCircle,
  Bot,
  Rocket,
  Layers,
  Scan,
  Wrench,
  BookOpen,
  Code2,
} from "lucide-react";
import { ScarletteChat } from "./ScarletteChat";
import { GlowingBall } from "./ui/GlowingBall";

interface MoreMenuProps {
  type: "degen" | "regen";
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export function MoreMenu({ type, onClose, onNavigate }: MoreMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showScarlette, setShowScarlette] = useState(false);
  const isDegen = type === "degen";

  const colors = {
    primary: isDegen ? "#DC143C" : "#0080FF",
    secondary: isDegen ? "#8B0000" : "#000080",
    gradient: isDegen
      ? "linear-gradient(135deg, rgba(220, 20, 60, 0.2) 0%, rgba(139, 0, 0, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(0, 128, 255, 0.2) 0%, rgba(0, 0, 128, 0.1) 100%)",
    border: isDegen ? "rgba(220, 20, 60, 0.2)" : "rgba(0, 128, 255, 0.2)",
  };

  // Always Available Features (Both Tribes)
  const coreFeatures = [
    {
      id: "portfolio",
      title: "Portfolio",
      description: "View your complete portfolio",
      icon: PieChart,
      category: "Core Features",
    },
    {
      id: "swap",
      title: "Swap",
      description: "Exchange tokens instantly",
      icon: ArrowLeftRight,
      category: "Core Features",
    },
    {
      id: "buy",
      title: "Buy Crypto",
      description: "Purchase crypto with fiat",
      icon: CreditCard,
      category: "Core Features",
    },
    {
      id: "nft",
      title: "NFT Gallery",
      description: "View your NFT collection",
      icon: Box,
      category: "Core Features",
    },
    {
      id: "airdrop",
      title: "Airdrop Hunter",
      description: "Find & claim airdrops",
      icon: Gift,
      category: "Core Features",
    },
    {
      id: "scarlette",
      title: "Scarlette AI",
      description: "Your intelligent crypto assistant",
      icon: Bot,
      category: "Core Features",
      isNew: true,
    },
    {
      id: "inheritance",
      title: "Legacy Vaults",
      description: "Digital inheritance & legacy",
      icon: Users,
      category: "Core Features",
    },
    {
      id: "settings",
      title: "Settings",
      description: "Customize your experience",
      icon: Settings,
      category: "Core Features",
    },
  ];

  // Degen Features
  const degenFeatures = [
    {
      id: "sniper",
      title: "Sniper Bot",
      description: "Automated token sniping",
      icon: Crosshair,
      category: "Degen Features",
    },
    {
      id: "whale",
      title: "Whale Tracker",
      description: "Track whale movements",
      icon: Radar,
      category: "Degen Features",
    },
    {
      id: "meme",
      title: "Meme Radar",
      description: "Discover trending meme coins",
      icon: Flame,
      category: "Degen Features",
    },
  ];

  // Regen Features
  const regenFeatures = [
    {
      id: "security",
      title: "Wallet Guard",
      description: "Advanced security monitoring",
      icon: Shield,
      category: "Regen Features",
    },
    {
      id: "mev",
      title: "MEV Protection",
      description: "Shield against MEV attacks",
      icon: Lock,
      category: "Regen Features",
    },
    {
      id: "privacy",
      title: "Privacy Shield",
      description: "Enhanced transaction privacy",
      icon: Eye,
      category: "Regen Features",
    },
    {
      id: "defi",
      title: "DeFi Dashboard",
      description: "Monitor DeFi positions",
      icon: BarChart3,
      category: "Regen Features",
    },
  ];

  // Utility Features
  const utilityFeatures = [
    {
      id: "dapps",
      title: "dApp Launcher",
      description: "Browse & launch curated dApps",
      icon: Rocket,
      category: "Utilities",
      isNew: true,
    },
    {
      id: "gas",
      title: "Gas Manager",
      description: "Optimize transaction fees",
      icon: Gauge,
      category: "Utilities",
    },
    {
      id: "analytics",
      title: "Portfolio Analytics",
      description: "Advanced portfolio insights",
      icon: LineChart,
      category: "Utilities",
    },
    {
      id: "tokens",
      title: "Custom Tokens",
      description: "Import & manage tokens",
      icon: Coins,
      category: "Utilities",
    },
    {
      id: "hardware",
      title: "Hardware Wallet",
      description: "Connect Ledger & Trezor",
      icon: Smartphone,
      category: "Utilities",
    },
    {
      id: "bridge",
      title: "Bridge Security",
      description: "Safe cross-chain transfers",
      icon: Layers,
      category: "Utilities",
    },
    {
      id: "help",
      title: "Help Center",
      description: "Get support & tutorials",
      icon: MessageCircle,
      category: "Utilities",
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Manage alerts & updates",
      icon: Bell,
      category: "Utilities",
    },
  ];

  const allFeatures = [
    ...coreFeatures,
    ...degenFeatures,
    ...regenFeatures,
    ...utilityFeatures,
  ];

  const filteredFeatures = allFeatures.filter(
    (feature) =>
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const groupedFeatures = filteredFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, typeof allFeatures>);

  const handleNavigate = (page: string) => {
    if (page === "scarlette") {
      setShowScarlette(true);
      return;
    }
    onNavigate(page);
    onClose();
  };

  const renderMenuItem = (item: typeof allFeatures[number], index: number) => (
    <motion.button
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleNavigate(item.id)}
      className="w-full p-4 rounded-xl border backdrop-blur-sm text-left"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        borderColor: colors.border,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-xl shrink-0"
          style={{ background: `${colors.primary}20` }}
        >
          <item.icon className="w-5 h-5" style={{ color: colors.primary }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white">{item.title}</span>
            {item.isNew && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: `${colors.secondary}20`,
                  color: colors.secondary,
                }}
              >
                NEW
              </span>
            )}
            {item.isPro && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: "rgba(251, 191, 36, 0.2)",
                  color: "#fbbf24",
                }}
              >
                PRO
              </span>
            )}
            {item.badge && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: `${colors.primary}20`,
                  color: colors.primary,
                }}
              >
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-white/50">{item.description}</p>
        </div>
        <Crosshair className="w-4 h-4 text-white/30 shrink-0" />
      </div>
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white pb-24 md:pb-20"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 max-w-7xl mx-auto">
          <h1 className="text-lg md:text-2xl font-black uppercase tracking-tight">
            All Features
          </h1>
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
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6 md:mb-8">
          <div
            className="flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Search className="w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 text-sm md:text-base"
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Search Results */}
          {filteredFeatures ? (
            <div>
              <h3 className="text-sm text-white/60 mb-3 uppercase tracking-wide">
                Search Results ({filteredFeatures.length})
              </h3>
              {filteredFeatures.length === 0 ? (
                <div className="p-12 text-center">
                  <Search className="w-12 h-12 mx-auto mb-3 text-white/20" />
                  <div className="text-white mb-1">No results found</div>
                  <p className="text-sm text-white/50">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFeatures.map((item, index) => renderMenuItem(item, index))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Core Features */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" style={{ color: colors.primary }} />
                  <h3 className="text-sm text-white/60 uppercase tracking-wide">Core Features</h3>
                </div>
                <div className="space-y-2">
                  {coreFeatures.map((item, index) => renderMenuItem(item, index))}
                </div>
              </div>

              {/* Degen Features */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-[#ff3366]" />
                  <h3 className="text-sm text-white/60 uppercase tracking-wide">Degen Features</h3>
                  {!isDegen && (
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50">
                      Available
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {degenFeatures.map((item, index) => renderMenuItem(item, index))}
                </div>
              </div>

              {/* Regen Features */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-[#00d4ff]" />
                  <h3 className="text-sm text-white/60 uppercase tracking-wide">Regen Features</h3>
                  {isDegen && (
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50">
                      Available
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {regenFeatures.map((item, index) => renderMenuItem(item, index))}
                </div>
              </div>

              {/* Utilities */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-white/60" />
                  <h3 className="text-sm text-white/60 uppercase tracking-wide">Utilities</h3>
                </div>
                <div className="space-y-2">
                  {utilityFeatures.map((item, index) => renderMenuItem(item, index))}
                </div>
              </div>

              {/* Info Card */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: `${colors.primary}10`,
                  borderColor: `${colors.primary}30`,
                }}
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.primary }} />
                  <div>
                    <div className="text-sm mb-1" style={{ color: colors.primary }}>
                      All Features Always Accessible
                    </div>
                    <p className="text-xs text-white/60">
                      Your {isDegen ? "Degen" : "Regen"} mode sets the default dashboard, but you can
                      access any feature at any time. Customize your experience in Settings.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
    </motion.div>
  );
}