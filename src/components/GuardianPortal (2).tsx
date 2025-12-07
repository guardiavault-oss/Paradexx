/**
 * Guardian Portal - Standalone Web Portal for Guardians
 * 
 * This portal allows guardians to:
 * 1. Accept/decline guardian invitations without downloading the app
 * 2. View recovery requests and approve/reject them
 * 3. Access their key shard when needed for recovery
 * 4. Communicate with the wallet owner
 * 
 * Guardians access via unique tokenized links - no account creation needed
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Mail,
  Lock,
  Unlock,
  Send,
  ChevronRight,
  HelpCircle,
  ArrowLeft,
  Copy,
  Check,
  Users,
  Eye,
  EyeOff,
  Smartphone,
} from "lucide-react";

// Types
interface GuardianInfo {
  id: string;
  name: string;
  email: string;
  status: "pending" | "accepted" | "declined" | "revoked";
  walletOwnerName: string;
  walletOwnerEmail: string;
  vaultName: string;
  threshold: number;
  totalGuardians: number;
  acceptedAt?: string;
  hasPendingRecovery: boolean;
}

interface RecoveryRequest {
  id: string;
  initiatedAt: string;
  expiresAt: string;
  canExecuteAt: string;
  status: "pending" | "approved" | "disputed" | "completed" | "expired";
  reason?: string;
  requiredApprovals: number;
  currentApprovals: number;
  guardianApproved: boolean;
  guardianApprovalDate?: string;
  ownerLastActivity?: string;
  timeLockRemaining?: number;
}

interface PortalState {
  loading: boolean;
  error: string | null;
  step: "loading" | "invitation" | "dashboard" | "recovery" | "success" | "error";
  guardianInfo: GuardianInfo | null;
  recoveryRequest: RecoveryRequest | null;
}

// API Configuration
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || "/api";

export function GuardianPortal() {
  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const action = urlParams.get("action"); // "accept", "recovery", etc.

  const [state, setState] = useState<PortalState>({
    loading: true,
    error: null,
    step: "loading",
    guardianInfo: null,
    recoveryRequest: null,
  });

  const [copied, setCopied] = useState(false);
  const [showShardCode, setShowShardCode] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load guardian info on mount
  useEffect(() => {
    if (!token) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Invalid or missing guardian token. Please use the link from your invitation email.",
        step: "error"
      }));
      return;
    }

    loadGuardianInfo();
  }, [token]);

  const loadGuardianInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/guardian-portal/info?token=${encodeURIComponent(token!)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load guardian information");
      }

      const data = await response.json();
      
      // Determine which step to show
      let step: PortalState["step"] = "invitation";
      if (data.status === "accepted") {
        step = data.hasPendingRecovery ? "recovery" : "dashboard";
      } else if (data.status === "declined" || data.status === "revoked") {
        step = "error";
      }

      setState(prev => ({
        ...prev,
        loading: false,
        guardianInfo: data,
        recoveryRequest: data.pendingRecovery || null,
        step,
        error: data.status === "revoked" ? "This guardian invitation has been revoked." : null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load guardian portal",
        step: "error",
      }));
    }
  };

  const handleAcceptInvitation = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/guardian-portal/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to accept invitation");
      }

      // Reload guardian info
      await loadGuardianInfo();
      
      setState(prev => ({
        ...prev,
        step: "success",
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/guardian-portal/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason: declineReason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to decline invitation");
      }

      setState(prev => ({
        ...prev,
        step: "error",
        error: "You have declined this guardian invitation. The wallet owner will be notified.",
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setSubmitting(false);
      setShowDeclineDialog(false);
    }
  };

  const handleApproveRecovery = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/guardian-portal/approve-recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          recoveryRequestId: state.recoveryRequest?.id,
          approved: true,
          notes: approvalReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to approve recovery");
      }

      await loadGuardianInfo();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRecovery = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/guardian-portal/approve-recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          recoveryRequestId: state.recoveryRequest?.id,
          approved: false,
          notes: declineReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to reject recovery");
      }

      await loadGuardianInfo();
      setShowDeclineDialog(false);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format time remaining
  const formatTimeRemaining = (hours: number): string => {
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Shield className="w-16 h-16 text-[#00ADEF]" />
          </motion.div>
          <p className="text-[#AAAAAA]">Loading Guardian Portal...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (state.step === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#0D0D0D] rounded-2xl p-8 border border-[#2A2A2A] text-center"
          style={{
            background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          }}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-[#DC143C]/10 rounded-full flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(220, 20, 60, 0.2)" }}>
            <AlertTriangle className="w-8 h-8 text-[#DC143C]" />
          </div>
          <h2 className="text-xl text-[#E0E0E0] mb-2">Unable to Load Portal</h2>
          <p className="text-[#AAAAAA] mb-6">{state.error}</p>
          <a
            href="mailto:support@paradex.io"
            className="text-[#00ADEF] hover:underline text-sm"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    );
  }

  // Invitation pending - Guardian needs to accept/decline
  if (state.step === "invitation" && state.guardianInfo) {
    const { guardianInfo } = state;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] py-8 px-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#00ADEF] to-[#0066CC] rounded-2xl flex items-center justify-center"
              style={{ boxShadow: "0 0 40px rgba(0, 173, 239, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.2)" }}
            >
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl text-white mb-2">Guardian Invitation</h1>
            <p className="text-[#AAAAAA]">You've been chosen to help protect someone's crypto</p>
          </motion.div>

          {/* Invitation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0D0D0D] rounded-2xl border border-[#2A2A2A] overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            }}
          >
            {/* Owner Info */}
            <div className="p-6 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#00ADEF]/20 to-[#0066CC]/20 rounded-full flex items-center justify-center border border-[#00ADEF]/30">
                  <span className="text-2xl text-[#00ADEF]">
                    {guardianInfo.walletOwnerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg text-[#E0E0E0]">
                    {guardianInfo.walletOwnerName}
                  </h3>
                  <p className="text-sm text-[#888888]">{guardianInfo.walletOwnerEmail}</p>
                </div>
              </div>
              <p className="mt-4 text-[#AAAAAA]">
                has invited you to be a guardian for their <span className="text-[#00ADEF]">{guardianInfo.vaultName}</span> wallet.
              </p>
            </div>

            {/* What is a Guardian */}
            <div className="p-6 border-b border-[#2A2A2A]">
              <h4 className="text-lg text-[#E0E0E0] mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#00ADEF]" />
                What does being a Guardian mean?
              </h4>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00ADEF]/10 flex items-center justify-center flex-shrink-0 border border-[#00ADEF]/20">
                    <Lock className="w-4 h-4 text-[#00ADEF]" />
                  </div>
                  <div>
                    <p className="text-[#E0E0E0]">You hold a recovery key piece</p>
                    <p className="text-sm text-[#888888]">You'll securely store a piece of their recovery key. You cannot access their funds alone.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00ADEF]/10 flex items-center justify-center flex-shrink-0 border border-[#00ADEF]/20">
                    <Users className="w-4 h-4 text-[#00ADEF]" />
                  </div>
                  <div>
                    <p className="text-[#E0E0E0]">{guardianInfo.threshold} of {guardianInfo.totalGuardians} guardians needed</p>
                    <p className="text-sm text-[#888888]">Recovery requires approval from {guardianInfo.threshold} guardians. No single person can access the funds.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                    <Clock className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[#E0E0E0]">Only activated when needed</p>
                    <p className="text-sm text-[#888888]">You'll only be contacted if the owner loses access or something happens to them.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Responsibilities */}
            <div className="p-6 border-b border-[#2A2A2A] bg-[#0a0a0a]/50">
              <h4 className="text-sm text-[#E0E0E0] mb-3">Your Responsibilities:</h4>
              <ul className="space-y-2 text-sm text-[#AAAAAA]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Keep your email accessible - we'll contact you through it
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Respond to recovery requests in a timely manner
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Verify the owner's identity before approving recovery
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAcceptInvitation}
                  disabled={submitting}
                  className="flex-1 py-4 bg-gradient-to-r from-[#00ADEF] to-[#0066CC] text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ boxShadow: "0 4px 20px rgba(0, 173, 239, 0.3)" }}
                >
                  {submitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Shield className="w-5 h-5" />
                      </motion.div>
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Accept & Become Guardian
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeclineDialog(true)}
                  disabled={submitting}
                  className="flex-1 py-4 bg-[#1A1A1A] text-[#888888] rounded-xl hover:text-[#E0E0E0] hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 border border-[#2A2A2A]"
                >
                  Decline Invitation
                </motion.button>
              </div>
              
              <p className="text-xs text-center text-[#666666] mt-4">
                By accepting, you agree to help protect {guardianInfo.walletOwnerName}'s cryptocurrency. 
                No app download required - everything works through this portal.
              </p>
            </div>
          </motion.div>

          {/* No App Required Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-[#0D0D0D] rounded-xl border border-[#00ADEF]/20 flex items-center gap-3"
            style={{ boxShadow: "0 0 20px rgba(0, 173, 239, 0.1)" }}
          >
            <div className="w-10 h-10 rounded-lg bg-[#00ADEF]/10 flex items-center justify-center flex-shrink-0 border border-[#00ADEF]/20">
              <Smartphone className="w-5 h-5 text-[#00ADEF]" />
            </div>
            <div>
              <p className="text-[#E0E0E0]">No App Required</p>
              <p className="text-xs text-[#888888]">Everything works right here in your browser. Bookmark this page to access your guardian portal anytime.</p>
            </div>
          </motion.div>
        </div>

        {/* Decline Dialog */}
        <AnimatePresence>
          {showDeclineDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeclineDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#0D0D0D] rounded-2xl border border-[#2A2A2A] max-w-md w-full p-6"
                style={{
                  background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                }}
              >
                <h3 className="text-lg text-[#E0E0E0] mb-2">Decline Invitation?</h3>
                <p className="text-sm text-[#888888] mb-4">
                  Are you sure you want to decline? {guardianInfo.walletOwnerName} will need to find another guardian.
                </p>
                
                <textarea
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  placeholder="Reason for declining (optional)..."
                  className="w-full p-3 bg-[#0a0a0a] border border-[#2A2A2A] rounded-xl text-[#E0E0E0] text-sm mb-4 resize-none focus:outline-none focus:border-[#00ADEF]/50"
                  rows={3}
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeclineDialog(false)}
                    className="flex-1 py-3 bg-[#1A1A1A] text-[#E0E0E0] rounded-xl border border-[#2A2A2A] hover:bg-[#2A2A2A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeclineInvitation}
                    disabled={submitting}
                    className="flex-1 py-3 bg-[#DC143C]/10 text-[#DC143C] rounded-xl border border-[#DC143C]/30 hover:bg-[#DC143C]/20 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Declining..." : "Decline"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Success state after accepting
  if (state.step === "success" && state.guardianInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#0D0D0D] rounded-2xl p-8 border border-[#2A2A2A] text-center"
          style={{
            background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30"
            style={{ boxShadow: "0 0 30px rgba(34, 197, 94, 0.2)" }}
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          
          <h2 className="text-2xl text-[#E0E0E0] mb-2">You're Now a Guardian!</h2>
          <p className="text-[#AAAAAA] mb-6">
            Thank you for helping protect {state.guardianInfo.walletOwnerName}'s crypto. 
            We'll notify you if they ever need your help with recovery.
          </p>
          
          <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#2A2A2A] mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#888888]">Your Portal Link</span>
              <button
                onClick={() => copyToClipboard(window.location.href)}
                className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-[#888888]" />
                )}
              </button>
            </div>
            <p className="text-xs text-[#666666]">
              Bookmark this page to access your guardian portal anytime
            </p>
          </div>
          
          <button
            onClick={() => setState(prev => ({ ...prev, step: "dashboard" }))}
            className="w-full py-4 bg-gradient-to-r from-[#00ADEF] to-[#0066CC] text-white rounded-xl"
            style={{ boxShadow: "0 4px 20px rgba(0, 173, 239, 0.3)" }}
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // Dashboard - Active guardian view
  if (state.step === "dashboard" && state.guardianInfo) {
    const { guardianInfo } = state;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] py-8 px-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00ADEF] to-[#0066CC] rounded-xl flex items-center justify-center"
                style={{ boxShadow: "0 0 30px rgba(0, 173, 239, 0.3)" }}
              >
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl text-white">Guardian Portal</h1>
                <p className="text-sm text-[#888888]">{guardianInfo.email}</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-500/10 rounded-full flex items-center gap-2 border border-green-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-green-500">Active</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-6"
          >
            <div className="bg-[#0D0D0D] rounded-xl p-4 border border-[#2A2A2A] text-center"
              style={{ background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)" }}
            >
              <p className="text-2xl text-[#00ADEF]">{guardianInfo.threshold}</p>
              <p className="text-xs text-[#888888]">Required</p>
            </div>
            <div className="bg-[#0D0D0D] rounded-xl p-4 border border-[#2A2A2A] text-center"
              style={{ background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)" }}
            >
              <p className="text-2xl text-[#00ADEF]">{guardianInfo.totalGuardians}</p>
              <p className="text-xs text-[#888888]">Total Guardians</p>
            </div>
            <div className="bg-[#0D0D0D] rounded-xl p-4 border border-[#2A2A2A] text-center"
              style={{ background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)" }}
            >
              <p className="text-2xl text-green-500">0</p>
              <p className="text-xs text-[#888888]">Pending Actions</p>
            </div>
          </motion.div>

          {/* Protected Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0D0D0D] rounded-2xl border border-[#2A2A2A] p-6 mb-6"
            style={{
              background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
            }}
          >
            <h3 className="text-sm text-[#888888] mb-4">You're Protecting</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00ADEF]/20 to-[#0066CC]/20 rounded-full flex items-center justify-center border border-[#00ADEF]/30">
                <span className="text-2xl text-[#00ADEF]">
                  {guardianInfo.walletOwnerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="text-[#E0E0E0]">{guardianInfo.walletOwnerName}</h4>
                <p className="text-sm text-[#888888]">{guardianInfo.vaultName}</p>
                <p className="text-xs text-[#666666] mt-1">
                  Guardian since {new Date(guardianInfo.acceptedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* All Clear Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0D0D0D] rounded-2xl border border-[#2A2A2A] p-8 text-center"
            style={{
              background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
            }}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg text-[#E0E0E0] mb-2">All Clear!</h3>
            <p className="text-[#AAAAAA]">
              No recovery requests right now. We'll email you immediately if {guardianInfo.walletOwnerName} ever needs your help.
            </p>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-[#666666]">
              Questions? Contact{" "}
              <a href="mailto:support@paradex.io" className="text-[#00ADEF] hover:underline">
                support@paradex.io
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Recovery Request - Guardian needs to approve/reject
  if (state.step === "recovery" && state.guardianInfo && state.recoveryRequest) {
    const { guardianInfo, recoveryRequest } = state;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] py-8 px-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          {/* Alert Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3"
            style={{ boxShadow: "0 0 30px rgba(245, 158, 11, 0.15)" }}
          >
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-amber-500">Recovery Request Pending</h3>
              <p className="text-sm text-amber-200/80">
                Someone is requesting to recover {guardianInfo.walletOwnerName}'s wallet. Your decision is needed.
              </p>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#00ADEF] to-[#0066CC] rounded-xl flex items-center justify-center"
              style={{ boxShadow: "0 0 30px rgba(0, 173, 239, 0.3)" }}
            >
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-white">Guardian Portal</h1>
              <p className="text-sm text-[#888888]">Recovery Request Review</p>
            </div>
          </motion.div>

          {/* Recovery Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0D0D0D] rounded-2xl border border-[#2A2A2A] overflow-hidden mb-6"
            style={{
              background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
            }}
          >
            <div className="p-6 border-b border-[#2A2A2A]">
              <h3 className="text-lg text-[#E0E0E0] mb-4">Recovery Request Details</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Wallet Owner</span>
                  <span className="text-[#E0E0E0]">{guardianInfo.walletOwnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Initiated</span>
                  <span className="text-[#E0E0E0]">
                    {new Date(recoveryRequest.initiatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Approvals</span>
                  <span className="text-[#E0E0E0]">
                    {recoveryRequest.currentApprovals} of {recoveryRequest.requiredApprovals} required
                  </span>
                </div>
                {recoveryRequest.timeLockRemaining && (
                  <div className="flex justify-between">
                    <span className="text-[#888888]">Time Lock</span>
                    <span className="text-amber-500">
                      {formatTimeRemaining(recoveryRequest.timeLockRemaining)} remaining
                    </span>
                  </div>
                )}
                {recoveryRequest.reason && (
                  <div className="pt-4 border-t border-[#2A2A2A]">
                    <span className="text-[#888888] text-sm block mb-2">Reason Given:</span>
                    <p className="text-[#E0E0E0] text-sm bg-[#0a0a0a] rounded-lg p-3 border border-[#2A2A2A]">
                      {recoveryRequest.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Already Voted */}
            {recoveryRequest.guardianApproved !== undefined && (
              <div className="p-6 bg-[#0a0a0a]/50">
                <div className={`p-4 rounded-xl ${
                  recoveryRequest.guardianApproved 
                    ? "bg-green-500/10 border border-green-500/30" 
                    : "bg-[#DC143C]/10 border border-[#DC143C]/30"
                }`}>
                  <div className="flex items-center gap-3">
                    {recoveryRequest.guardianApproved ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <div>
                          <p className="text-green-500">You Approved</p>
                          <p className="text-xs text-green-300/60">
                            on {new Date(recoveryRequest.guardianApprovalDate || Date.now()).toLocaleString()}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-[#DC143C]" />
                        <div>
                          <p className="text-[#DC143C]">You Rejected</p>
                          <p className="text-xs text-[#DC143C]/60">
                            on {new Date(recoveryRequest.guardianApprovalDate || Date.now()).toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Voting Actions */}
            {recoveryRequest.guardianApproved === undefined && (
              <div className="p-6">
                <div className="mb-4">
                  <label className="text-sm text-[#888888] mb-2 block">
                    Add a note (optional)
                  </label>
                  <textarea
                    value={approvalReason}
                    onChange={e => setApprovalReason(e.target.value)}
                    placeholder="Any additional context for your decision..."
                    className="w-full p-3 bg-[#0a0a0a] border border-[#2A2A2A] rounded-xl text-[#E0E0E0] text-sm resize-none focus:outline-none focus:border-[#00ADEF]/50"
                    rows={2}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApproveRecovery}
                    disabled={submitting}
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ boxShadow: "0 4px 20px rgba(34, 197, 94, 0.3)" }}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Recovery
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeclineDialog(true)}
                    disabled={submitting}
                    className="flex-1 py-4 bg-[#1A1A1A] text-[#888888] rounded-xl hover:text-[#E0E0E0] hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-[#2A2A2A]"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Recovery
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-[#0D0D0D] rounded-xl border border-[#2A2A2A]"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#888888]">
                <p className="text-[#E0E0E0] mb-1">Before you decide:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verify this is a legitimate recovery request</li>
                  <li>If possible, contact {guardianInfo.walletOwnerName} to confirm</li>
                  <li>If you suspect fraud, reject the request immediately</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reject Dialog */}
        <AnimatePresence>
          {showDeclineDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeclineDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#0D0D0D] rounded-2xl border border-[#2A2A2A] max-w-md w-full p-6"
                style={{
                  background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                }}
              >
                <h3 className="text-lg text-[#E0E0E0] mb-2">Reject Recovery?</h3>
                <p className="text-sm text-[#888888] mb-4">
                  Are you sure? Only reject if you believe this is a fraudulent request or you've confirmed with the owner that they don't need recovery.
                </p>
                
                <textarea
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  placeholder="Reason for rejection (required)..."
                  className="w-full p-3 bg-[#0a0a0a] border border-[#2A2A2A] rounded-xl text-[#E0E0E0] text-sm mb-4 resize-none focus:outline-none focus:border-[#DC143C]/50"
                  rows={3}
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeclineDialog(false)}
                    className="flex-1 py-3 bg-[#1A1A1A] text-[#E0E0E0] rounded-xl border border-[#2A2A2A] hover:bg-[#2A2A2A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectRecovery}
                    disabled={submitting || !declineReason.trim()}
                    className="flex-1 py-3 bg-[#DC143C]/10 text-[#DC143C] rounded-xl border border-[#DC143C]/30 hover:bg-[#DC143C]/20 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Rejecting..." : "Reject Recovery"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}

export default GuardianPortal;