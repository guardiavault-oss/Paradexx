import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Settings,
  ChevronRight,
  Sparkles,
  Percent,
  AlertCircle,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Zap,
  Lock,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useVaults } from "@/hooks/useVaults";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { SkipLink } from "@/components/SkipLink";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ContextualHelp } from "@/components/ui/contextual-help";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureHint } from "@/components/FeatureHint";
import { useFeatureDiscovery } from "@/hooks/useFeatureDiscovery";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Lazy load heavy dashboard components
const YieldComparisonChart = lazy(() => import("@/components/YieldComparisonChart"));
const YieldPerformanceShare = lazy(() => import("@/components/YieldPerformanceShare"));
const Achievements = lazy(() => import("@/components/dashboard/Achievements"));
const EducationHub = lazy(() => import("@/components/dashboard/EducationHub"));
const PassphraseDisplay = lazy(() => import("@/components/PassphraseDisplay"));

import "../design-system.css";

// Constants
const AUTH_CHECK_DELAY = 200;
const FEATURE_HINT_DELAY = 2000;
const ETH_PRICE_FALLBACK = 3000;

// Types
interface YieldData {
  apy?: number;
  yieldAccumulated?: string;
  principal?: string;
  totalValue?: string;
  asset?: string;
  stakingProtocol?: string;
}

interface PassphraseData {
  masterSecret: string;
  guardianPassphrases: Array<{
    guardianId: string;
    guardianName: string;
    guardianEmail: string;
    passphrase: string;
  }>;
  vaultName: string;
}

interface StatItem {
  label: string;
  value: string;
  change?: string;
  trend: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  helpText?: string;
}

interface QuickAction {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  accent: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const cardHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
};

// Custom hooks
function useYieldData(vaultId: string | undefined) {
  const [data, setData] = useState<YieldData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vaultId) {
      setData(null);
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    const fetchYieldData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/vaults/${vaultId}/yield`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch yield data: ${response.status}`);
        }

        const yieldData = await response.json();
        if (mounted) setData(yieldData);
      } catch (err) {
        if (mounted && (err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : "Failed to load yield data");
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchYieldData();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [vaultId]);

  return { data, loading, error };
}

function useEthPrice() {
  const [ethPrice, setEthPrice] = useState(ETH_PRICE_FALLBACK);

  useEffect(() => {
    let mounted = true;

    async function fetchEthPrice() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        if (!response.ok) throw new Error('Failed to fetch ETH price');
        const data = await response.json();
        const price = data.ethereum?.usd;
        if (mounted && price) setEthPrice(price);
      } catch {
        if (mounted) setEthPrice(ETH_PRICE_FALLBACK);
      }
    }

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return ethPrice;
}

function usePassphraseStorage(vaultId: string | undefined) {
  const [passphraseData, setPassphraseData] = useState<PassphraseData | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!vaultId) return;
    try {
      const stored = sessionStorage.getItem(`vault_passphrases_${vaultId}`);
      if (stored) {
        const data = JSON.parse(stored) as PassphraseData;
        setPassphraseData(data);
        setShowDialog(true);
        sessionStorage.removeItem(`vault_passphrases_${vaultId}`);
      }
    } catch { }
  }, [vaultId]);

  const clearPassphraseData = useCallback(() => {
    setPassphraseData(null);
    setShowDialog(false);
  }, []);

  return { passphraseData, showDialog, setShowDialog, clearPassphraseData };
}

