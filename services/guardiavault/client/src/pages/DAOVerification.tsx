import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Shield,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Vote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { logError } from "@/utils/logger";
import { motion } from "framer-motion";
import "../design-system.css";

interface Claim {
  id: number;
  vaultId: number;
  claimant: string;
  reason: string;
  createdAt: number;
  votingDeadline: number;
  approvalVotes: number;
  rejectionVotes: number;
  resolved: boolean;
  approved: boolean;
}

interface VerifierStats {
  isActive: boolean;
  stake: string;
  reputation: number;
  totalVotes: number;
  correctVotes: number;
  address?: string;
  registeredAt?: string;
  status?: string;
  stakeAmount?: string;
}

export default function DAOVerification() {
  const [, setLocation] = useLocation();
  const { walletAddress, isWalletConnected } = useWallet();
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [verifierStats, setVerifierStats] = useState<VerifierStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [deregistering, setDeregistering] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchClaims();
      fetchVerifierStats();
    }
  }, [walletAddress]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dao/claims`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch claims");
      }

      const data = await response.json();
      setClaims(data.claims || []);
      setMyClaims(data.myClaims || []);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "fetchClaims",
      });
      toast({
        title: "Error",
        description: "Failed to load claims",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifierStats = async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`/api/dao/verifier/${walletAddress}`, {
        credentials: "include",
      });

      if (!response.ok) {
        // Not a verifier yet
        setVerifierStats(null);
        return;
      }

      const data = await response.json();
      setVerifierStats(data);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "fetchVerifierStats",
      });
      setVerifierStats(null);
    }
  };

  const handleDeregisterVerifier = async () => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to deregister as a verifier",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeregistering(true);

      const response = await fetch(`/api/dao/verifier/deregister`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to deregister as verifier");
      }

      toast({
        title: "Verifier Deregistered",
        description: "You have successfully deregistered as a verifier",
      });

      await fetchVerifierStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deregister as verifier",
        variant: "destructive",
      });
    } finally {
      setDeregistering(false);
    }
  };

  const handleRegisterVerifier = async () => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to register as a verifier",
        variant: "destructive",
      });
      return;
    }

    try {
      setRegistering(true);

      // Register via backend API
      const response = await fetch(`/api/dao/verifier/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stakeAmount: "1000", // In production, get from form or config
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to register as verifier");
      }

      const result = await response.json();
      
      toast({
        title: "Verifier Registered!",
        description: "You can now vote on claims and earn reputation",
      });

      // Update verifier stats with returned metadata
      if (result.verifier) {
        await fetchVerifierStats();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register as verifier",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleVote = async (claimId: number, approved: boolean) => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      });
      return;
    }

    try {
      // Vote via backend API
      const response = await fetch(`/api/dao/claims/${claimId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approved }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to vote");
      }

      toast({
        title: "Vote Cast!",
        description: `You voted to ${approved ? "approve" : "reject"} this claim`,
      });

      await fetchClaims();
      await fetchVerifierStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to vote",
        variant: "destructive",
      });
    }
  };

  const formatTimeRemaining = (deadline: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    if (remaining <= 0) return "Voting Closed";
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    return `${days}d ${hours}h remaining`;
  };

  const getVotePercentage = (claim: Claim) => {
    const total = claim.approvalVotes + claim.rejectionVotes;
    if (total === 0) return 0;
    return (claim.approvalVotes / total) * 100;
  };

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
                    <Shield className="w-10 h-10 text-blue-400" />
                    DAO Verification
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Community-driven verification for vault claims. Stake tokens, vote, earn reputation.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Verifier Status */}
            {verifierStats && verifierStats.isActive ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Verifier Status
                  </CardTitle>
                  <CardDescription>
                    {verifierStats.address && (
                      <span className="font-mono text-sm">
                        Address: {verifierStats.address.slice(0, 6)}...{verifierStats.address.slice(-4)}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Verifier Metadata */}
                    {(verifierStats.registeredAt || verifierStats.status) && (
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                        {verifierStats.registeredAt && (
                          <div>
                            <Label className="text-muted-foreground">Registered At</Label>
                            <p className="text-sm font-medium mt-1">
                              {new Date(verifierStats.registeredAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {verifierStats.status && (
                          <div>
                            <Label className="text-muted-foreground">Status</Label>
                            <Badge variant="default" className="mt-1">
                              {verifierStats.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Reputation</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={(verifierStats.reputation / 10)} className="flex-1" />
                          <span className="font-bold">{verifierStats.reputation}/1000</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Stake</Label>
                        <p className="text-xl font-bold">{verifierStats.stake || verifierStats.stakeAmount || "0"} tokens</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Total Votes</Label>
                        <p className="text-xl font-bold">{verifierStats.totalVotes}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Accuracy</Label>
                        <p className="text-xl font-bold">
                          {verifierStats.totalVotes > 0
                            ? ((verifierStats.correctVotes / verifierStats.totalVotes) * 100).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>

                    {/* Deregister Button */}
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={handleDeregisterVerifier}
                        disabled={deregistering}
                      >
                        {deregistering ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deregistering...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Deregister as Verifier
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Become a Verifier</CardTitle>
                  <CardDescription>
                    Stake tokens to participate in claim verification and earn reputation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleRegisterVerifier}
                    disabled={!isWalletConnected || registering}
                    size="lg"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Register as Verifier
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Claims */}
            <Tabs defaultValue="active" className="space-y-4">
              <TabsList>
                <TabsTrigger value="active">Active Claims</TabsTrigger>
                <TabsTrigger value="my-claims">My Claims</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : claims.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Vote className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No Active Claims</h3>
                      <p className="text-muted-foreground">
                        There are currently no claims requiring verification.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {claims.map((claim) => (
                      <Card key={claim.id} className="hover-elevate">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Claim #{claim.id}</CardTitle>
                            <Badge variant={claim.resolved ? "secondary" : "default"}>
                              {claim.resolved ? "Resolved" : "Active"}
                            </Badge>
                          </div>
                          <CardDescription>
                            Vault #{claim.vaultId} • Claimed by {claim.claimant.slice(0, 6)}...
                            {claim.claimant.slice(-4)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Reason</Label>
                            <p className="text-sm mt-1">{claim.reason}</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Approval Votes</span>
                              <span className="font-semibold">{claim.approvalVotes}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Rejection Votes</span>
                              <span className="font-semibold">{claim.rejectionVotes}</span>
                            </div>
                            <Progress value={getVotePercentage(claim)} className="mt-2" />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{formatTimeRemaining(claim.votingDeadline)}</span>
                            </div>

                            {!claim.resolved && verifierStats?.isActive && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVote(claim.id, false)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleVote(claim.id, true)}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-claims">
                {myClaims.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No Claims Created</h3>
                      <p className="text-muted-foreground">
                        You haven't created any claims yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myClaims.map((claim) => (
                      <Card key={claim.id}>
                        <CardHeader>
                          <CardTitle>Claim #{claim.id}</CardTitle>
                          <CardDescription>
                            {claim.resolved
                              ? claim.approved
                                ? "Approved ✓"
                                : "Rejected ✗"
                              : "Pending Verification"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{claim.reason}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resolved">
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Resolved claims will appear here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Info */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>How DAO Verification Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>Verifier Registration:</strong> Stake governance tokens to become a
                  verifier. Minimum stake required.
                </p>
                <p>
                  <strong>Voting:</strong> Verifiers vote on claim legitimacy. Vote weight is
                  based on reputation score.
                </p>
                <p>
                  <strong>Reputation System:</strong> Start at 500 (neutral). +10 for correct
                  votes, -10 for incorrect votes. Higher reputation = higher vote weight.
                </p>
                <p>
                  <strong>Auto-Resolution:</strong> Claims auto-resolve when 2/3 threshold reached
                  (approve or reject). Manual resolution after voting deadline.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

