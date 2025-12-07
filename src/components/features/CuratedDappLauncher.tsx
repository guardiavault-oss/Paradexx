import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../../design-system";
import {
  Shield,
  ShieldCheck,
  Star,
  Clock,
  TrendingUp,
  Search,
  ExternalLink,
  Heart,
  AlertTriangle,
  CheckCircle,
  Zap,
  Coins,
  Image,
  GitBranch,
  Sparkles,
  Gamepad2,
  X,
  Info,
  Users,
  Lock,
} from "lucide-react";
import { Button, Badge, GlassCard } from "../ui";
import { StaggeredList, CardReveal } from "../ui";

// Types
interface DappInfo {
  id: string;
  name: string;
  description: string;
  url: string;
  logo: string;
  category: DappCategory;
  chains: string[];
  trustScore: number; // 0-100
  badges: TrustBadge[];
  tvl?: string;
  audits: string[];
  riskLevel: "safe" | "moderate" | "advanced";
  beginnerFriendly: boolean;
  isOfficial: boolean;
  isNew: boolean;
  users24h?: number;
  riskNotes?: string[];
}

type DappCategory =
  | "dex"
  | "lending"
  | "nft"
  | "bridge"
  | "staking"
  | "gaming"
  | "other";
type TrustBadge =
  | "audited"
  | "high-tvl"
  | "official"
  | "new"
  | "risky"
  | "verified"
  | "popular";

interface CuratedDappLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  currentChain?: string;
  userMode?: "beginner" | "pro" | "guardian";
  walletType?: "degen" | "regen";
}