// Main Dashboard Component
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, walletAddress, isAuthenticated, checkAuth } = useWallet();
  const { data: vaultsData, isLoading: vaultsLoading } = useVaults();
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscription();
  const { activeHint, dismissHint, showHint } = useFeatureDiscovery();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("portfolio");

  const vault = vaultsData?.vaults?.[0] || null;
  const { data: yieldData, loading: yieldLoading, error: yieldError } = useYieldData(vault?.id);
  const ethPrice = useEthPrice();
  const {
    passphraseData,
    showDialog: showPassphraseDialog,
    setShowDialog: setShowPassphraseDialog,
    clearPassphraseData
  } = usePassphraseStorage(vault?.id);

  // Auth check
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | undefined;

    const performAuthCheck = async () => {
      if (!checkAuth) {
        setCheckingAuth(false);
        return;
      }
      try {
        await checkAuth();
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    };

    performAuthCheck();

    const hasOAuthParams = window.location.search.includes('code=') ||
      window.location.search.includes('state=') ||
      window.location.hash.includes('access_token');

    if (hasOAuthParams) {
      timeoutId = setTimeout(() => {
        if (mounted) performAuthCheck();
      }, AUTH_CHECK_DELAY);
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [checkAuth]);

  useEffect(() => {
    if (!checkingAuth && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, checkingAuth, setLocation]);

  useEffect(() => {
    if (vaultsLoading || !vaultsData) return;
    if (vaultsData.vaults.length === 0) {
      const timeoutId = setTimeout(() => {
        showHint({
          id: "create-first-vault",
          title: "Create Your First Vault",
          description: "Start by creating a vault to protect your crypto and earn yield",
          targetSelector: '[aria-label="Navigate to Create Vault"]',
          position: "bottom",
        });
      }, FEATURE_HINT_DELAY);
      return () => clearTimeout(timeoutId);
    }
  }, [vaultsLoading, vaultsData, showHint]);

  // Calculate metrics
  const portfolioMetrics = useMemo(() => {
    const totalValue = yieldData?.totalValue ? parseFloat(yieldData.totalValue) * ethPrice : 0;
    const earnings = yieldData?.yieldAccumulated ? parseFloat(yieldData.yieldAccumulated) * ethPrice : 0;
    const apy = yieldData?.apy || 0;
    return { totalValue, earnings, apy };
  }, [yieldData, ethPrice]);

  // Stats config
  const stats: StatItem[] = useMemo(() => [
    {
      label: "Portfolio Value",
      value: portfolioMetrics.totalValue > 0
        ? `$${portfolioMetrics.totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
        : "$0.00",
      change: portfolioMetrics.apy > 0 ? `+${portfolioMetrics.apy.toFixed(1)}% APY` : undefined,
      trend: portfolioMetrics.apy > 0 ? "up" : "neutral",
      icon: Wallet,
      accent: "emerald",
      helpText: "Total portfolio value including principal and accumulated yield.",
    },
    {
      label: "Yield Earned",
      value: portfolioMetrics.earnings > 0
        ? `+$${portfolioMetrics.earnings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
        : "$0.00",
      change: yieldData ? "Live" : undefined,
      trend: portfolioMetrics.earnings > 0 ? "up" : "neutral",
      icon: TrendingUp,
      accent: "cyan",
      helpText: "Real-time earnings based on your staking protocol's APY.",
    },
    {
      label: "Current APY",
      value: portfolioMetrics.apy > 0 ? `${portfolioMetrics.apy.toFixed(2)}%` : "5-8%",
      change: yieldData ? "Active" : "Est.",
      trend: portfolioMetrics.apy > 0 ? "up" : "neutral",
      icon: Percent,
      accent: "violet",
      helpText: "APY varies by protocol. Lido ETH ~5.2%, Aave USDC ~4.1%.",
    },
    {
      label: "Protection",
      value: vaultsData?.vaults?.length ? "Active" : "Setup",
      change: vault?.nextCheckInDue
        ? `${Math.ceil((new Date(vault.nextCheckInDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d`
        : "Free",
      trend: "neutral",
      icon: Shield,
      accent: "amber",
      helpText: "Inheritance protection ensures safe transfer to beneficiaries.",
    },
  ], [portfolioMetrics, yieldData, vaultsData, vault]);

  const quickActions: QuickAction[] = useMemo(() => [
    {
      label: "Yield Vaults",
      description: "Manage your staking",
      icon: TrendingUp,
      path: "/dashboard/yield-vaults",
      accent: "emerald"
    },
    {
      label: "Create Vault",
      description: "Start earning yield",
      icon: Sparkles,
      path: "/create-vault",
      accent: "cyan"
    },
    {
      label: "Guardians",
      description: "Manage beneficiaries",
      icon: Users,
      path: "/dashboard/guardians",
      accent: "violet"
    },
    {
      label: "Settings",
      description: "Account preferences",
      icon: Settings,
      path: "/dashboard/settings",
      accent: "slate"
    },
  ], []);

  // Loading states
  if (checkingAuth || !isAuthenticated) {
    return <LoadingScreen message={checkingAuth ? "Verifying authentication..." : "Redirecting to login..."} />;
  }

  return (
    <SidebarProvider>
      <EnhancedAppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2 border-b border-white/[0.04] bg-[#0a0a0f]/80 backdrop-blur-2xl">
          <SidebarTrigger className="-ml-1" />
        </div>
        <DashboardHeader />

        <div className="min-h-screen bg-[#050507] relative overflow-hidden">
          {/* Ambient Background */}
          <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/[0.03] rounded-full blur-[150px] translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/[0.02] rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-violet-500/[0.02] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }}
            />
          </div>

          {/* Upgrade Banner */}
          <AnimatePresence>
            {!subscriptionLoading && !hasActiveSubscription && (
              <UpgradeBanner onNavigate={setLocation} />
            )}
          </AnimatePresence>

          <SkipLink />

          <motion.main
            id="main-content"
            className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.header variants={itemVariants} className="mb-10 sm:mb-12">
              <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <motion.div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400 tracking-wide">
                      {yieldData ? "Earning Yield" : "Ready to Earn"}
                    </span>
                  </motion.div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-3">
                    {yieldData ? (
                      <>
                        Your portfolio is earning{" "}
                        <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                          {yieldData.apy?.toFixed(1) || '0'}% APY
                        </span>
                      </>
                    ) : (
                      <>Welcome back</>
                    )}
                  </h1>
                  <p className="text-slate-400 text-base sm:text-lg font-light">
                    {yieldData
                      ? `$${(parseFloat(yieldData.totalValue || '0') * ethPrice).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} total value • Inheritance protection included`
                      : `Good to see you, ${user?.email?.split('@')[0]}`
                    }
                  </p>
                </div>

                <UserProfileCard user={user} walletAddress={walletAddress} onSettingsClick={() => setLocation("/dashboard/settings")} />
              </div>
            </motion.header>

            {/* Error Alert */}
            <AnimatePresence>
              {yieldError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <Alert className="bg-red-500/5 border-red-500/20 backdrop-blur-xl">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      Unable to load yield data. Please refresh or try again later.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Grid */}
            {vaultsLoading ? (
              <LoadingSkeleton variant="stats" className="mb-10" />
            ) : (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12"
              >
                {stats.map((stat, index) => (
                  <StatCard key={stat.label} stat={stat} index={index} />
                ))}
              </motion.div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <motion.div variants={itemVariants}>
                <TabsList className="inline-flex h-11 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 mb-8">
                  <TabsTrigger
                    value="portfolio"
                    className="rounded-lg px-5 py-2 text-sm font-medium transition-all data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-slate-400"
                  >
                    Portfolio
                  </TabsTrigger>
                  <TabsTrigger
                    value="achievements"
                    className="rounded-lg px-5 py-2 text-sm font-medium transition-all data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-slate-400"
                  >
                    Achievements
                  </TabsTrigger>
                  <TabsTrigger
                    value="education"
                    className="rounded-lg px-5 py-2 text-sm font-medium transition-all data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-slate-400"
                  >
                    Learn
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              <TabsContent value="portfolio" className="space-y-8">
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  <PortfolioPerformance
                    yieldData={yieldData}
                    yieldLoading={yieldLoading}
                    vault={vault}
                    onNavigate={setLocation}
                    ethPrice={ethPrice}
                  />
                  <div className="space-y-6">
                    <QuickActionsCard actions={quickActions} onNavigate={setLocation} />
                    <SecurityScoreCard />
                  </div>
                </motion.div>

                {!yieldData && (
                  <motion.div variants={itemVariants}>
                    <Suspense fallback={<LoadingSkeleton className="h-64 w-full" />}>
                      <YieldComparisonChart />
                    </Suspense>
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <ActivityFeed onNavigate={setLocation} />
                </motion.div>
              </TabsContent>

              <TabsContent value="achievements">
                <Suspense fallback={<LoadingSkeleton className="h-64 w-full" />}>
                  <Achievements />
                </Suspense>
              </TabsContent>

              <TabsContent value="education">
                <Suspense fallback={<LoadingSkeleton className="h-32 w-full" />}>
                  <EducationHub />
                </Suspense>
              </TabsContent>
            </Tabs>

            <AnimatePresence>
              {activeHint && (
                <FeatureHint
                  hint={activeHint}
                  onDismiss={() => dismissHint(activeHint.id)}
                />
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </SidebarInset>

      <Dialog open={showPassphraseDialog} onOpenChange={setShowPassphraseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0f] border-white/[0.06]">
          {passphraseData && (
            <Suspense fallback={<LoadingSkeleton className="h-96 w-full" />}>
              <PassphraseDisplay
                guardianPassphrases={passphraseData.guardianPassphrases}
                masterSecret={passphraseData.masterSecret}
                vaultName={passphraseData.vaultName}
                onClose={clearPassphraseData}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

// Loading Screen
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050507]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-cyan-500/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-sm text-slate-500 font-light tracking-wide">{message}</p>
      </motion.div>
    </div>
  );
}

// Upgrade Banner
function UpgradeBanner({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative z-20 mx-4 sm:mx-6 lg:mx-8 mt-6"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-cyan-500/10 border border-white/[0.08] p-5 sm:p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDBWNDBIMHoiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/[0.08]">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-0.5">Unlock Full Features</h3>
              <p className="text-sm text-slate-400">
                Upgrade to create vaults, add guardians, and protect your crypto legacy.
              </p>
            </div>
          </div>
          <Button
            onClick={() => onNavigate("/pricing")}
            className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-5 h-10 rounded-xl transition-all"
          >
            View Plans <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// User Profile Card
function UserProfileCard({
  user,
  walletAddress,
  onSettingsClick
}: {
  user: { email?: string } | null;
  walletAddress: string | null;
  onSettingsClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSettingsClick}
        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
        aria-label="Open settings"
      >
        <Settings className="w-4 h-4 text-slate-400" />
      </motion.button>

      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-white truncate max-w-[140px]">
            {user?.email?.split('@')[0]}
          </p>
          <p className="text-xs text-slate-500 font-mono">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Not connected"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Stat Card
function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const Icon = stat.icon;
  const accentColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/10"
    },
    cyan: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
      glow: "shadow-cyan-500/10"
    },
    violet: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/20",
      glow: "shadow-violet-500/10"
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/10"
    },
    slate: {
      bg: "bg-slate-500/10",
      text: "text-slate-400",
      border: "border-slate-500/20",
      glow: "shadow-slate-500/10"
    },
  };

  const colors = accentColors[stat.accent] || accentColors.slate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative rounded-2xl p-5 transition-all duration-300",
        "bg-white/[0.02] border border-white/[0.06]",
        "hover:bg-white/[0.04] hover:border-white/[0.1]",
        `hover:shadow-xl hover:${colors.glow}`
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", colors.bg, colors.border, "border")}>
          <Icon className={cn("w-4 h-4", colors.text)} />
        </div>
        {stat.change && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            stat.trend === "up"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-white/[0.05] text-slate-400"
          )}>
            {stat.trend === "up" && <ArrowUpRight className="w-3 h-3 inline mr-0.5" />}
            {stat.change}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          {stat.value}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{stat.label}</span>
          {stat.helpText && (
            <ContextualHelp content={stat.helpText} variant="tooltip" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Portfolio Performance
interface PortfolioPerformanceProps {
  yieldData: YieldData | null;
  yieldLoading: boolean;
  vault: {
    id: string;
    name: string;
    createdAt: Date;
    status: "active" | "warning" | "critical" | "triggered" | "cancelled";
    ownerId: string;
    checkInIntervalDays: number;
    gracePeriodDays: number;
    lastCheckInAt: Date;
    nextCheckInDue: Date;
    fragmentScheme: string | null;
    updatedAt: Date;
  } | null;
  onNavigate: (path: string) => void;
  ethPrice: number;
}

function PortfolioPerformance({ yieldData, yieldLoading, vault, onNavigate, ethPrice }: PortfolioPerformanceProps) {
  return (
    <motion.section
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 sm:p-8"
      aria-labelledby="portfolio-performance-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-cyan-500/[0.02] pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <h2 id="portfolio-performance-heading" className="text-xl font-semibold text-white">
            Portfolio Performance
          </h2>
          {yieldData && (
            <button
              onClick={() => onNavigate("/dashboard/yield-vaults")}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
            >
              View Details
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {yieldLoading ? (
          <LoadingSkeleton variant="card" />
        ) : yieldData ? (
          <ActiveYieldView yieldData={yieldData} vault={vault} onNavigate={onNavigate} ethPrice={ethPrice} />
        ) : (
          <EmptyYieldState onNavigate={onNavigate} />
        )}
      </div>
    </motion.section>
  );
}

// Active Yield View
function ActiveYieldView({ yieldData, vault, onNavigate, ethPrice }: {
  yieldData: YieldData;
  vault: PortfolioPerformanceProps['vault'];
  onNavigate: (path: string) => void;
  ethPrice: number;
}) {
  const metrics = [
    {
      label: "Current APY",
      value: yieldData.apy ? `${yieldData.apy.toFixed(2)}%` : "0.00%",
      subtext: "Live Rate",
      accent: "emerald",
    },
    {
      label: "Total Earned",
      value: yieldData.yieldAccumulated
        ? `+${parseFloat(yieldData.yieldAccumulated).toFixed(4)}`
        : "+0.0000",
      subtext: yieldData.asset || "ETH",
      accent: "cyan",
    },
    {
      label: "Total Value",
      value: yieldData.totalValue
        ? parseFloat(yieldData.totalValue).toFixed(4)
        : "0.0000",
      subtext: `≈ $${yieldData.totalValue ? (parseFloat(yieldData.totalValue) * ethPrice).toFixed(2) : '0.00'}`,
      accent: "violet",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={cn(
              "p-4 sm:p-5 rounded-xl border transition-colors",
              metric.accent === "emerald" && "bg-emerald-500/5 border-emerald-500/10",
              metric.accent === "cyan" && "bg-cyan-500/5 border-cyan-500/10",
              metric.accent === "violet" && "bg-violet-500/5 border-violet-500/10",
            )}
          >
            <p className={cn(
              "text-xs uppercase tracking-wider mb-2",
              metric.accent === "emerald" && "text-emerald-400/70",
              metric.accent === "cyan" && "text-cyan-400/70",
              metric.accent === "violet" && "text-violet-400/70",
            )}>
              {metric.label}
            </p>
            <p className={cn(
              "text-xl sm:text-2xl font-semibold mb-1",
              metric.accent === "emerald" && "text-emerald-400",
              metric.accent === "cyan" && "text-white",
              metric.accent === "violet" && "text-white",
            )}>
              {metric.value}
            </p>
            <p className="text-xs text-slate-500">{metric.subtext}</p>
          </div>
        ))}
      </div>

      {/* Performance Breakdown */}
      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-sm font-medium text-white mb-4">Performance Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Principal Invested</span>
            <span className="text-sm text-white font-medium font-mono">
              {yieldData.principal ? parseFloat(yieldData.principal).toFixed(4) : "0.0000"} {yieldData.asset || "ETH"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Yield Accumulated</span>
            <span className="text-sm text-emerald-400 font-medium font-mono">
              +{yieldData.yieldAccumulated ? parseFloat(yieldData.yieldAccumulated).toFixed(4) : "0.0000"} {yieldData.asset || "ETH"}
            </span>
          </div>
          <div className="h-px bg-white/[0.06] my-2" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Staking Protocol</span>
            <span className="text-xs text-slate-300">{yieldData.stakingProtocol || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Inheritance Protection */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Inheritance Protection</p>
            <p className="text-xs text-slate-500">Included free with your vault</p>
          </div>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium">
          Active
        </Badge>
      </div>

      <Suspense fallback={<LoadingSkeleton className="h-20 w-full" />}>
        <YieldPerformanceShare
          apy={yieldData.apy}
          totalEarned={yieldData.yieldAccumulated}
          totalValue={yieldData.totalValue}
          asset={yieldData.asset}
          vaultName={vault?.name}
        />
      </Suspense>
    </div>
  );
}

// Empty Yield State
function EmptyYieldState({ onNavigate }: { onNavigate: (path: string) => void }) {
  const steps = [
    { icon: Wallet, title: "Create Vault", desc: "2 minutes setup" },
    { icon: ArrowRight, title: "Deposit", desc: "ETH or USDC" },
    { icon: TrendingUp, title: "Earn", desc: "Daily yield" },
  ];

  return (
    <div className="text-center py-8 sm:py-10">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative w-20 h-20 mx-auto mb-6"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-20 blur-xl" />
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <TrendingUp className="w-10 h-10 text-white" />
        </div>
        <motion.div
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
      </motion.div>

      <h3 className="text-2xl font-semibold text-white mb-3">
        Start Earning Yield
      </h3>
      <p className="text-slate-400 mb-8 max-w-sm mx-auto">
        Earn <span className="text-emerald-400 font-medium">5.2% APY</span> with Lido or{" "}
        <span className="text-violet-400 font-medium">4.1% APY</span> with Aave
      </p>

      {/* Steps */}
      <div className="flex items-center justify-center gap-3 mb-8 max-w-md mx-auto">
        {steps.map((step, idx) => (
          <div key={step.title} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-2">
                <step.icon className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-medium text-white">{step.title}</p>
              <p className="text-xs text-slate-500">{step.desc}</p>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-8 h-px bg-white/[0.1] mt-[-20px]" />
            )}
          </div>
        ))}
      </div>

      {/* Trust Signals */}
      <div className="flex items-center justify-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Free inheritance</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>No lock-in</span>
        </div>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate("/create-vault")}
        className="relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow overflow-hidden group"
      >
        <span className="relative z-10">Create Your First Vault</span>
        <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    </div>
  );
}

// Quick Actions Card
function QuickActionsCard({ actions, onNavigate }: { actions: QuickAction[]; onNavigate: (path: string) => void }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
      <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
      <nav aria-label="Quick actions">
        <ul className="space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const colors: Record<string, string> = {
              emerald: "from-emerald-500 to-emerald-600",
              cyan: "from-cyan-500 to-cyan-600",
              violet: "from-violet-500 to-violet-600",
              slate: "from-slate-500 to-slate-600",
            };

            return (
              <li key={action.label}>
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate(action.path)}
                  className="w-full p-3 rounded-xl flex items-center justify-between group hover:bg-white/[0.03] transition-colors"
                  aria-label={`Navigate to ${action.label}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity",
                      colors[action.accent]
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-white block">{action.label}</span>
                      <span className="text-xs text-slate-500">{action.description}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </motion.button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

// Security Score Card
function SecurityScoreCard() {
  const checks = [
    { label: "Encryption", status: "AES-256", active: true },
    { label: "Multi-Sig", status: "Active", active: true },
    { label: "Backup", status: "Secured", active: true },
  ];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5"
    >
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Security Score</h3>
          <Shield className="w-4 h-4 text-slate-500" />
        </div>

        <div className="text-4xl font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-1">
          94<span className="text-2xl">/100</span>
        </div>
        <p className="text-sm text-slate-500 mb-4">Excellent Protection</p>

        <div className="space-y-2.5">
          {checks.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">{item.label}</span>
              </div>
              <span className="text-emerald-400 text-xs font-medium">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Activity Feed
function ActivityFeed({ onNavigate }: { onNavigate: (path: string) => void }) {
  const activities = [
    { action: "Check-in completed", time: "2 hours ago", icon: Clock, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { action: "Guardian added: Alice.eth", time: "1 day ago", icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { action: "Vault settings updated", time: "3 days ago", icon: Settings, color: "text-violet-400", bg: "bg-violet-500/10" },
    { action: "Security audit passed", time: "1 week ago", icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <section
      className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6"
      aria-labelledby="activity-feed-heading"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 id="activity-feed-heading" className="text-lg font-semibold text-white">
          Recent Activity
        </h2>
        <button
          onClick={() => onNavigate("/dashboard/checkins")}
          className="text-sm text-slate-500 hover:text-white transition-colors"
        >
          View all
        </button>
      </div>

      <ul className="space-y-2">
        {activities.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
            >
              <button
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors text-left group"
                onClick={() => onNavigate("/dashboard/checkins")}
              >
                <div className={cn("p-2 rounded-lg", item.bg)}>
                  <Icon className={cn("w-4 h-4", item.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.action}</p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </button>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}