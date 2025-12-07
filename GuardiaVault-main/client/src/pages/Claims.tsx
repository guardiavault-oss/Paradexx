import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useWallet } from "@/hooks/useWallet";
import { useVaults } from "@/hooks/useVaults";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FileCheck, RefreshCw, CheckCircle2, Clock, XCircle, FileText, Users } from "lucide-react";
import "../design-system.css";

export default function Claims() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useWallet();
  const { toast } = useToast();
  const { data: vaultsData, isLoading: vaultsLoading } = useVaults();
  const vault = vaultsData?.vaults?.[0];
  const vaultId = vault?.id;

  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [detail, setDetail] = useState<{ claim: any; files: any[]; attestations: any[] } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const fetchClaims = async () => {
    if (!vaultId) return;
    setLoading(true);
    try {
      // Use DAO claims endpoint instead - these are the vault trigger claims
      const resp = await apiRequest("GET", `/api/dao/claims`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed to load claims");
      // Filter claims for this vault
      const allClaims = [...(data.claims || []), ...(data.myClaims || [])];
      setClaims(allClaims.filter((c: any) => c.vaultId === vaultId || c.vaultId === Number(vaultId)));
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load claims", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const fetchDetail = async (claimId: string) => {
    try {
      const resp = await apiRequest("GET", `/api/claims/${claimId}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed to load claim");
      setDetail(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load claim", variant: "destructive" });
    }
  };

  useEffect(() => { fetchClaims(); }, [vaultId]);

  const summary = useMemo(() => {
    if (!detail) return { guardiansOk: 0, attestorsOk: 0 };
    return {
      guardiansOk: detail.attestations.filter((a) => a.role === "guardian" && a.decision === "approve").length,
      attestorsOk: detail.attestations.filter((a) => a.role === "attestor" && a.decision === "approve").length,
    };
  }, [detail]);

  if (vaultsLoading) {
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
              <Skeleton className="h-10 w-64 mb-6 bg-slate-800/50" />
              <Skeleton className="h-40 bg-slate-800/50" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
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
                background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold display-font heading-glow mb-3 flex items-center gap-3">
                    <FileCheck className="w-10 h-10 text-blue-400" />
                    Claims
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Review and manage vault recovery claims
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLocation("/dashboard/dao-verification")}
                    className="btn-premium btn-primary flex items-center gap-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    Create New Claim
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={fetchClaims}
                    disabled={loading}
                    className="btn-premium btn-glass flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? "Refreshing…" : "Refresh"}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Claims List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
              >
                <h2 className="text-2xl font-bold display-font text-white mb-6">Claims for Vault</h2>
                {claims.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCheck className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 text-lg">No claims yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims.map((c, index) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ x: 2 }}
                        className="glass p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
                        onClick={() => { setSelectedClaim(c); fetchDetail(c.id); }}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-white mb-1">{c.id.slice(0, 16)}…</div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Badge 
                                variant={c.status === 'approved' ? 'default' : c.status === 'pending' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {c.status}
                              </Badge>
                            </span>
                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="btn-premium btn-glass text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClaim(c);
                            fetchDetail(c.id);
                          }}
                        >
                          View
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Claim Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-6"
              >
                <h2 className="text-2xl font-bold display-font text-white mb-6">Claim Details</h2>
                {!selectedClaim || !detail ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 text-lg">Select a claim to view details.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="glass p-4 rounded-xl">
                      <div className="text-sm text-slate-400 mb-1">Claim ID</div>
                      <code className="text-white font-mono text-sm">{selectedClaim.id}</code>
                    </div>
                    
                    <div className="glass p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Status</span>
                        <Badge 
                          variant={detail.claim.status === 'approved' ? 'default' : detail.claim.status === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {detail.claim.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="glass p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-white">Approvals</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Guardians</span>
                          <span className="text-white font-medium">{summary.guardiansOk} approved</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Attestors</span>
                          <span className="text-white font-medium">{summary.attestorsOk} approved</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-white">Files</span>
                      </div>
                      {detail.files.length === 0 ? (
                        <div className="text-slate-400 text-sm glass p-4 rounded-xl">No files uploaded.</div>
                      ) : (
                        <div className="space-y-2">
                          {detail.files.map((f) => (
                            <div key={f.id} className="glass p-3 rounded-xl text-sm">
                              <div className="text-white font-medium">{f.fileName}</div>
                              <div className="text-slate-400 text-xs mt-1">
                                {f.mimeType} • {Math.round((f.size || 0)/1024)} KB • sha256:{f.sha256.slice(0,12)}…
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-white">Attestations</span>
                      </div>
                      {detail.attestations.length === 0 ? (
                        <div className="text-slate-400 text-sm glass p-4 rounded-xl">No attestations yet.</div>
                      ) : (
                        <div className="space-y-2">
                          {detail.attestations.map((a) => (
                            <div key={a.id} className="glass p-3 rounded-xl">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-medium text-sm">{a.role}</span>
                                {a.decision === 'approve' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Badge variant={a.decision === 'approve' ? 'default' : 'destructive'} className="text-xs">
                                  {a.decision}
                                </Badge>
                                <Clock className="w-3 h-3" />
                                <span>{new Date(a.updatedAt).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
