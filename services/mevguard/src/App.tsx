import { useState, useEffect } from "react";
import { Toaster } from "./components/ui/sonner";
import {
  Shield,
  Activity,
  AlertTriangle,
  TrendingUp,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { api, DashboardData, StatsData } from "./lib/api";
import { useApiData } from "./hooks/useApiData";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageLoader } from "./components/LoadingStates";
import { Footer } from "./components/Footer";
import { MobileMenu } from "./components/MobileMenu";
import { NotificationCenter } from "./components/NotificationCenter";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";
import { Overview } from "./components/Overview";
import { ServiceStatusPanel } from "./components/ServiceStatusPanel";
import { UnifiedDashboard } from "./components/UnifiedDashboard";
import { EnhancedTransactions } from "./components/EnhancedTransactions";
import { UnifiedMEV } from "./components/UnifiedMEV";
import { ThreatIntelligence } from "./components/ThreatIntelligence";
import { LiveMonitoring } from "./components/LiveMonitoring";
import { ProtectionControl } from "./components/ProtectionControl";
import { Threats } from "./components/Threats";
import { MEVDetection } from "./components/MEVDetection";
import { Transactions } from "./components/Transactions";
import { Analytics } from "./components/Analytics";
import { AlertsCenter } from "./components/AlertsCenter";
import { NetworkStatus } from "./components/NetworkStatus";
import { RelayStatus } from "./components/RelayStatus";
import { APIIntegration } from "./components/APIIntegration";
import { Settings } from "./components/Settings";
import { EdgeCaseDemo } from "./components/EdgeCaseDemo";
import { FeatureShowcase } from "./components/FeatureShowcase";
import { GasTracker } from "./components/GasTracker";
import { TokenApprovalMonitor } from "./components/TokenApprovalMonitor";
import { OnboardingTour } from "./components/OnboardingTour";
import { LandingPage } from "./components/LandingPage";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card } from "./components/ui/card";
import { StatCard } from "./components/StatCard";
import { ProtectionChart } from "./components/ProtectionChart";
import { ThreatsTable } from "./components/ThreatsTable";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [currentPage, setCurrentPage] = useState("overview");
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");
  const [tokenAddress, setTokenAddress] = useState("");
  const [protectedTokens, setProtectedTokens] = useState<string[]>([]);
  const [isProtecting, setIsProtecting] = useState(false);

  // Fetch dashboard data from API
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useApiData<DashboardData>(
    () => api.getDashboard(),
    {
      autoFetch: isLoggedIn,
      refetchInterval: isLoggedIn ? 5000 : undefined, // Refetch every 5 seconds when logged in
    }
  );

  // Fetch stats data
  const { data: statsData } = useApiData<StatsData>(
    () => api.getStats({ timeframe: selectedTimeframe }),
    {
      autoFetch: isLoggedIn,
      refetchInterval: isLoggedIn ? 10000 : undefined,
    }
  );

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleShowLogin = () => {
    setShowLogin(true);
  };

  const handleBackToLanding = () => {
    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLogin(false);
    setCurrentPage("overview");
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleProtectToken = async () => {
    if (!tokenAddress.trim()) return;

    setIsProtecting(true);

    try {
      // Call the actual API to protect the transaction
      await api.protectTransaction({
        from_address: tokenAddress,
        network: 'ethereum',
        protection_level: 'high',
      });

      setProtectedTokens((prev) => [...prev, tokenAddress]);
      setTokenAddress("");
    } catch (error) {
      console.error('Failed to protect token:', error);
    } finally {
      setIsProtecting(false);
    }
  };

  const handleRemoveToken = (token: string) => {
    setProtectedTokens((prev) =>
      prev.filter((t) => t !== token),
    );
  };

  if (!isLoggedIn && !showLogin) {
    return (
      <LandingPage
        onGetStarted={handleShowLogin}
        onLogin={handleShowLogin}
      />
    );
  }

  if (!isLoggedIn && showLogin) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-[#0a0a0a] dark">
        {/* Toast Notifications */}
        <Toaster position="top-right" />

        {/* Onboarding Tour */}
        <OnboardingTour autoStart={true} />

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <main className="flex-1 overflow-auto">
            {/* Header */}
            <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-40">
              <div className="px-4 md:px-8 py-4 md:py-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Mobile Menu */}
                  <div className="flex items-center gap-3">
                    <MobileMenu
                      currentPage={currentPage}
                      onNavigate={handleNavigate}
                      onLogout={handleLogout}
                    />
                    <div className="md:hidden flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      <span className="text-white">
                        MEVGUARD
                      </span>
                    </div>
                  </div>

                  {/* Page Title - Hidden on mobile */}
                  <div className="hidden md:block flex-1">
                    <h2 className="text-white tracking-tight mb-1">
                      {currentPage.charAt(0).toUpperCase() +
                        currentPage.slice(1).replace("-", " ")}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {currentPage === "overview" &&
                        "Monitor your MEV protection at a glance"}
                      {currentPage === "services" &&
                        "Monitor integrated mempool services status"}
                      {currentPage === "unified" &&
                        "Unified dashboard from all services"}
                      {currentPage === "live" &&
                        "Real-time threat detection and protection"}
                      {currentPage === "protection" &&
                        "Configure protection settings"}
                      {currentPage === "threats" &&
                        "Unified threat intelligence from all sources"}
                      {currentPage === "mev" &&
                        "MEV opportunities detected across networks"}
                      {currentPage === "transactions" &&
                        "Transaction monitoring and analysis"}
                      {currentPage === "enhanced-tx" &&
                        "Enhanced transaction monitoring"}
                      {currentPage === "unified-mev" &&
                        "Unified MEV detection"}
                      {currentPage === "threat-intel" &&
                        "Advanced threat intelligence"}
                      {currentPage === "analytics" &&
                        "MEV analytics and insights"}
                      {currentPage === "alerts" &&
                        "Manage alerts and notifications"}
                      {currentPage === "networks" &&
                        "Network status and performance"}
                      {currentPage === "relays" &&
                        "Private relay connections"}
                      {currentPage === "api" &&
                        "API integration and documentation"}
                      {currentPage === "settings" &&
                        "Account and system settings"}
                      {currentPage === "features" &&
                        "Explore new features"}
                      {currentPage === "edge-cases" &&
                        "Edge case handling and MEV detection accuracy demo"}
                    </p>
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <Badge className="hidden md:flex bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <Activity className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <div className="p-8">
              {dashboardLoading && <PageLoader />}
              {dashboardError && (
                <div className="text-center py-12">
                  <p className="text-red-400 mb-4">Failed to load dashboard data</p>
                  <p className="text-gray-500 text-sm">{dashboardError}</p>
                </div>
              )}
              {!dashboardLoading && !dashboardError && dashboardData && (
                <>
              {currentPage === "overview" && (
                <div className="space-y-8">
                  {/* Token Protection Input */}
                  <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white mb-2">
                          Protect Token Address
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Add a token address to automatically
                          monitor and protect transactions from
                          MEV bots in real-time via your mempool
                          service.
                        </p>

                        <div className="flex gap-3 mb-4">
                          <Input
                            placeholder="0x... (Token contract address)"
                            value={tokenAddress}
                            onChange={(e) =>
                              setTokenAddress(e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              handleProtectToken()
                            }
                            className="flex-1 bg-[#0f0f0f] border-[#2a2a2a] text-white font-mono"
                            disabled={isProtecting}
                          />
                          <Button
                            onClick={handleProtectToken}
                            disabled={
                              !tokenAddress.trim() ||
                              isProtecting
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 px-8"
                          >
                            {isProtecting ? (
                              <>
                                <Activity className="w-4 h-4 mr-2 animate-spin" />
                                Protecting...
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Protect
                              </>
                            )}
                          </Button>
                        </div>

                        {protectedTokens.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-gray-500 text-xs">
                              Protected Tokens (
                              {protectedTokens.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {protectedTokens.map(
                                (token, idx) => (
                                  <Badge
                                    key={idx}
                                    className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1.5 flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <code className="text-xs">
                                      {token.slice(0, 6)}...
                                      {token.slice(-4)}
                                    </code>
                                    <button
                                      onClick={() =>
                                        handleRemoveToken(token)
                                      }
                                      className="ml-1 hover:text-emerald-300 transition-colors"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Active Protections"
                      value={dashboardData.overview.active_protections.toLocaleString()}
                      icon={<Shield className="w-5 h-5" />}
                      trend="+12.5%"
                      trendUp={true}
                      className="bg-[#1a1a1a] border-[#2a2a2a]"
                    />
                    <StatCard
                      title="Threats Detected (24h)"
                      value={dashboardData.overview.threats_detected_24h.toLocaleString()}
                      icon={
                        <AlertTriangle className="w-5 h-5" />
                      }
                      trend="+8.2%"
                      trendUp={false}
                      className="bg-[#1a1a1a] border-[#2a2a2a]"
                    />
                    <StatCard
                      title="Transactions Protected"
                      value={dashboardData.overview.transactions_protected_24h.toLocaleString()}
                      icon={<Activity className="w-5 h-5" />}
                      trend="+23.1%"
                      trendUp={true}
                      className="bg-[#1a1a1a] border-[#2a2a2a]"
                    />
                    <StatCard
                      title="Value Protected"
                      value={`$${(dashboardData.overview.value_protected_24h / 1000).toFixed(1)}K`}
                      icon={<TrendingUp className="w-5 h-5" />}
                      trend="+18.7%"
                      trendUp={true}
                      subtitle={statsData ? `${(statsData.statistics.value_protected / 1000000).toFixed(2)} ETH saved` : undefined}
                      className="bg-[#1a1a1a] border-[#2a2a2a]"
                    />
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ProtectionChart
                      title="MEV Threats Detected"
                      timeframe={selectedTimeframe}
                      onTimeframeChange={setSelectedTimeframe}
                    />
                    <ProtectionChart
                      title="Protection Success Rate"
                      type="success-rate"
                      timeframe={selectedTimeframe}
                      onTimeframeChange={setSelectedTimeframe}
                    />
                  </div>

                  {/* Network Status & Recent Threats */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ThreatsTable />
                    </div>
                    <div>
                      <NetworkStatus
                        networks={dashboardData.networks}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentPage === "live" && <LiveMonitoring />}
              {currentPage === "protection" && (
                <ProtectionControl />
              )}
              {currentPage === "threats" && (
                <ThreatIntelligence />
              )}
              {currentPage === "mev" && <UnifiedMEV />}
              {currentPage === "transactions" && (
                <EnhancedTransactions />
              )}
              {currentPage === "analytics" && <Analytics />}
              {currentPage === "alerts" && <AlertsCenter />}
              {currentPage === "networks" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(dashboardData.networks).map(
                    ([name, data]) => (
                      <NetworkStatus
                        key={name}
                        networks={{ [name]: data }}
                        detailed
                      />
                    ),
                  )}
                </div>
              )}
              {currentPage === "relays" && <RelayStatus />}
              {currentPage === "api" && <APIIntegration />}
              {currentPage === "settings" && <Settings />}
              {currentPage === "gas" && <GasTracker />}
              {currentPage === "security" && (
                <TokenApprovalMonitor />
              )}
              {currentPage === "features" && (
                <FeatureShowcase />
              )}
              {currentPage === "edge-cases" && <EdgeCaseDemo />}
              {currentPage === "services" && (
                <ServiceStatusPanel />
              )}
              {currentPage === "unified" && (
                <UnifiedDashboard />
              )}
              {currentPage === "enhanced-tx" && (
                <EnhancedTransactions />
              )}
              {currentPage === "unified-mev" && <UnifiedMEV />}
              {currentPage === "threat-intel" && (
                <ThreatIntelligence />
              )}
                </>
              )}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </ErrorBoundary>
  );
}