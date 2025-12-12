import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeStyles } from '../design-system';
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
} from 'lucide-react';

// Import Header
import { Header } from './Header';
import { ToastProvider } from './Toast';
import { getRandomCharacter } from './CharacterAvatar';
import { calculateScore, EXAMPLE_BADGES } from './UserScore';

// Import effects
import { FireflyParticles } from './effects/FireflyParticles';
import { WaterParticles } from './effects/WaterParticles';

// Import pages
import TradingPage from './TradingPage';
import { Activity as ActivityPage } from './Activity';
import { NFTGallery } from './NFTGallery';
import Portfolio from './Portfolio';
import { MoreMenu } from './MoreMenu';
import { SwapPageEnhanced } from './SwapPageEnhanced';
import { SwapTradePage } from './SwapTradePage';
import { BuyPage } from './BuyPage';
import { AirdropPage } from './AirdropPage';
import { HelpCenter } from './features/HelpCenter';
import { MiniLineChart } from './ui/MiniLineChart';

// Import modals
import { SendModal } from './modals/SendModal';
import { ReceiveModal } from './modals/ReceiveModal';

// Import features
import { SniperBot } from './features/SniperBot';
import { MemeRadar } from './features/MemeRadar';
import { WhaleTracker } from './features/WhaleTracker';
import { WalletGuard } from './features/WalletGuard';
import { MEVProtection } from './MEVProtection';
import MempoolMEVMonitor from './pro/MempoolMEVMonitor';
import { PrivacyShield } from './features/PrivacyShield';
import { DeFiDashboard } from './features/DeFiDashboard';
import { LegacyVaults } from './features/LegacyVaults';
import { CuratedDappLauncher } from './features/CuratedDappLauncher';
import { GasManager } from './features/GasManager';
import { PortfolioAnalytics } from './features/PortfolioAnalytics';
import { CustomTokenImport } from './features/CustomTokenImport';
import { HardwareWalletConnect } from './HardwareWalletConnect';
import { BridgeSecurity } from './BridgeSecurity';
import { NotificationCenter } from './NotificationCenter';
import { Settings as SettingsPage } from './Settings';
// Import security components
import { DecoyWalletMode } from './security/DecoyWalletMode';

import { PageLayout, Section, Container, VStack, HStack, CardGrid } from './layout';

import { Button, Avatar, Badge, GlassCard, NumberTicker } from './ui';

import { Card3D, MovingBorder, BentoGrid, BentoGridItem, AnimatedGradientText } from './effects';

import BottomNav from './dashboard/BottomNav';
import { Mode } from '@/styles/tokens';
import SubtleGradientBackground from './SubtleGradientBackground';
import { useDashboardData } from '../hooks/useDashboardData';
import { useWebSocketPrices } from '../hooks/useWebSocketPrices';

interface DashboardNewProps {
  type: Mode;
  degenPercent: number;
  regenPercent: number;
  onLogout?: () => void;
  walletAddress?: string;
}

