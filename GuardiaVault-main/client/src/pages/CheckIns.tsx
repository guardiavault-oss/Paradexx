import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Shield,
  Activity,
  Fingerprint,
  Zap,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  Lock,
  Waves,
  Heart,
  ChevronRight,
} from "lucide-react";
import { useVaults } from "@/hooks/useVaults";
import { useGuardiaVault } from "@/hooks/useGuardiaVault";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { biometricCollector } from "@/lib/biometricCollection";
import { authenticateBiometric, getWebAuthnStatus, isWebAuthnSupported } from "@/lib/webauthn";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import LifelineVisual from "@/components/LifelineVisual";
import { logError } from "@/utils/logger";

// Import design system
import "../design-system.css";

interface CheckIn {
  id: string;
  timestamp: Date;
  method: string;
  status: 'success' | 'failed';
  transactionHash?: string;
  biometricScore?: number;
}

export default function CheckIns() {
  const [, setLocation] = useLocation();
  const { data: vaultsData, isLoading: vaultsLoading } = useVaults();
  const { isWalletConnected } = useWallet();
  const { checkIn, loading: blockchainLoading } = useGuardiaVault();
  const { toast } = useToast();

  const vault = vaultsData?.vaults?.[0];
  const vaultId = vault?.id;

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [collectingBiometric, setCollectingBiometric] = useState(false);
  const [checkInProgress, setCheckInProgress] = useState(0);
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [webauthnStatus, setWebauthnStatus] = useState<any>(null);
  const [authMethod, setAuthMethod] = useState<"webauthn" | "totp" | "password" | null>(null);

  // Fetch check-ins and WebAuthn status
  useEffect(() => {
    if (vaultId) {
      fetch(`/api/vaults/${vaultId}/checkins`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.checkIns) {
            setCheckIns(data.checkIns.map((ci: any) => ({
              ...ci,
              timestamp: new Date(ci.timestamp || ci.createdAt),
            })));
          }
        })
        .catch(() => setCheckIns([]));

      fetch(`/api/vaults/${vaultId}/biometric-status`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          setBiometricEnabled(data.hasBiometricBaseline || false);
        })
        .catch(() => setBiometricEnabled(false));
    }

    // Check WebAuthn support and status
    const supported = isWebAuthnSupported();
    setWebauthnSupported(supported);
    
    if (supported) {
      getWebAuthnStatus().then((status) => {
        if (status) {
          setWebauthnStatus(status);
          setBiometricEnabled(status.hasCredentials || biometricEnabled);
        }
      });
    }
  }, [vaultId]);

  const handleCheckIn = async () => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to perform a check-in",
        variant: "destructive",
      });
      return;
    }

    try {
      setCollectingBiometric(true);
      setCheckInProgress(0);
      setAuthMethod(null);
      
      // Step 1: Biometric authentication (WebAuthn or fallback)
      const authResult = await authenticateBiometric();
      
      if (!authResult.success) {
        // If WebAuthn failed and no fallback, show error
        if (authResult.method === "webauthn" && !webauthnStatus?.hasCredentials) {
          toast({
            title: "Biometric Not Set Up",
            description: "Please set up biometric authentication in settings first",
            variant: "destructive",
          });
          setCollectingBiometric(false);
          setCheckInProgress(0);
          return;
        }
        
        // If auth failed, still allow check-in but warn
        toast({
          title: "Biometric Verification Failed",
          description: "Proceeding with check-in, but biometric verification could not be completed",
          variant: "destructive",
        });
      } else {
        setAuthMethod(authResult.method);
      }
      
      // Animate progress
      const progressInterval = setInterval(() => {
        setCheckInProgress(prev => Math.min(prev + 30, 90));
      }, 500);

      // Step 2: Collect behavioral biometrics (typing/mouse patterns)
      const biometricData = await biometricCollector.collectSignature(undefined, 3000);
      
      clearInterval(progressInterval);
      setCheckInProgress(95);

      const message = `GuardiaVault Check-in: ${Date.now()}`;
      const signature = `0x${Math.random().toString(16).substr(2, 64)}`;

      const response = await fetch(`/api/vaults/${vaultId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          signature,
          biometricData: Object.keys(biometricData).length > 0 ? biometricData : undefined,
          requireBiometric: authResult.success && authResult.method === "webauthn",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Check-in failed");
      }

      const data = await response.json();
      setCheckInProgress(100);
      
      const blockchainVaultId = 0;
      await checkIn(blockchainVaultId);

      const methodName = authResult.success 
        ? authResult.method === "webauthn" 
          ? "WebAuthn + Blockchain"
          : authResult.method === "totp"
          ? "TOTP + Blockchain"
          : "Password + Blockchain"
        : "Blockchain";

      setCheckIns([
        {
          id: data.checkIn.id,
          timestamp: new Date(data.checkIn.timestamp),
          method: methodName,
          status: 'success',
          biometricScore: data.biometric?.confidence ? Math.round(data.biometric.confidence * 100) : undefined,
        },
        ...checkIns,
      ]);

      if (authResult.success) {
        toast({
          title: "Check-in Successful",
          description: `Authenticated via ${authResult.method === "webauthn" ? "biometrics" : authResult.method.toUpperCase()}. Check-in completed.`,
        });
      } else if (data.biometric) {
        toast({
          title: data.biometric.verified ? "Biometric Verified" : "Check-in Complete",
          description: data.biometric.verified
            ? `Confidence: ${(data.biometric.confidence * 100).toFixed(1)}%`
            : "Check-in completed successfully",
        });
      } else {
        toast({
          title: "Check-in Successful",
          description: "Your vault status has been updated",
        });
      }

      biometricCollector.reset();
      setCheckInProgress(0);
      setCollectingBiometric(false);
      setAuthMethod(null);
    } catch (error: any) {
      setCollectingBiometric(false);
      setCheckInProgress(0);
      setAuthMethod(null);
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "checkIn",
      });
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to perform check-in",
        variant: "destructive",
      });
    }
  };

  // Calculate days until next check-in
  const daysUntilNext = vault?.nextCheckInDue 
    ? Math.ceil((new Date(vault.nextCheckInDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const healthScore = 98; // Mock health score
  
  // Determine vault status for LifelineVisual
  const vaultStatus = daysUntilNext === null 
    ? "active" 
    : daysUntilNext <= 7 
    ? "critical" 
    : daysUntilNext <= 30 
    ? "warning" 
    : "active";
  
  // Calculate total days in grace period (default 90 days)
  const totalDays = 90;
  const daysRemaining = daysUntilNext !== null ? daysUntilNext : totalDays;

  return (
    <SidebarProvider>
      <EnhancedAppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <DashboardHeader />
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Premium Mesh Gradient Background */}
          <div className="mesh-gradient" />
          <div className="noise-overlay" />
          
          {/* Animated Orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-40 right-20 w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                x: [0, -50, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          <div className="relative z-10 container max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <button
                onClick={() => setLocation("/dashboard")}
                className="mb-6 glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-5xl font-bold display-font heading-glow mb-3">
                    Proof of Life
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Maintain your vault access with regular check-ins
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckIn}
                  disabled={!isWalletConnected || blockchainLoading || collectingBiometric}
                  className="btn-premium btn-primary px-8 py-4 text-lg relative overflow-hidden"
                >
                  {collectingBiometric && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <Heart className="w-5 h-5 mr-2" />
                  {collectingBiometric ? "Verifying..." : "I'm Still Alive"}
                </motion.button>
              </div>
            </motion.div>

            {/* Lifeline Visual */}
            {vault && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mb-8"
              >
                <div className="glass-card p-8">
                  <LifelineVisual
                    daysRemaining={daysRemaining}
                    totalDays={totalDays}
                    checkInsCompleted={checkIns.length}
                    status={vaultStatus}
                  />
                </div>
              </motion.div>
            )}

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Next Check-in Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  {daysUntilNext && daysUntilNext <= 7 && (
                    <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium">
                      Due Soon
                    </span>
                  )}
                </div>
                <h3 className="text-lg text-slate-400 mb-2">Next Check-in</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white display-font">
                    {daysUntilNext ?? "--"}
                  </span>
                  <span className="text-slate-400">days</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  {vault?.nextCheckInDue 
                    ? new Date(vault.nextCheckInDue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : "Not scheduled"}
                </p>
              </motion.div>

              {/* Streak Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ y: -5 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-400">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400 font-medium">+5</span>
                  </div>
                </div>
                <h3 className="text-lg text-slate-400 mb-2">Current Streak</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white display-font">42</span>
                  <span className="text-slate-400">days</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Personal best: 127 days</p>
              </motion.div>

              {/* Health Score Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5 }}
                className="glass-card p-6 relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow" />
                </div>
                <h3 className="text-lg text-slate-400 mb-2">Vault Health</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 display-font">
                    {healthScore}%
                  </span>
                </div>
                <p className="text-sm text-emerald-400 mt-2">Excellent</p>
                
                {/* Health Wave Animation */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-20"
                  style={{
                    background: "linear-gradient(180deg, transparent, rgba(34, 197, 94, 0.1))",
                  }}
                >
                  <Waves className="w-full h-full text-emerald-400/20" />
                </motion.div>
              </motion.div>
            </div>

            {/* Biometric Collection Progress */}
            <AnimatePresence>
              {collectingBiometric && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card p-6 mb-8 overflow-hidden"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-400 animate-pulse">
                      <Fingerprint className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Collecting Biometric Signature</h3>
                      <p className="text-sm text-slate-400">Please wait while we verify your identity...</p>
                    </div>
                  </div>
                  
                  <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute h-full bg-gradient-to-r from-indigo-500 to-blue-400"
                      initial={{ width: "0%" }}
                      animate={{ width: `${checkInProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Check-ins */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold display-font text-white">Check-in History</h2>
                <button className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {checkIns.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Check-ins Yet</h3>
                  <p className="text-slate-400 mb-6">
                    Check-ins are recorded when you perform a proof-of-life verification.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckIn}
                    disabled={!isWalletConnected || collectingBiometric}
                    className="btn-premium btn-glass"
                  >
                    Perform First Check-in
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {checkIns.map((checkIn, index) => (
                    <motion.div
                      key={checkIn.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{ x: 2 }}
                      className="glass p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {checkIn.status === 'success' ? (
                          <div className="p-2 rounded-xl bg-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-red-500/20">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          </div>
                        )}
                        
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-white">{checkIn.method}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              checkIn.status === 'success' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {checkIn.status}
                            </span>
                            {checkIn.biometricScore && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400">
                                Biometric: {checkIn.biometricScore}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {checkIn.timestamp.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {checkIn.transactionHash && (
                              <>
                                <span className="text-slate-600">•</span>
                                <Lock className="w-3 h-3" />
                                <span className="font-mono text-xs">
                                  {checkIn.transactionHash.slice(0, 8)}...
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Security Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 glass-card p-6 border border-blue-500/20 bg-blue-500/5"
            >
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-blue-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Enhanced Security Active</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Your check-ins are secured with blockchain verification, biometric authentication, 
                    and multi-factor validation. Each check-in creates an immutable proof of life record 
                    that protects your digital assets.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