// Curated dApps Database
const CURATED_DAPPS: DappInfo[] = [
  // DEXs
  {
    id: "uniswap",
    name: "Uniswap",
    description:
      "The leading decentralized exchange. Swap tokens with low fees.",
    url: "https://app.uniswap.org",
    logo: "🦄",
    category: "dex",
    chains: [
      "ethereum",
      "polygon",
      "arbitrum",
      "optimism",
      "base",
    ],
    trustScore: 98,
    badges: [
      "audited",
      "high-tvl",
      "official",
      "verified",
      "popular",
    ],
    tvl: "$5.2B",
    audits: ["Trail of Bits", "OpenZeppelin", "ABDK"],
    riskLevel: "safe",
    beginnerFriendly: true,
    isOfficial: true,
    isNew: false,
    users24h: 142000,
  },
  {
    id: "sushiswap",
    name: "SushiSwap",
    description:
      "Community-owned DEX with yield farming opportunities.",
    url: "https://www.sushi.com/swap",
    logo: "🍣",
    category: "dex",
    chains: ["ethereum", "polygon", "arbitrum", "avalanche"],
    trustScore: 88,
    badges: ["audited", "verified"],
    tvl: "$420M",
    audits: ["PeckShield", "Quantstamp"],
    riskLevel: "safe",
    beginnerFriendly: true,
    isOfficial: true,
    isNew: false,
    users24h: 28000,
  },
  {
    id: "curve",
    name: "Curve Finance",
    description:
      "Optimized for stablecoin swaps with minimal slippage.",
    url: "https://curve.fi",
    logo: "🌀",
    category: "dex",
    chains: ["ethereum", "polygon", "arbitrum", "avalanche"],
    trustScore: 95,
    badges: ["audited", "high-tvl", "official"],
    tvl: "$2.1B",
    audits: ["Trail of Bits", "Quantstamp"],
    riskLevel: "moderate",
    beginnerFriendly: false,
    isOfficial: true,
    isNew: false,
    users24h: 15000,
    riskNotes: [
      "Complex UI for beginners",
      "Requires understanding of LP mechanics",
    ],
  },
  // Lending
  {
    id: "aave",
    name: "Aave",
    description:
      "Leading DeFi lending protocol. Earn interest or borrow assets.",
    url: "https://app.aave.com",
    logo: "👻",
    category: "lending",
    chains: [
      "ethereum",
      "polygon",
      "arbitrum",
      "optimism",
      "avalanche",
    ],
    trustScore: 97,
    badges: [
      "audited",
      "high-tvl",
      "official",
      "verified",
      "popular",
    ],
    tvl: "$12.8B",
    audits: [
      "Trail of Bits",
      "OpenZeppelin",
      "Certora",
      "SigmaPrime",
    ],
    riskLevel: "safe",
    beginnerFriendly: true,
    isOfficial: true,
    isNew: false,
    users24h: 89000,
  },
  {
    id: "compound",
    name: "Compound",
    description:
      "Algorithmic money markets. Earn COMP rewards while lending.",
    url: "https://app.compound.finance",
    logo: "🏦",
    category: "lending",
    chains: ["ethereum", "polygon", "arbitrum"],
    trustScore: 94,
    badges: ["audited", "high-tvl", "official"],
    tvl: "$2.4B",
    audits: ["Trail of Bits", "OpenZeppelin"],
    riskLevel: "safe",
    beginnerFriendly: true,
    isOfficial: true,
    isNew: false,
    users24h: 18000,
  },
  // Staking
  {
    id: "lido",
    name: "Lido Finance",
    description:
      "Liquid staking for ETH. Stake and stay liquid with stETH.",
    url: "https://stake.lido.fi",
    logo: "🌊",
    category: "staking",
    chains: ["ethereum", "polygon"],
    trustScore: 96,
    badges: ["audited", "high-tvl", "official", "verified"],
    tvl: "$28.5B",
    audits: ["Quantstamp", "MixBytes", "Sigma Prime"],
    riskLevel: "safe",
    beginnerFriendly: true,
    isOfficial: true,
    isNew: false,
    users24h: 52000,
  },
  {
    id: "rocketpool",
    name: "Rocket Pool",
    description:
      "Decentralized ETH staking. More decentralized alternative to Lido.",
    url: "https://stake.rocketpool.net",
    logo: "🚀",
    category: "staking",
    chains: ["ethereum"],
    trustScore: 92,
    badges: ["audited", "official", "verified"],
    tvl: "$4.2B",
    audits: [
      "Sigma Prime",
      "Consensys Diligence",
      "Trail of Bits",
    ],
    riskLevel: "safe",
    beginnerFriendly: true,
    isOfficial: true,
    isNew: false,
    users24h: 12000,
  },
  // Bridges
  {
    id: "stargate",
    name: "Stargate Finance",
    description:
      "LayerZero bridge for seamless cross-chain transfers.",
    url: "https://stargate.finance",
    logo: "⭐",
    category: "bridge",
    chains: [
      "ethereum",
      "polygon",
      "arbitrum",
      "optimism",
      "avalanche",
    ],
    trustScore: 89,
    badges: ["audited", "verified"],
    tvl: "$320M",
    audits: ["Quantstamp", "Zokyo"],
    riskLevel: "moderate",
    beginnerFriendly: false,
    isOfficial: true,
    isNew: false,
    users24h: 8500,
    riskNotes: [
      "Bridge risks - always verify destination address",
    ],
  },
  {
    id: "across",
    name: "Across Protocol",
    description: "Fast, cheap, and secure cross-chain bridge.",
    url: "https://across.to",
    logo: "🌉",
    category: "bridge",
    chains: [
      "ethereum",
      "polygon",
      "arbitrum",
      "optimism",
      "base",
    ],
    trustScore: 87,
    badges: ["audited", "verified"],
    tvl: "$180M",
    audits: ["OpenZeppelin"],
    riskLevel: "moderate",
    beginnerFriendly: false,
    isOfficial: true,
    isNew: false,
    users24h: 6200,
    riskNotes: ["Bridge risks apply - double-check chains"],
  },
  // NFTs
  {
    id: "opensea",
    name: "OpenSea",
    description:
      "The largest NFT marketplace. Buy, sell, and discover digital items.",
    url: "https://opensea.io",
    logo: "🌊",
    category: "nft",
    chains: [
      "ethereum",
      "polygon",
      "arbitrum",
      "avalanche",
      "base",
    ],
    trustScore: 92,
    badges: ["official", "verified", "popular"],
    audits: ["Trail of Bits"],
    riskLevel: "safe",
    beginnerFriendly: true,
    isOfficial: true,
    isNew: false,
    users24h: 185000,
  },
  {
    id: "blur",
    name: "Blur",
    description:
      "Pro NFT marketplace with advanced trading features.",
    url: "https://blur.io",
    logo: "🟠",
    category: "nft",
    chains: ["ethereum"],
    trustScore: 85,
    badges: ["verified", "popular"],
    audits: ["Code4rena"],
    riskLevel: "moderate",
    beginnerFriendly: false,
    isOfficial: true,
    isNew: false,
    users24h: 42000,
    riskNotes: [
      "Advanced traders only",
      "Blur bidding has unique mechanics",
    ],
  },
  // Gaming
  {
    id: "axie",
    name: "Axie Infinity",
    description:
      "Play-to-earn game with collectible creatures.",
    url: "https://axieinfinity.com",
    logo: "🎮",
    category: "gaming",
    chains: ["ethereum", "ronin"],
    trustScore: 78,
    badges: ["official", "popular"],
    audits: ["Certik"],
    riskLevel: "moderate",
    beginnerFriendly: true,
    isOfficial: true,
    isNew: false,
    users24h: 125000,
    riskNotes: [
      "Game economies can be volatile",
      "Ronin bridge required",
    ],
  },
];

