/**
 * Seedless Wallet Recovery Page
 * Allows users to recover their seedless wallet using GuardiaVault guardians
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Shield, Users, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { seedlessGuardiaIntegration } from "../services/seedless-guardia-integration.service";
import { toast } from "sonner";

interface SeedlessRecoveryPageProps {
  onClose?: () => void;
}

export function SeedlessRecoveryPage({ onClose }: SeedlessRecoveryPageProps) {
  const [step, setStep] = useState<"initiate" | "waiting" | "complete">("initiate");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<any>(null);

  const handleInitiateRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !reason.trim()) {
      toast.error("Email and reason are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await seedlessGuardiaIntegration.initiateSeedlessRecovery({
        userEmail: email.trim(),
        reason: reason.trim(),
      });

      if (result.success && result.recoveryId) {
        setRecoveryId(result.recoveryId);
        setStep("waiting");
        toast.success(result.message);
        
        // Start polling for recovery status
        pollRecoveryStatus(result.recoveryId);
      } else {
        toast.error(result.message || "Failed to initiate recovery");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate recovery");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollRecoveryStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await seedlessGuardiaIntegration.getRecoveryStatus(id);
        if (status) {
          setRecoveryStatus(status);
          
          if (status.status === "approved" && status.canComplete) {
            clearInterval(interval);
            setStep("complete");
          } else if (status.status === "rejected" || status.status === "expired") {
            clearInterval(interval);
            toast.error(`Recovery ${status.status}`);
          }
        }
      } catch (error) {
        console.error("Error polling recovery status:", error);
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup after 30 minutes
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  const handleCompleteRecovery = async () => {
    if (!recoveryId) return;

    setIsSubmitting(true);
    try {
      const recoveryToken = prompt("Enter your recovery token:");
      if (!recoveryToken) {
        toast.error("Recovery token is required");
        setIsSubmitting(false);
        return;
      }

      const result = await seedlessGuardiaIntegration.completeSeedlessRecovery(
        recoveryId,
        recoveryToken
      );

      if (result.success) {
        toast.success(result.message);
        // Store recovered key securely (user should save this)
        if (result.recoveredKey) {
          localStorage.setItem("recovered_wallet_key", result.recoveredKey);
          toast.info("Recovered key saved. Please secure it immediately!");
        }
        setStep("complete");
      } else {
        toast.error(result.message || "Failed to complete recovery");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to complete recovery");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 max-w-4xl mx-auto">
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 border border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-black uppercase">
                Seedless Wallet Recovery
              </h1>
              <p className="text-xs md:text-sm text-white/50">
                Recover access via GuardiaVault guardians
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Step 1: Initiate Recovery */}
        {step === "initiate" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h2 className="text-xl font-black uppercase mb-4">Initiate Recovery</h2>
              <p className="text-sm text-white/60 mb-6">
                If you've lost access to your seedless wallet, you can recover it using your
                GuardiaVault guardians. At least 2 of 3 guardians must approve your recovery request.
              </p>

              <form onSubmit={handleInitiateRecovery} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Your Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Recovery Reason *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why you need to recover your wallet..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 resize-none"
                    required
                  />
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-blue-400 mb-1">
                        How Guardian Recovery Works
                      </div>
                      <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                        <li>Your guardians will receive an email notification</li>
                        <li>At least 2 of 3 guardians must approve your request</li>
                        <li>There's a 7-day timelock before recovery completes</li>
                        <li>You'll receive a recovery token once approved</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    "Initiate Recovery Request"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Step 2: Waiting for Approval */}
        {step === "waiting" && recoveryStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-orange-400" />
                <h2 className="text-xl font-black uppercase">Waiting for Guardian Approval</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-sm font-bold text-orange-400 mb-2">
                    Recovery Status: {recoveryStatus.status.toUpperCase()}
                  </div>
                  <div className="text-xs text-white/60">
                    Current Approvals: {recoveryStatus.currentApprovals} / {recoveryStatus.requiredApprovals}
                  </div>
                </div>

                {recoveryStatus.timeLockEndsAt && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-bold text-blue-400">Timelock Period</span>
                    </div>
                    <div className="text-xs text-white/60">
                      Recovery can complete after: {new Date(recoveryStatus.timeLockEndsAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {recoveryStatus.guardianApprovals && recoveryStatus.guardianApprovals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold mb-3">Guardian Responses</h3>
                    <div className="space-y-2">
                      {recoveryStatus.guardianApprovals.map((approval: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-white">
                                {approval.guardianName}
                              </div>
                              <div className="text-xs text-white/60">
                                {approval.guardianEmail}
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              approval.approved
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}>
                              {approval.approved ? "Approved" : "Rejected"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recoveryStatus.status === "approved" && recoveryStatus.canComplete && (
                  <button
                    onClick={handleCompleteRecovery}
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      "Complete Recovery"
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Recovery Complete */}
        {step === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase mb-2">Recovery Complete!</h2>
            <p className="text-sm text-white/60 mb-6">
              Your seedless wallet has been recovered. You can now access your wallet using the recovered key.
            </p>
            <div className="p-4 rounded-lg bg-black/50 border border-white/10 mb-4">
              <p className="text-xs text-white/40 mb-2">Recovered Key (save this securely):</p>
              <code className="text-xs text-white/80 font-mono break-all">
                {localStorage.getItem("recovered_wallet_key")?.slice(0, 20)}...
              </code>
            </div>
            <button
              onClick={() => {
                // Navigate to wallet or close
                if (onClose) onClose();
              }}
              className="px-6 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 transition-colors"
            >
              Continue to Wallet
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

