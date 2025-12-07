import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Shield,
  Key,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  Wallet,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@shared/config/api";
import { logError } from "@/utils/logger";

interface RecoveryInfo {
  recoveryId: string;
  walletAddress: string;
  ownerEmail?: string;
  status: "active" | "triggered" | "completed" | "cancelled";
  attestationCount: number;
  createdAt: string;
  recoveryFeePercentage: number;
  isValidKey: boolean;
  hasAttested: boolean;
  canAttest: boolean;
}

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function RecoveryKeyPortal() {
  const [, setLocation] = useLocation();
  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [signature, setSignature] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAttesting, setIsAttesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showWalletAddress, setShowWalletAddress] = useState(false);

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const recoveryId = urlParams.get("recoveryId");
  const recoveryKey = urlParams.get("key");
  const token = urlParams.get("token");

  useEffect(() => {
    if (recoveryId && (recoveryKey || token)) {
      loadRecoveryInfo();
    }
  }, [recoveryId, recoveryKey, token]);

  const loadRecoveryInfo = async () => {
    if (!recoveryId) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (recoveryKey) params.append("key", recoveryKey);
      if (token) params.append("token", token);

      const response = await fetch(
        `${API_BASE_URL}/api/recovery/key-portal/${recoveryId}?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load recovery information");
      }

      const data = await response.json();
      setRecoveryInfo(data);

      // Mark invitation as viewed
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/recovery/key-portal/${recoveryId}/viewed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        } catch (viewError) {
          logError(viewError instanceof Error ? viewError : new Error(String(viewError)), {
            context: "markInvitationViewed",
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load recovery information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  const handleSignMessage = async () => {
    if (!walletAddress || !recoveryInfo) return;

    try {
      const message = `GuardiaVault Recovery Attestation\nRecovery ID: ${recoveryInfo.recoveryId}\nWallet: ${recoveryInfo.walletAddress}\nKey: ${walletAddress}`;
      
      const signature = await window.ethereum!.request({
        method: "personal_sign",
        params: [message, walletAddress],
      });

      setSignature(signature);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to sign message");
    }
  };

  const handleAttest = async () => {
    if (!recoveryInfo || !signature) return;

    try {
      setIsAttesting(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/recovery/attest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoveryId: recoveryInfo.recoveryId,
          signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to attest recovery");
      }

      const data = await response.json();
      setSuccess(data.message);
      
      // Reload recovery info
      await loadRecoveryInfo();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to attest recovery");
    } finally {
      setIsAttesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recovery information...</p>
        </div>
      </div>
    );
  }

  if (!recoveryId || (!recoveryKey && !token)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Invalid Recovery Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              This recovery link is invalid or expired. Please check your email for the correct link.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Recovery Key Portal</h1>
            </motion.div>
            <p className="text-gray-600">
              You've been selected as a recovery key for a wallet. No account required.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 mb-6">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {recoveryInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Recovery Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Recovery Information
                  </CardTitle>
                  <CardDescription>
                    Details about the wallet recovery request
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Recovery ID</Label>
                      <p className="text-sm text-gray-600">#{recoveryInfo.recoveryId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge
                        variant={
                          recoveryInfo.status === "completed"
                            ? "default"
                            : recoveryInfo.status === "triggered"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {recoveryInfo.status.charAt(0).toUpperCase() + recoveryInfo.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Wallet Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={showWalletAddress ? recoveryInfo.walletAddress : "••••••••••••••••••••••••••••••••••••••••••"}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowWalletAddress(!showWalletAddress)}
                      >
                        {showWalletAddress ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      {showWalletAddress && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(recoveryInfo.walletAddress)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Attestations</Label>
                      <p className="text-sm text-gray-600">
                        {recoveryInfo.attestationCount} of 2 required
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Recovery Fee</Label>
                      <p className="text-sm text-gray-600">{recoveryInfo.recoveryFeePercentage}%</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(recoveryInfo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Attestation Process */}
              {recoveryInfo.isValidKey && !recoveryInfo.hasAttested && recoveryInfo.canAttest && (
                <Card>
                  <CardHeader>
                    <CardTitle>Confirm Recovery Request</CardTitle>
                    <CardDescription>
                      Confirm that the wallet owner needs help accessing their cryptocurrency
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important:</strong> Only confirm if you're certain the wallet owner
                        has lost access and genuinely needs help. Please verify the situation before confirming.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div>
                        <Label>Step 1: Connect Your Wallet</Label>
                        {!walletAddress ? (
                          <Button onClick={handleConnectWallet} className="w-full mt-2">
                            <Wallet className="mr-2 h-4 w-4" />
                            Connect Wallet
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              value={walletAddress}
                              readOnly
                              className="font-mono text-xs"
                            />
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Step 2: Sign Confirmation Message</Label>
                        <Button
                          onClick={handleSignMessage}
                          disabled={!walletAddress || !!signature}
                          className="w-full mt-2"
                        >
                          {signature ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Message Signed
                            </>
                          ) : (
                            <>
                              <Key className="mr-2 h-4 w-4" />
                              Sign Message
                            </>
                          )}
                        </Button>
                      </div>

                      <div>
                        <Label>Step 3: Submit Confirmation</Label>
                        <Button
                          onClick={handleAttest}
                          disabled={!signature || isAttesting}
                          className="w-full mt-2"
                        >
                          {isAttesting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Submit Confirmation
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Already Attested */}
              {recoveryInfo.hasAttested && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Confirmation Submitted</h3>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      You have already confirmed this recovery request. Thank you for helping secure
                      this wallet.
                    </p>
                    {recoveryInfo.attestationCount < 2 && (
                      <p className="text-xs text-gray-500">
                        Waiting for {2 - recoveryInfo.attestationCount} more confirmation(s)...
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recovery Triggered */}
              {recoveryInfo.status === "triggered" && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Clock className="h-12 w-12 text-orange-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Recovery Triggered</h3>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      The 7-day security time lock has started. The wallet owner can still cancel
                      the recovery during this period.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Recovery Completed */}
              {recoveryInfo.status === "completed" && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Recovery Completed</h3>
                    <p className="text-sm text-gray-600 text-center">
                      The wallet recovery has been completed successfully. The encrypted seed
                      phrase is now available to the recovery keys.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Footer */}
              <div className="text-center pt-8 border-t">
                <p className="text-xs text-gray-500 mb-2">
                  Powered by GuardiaVault - Secure Crypto Inheritance
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://guardiavault.com", "_blank")}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Learn More
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