const CATEGORY_INFO: Record<
  DappCategory,
  { icon: typeof Zap; label: string; color: string }
> = {
  dex: { icon: Zap, label: "DEX", color: "#8B5CF6" },
  lending: { icon: Coins, label: "Lending", color: "#10B981" },
  nft: { icon: Image, label: "NFT", color: "#EC4899" },
  bridge: {
    icon: GitBranch,
    label: "Bridges",
    color: "#F59E0B",
  },
  staking: { icon: Lock, label: "Staking", color: "#6366F1" },
  gaming: { icon: Gamepad2, label: "Gaming", color: "#EF4444" },
  other: { icon: Sparkles, label: "Other", color: "#A78BFA" },
};

const BADGE_CONFIG: Record<
  TrustBadge,
  {
    icon: typeof Shield;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  audited: {
    icon: ShieldCheck,
    label: "Audited",
    color: "#10B981",
    bgColor: "bg-green-500/10",
  },
  "high-tvl": {
    icon: TrendingUp,
    label: "High TVL",
    color: "#3B82F6",
    bgColor: "bg-blue-500/10",
  },
  official: {
    icon: CheckCircle,
    label: "Official",
    color: "#8B5CF6",
    bgColor: "bg-purple-500/10",
  },
  new: {
    icon: Sparkles,
    label: "New",
    color: "#F59E0B",
    bgColor: "bg-yellow-500/10",
  },
  risky: {
    icon: AlertTriangle,
    label: "Risky",
    color: "#EF4444",
    bgColor: "bg-red-500/10",
  },
  verified: {
    icon: Shield,
    label: "Verified",
    color: "#6366F1",
    bgColor: "bg-indigo-500/10",
  },
  popular: {
    icon: Users,
    label: "Popular",
    color: "#EC4899",
    bgColor: "bg-pink-500/10",
  },
};

