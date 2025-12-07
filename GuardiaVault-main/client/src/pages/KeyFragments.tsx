import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ArrowLeft, Key, Shield, Lock, Eye, EyeOff, Sparkles, Fingerprint } from "lucide-react";
import { useVaults, usePartiesByRole } from "@/hooks/useVaults";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { authenticateBiometric } from "@/lib/webauthn";
import { useToast } from "@/hooks/use-toast";
import PassphraseDisplay from "@/components/PassphraseDisplay";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import "../design-system.css";

export default function KeyFragments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: vaultsData, isLoading: vaultsLoading } = useVaults();
  const vault = vaultsData?.vaults?.[0];
  const vaultId = vault?.id;

  const { data: guardiansData, isLoading: guardiansLoading } = usePartiesByRole(
    vaultId,
    "guardian"
  );

  const guardians = guardiansData?.parties || [];
  const [showFragments, setShowFragments] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [showPassphrases, setShowPassphrases] = useState(false);
  const [passphraseData, setPassphraseData] = useState<any>(null);
  const [loadingPassphrases, setLoadingPassphrases] = useState(false);

  const handleShowFragments = async () => {
    if (showFragments) {
      setShowFragments(false);
      return;
    }

    setAuthenticating(true);
    try {
      // Require biometric authentication before showing fragments
      const authResult = await authenticateBiometric();
      
      if (!authResult.success) {
        toast({
          title: "Authentication Required",
          description: authResult.error || "Please authenticate to view fragments",
          variant: "destructive",
        });
        setAuthenticating(false);
        return;
      }

      setShowFragments(true);
      toast({
        title: "Fragments Revealed",
        description: `Authenticated via ${authResult.method === "webauthn" ? "biometrics" : authResult.method.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setAuthenticating(false);
    }
  };

  const handleShowPassphrases = async () => {
    if (!vaultId) {
      toast({
        title: "Error",
        description: "Vault not found",
        variant: "destructive",
      });
      return;
    }

    setLoadingPassphrases(true);
    try {
      // Require biometric authentication
      const authResult = await authenticateBiometric();
      
      if (!authResult.success) {
        toast({
          title: "Authentication Required",
          description: authResult.error || "Please authenticate to view passphrases",
          variant: "destructive",
        });
        setLoadingPassphrases(false);
        return;
      }

      // Fetch passphrases from backend
      const response = await fetch(`/api/vaults/${vaultId}/fragments/passphrases`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch passphrases");
      }

      const data = await response.json();
      setPassphraseData(data);
      setShowPassphrases(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load passphrases",
        variant: "destructive",
      });
    } finally {
      setLoadingPassphrases(false);
    }
  };

  if (vaultsLoading || guardiansLoading) {
    return (
      <SidebarProvider>
        <EnhancedAppSidebar />
        <SidebarInset>
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <DashboardHeader />
          <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="mesh-gradient" />
            <div className="noise-overlay" />
            <div className="container max-w-6xl mx-auto py-8 px-6 relative z-10">
              <Skeleton className="h-12 w-48 mb-8 bg-slate-800/50" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 bg-slate-800/50" />
                ))}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Mock fragment data - in production, this would come from the backend/blockchain
  const fragments = guardians.map((guardian, index) => ({
    id: `fragment-${index + 1}`,
    guardianId: guardian.id,
    guardianName: guardian.name,
    fragmentNumber: index + 1,
    encryptedData: showFragments 
      ? `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      : '••••••••••••••••',
    status: guardian.status === 'active' ? 'distributed' : 'pending',
  }));

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
              className="absolute w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute right-0 bottom-0 w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                x: [0, -100, 0],
                y: [0, 100, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          <div className="relative z-10 container max-w-6xl mx-auto px-6 py-8">
            {/* Premium Header */}
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
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold display-font heading-glow mb-3 flex items-center gap-3">
                    <Key className="w-10 h-10 text-purple-400" />
                    Key Fragments
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Encrypted fragments of your master key distributed to guardians
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass px-6 py-3 rounded-xl"
                  >
                    <Badge variant="outline" className="text-lg px-4 py-2 bg-white/5 border-white/10">
                      {fragments.filter(f => f.status === 'distributed').length} / {fragments.length}
                    </Badge>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShowFragments}
                    disabled={authenticating}
                    className="btn-premium btn-glass flex items-center gap-2 disabled:opacity-50"
                  >
                    {authenticating ? (
                      <>
                        <Fingerprint className="w-4 h-4 animate-pulse" />
                        Authenticating...
                      </>
                    ) : showFragments ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide Fragments
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show Fragments
                      </>
                    )}
                  </motion.button>
                  {guardians.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleShowPassphrases}
                      disabled={loadingPassphrases}
                      className="btn-premium btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingPassphrases ? (
                        <>
                          <Fingerprint className="w-4 h-4 animate-pulse" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          View Passphrases
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>

            {fragments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-12 text-center"
              >
                <Key className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-2xl font-bold text-white mb-2 display-font">No Fragments Created</h3>
                <p className="text-slate-400 mb-6 text-lg">
                  Key fragments are created when you set up a vault with guardians.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation("/create-vault")}
                  className="btn-premium btn-primary"
                >
                  Create Vault
                </motion.button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {fragments.map((fragment, index) => (
                  <motion.div
                    key={fragment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="glass-card p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-400">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white display-font">Fragment #{fragment.fragmentNumber}</h3>
                          <p className="text-slate-400">Held by {fragment.guardianName}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={fragment.status === 'distributed' ? 'default' : 'secondary'}
                        className="px-4 py-2 bg-white/5 border-white/10"
                      >
                        {fragment.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Lock className="w-4 h-4" />
                        <span>Encrypted Fragment Data:</span>
                      </div>
                      <div className="p-4 bg-background border border-input rounded-lg font-mono text-xs break-all text-foreground bg-slate-900/50 border-white/10">
                        {fragment.encryptedData}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        This fragment is encrypted and can only be combined with 1 other fragment (2-of-3 threshold) to reconstruct the master key.
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 glass-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold display-font text-white">Shamir Secret Sharing</h2>
              </div>
              {vault?.fragmentScheme === '3-of-5' ? (
                <>
                  <div className="mb-4">
                    <Badge variant="outline" className="bg-orange-500/10 border-orange-500/20 text-orange-400">
                      Legacy 3-of-5 Scheme
                    </Badge>
                  </div>
                  <p className="text-slate-400 mb-6 text-lg">
                    Your master key is split into 5 encrypted fragments using Shamir Secret Sharing.
                    Any 3 fragments can reconstruct the original key, ensuring redundancy and security.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-2xl text-center"
                    >
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 display-font">5</div>
                      <div className="text-sm text-slate-400">Total Fragments</div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-2xl text-center"
                    >
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 display-font">3</div>
                      <div className="text-sm text-slate-400">Required for Recovery</div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-2xl text-center"
                    >
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 mb-2 display-font">2</div>
                      <div className="text-sm text-slate-400">Redundancy Factor</div>
                    </motion.div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-400 mb-6 text-lg">
                    Your master key is split into 3 encrypted fragments using Shamir Secret Sharing.
                    Any 2 fragments can reconstruct the original key, ensuring redundancy and security.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-2xl text-center"
                    >
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 display-font">3</div>
                      <div className="text-sm text-slate-400">Total Fragments</div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-2xl text-center"
                    >
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 display-font">2</div>
                      <div className="text-sm text-slate-400">Required for Recovery</div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="glass p-6 rounded-2xl text-center"
                    >
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 mb-2 display-font">2</div>
                      <div className="text-sm text-slate-400">Redundancy Factor</div>
                    </motion.div>
                  </div>
                </>
              )}
            </motion.div>

            {/* Passphrase Display Dialog */}
            <Dialog open={showPassphrases} onOpenChange={setShowPassphrases}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Guardian Passphrases</DialogTitle>
                  <DialogDescription>
                    These passphrases are used by guardians to decrypt their fragments. Save them securely.
                  </DialogDescription>
                </DialogHeader>
                {passphraseData && (
                  <PassphraseDisplay
                    guardianPassphrases={passphraseData.guardianPassphrases || []}
                    masterSecret={passphraseData.masterSecret || undefined}
                    vaultName={passphraseData.vaultName || "My Vault"}
                    onClose={() => setShowPassphrases(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
