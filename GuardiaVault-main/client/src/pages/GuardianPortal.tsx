/**
 * Guardian Portal
 * Lightweight UI for guardians to participate without full account creation
 */

import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Send, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/utils/logger";
import "../design-system.css";

interface PortalInfo {
  party: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  vault: {
    id: string;
    name: string;
    status: string;
  };
  owner: {
    email: string;
  };
  pendingClaims: number;
  hasPendingActions: boolean;
}

interface PendingAction {
  claimId: string;
  status: string;
  myDecision: string;
  createdAt: string;
}

interface DashboardData {
  party: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  vault: {
    id: string;
    name: string;
    status: string;
  };
  pendingActions: PendingAction[];
  totalPendingClaims: number;
}

export default function GuardianPortal() {
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalInfo, setPortalInfo] = useState<PortalInfo | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [attesting, setAttesting] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    loadPortalInfo();
  }, [token]);

  const loadPortalInfo = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/guardian-portal/info?token=${encodeURIComponent(token)}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to load portal information");
      }

      const info = await response.json();
      setPortalInfo(info);
      setError(null);

      // Load dashboard data if accepted
      if (info.party.status === "active") {
        await loadDashboard();
      }
    } catch (err: any) {
      setError(err.message || "Failed to load portal");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    if (!token) return;

    try {
      const response = await apiRequest("GET", `/api/guardian-portal/dashboard?token=${encodeURIComponent(token)}`);
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: "loadGuardianDashboard",
      });
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const response = await apiRequest("POST", "/api/guardian-portal/accept", {
        token,
        acceptTerms: true,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to accept invitation");
      }

      toast({
        title: "Invitation Accepted",
        description: "You are now an active guardian for this vault.",
      });

      await loadPortalInfo();
      await loadDashboard();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;

    setDeclining(true);
    try {
      const response = await apiRequest("POST", "/api/guardian-portal/decline", {
        token,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to decline invitation");
      }

      toast({
        title: "Invitation Declined",
        description: "You have declined to serve as a guardian.",
      });

      setPortalInfo(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to decline invitation",
        variant: "destructive",
      });
    } finally {
      setDeclining(false);
    }
  };

  const handleAttest = async (claimId: string, decision: "approve" | "reject") => {
    if (!token) return;

    setAttesting(claimId);
    try {
      const response = await apiRequest("POST", "/api/guardian-portal/attest", {
        token,
        claimId,
        decision,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to process attestation");
      }

      toast({
        title: "Success",
        description: `Claim ${decision}d successfully`,
      });

      await loadDashboard();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to process attestation",
        variant: "destructive",
      });
    } finally {
      setAttesting(null);
    }
  };

  const handleSendMessage = async () => {
    if (!token || !contactMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await apiRequest("POST", "/api/guardian-portal/contact-owner", {
        token,
        message: contactMessage,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send message");
      }

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the vault owner.",
      });

      setContactMessage("");
      setShowContactDialog(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading portal...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!portalInfo) {
    return null;
  }

  // Pending invitation - show simplified onboarding wizard
  if (portalInfo.party.status === "pending") {
    const ownerName = portalInfo.owner.email.split("@")[0];
    const ownerDisplayName = ownerName.charAt(0).toUpperCase() + ownerName.slice(1);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl"
        >
          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">You've been chosen as a trusted guardian</CardTitle>
              <CardDescription className="text-lg mt-2">
                {ownerDisplayName} has selected you to help protect their cryptocurrency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Simple explanation steps */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-2xl">
                    👤
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">You're a Guardian</h4>
                    <p className="text-sm text-slate-300">
                      You hold a piece of {ownerDisplayName}'s recovery key. You can't access their funds alone - it takes multiple guardians working together.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-2xl">
                    🔐
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Only When Needed</h4>
                    <p className="text-sm text-slate-300">
                      You'll only be contacted if {ownerDisplayName} can't access their wallet for 90+ days, or if something unexpected happens.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-2xl">
                    ✅
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Simple Process</h4>
                    <p className="text-sm text-slate-300">
                      If needed, you'll just confirm that {ownerDisplayName} needs help. No technical knowledge required - we'll guide you through everything.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vault info - simplified */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 space-y-2">
                <p className="text-sm text-blue-200 font-medium">Vault: {portalInfo.vault.name}</p>
                <p className="text-xs text-blue-300/80">Owner: {portalInfo.owner.email}</p>
              </div>

              {/* Call to action */}
              <div className="flex gap-4 pt-2">
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg py-6"
                  size="lg"
                >
                  {accepting ? "Accepting..." : "I Accept - Help Protect Their Assets"}
                </Button>
                <Button
                  onClick={handleDecline}
                  disabled={declining}
                  variant="outline"
                  className="flex-1 text-lg py-6"
                  size="lg"
                >
                  {declining ? "Declining..." : "Decline"}
                </Button>
              </div>

              <p className="text-xs text-center text-slate-400">
                By accepting, you're helping {ownerDisplayName} ensure their cryptocurrency is protected. Thank you for being part of their safety plan.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Active guardian - show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Guardian Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              {portalInfo.party.name} ({portalInfo.party.email})
            </p>
          </div>
          <Button
            onClick={() => setShowContactDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Contact Owner
          </Button>
        </motion.div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Vault Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={portalInfo.vault.status === "active" ? "default" : "destructive"}>
                {portalInfo.vault.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Guardian Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.totalPendingClaims || portalInfo.pendingClaims || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions */}
        {dashboardData && dashboardData.pendingActions.length > 0 && (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Action Needed - Someone Needs Your Help
              </CardTitle>
              <CardDescription>
                Please confirm whether the vault owner needs assistance accessing their cryptocurrency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.pendingActions.map((action) => (
                <div
                  key={action.claimId}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold">Claim #{action.claimId.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(action.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={action.myDecision === "pending" ? "secondary" : "default"}>
                      {action.myDecision === "pending" ? "Pending" : action.myDecision === "approve" ? "Approved" : "Rejected"}
                    </Badge>
                  </div>

                  {action.myDecision === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAttest(action.claimId, "approve")}
                        disabled={attesting === action.claimId}
                        variant="default"
                        className="gap-2"
                        size="sm"
                      >
                        {attesting === action.claimId ? (
                          "Processing..."
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Yes, They Need Help
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleAttest(action.claimId, "reject")}
                        disabled={attesting === action.claimId}
                        variant="destructive"
                        className="gap-2"
                        size="sm"
                      >
                        {attesting === action.claimId ? (
                          "Processing..."
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            No, They're Fine
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Pending Actions */}
        {dashboardData && dashboardData.pendingActions.length === 0 && (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Clear</h3>
              <p className="text-muted-foreground">
                You have no actions needed at this time. If the vault owner needs help, we'll contact you.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contact Owner Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Vault Owner</DialogTitle>
            <DialogDescription>
              Send a message to {portalInfo.owner.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Enter your message here..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!contactMessage.trim() || sendingMessage}
            >
              {sendingMessage ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

