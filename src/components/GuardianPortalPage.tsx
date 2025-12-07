/**
 * Guardian Portal Page
 * Email-based guardian access without full account creation
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { guardiaVaultAPI } from "../services/guardiavault-api.service";
import { toast } from "sonner";
// Get token from URL search params
const getTokenFromURL = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }
  return null;
};

export function GuardianPortalPage() {
  const [token, setToken] = useState<string | null>(getTokenFromURL());
  
  const [loading, setLoading] = useState(true);
  const [vaultInfo, setVaultInfo] = useState<any>(null);
  const [guardianInfo, setGuardianInfo] = useState<any>(null);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [accepting, setAccepting] = useState(false);
  const [attesting, setAttesting] = useState(false);

  useEffect(() => {
    if (token) {
      loadGuardianInfo();
    }
  }, [token]);

  const loadGuardianInfo = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const info = await guardiaVaultAPI.getGuardianInviteInfo(token);
      setVaultInfo(info.vault);
      setGuardianInfo(info.guardian);
      
      // Load pending claims
      const status = await guardiaVaultAPI.getGuardianStatus(token);
      setPendingClaims(status.pendingClaims || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load guardian information");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const result = await guardiaVaultAPI.acceptGuardianInvite(token, true);
      if (result.success) {
        toast.success("Invitation accepted!");
        await loadGuardianInfo();
      } else {
        toast.error(result.message || "Failed to accept invitation");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const handleAttest = async (claimId: string, decision: "approve" | "reject") => {
    if (!token) return;

    setAttesting(true);
    try {
      const result = await guardiaVaultAPI.guardianAttest(token, claimId, decision);
      if (result.success) {
        toast.success(`Recovery request ${decision}d`);
        await loadGuardianInfo();
      } else {
        toast.error(result.message || "Failed to process attestation");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process attestation");
    } finally {
      setAttesting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase mb-2">Invalid Link</h2>
          <p className="text-white/60">This guardian invitation link is invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 max-w-4xl mx-auto">
          <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black uppercase">
              Guardian Portal
            </h1>
            <p className="text-xs md:text-sm text-white/50">
              {guardianInfo?.name || "Guardian Access"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Vault Information */}
        {vaultInfo && (
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-black uppercase mb-4">Vault Information</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-white/40 mb-1">Vault Name</div>
                <div className="text-base font-bold text-white">{vaultInfo.name}</div>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-1">Status</div>
                <div className="text-base font-bold text-white uppercase">{vaultInfo.status}</div>
              </div>
              {vaultInfo.owner && (
                <div>
                  <div className="text-xs text-white/40 mb-1">Vault Owner</div>
                  <div className="text-base text-white">{vaultInfo.owner.name}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Guardian Status */}
        {guardianInfo && (
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-black uppercase mb-4">Your Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Status</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  guardianInfo.status === "accepted" || guardianInfo.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-orange-500/20 text-orange-400"
                }`}>
                  {guardianInfo.status.toUpperCase()}
                </span>
              </div>
              {guardianInfo.hasAttested && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>You have attested to recovery requests</span>
                </div>
              )}
            </div>

            {guardianInfo.status === "pending" && (
              <button
                onClick={handleAcceptInvite}
                disabled={accepting}
                className="w-full mt-4 px-6 py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </button>
            )}
          </div>
        )}

        {/* Pending Recovery Requests */}
        {pendingClaims.length > 0 && (
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-black uppercase mb-4">Pending Recovery Requests</h2>
            <div className="space-y-4">
              {pendingClaims.map((claim: any, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold text-white mb-1">
                        Recovery Request #{claim.id?.slice(0, 8)}
                      </div>
                      <div className="text-xs text-white/60">
                        Reason: {claim.reason || "Not specified"}
                      </div>
                      {claim.initiatedAt && (
                        <div className="text-xs text-white/40 mt-1">
                          Initiated: {new Date(claim.initiatedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      claim.status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : claim.status === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-orange-500/20 text-orange-400"
                    }`}>
                      {claim.status?.toUpperCase() || "PENDING"}
                    </div>
                  </div>

                  {claim.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAttest(claim.id || claim.claimId, "approve")}
                        disabled={attesting}
                        className="flex-1 px-4 py-2 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAttest(claim.id || claim.claimId, "reject")}
                        disabled={attesting}
                        className="flex-1 px-4 py-2 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Reject
                      </button>
                    </div>
                  )}

                  {claim.currentApprovals !== undefined && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-white/60">
                        Approvals: {claim.currentApprovals} / {claim.requiredApprovals}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingClaims.length === 0 && guardianInfo?.status === "accepted" && (
          <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10">
            <Shield className="w-12 h-12 mx-auto mb-3 text-white/40" />
            <p className="text-white/60">No pending recovery requests</p>
          </div>
        )}

        {/* Information */}
        <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-blue-400 mb-2">
                Your Role as a Guardian
              </div>
              <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                <li>You help verify the vault owner's inactivity</li>
                <li>You cannot access or control the vault owner's funds</li>
                <li>At least 2 of 3 guardians must approve recovery requests</li>
                <li>Recovery requests have a 7-day timelock before execution</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