export function CuratedDappLauncher({
  isOpen,
  onClose,
  currentChain = "ethereum",
  userMode = "pro",
  walletType = "degen",
}: CuratedDappLauncherProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    DappCategory | "all"
  >("all");
  const [showOnlyBeginner, setShowOnlyBeginner] = useState(
    userMode === "beginner",
  );
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem(
      "paradex_dapp_favorites",
    );
    return stored
      ? JSON.parse(stored)
      : ["uniswap", "aave", "lido"];
  });
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(
    () => {
      const stored = localStorage.getItem(
        "paradex_dapp_recent",
      );
      return stored ? JSON.parse(stored) : [];
    },
  );
  const [selectedDapp, setSelectedDapp] =
    useState<DappInfo | null>(null);

  const isDegen = walletType === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  // Filter dApps
  const filteredDapps = useMemo(() => {
    return CURATED_DAPPS.filter((dapp) => {
      if (
        searchQuery &&
        !dapp.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) &&
        !dapp.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (
        selectedCategory !== "all" &&
        dapp.category !== selectedCategory
      ) {
        return false;
      }
      if (showOnlyBeginner && !dapp.beginnerFriendly) {
        return false;
      }
      if (!dapp.chains.includes(currentChain.toLowerCase())) {
        return false;
      }
      return true;
    }).sort((a, b) => b.trustScore - a.trustScore);
  }, [
    searchQuery,
    selectedCategory,
    showOnlyBeginner,
    currentChain,
  ]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id];
      localStorage.setItem(
        "paradex_dapp_favorites",
        JSON.stringify(updated),
      );
      return updated;
    });
  };

  const launchDapp = (dapp: DappInfo) => {
    setRecentlyUsed((prev) => {
      const updated = [
        dapp.id,
        ...prev.filter((id) => id !== dapp.id),
      ].slice(0, 10);
      localStorage.setItem(
        "paradex_dapp_recent",
        JSON.stringify(updated),
      );
      return updated;
    });

    window.open(dapp.url, "_blank", "noopener,noreferrer");
  };

  const favoriteDapps = CURATED_DAPPS.filter((d) =>
    favorites.includes(d.id),
  );
  const recentDapps = recentlyUsed
    .map((id) => CURATED_DAPPS.find((d) => d.id === id))
    .filter(Boolean) as DappInfo[];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[var(--bg-base)]/90 backdrop-blur-xl z-[60] flex items-start justify-center overflow-y-auto py-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl mx-4 bg-[var(--bg-base)]/95 backdrop-blur-2xl rounded-2xl border border-[var(--border-neutral)]/10 overflow-hidden shadow-2xl"
          style={{
            boxShadow: `0 0 60px ${accentColor}30`,
          }}
        >
          {/* Header */}
          <div
            className="p-6 border-b border-[var(--border-neutral)]/10"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}20 100%)`,
                  }}
                >
                  <Shield className="w-7 h-7 text-[var(--text-primary)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                    Curated dApp Store
                  </h2>
                  <p className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider">
                    Every app safety-verified by Paradox
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-primary)]/50" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]/30" />
                <input
                  type="text"
                  placeholder="Search dApps..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl text-[var(--text-primary)] placeholder-white/30 focus:outline-none focus:bg-white/10 border border-[var(--border-neutral)]/10 focus:border-[var(--border-neutral)]/20 transition-all"
                />
              </div>
              <button
                onClick={() =>
                  setShowOnlyBeginner(!showOnlyBeginner)
                }
                className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all font-black uppercase tracking-wider text-sm ${showOnlyBeginner
                    ? "text-[var(--text-primary)] border border-green-500/50"
                    : "bg-white/5 text-[var(--text-primary)]/50 hover:bg-white/10 border border-[var(--border-neutral)]/10"
                  }`}
                style={
                  showOnlyBeginner
                    ? {
                      background: "rgba(16, 185, 129, 0.2)",
                    }
                    : {}
                }
              >
                <ShieldCheck className="w-4 h-4" />
                Beginner Safe
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${selectedCategory === "all"
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-primary)]/40 hover:text-[var(--text-primary)]/60"
                  }`}
                style={
                  selectedCategory === "all"
                    ? {
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                      boxShadow: `0 0 20px ${accentColor}40`,
                    }
                    : { background: "rgba(255,255,255,0.05)" }
                }
              >
                All
              </button>
              {Object.entries(CATEGORY_INFO).map(
                ([key, { icon: Icon, label, color }]) => (
                  <button
                    key={key}
                    onClick={() =>
                      setSelectedCategory(key as DappCategory)
                    }
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${selectedCategory === key
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-primary)]/40 hover:text-[var(--text-primary)]/60"
                      }`}
                    style={
                      selectedCategory === key
                        ? {
                          backgroundColor: color,
                          boxShadow: `0 0 20px ${color}40`,
                        }
                        : {
                          background:
                            "rgba(255,255,255,0.05)",
                        }
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {/* Favorites Section */}
            {favoriteDapps.length > 0 &&
              selectedCategory === "all" &&
              !searchQuery && (
                <CardReveal direction="up">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Heart
                        className="w-5 h-5 text-red-400"
                        fill="currentColor"
                      />
                      <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
                        Favorites
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {favoriteDapps.slice(0, 3).map((dapp) => (
                        <DappCard
                          key={dapp.id}
                          dapp={dapp}
                          isFavorite={true}
                          onToggleFavorite={() =>
                            toggleFavorite(dapp.id)
                          }
                          onLaunch={() => launchDapp(dapp)}
                          onViewDetails={() =>
                            setSelectedDapp(dapp)
                          }
                          compact
                          accentColor={accentColor}
                        />
                      ))}
                    </div>
                  </div>
                </CardReveal>
              )}

            {/* Recently Used */}
            {recentDapps.length > 0 &&
              selectedCategory === "all" &&
              !searchQuery && (
                <CardReveal direction="up" delay={0.1}>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-[var(--text-primary)]/50" />
                      <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
                        Recently Used
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recentDapps.slice(0, 3).map((dapp) => (
                        <DappCard
                          key={dapp.id}
                          dapp={dapp}
                          isFavorite={favorites.includes(
                            dapp.id,
                          )}
                          onToggleFavorite={() =>
                            toggleFavorite(dapp.id)
                          }
                          onLaunch={() => launchDapp(dapp)}
                          onViewDetails={() =>
                            setSelectedDapp(dapp)
                          }
                          compact
                          accentColor={accentColor}
                        />
                      ))}
                    </div>
                  </div>
                </CardReveal>
              )}

            {/* All dApps */}
            <CardReveal direction="up" delay={0.2}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
                    {selectedCategory === "all"
                      ? "All dApps"
                      : CATEGORY_INFO[selectedCategory].label}
                  </h3>
                  <span className="text-xs text-[var(--text-primary)]/40 uppercase tracking-wider font-bold">
                    {filteredDapps.length} apps
                  </span>
                </div>

                {filteredDapps.length === 0 ? (
                  <div className="text-center py-16">
                    <Search className="w-16 h-16 text-[var(--text-primary)]/20 mx-auto mb-4" />
                    <p className="text-[var(--text-primary)]/50 font-bold">
                      No dApps found matching your criteria
                    </p>
                    <p className="text-[var(--text-primary)]/30 text-sm mt-2">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDapps.map((dapp) => (
                      <DappCard
                        key={dapp.id}
                        dapp={dapp}
                        isFavorite={favorites.includes(dapp.id)}
                        onToggleFavorite={() =>
                          toggleFavorite(dapp.id)
                        }
                        onLaunch={() => launchDapp(dapp)}
                        onViewDetails={() =>
                          setSelectedDapp(dapp)
                        }
                        accentColor={accentColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardReveal>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--border-neutral)]/10 bg-[var(--bg-base)]/50">
            <p className="text-xs text-[var(--text-primary)]/40 text-center uppercase tracking-wider">
              🛡️ All dApps are curated and safety-checked by
              Paradox. Always DYOR before using any protocol.
            </p>
          </div>
        </motion.div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedDapp && (
            <DappDetailModal
              dapp={selectedDapp}
              isFavorite={favorites.includes(selectedDapp.id)}
              onToggleFavorite={() =>
                toggleFavorite(selectedDapp.id)
              }
              onLaunch={() => {
                launchDapp(selectedDapp);
                setSelectedDapp(null);
              }}
              onClose={() => setSelectedDapp(null)}
              accentColor={accentColor}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// DappCard Component
function DappCard({
  dapp,
  isFavorite,
  onToggleFavorite,
  onLaunch,
  onViewDetails,
  compact = false,
  accentColor,
}: {
  dapp: DappInfo;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onLaunch: () => void;
  onViewDetails: () => void;
  compact?: boolean;
  accentColor: string;
}) {
  const categoryInfo = CATEGORY_INFO[dapp.category];
  const isRisky = dapp.badges.includes("risky");

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`p-5 bg-white/5 backdrop-blur-xl rounded-xl border transition-all cursor-pointer ${isRisky
          ? "border-red-500/30 hover:border-red-500/50"
          : "border-[var(--border-neutral)]/10 hover:border-[var(--border-neutral)]/20"
        }`}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: `${categoryInfo.color}30` }}
        >
          {dapp.logo}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name & Favorite */}
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-black text-[var(--text-primary)] truncate uppercase tracking-tight">
              {dapp.name}
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${isFavorite
                    ? "text-red-400 fill-current"
                    : "text-[var(--text-primary)]/30"
                  }`}
              />
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {dapp.beginnerFriendly && (
              <Badge variant="success" size="sm" dot>
                Beginner
              </Badge>
            )}
            {!dapp.beginnerFriendly && (
              <Badge variant="warning" size="sm">
                Advanced
              </Badge>
            )}
            {dapp.badges.slice(0, 2).map((badge) => {
              const config = BADGE_CONFIG[badge];
              return (
                <span
                  key={badge}
                  className={`px-2 py-1 text-xs rounded-full ${config.bgColor} font-black uppercase tracking-wider`}
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
              );
            })}
          </div>

          {!compact && (
            <p className="text-sm text-[var(--text-primary)]/60 mb-3 line-clamp-2">
              {dapp.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-[var(--text-primary)]/40">
            {dapp.tvl && (
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="font-black uppercase tracking-wider">
                  {dapp.tvl}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-black uppercase tracking-wider">
                {dapp.trustScore}% Safe
              </span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onLaunch();
            }}
            className="p-2.5 rounded-xl transition-colors"
            style={{
              background: `${accentColor}20`,
            }}
          >
            <ExternalLink
              className="w-4 h-4"
              style={{ color: accentColor }}
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Info className="w-4 h-4 text-[var(--text-primary)]/50" />
          </motion.button>
        </div>
      </div>

      {/* Risk Warning */}
      {isRisky && (
        <div className="mt-3 p-3 bg-red-500/10 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 font-bold">
            {dapp.riskNotes?.[0] ||
              "High risk - proceed with caution"}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// DappDetailModal Component
function DappDetailModal({
  dapp,
  isFavorite,
  onToggleFavorite,
  onLaunch,
  onClose,
  accentColor,
}: {
  dapp: DappInfo;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onLaunch: () => void;
  onClose: () => void;
  accentColor: string;
}) {
  const categoryInfo = CATEGORY_INFO[dapp.category];
  const isRisky = dapp.badges.includes("risky");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[var(--bg-base)]/70 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--bg-base)]/95 backdrop-blur-2xl rounded-2xl border border-[var(--border-neutral)]/10 overflow-hidden shadow-2xl"
        style={{
          boxShadow: `0 0 60px ${accentColor}30`,
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b border-[var(--border-neutral)]/10"
          style={{
            background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}05 100%)`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                backgroundColor: `${categoryInfo.color}40`,
              }}
            >
              {dapp.logo}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                  {dapp.name}
                </h2>
                <button onClick={onToggleFavorite}>
                  <Heart
                    className={`w-5 h-5 ${isFavorite
                        ? "text-red-400 fill-current"
                        : "text-[var(--text-primary)]/30"
                      }`}
                  />
                </button>
              </div>
              <p className="text-sm text-[var(--text-primary)]/60">
                {dapp.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-primary)]/50" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Trust Score */}
          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-primary)]/60 font-black uppercase tracking-wider">
                Trust Score
              </span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${dapp.trustScore}%`,
                      backgroundColor:
                        dapp.trustScore >= 80
                          ? "#10B981"
                          : dapp.trustScore >= 50
                            ? "#F59E0B"
                            : "#EF4444",
                    }}
                  />
                </div>
                <span className="font-black text-[var(--text-primary)] text-lg">
                  {dapp.trustScore}%
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Badges */}
          <div>
            <h4 className="text-sm font-black text-[var(--text-primary)] mb-3 uppercase tracking-wider">
              Trust Badges
            </h4>
            <div className="flex flex-wrap gap-2">
              {dapp.badges.map((badge) => {
                const config = BADGE_CONFIG[badge];
                const Icon = config.icon;
                return (
                  <span
                    key={badge}
                    className={`px-3 py-2 rounded-xl flex items-center gap-2 ${config.bgColor} font-black uppercase tracking-wider text-sm`}
                    style={{ color: config.color }}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Audits */}
          {dapp.audits.length > 0 && (
            <div>
              <h4 className="text-sm font-black text-[var(--text-primary)] mb-3 uppercase tracking-wider">
                Security Audits
              </h4>
              <div className="flex flex-wrap gap-2">
                {dapp.audits.map((audit) => (
                  <Badge
                    key={audit}
                    variant="success"
                    size="md"
                  >
                    ✓ {audit}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Supported Chains */}
          <div>
            <h4 className="text-sm font-black text-[var(--text-primary)] mb-3 uppercase tracking-wider">
              Supported Chains
            </h4>
            <div className="flex flex-wrap gap-2">
              {dapp.chains.map((chain) => (
                <Badge key={chain} variant="default" size="md">
                  {chain}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {dapp.tvl && (
              <GlassCard hover={false}>
                <p className="text-xs text-[var(--text-primary)]/40 uppercase tracking-wider mb-1">
                  Total Value Locked
                </p>
                <p className="text-lg font-black text-[var(--text-primary)]">
                  {dapp.tvl}
                </p>
              </GlassCard>
            )}
            {dapp.users24h && (
              <GlassCard hover={false}>
                <p className="text-xs text-[var(--text-primary)]/40 uppercase tracking-wider mb-1">
                  24h Users
                </p>
                <p className="text-lg font-black text-[var(--text-primary)]">
                  {dapp.users24h.toLocaleString()}
                </p>
              </GlassCard>
            )}
          </div>

          {/* Risk Notes */}
          {dapp.riskNotes && dapp.riskNotes.length > 0 && (
            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h4 className="text-sm font-black text-yellow-400 uppercase tracking-wider">
                  Risk Notes
                </h4>
              </div>
              <ul className="space-y-2">
                {dapp.riskNotes.map((note, i) => (
                  <li
                    key={i}
                    className="text-sm text-yellow-200/80 flex gap-2"
                  >
                    <span>•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[var(--border-neutral)]/10">
          <Button
            variant="primary"
            size="lg"
            onClick={onLaunch}
            fullWidth
            leftIcon={<ExternalLink className="w-5 h-5" />}
          >
            {isRisky
              ? "Launch Anyway (High Risk)"
              : "Launch App"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CuratedDappLauncher;