export default function DashboardNew({
  type,
  degenPercent,
  regenPercent,
  onLogout,
  walletAddress,
}: DashboardNewProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'trading' | 'activity' | 'more'>('home');
  const [activeFeaturePage, setActiveFeaturePage] = useState<string | null>(null);
  const [showScarlette, setShowScarlette] = useState(false);
  const [decoyWalletActive, setDecoyWalletActive] = useState(false);
  const isDegen = type === 'degen';

  // Real data from API via useDashboardData hook
  const {
    user,
    network,
    setNetwork,
    networks,
    totalValue,
    totalChange24h,
    tokens: myTokens,
    gasPrice,
    watchlist,
    activePositions,
    pendingTxs,
    unreadNotifications,
    isLoading,
    isRefreshing,
    refetchAll,
  } = useDashboardData(
    walletAddress || localStorage.getItem('walletAddress') || undefined,
    isDegen ? 'degen' : 'regen'
  );

  // Real-time price updates via WebSocket
  const tokenSymbols = myTokens?.map(t => t.symbol) || ['ETH', 'BTC'];
  const { prices: livePrices, isConnected: wsPricesConnected } = useWebSocketPrices(tokenSymbols);

  // Merge live prices into tokens
  const tokensWithLivePrices = myTokens?.map(token => ({
    ...token,
    price: livePrices[token.symbol]?.price || token.price,
    change24h: livePrices[token.symbol]?.change24h ?? token.change24h,
  }));

  // All data comes from useDashboardData hook
  const [priceAlerts] = useState<any[]>([]);

  const handleNavigate = (path: string) => {
    if (path === '/settings') {
      setActiveFeaturePage('settings');
      setActiveTab('home');
    } else if (path === '/profile') {
      // Navigate to profile page (could add a profile page)
      console.log('Navigate to profile');
    } else {
      console.log('Navigate to:', path);
    }
  };

  const handleNetworkChange = (newNetwork: any) => {
    setNetwork(newNetwork);
    console.log('Network changed to:', newNetwork.name);
    // In production, trigger wallet network switch
  };

  // Tab order for swipe navigation
  const tabOrder: Array<'home' | 'trading' | 'activity' | 'more'> = [
    'home',
    'trading',
    'activity',
    'more',
  ];

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (direction === 'left' && currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  // Render feature pages function
  const renderFeature = () => {
    switch (activeFeaturePage) {
      case 'send':
        return <SendModal type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'receive':
        return <ReceiveModal type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'portfolio':
        return <Portfolio type={type} />;
      case 'swap':
        return (
          <SwapPageEnhanced
            type={type}
            walletAddress={walletAddress}
            onClose={() => setActiveFeaturePage(null)}
          />
        );
      case 'buy':
        return (
          <BuyPage
            type={type}
            walletAddress={walletAddress}
            onBack={() => setActiveFeaturePage(null)}
          />
        );
      case 'nft':
        return <NFTGallery type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'airdrop':
        return <AirdropPage type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'sniper':
        return <SniperBot type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'meme':
        return <MemeRadar type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'whale':
        return <WhaleTracker type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'security':
        return <WalletGuard type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'mev':
        return <MEVProtection type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'privacy':
        return <PrivacyShield type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'defi':
        return <DeFiDashboard type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'inheritance':
        return <LegacyVaults type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'dapps':
        return (
          <CuratedDappLauncher
            isOpen={true}
            onClose={() => setActiveFeaturePage(null)}
            walletType={type}
          />
        );
      case 'gas':
        return (
          <GasManager isOpen={true} onClose={() => setActiveFeaturePage(null)} walletType={type} />
        );
      case 'analytics':
        return <PortfolioAnalytics type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'tokens':
        return (
          <CustomTokenImport
            isOpen={true}
            onClose={() => setActiveFeaturePage(null)}
            onImport={token => {
              console.log('Token imported:', token);
              setActiveFeaturePage(null);
            }}
            walletType={type}
          />
        );
      case 'hardware':
        return (
          <HardwareWalletConnect
            isOpen={true}
            onClose={() => setActiveFeaturePage(null)}
            type={type}
          />
        );
      case 'bridge':
        return <BridgeSecurity type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'help':
        return (
          <HelpCenter isOpen={true} walletType={type} onClose={() => setActiveFeaturePage(null)} />
        );
      case 'notifications':
        return <NotificationCenter type={type} onClose={() => setActiveFeaturePage(null)} />;
      case 'settings':
        return (
          <SettingsPage
            type={type}
            onClose={() => setActiveFeaturePage(null)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        );
      default:
        return null;
    }
  };

  // Home tab - existing dashboard code
  const degenScore = isDegen ? 847 : 342;
  const securityScore = 94;

  // Quick stats
  const stats = [
    {
      label: 'Total Balance',
      value: 42750.25,
      change: 3.2,
      icon: Wallet,
      prefix: '$',
    },
    {
      label: isDegen ? 'Degen Score' : 'Regen Score',
      value: degenScore,
      change: 12,
      icon: isDegen ? Flame : Radar,
    },
    {
      label: '24h P&L',
      value: 1247.89,
      change: 3.2,
      icon: TrendingUp,
      prefix: '$',
    },
    {
      label: 'Security Score',
      value: securityScore,
      change: 5,
      icon: Shield,
      suffix: '%',
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: 'Send',
      icon: Send,
      color: isDegen ? 'degen' : 'regen',
      action: 'send',
    },
    {
      label: 'Receive',
      icon: Download,
      color: isDegen ? 'degen' : 'regen',
      action: 'receive',
    },
    {
      label: 'Swap',
      icon: TrendingUp,
      color: isDegen ? 'degen' : 'regen',
      action: 'swap',
    },
    {
      label: 'Buy',
      icon: Plus,
      color: isDegen ? 'degen' : 'regen',
      action: 'buy',
    },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'send':
        setActiveFeaturePage('send');
        break;
      case 'receive':
        setActiveFeaturePage('receive');
        break;
      case 'swap':
        setActiveFeaturePage('swap');
        break;
      case 'buy':
        setActiveFeaturePage('buy');
        break;
    }
  };

  // Featured widgets (tribe-specific)
  const degenWidgets = [
    {
      title: 'Sniper Bot',
      description: 'Hunt new tokens instantly',
      icon: Target,
      stats: '24 targets tracked',
      highlight: true,
      page: 'sniper',
    },
    {
      title: 'Meme Radar',
      description: 'Trending meme coins',
      icon: Zap,
      stats: '156% avg gain',
      page: 'meme',
    },
    {
      title: 'Whale Tracker',
      description: 'Follow smart money',
      icon: Eye,
      stats: '12 whales monitored',
      page: 'whale',
    },
    {
      title: 'MEV Shield',
      description: 'Front-run protection',
      icon: Shield,
      stats: '24/7 active',
      page: 'mev',
    },
    {
      title: 'Mempool Monitor',
      description: 'Pro monitoring dashboard',
      icon: Activity,
      stats: 'Real-time',
      page: 'mempool-monitor',
      highlight: true,
    },
  ];

  const regenWidgets = [
    {
      title: 'Wallet Guard',
      description: 'Multi-sig security',
      icon: Shield,
      stats: '99.9% secure',
      highlight: true,
      page: 'security',
    },
    {
      title: 'Legacy Vaults',
      description: 'Inheritance platform',
      icon: Users,
      stats: '3 guardians active',
      page: 'inheritance',
    },
    {
      title: 'MEV Protection',
      description: 'Transaction shield',
      icon: Lock,
      stats: '$2.4k saved',
      page: 'mev',
    },
    {
      title: 'Privacy Shield',
      description: 'Anonymous transactions',
      icon: Shield,
      stats: '24/7 monitoring',
      page: 'privacy',
    },
  ];

  const widgets = isDegen ? degenWidgets : regenWidgets;

  // Render the dashboard content
  const renderDashboardContent = () => (
    <>
      {/* Welcome Message */}
      <Section padding="none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-4 text-center"
        >
          <h1 className="text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
            Welcome {isDegen ? 'Degen' : 'Regen'}{' '}
            <span style={{ color: isDegen ? '#DC143C' : '#0080FF' }}>{user.username}</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--text-primary)]/60 md:text-base">
            {isDegen ? 'Ready to hunt those gains? 🔥' : 'Building sustainable wealth 🌱'}
          </p>
        </motion.div>
      </Section>

      <Section padding="none">
        <GlassCard className="p-6 md:p-8" glowColor={isDegen ? '#DC143C' : '#0080FF'}>
          <VStack spacing="md" className="md:space-y-6">
            {/* Score Gauge */}
            <VStack spacing="xs" align="center" className="md:space-y-2">
              <p className="text-xs tracking-wider text-[var(--text-primary)]/60 uppercase md:text-sm">
                {isDegen ? '🔥 Degen Score' : '❄️ Regen Score'}
              </p>

              {/* Circular Progress Gauge */}
              <div className="relative h-32 w-32 md:h-40 md:w-40">
                {/* Background Circle */}
                <svg className="h-full w-full -rotate-90 transform">
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
                    stroke={isDegen ? '#DC143C' : '#0080FF'}
                    strokeWidth="8"
                    strokeDasharray={`${(degenScore / 1000) * 283} 283`}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Score Number */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <NumberTicker value={degenScore} className="text-[var(--text-primary)]" />
                  <p className="mt-1 text-xs text-[var(--text-primary)]/40">/ 1000</p>
                </div>
              </div>

              <p className="max-w-xs text-center text-xs text-[var(--text-primary)]/50">
                {isDegen
                  ? 'Your risk appetite and trading activity score'
                  : 'Your security and long-term wealth score'}
              </p>
            </VStack>

            {/* Balance */}
            <VStack spacing="xs" align="center">
              <p className="text-xs tracking-wider text-[var(--text-primary)]/60 uppercase">
                Total Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl text-[var(--text-primary)] md:text-5xl">
                  $<NumberTicker value={Math.floor(totalValue)} />
                </span>
                <span className="text-xl text-[var(--text-primary)]/40">
                  .{Math.floor((totalValue % 1) * 100).toString().padStart(2, '0')}
                </span>
              </div>
              <div className={`flex items-center gap-1 ${totalChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalChange24h >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
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
        <HStack spacing="sm" className="grid grid-cols-4 gap-3">
          {quickActions.map(action => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickAction(action.action)}
              className="flex flex-col items-center gap-2 rounded-xl border px-2 py-4 backdrop-blur-md transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderColor: isDegen ? 'rgba(220, 20, 60, 0.4)' : 'rgba(0, 128, 255, 0.4)',
                boxShadow: `0 4px 12px ${isDegen ? 'rgba(220, 20, 60, 0.2)' : 'rgba(0, 128, 255, 0.2)'}`,
              }}
            >
              <action.icon
                className="h-6 w-6"
                style={{
                  color: isDegen ? '#DC143C' : '#0080FF',
                }}
              />
              <span className="text-xs font-medium text-[var(--text-primary)]">{action.label}</span>
            </motion.button>
          ))}
        </HStack>
      </Section>

      {/* Shadow Mode Section */}
      <Section padding="none">
        <VStack spacing="sm">
          <h2 className="px-1 text-[var(--text-primary)]/80">🎭 Shadow Mode</h2>
          <DecoyWalletMode
            isActive={decoyWalletActive}
            onToggle={setDecoyWalletActive}
            type={type}
          />
        </VStack>
      </Section>

      {/* Daily Use Widgets */}
      <Section padding="none">
        <VStack spacing="sm">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[var(--text-primary)]/80">⚡ Quick Info</h2>
            <Button variant="ghost" size="sm" onClick={() => refetchAll()} className="text-xs">
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Gas Price + Pending Transactions Row */}
          <div className="grid auto-rows-min grid-cols-4 gap-4">
            {/* Gas Price Widget - 2x2 */}
            <GlassCard
              className="col-span-2 row-span-2 cursor-pointer p-8"
              onClick={() => setActiveFeaturePage('gas')}
              glowColor={isDegen ? '#DC143C' : '#0080FF'}
            >
              <VStack spacing="md">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fuel
                      className="h-7 w-7"
                      style={{
                        color: isDegen ? '#DC143C' : '#0080FF',
                      }}
                    />
                    <span className="text-lg text-[var(--text-primary)]/80">Gas</span>
                  </div>
                  <Badge variant="outline">GWE</Badge>
                </div>
                <div className="mt-4 w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-[var(--text-primary)]/40">Fast</span>
                    <span className="text-2xl font-medium text-[var(--text-primary)]">
                      {gasPrice.fast}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-[var(--text-primary)]/40">Standard</span>
                    <span className="text-2xl font-medium text-[var(--text-primary)]">
                      {gasPrice.standard}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-[var(--text-primary)]/40">Slow</span>
                    <span className="text-2xl font-medium text-[var(--text-primary)]">
                      {gasPrice.slow}
                    </span>
                  </div>
                </div>
              </VStack>
            </GlassCard>

            {/* Watchlist Widget - 2x2 */}
            <GlassCard
              className="col-span-2 row-span-2 cursor-pointer p-8"
              onClick={() => setActiveFeaturePage('portfolio')}
              glowColor={isDegen ? '#DC143C' : '#0080FF'}
            >
              <VStack spacing="md">
                <div className="flex items-center gap-3">
                  <Star
                    className="h-7 w-7"
                    style={{
                      color: isDegen ? '#DC143C' : '#0080FF',
                    }}
                  />
                  <span className="text-lg text-[var(--text-primary)]/80">Watch</span>
                </div>
                <div className="mt-4 w-full space-y-4">
                  {watchlist.map(token => (
                    <div key={token.symbol} className="flex items-center justify-between">
                      <span className="text-base text-[var(--text-primary)]/80">
                        {token.symbol}
                      </span>
                      <div
                        className={`flex items-center gap-2 ${token.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {token.change24h > 0 ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                        <span className="text-base font-medium">{Math.abs(token.change24h)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </VStack>
            </GlassCard>

            {/* My Tokens Widget - 4x4 (full width, below) */}
            <GlassCard
              className="col-span-4 row-span-4 cursor-pointer p-8"
              onClick={() => setActiveFeaturePage('portfolio')}
              glowColor={isDegen ? '#DC143C' : '#0080FF'}
            >
              <VStack spacing="md">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet
                      className="h-7 w-7"
                      style={{
                        color: isDegen ? '#DC143C' : '#0080FF',
                      }}
                    />
                    <span className="text-lg text-[var(--text-primary)]/80">My Tokens</span>
                  </div>
                  <Badge variant="outline">{tokensWithLivePrices?.length || myTokens.length}</Badge>
                </div>
                <div className="mt-4 w-full space-y-4">
                  {(tokensWithLivePrices || myTokens).map(token => (
                    <div
                      key={token.symbol}
                      className="flex items-center justify-between border-b border-[var(--border-neutral)]/5 py-3 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{token.icon}</span>
                        <div>
                          <p className="text-lg font-medium text-[var(--text-primary)]">
                            {token.symbol}
                          </p>
                          <p className="text-base text-[var(--text-primary)]/40">{token.balance}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* Mini Chart */}
                        <div className="hidden md:block">
                          <MiniLineChart
                            data={token.chartData}
                            change={token.change24h}
                            width={100}
                            height={40}
                          />
                        </div>
                        {/* Value and Change */}
                        <div className="text-right">
                          <p className="text-lg font-medium text-[var(--text-primary)]">
                            ${token.value.toLocaleString()}
                          </p>
                          <div
                            className={`flex items-center justify-end gap-2 ${token.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {token.change24h > 0 ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5" />
                            )}
                            <span className="text-base font-medium">
                              {token.change24h > 0 ? '+' : ''}
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
          </div>

          {/* Price Alerts - Only show if user has alerts */}
          {priceAlerts.length > 0 && (
            <GlassCard className="p-4">
              <VStack spacing="xs">
                <div className="mb-2 flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell
                      className="h-5 w-5"
                      style={{
                        color: isDegen ? '#DC143C' : '#0080FF',
                      }}
                    />
                    <span className="text-sm text-[var(--text-primary)]/80">Price Alerts</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    View All
                  </Button>
                </div>
                {priceAlerts.map((alert: any, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-primary)]/60">
                      {alert.token} &gt; ${alert.price}
                    </span>
                    <span className="text-green-400">Active</span>
                  </div>
                ))}
              </VStack>
            </GlassCard>
          )}
        </VStack>
      </Section>

      {/* Degen/Regen Widgets Section */}
      <Section padding="none">
        <VStack spacing="sm">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[var(--text-primary)]/80">
              {isDegen ? '🔥 Degen Tools' : '🛡️ Regen Tools'}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {widgets.map((widget, index) => (
              <motion.div
                key={widget.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  className="cursor-pointer p-6 transition-transform hover:scale-[1.02]"
                  onClick={() => setActiveFeaturePage(widget.page)}
                  glowColor={widget.highlight ? (isDegen ? '#DC143C' : '#0080FF') : undefined}
                >
                  <VStack spacing="md">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-xl p-3"
                          style={{
                            background: `${isDegen ? '#DC143C' : '#0080FF'}20`,
                            border: `1px solid ${isDegen ? '#DC143C' : '#0080FF'}40`,
                          }}
                        >
                          <widget.icon
                            className="h-6 w-6"
                            style={{
                              color: isDegen ? '#DC143C' : '#0080FF',
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[var(--text-primary)]">
                            {widget.title}
                          </h3>
                          <p className="text-sm text-[var(--text-primary)]/50">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-[var(--text-primary)]/30" />
                    </div>
                    <div className="flex w-full items-center justify-between border-t border-[var(--border-neutral)]/10 pt-2">
                      <span className="text-sm text-[var(--text-primary)]/60">Status</span>
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: isDegen ? '#DC143C' : '#0080FF',
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
    </>
  );

  const getPageContent = () => {
    return (
      <AnimatePresence mode="wait" initial={false}>
        {activeFeaturePage ? (
          <motion.div
            key={`feature-${activeFeaturePage}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="min-h-screen pt-4"
          >
            {renderFeature()}
          </motion.div>
        ) : activeTab === 'trading' ? (
          <motion.div
            key="trading-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe > 10000) {
                handleSwipe('left');
              } else if (swipe < -10000) {
                handleSwipe('right');
              }
            }}
          >
            <SwapTradePage />
          </motion.div>
        ) : activeTab === 'activity' ? (
          <motion.div
            key="activity-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe > 10000) {
                handleSwipe('left');
              } else if (swipe < -10000) {
                handleSwipe('right');
              }
            }}
          >
            <ActivityPage
              type={type}
              onClose={() => setActiveTab('home')}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </motion.div>
        ) : activeTab === 'more' ? (
          <motion.div
            key="more-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe > 10000) {
                handleSwipe('left');
              } else if (swipe < -10000) {
                handleSwipe('right');
              }
            }}
          >
            <MoreMenu
              type={type}
              onClose={() => setActiveTab('home')}
              onNavigate={page => {
                console.log('Navigate to:', page);
                setActiveFeaturePage(page);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="home-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Container maxWidth="7xl" className="px-4 md:px-6">
              <VStack spacing="lg" className="md:space-y-8">
                {renderDashboardContent()}
              </VStack>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <PageLayout
      mode={type}
      transition="none"
      backgroundPattern="none"
      maxWidth="full"
      className="min-h-screen overflow-x-hidden bg-[var(--bg-base)] pb-24 md:pb-20"
    >
      {/* Animated Background */}
      <SubtleGradientBackground
        type={type}
        className="pointer-events-none fixed inset-0 h-full w-full"
      />

      {/* Particle Effects */}
      {isDegen ? <FireflyParticles /> : <WaterParticles />}

      {/* Toast Provider */}
      <ToastProvider type={type} />

      {/* Permanent Header */}
      <Header
        type={type}
        onNavigate={handleNavigate}
        user={user}
        network={network}
        onNetworkChange={handleNetworkChange}
        unreadNotifications={unreadNotifications}
        onLogout={onLogout}
      />

      {/* Main Content */}
      {getPageContent()}

      {/* Bottom Nav - Always show unless feature page takes over (or show there too?)
          Usually we want nav everywhere. But user didn't specify.
          The original code hid nav in some cases or showed it explicitly.
          Let's keep it visible.
      */}
      {!activeFeaturePage && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} tribe={type} />
      )}
      {/* For feature pages, original code showed bottom nav with activeTab="more" */}
      {activeFeaturePage && (
        <BottomNav
          activeTab="more"
          onTabChange={tab => {
            setActiveFeaturePage(null);
            setActiveTab(tab);
          }}
          tribe={type}
        />
      )}
    </PageLayout>
  );
}
