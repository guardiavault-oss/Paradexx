import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Key,
  Lock,
  Shield,
  Users,
  Wallet,
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { API_BASE_URL } from "@shared/config/api";
import { logError } from "@/utils/logger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RecoveryStatus {
  recoveryId: number;
  walletAddress: string;
  status: "Active" | "Triggered" | "Completed" | "Cancelled";
  createdAt: string;
  triggeredAt?: string;
  attestationCount: number;
  timeRemaining?: number; // seconds until recovery can complete
  canComplete: boolean;
}

export default function MultiSigRecovery() {
  const [, setLocation] = useLocation();
  const { user, walletAddress, isAuthenticated } = useWallet();
  const [activeRecovery, setActiveRecovery] = useState<RecoveryStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    // Load active recovery if exists
    loadRecoveryStatus();
  }, [isAuthenticated, walletAddress, setLocation]);

  const loadRecoveryStatus = async () => {
    if (!walletAddress) return;

    try {
      setIsLoading(true);
      // TODO: Implement API endpoint to fetch recovery status
      // For now, this is a placeholder
      // const response = await fetch(`${API_BASE_URL}/api/recovery/status/${walletAddress}`, {
      //   credentials: "include",
      // });
      // if (response.ok) {
      //   const data = await response.json();
      //   setActiveRecovery(data);
      // }
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: "loadRecoveryStatus",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleAttestRecovery = async () => {
    if (!activeRecovery) return;

    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement API endpoint
      // const response = await fetch(`${API_BASE_URL}/api/recovery/attest`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify({ recoveryId: activeRecovery.recoveryId }),
      // });

      // For now, simulate success
      setSuccess("Recovery attestation submitted. Waiting for second key...");
      setTimeout(() => {
        setSuccess(null);
        loadRecoveryStatus();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to attest recovery");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRecovery = async () => {
    if (!activeRecovery || !activeRecovery.canComplete) return;

    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement API endpoint
      // const response = await fetch(`${API_BASE_URL}/api/recovery/complete`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify({ recoveryId: activeRecovery.recoveryId }),
      // });

      setSuccess("Recovery completed! Encrypted data is now available.");
      setTimeout(() => {
        setSuccess(null);
        loadRecoveryStatus();
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to complete recovery");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <EnhancedAppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <DashboardHeader />
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Lost Access Recovery</h1>
              <p className="text-muted-foreground">
                2-of-3 recovery keys can restore your wallet after a 7-day time lock
              </p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/setup-recovery")}>
              <Key className="mr-2 h-4 w-4" />
              Setup Recovery
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="setup">Setup Recovery</TabsTrigger>
              <TabsTrigger value="active">Active Recovery</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      How It Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Setup Recovery</p>
                        <p className="text-sm text-muted-foreground">
                          Choose 3 trusted recovery keys and encrypt your seed phrase
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">2-of-3 Attestation</p>
                        <p className="text-sm text-muted-foreground">
                          Two recovery keys must attest that you need recovery
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold">3</span>
                      </div>
                      <div>
                        <p className="font-medium">7-Day Time Lock</p>
                        <p className="text-sm text-muted-foreground">
                          Security period to prevent false triggers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Recovery Complete</p>
                        <p className="text-sm text-muted-foreground">
                          Encrypted seed phrase becomes accessible to recovery keys
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Important Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Fee Structure:</strong> 10-20% of recovered balance may be charged
                        as a recovery fee.
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        <strong>7-Day Time Lock:</strong> Recovery cannot be completed until the
                        time lock expires. This protects against false triggers.
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Users className="h-4 w-4" />
                      <AlertDescription>
                        <strong>2-of-3 Required:</strong> Two of your three recovery keys must
                        attest before recovery begins.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                  <CardDescription>
                    Recover lost wallets with our secure multi-signature system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="font-semibold mb-2">Flat Fee</p>
                      <p className="text-2xl font-bold">$299</p>
                      <p className="text-sm text-muted-foreground mt-1">One-time setup fee</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="font-semibold mb-2">Percentage Fee</p>
                      <p className="text-2xl font-bold">10-20%</p>
                      <p className="text-sm text-muted-foreground mt-1">Of recovered balance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeRecovery ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Active Recovery</CardTitle>
                      <Badge
                        variant={
                          activeRecovery.status === "Completed"
                            ? "default"
                            : activeRecovery.status === "Triggered"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {activeRecovery.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Wallet: <code className="text-xs">{activeRecovery.walletAddress}</code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Attestation Progress</span>
                        <span className="text-sm">
                          {activeRecovery.attestationCount} of 2 required
                        </span>
                      </div>
                      <Progress
                        value={(activeRecovery.attestationCount / 2) * 100}
                        className="h-2"
                      />
                    </div>

                    {activeRecovery.status === "Triggered" && activeRecovery.timeRemaining && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Time Lock Remaining
                          </span>
                          <Badge variant="outline">
                            {formatTimeRemaining(activeRecovery.timeRemaining)}
                          </Badge>
                        </div>
                        <Progress
                          value={
                            ((7 * 24 * 60 * 60 - activeRecovery.timeRemaining) /
                              (7 * 24 * 60 * 60)) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      {activeRecovery.status === "Active" &&
                        activeRecovery.attestationCount < 2 && (
                          <Button onClick={handleAttestRecovery} disabled={isLoading}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Attest Recovery
                          </Button>
                        )}

                      {activeRecovery.canComplete && (
                        <Button
                          onClick={handleCompleteRecovery}
                          disabled={isLoading}
                          variant="default"
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Complete Recovery
                        </Button>
                      )}

                      {activeRecovery.status === "Completed" && (
                        <Alert className="border-green-500 bg-green-50">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Recovery completed! Encrypted seed phrase data is now available to
                            recovery keys.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No Active Recovery</p>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      You don't have an active recovery setup. Click "Setup Recovery" to get
                      started.
                    </p>
                    <Button onClick={() => setLocation("/setup-recovery")}>
                      <Key className="mr-2 h-4 w-4" />
                      Setup Recovery
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="setup" className="space-y-4">
              <Alert>
                <ExternalLink className="h-4 w-4" />
                <AlertDescription>
                  Use the Setup Recovery page to configure your 2-of-3 recovery keys and encrypt
                  your seed phrase.
                </AlertDescription>
              </Alert>
              <Button onClick={() => setLocation("/setup-recovery")} size="lg" className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Go to Setup Recovery
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}






