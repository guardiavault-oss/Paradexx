import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Shield, AlertTriangle, Send, RefreshCw, MessageSquare, UserPlus } from "lucide-react";
import { useVaults, usePartiesByRole } from "@/hooks/useVaults";
import { useWallet } from "@/hooks/useWallet";
import { Skeleton } from "@/components/ui/skeleton";
import GuardianCard from "@/components/GuardianCard";
import EnhancedGuardianCard from "@/components/EnhancedGuardianCard";
import { PartyHistoryDialog } from "@/components/PartyHistoryDialog";
import GuardianEducation from "@/components/GuardianEducation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import "../design-system.css";

export default function Guardians() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useWallet();
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const activeClaimId = urlParams.get("claim");
  const { data: vaultsData, isLoading: vaultsLoading } = useVaults();
  const vault = vaultsData?.vaults?.[0];
  const vaultId = vault?.id;

  const { data: guardiansData, isLoading: guardiansLoading } = usePartiesByRole(
    vaultId,
    "guardian"
  );

  const guardians = guardiansData?.parties || [];
  
  // Dialog states
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null);
  const [newGuardianName, setNewGuardianName] = useState("");
  const [newGuardianEmail, setNewGuardianEmail] = useState("");
  const [newGuardianPhone, setNewGuardianPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false);
  const [bulkGuardians, setBulkGuardians] = useState([
    { name: "", email: "", phone: "" },
    { name: "", email: "", phone: "" },
    { name: "", email: "", phone: "" },
  ]);
  const [bulkInviting, setBulkInviting] = useState(false);

  const handleReplaceGuardian = (guardian: any) => {
    setSelectedGuardian(guardian);
    setReplaceDialogOpen(true);
  };

  const handleRemoveGuardian = (guardian: any) => {
    setSelectedGuardian(guardian);
    setRemoveDialogOpen(true);
  };

  const confirmReplace = async () => {
    if (!vaultId || !selectedGuardian || !newGuardianName || !newGuardianEmail) return;
    
    setProcessing(true);
    try {
      // Delete old guardian
      const deleteResponse = await apiRequest("DELETE", `/api/parties/${selectedGuardian.id}`);
      
      // Add new guardian
      const addResponse = await apiRequest("POST", `/api/vaults/${vaultId}/parties`, {
        role: "guardian",
        name: newGuardianName,
        email: newGuardianEmail,
        phone: newGuardianPhone || null,
      });

      if (deleteResponse.ok && addResponse.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", vaultId, "parties"] });
        toast({
          title: "Guardian Replaced",
          description: `${newGuardianName} has been added as a new guardian.`,
        });
        setReplaceDialogOpen(false);
        setNewGuardianName("");
        setNewGuardianEmail("");
        setSelectedGuardian(null);
        setNewGuardianPhone("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to replace guardian",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const confirmRemove = async () => {
    if (!vaultId || !selectedGuardian) return;

    // Prevent removing if only 3 guardians (minimum required)
    if (guardians.length <= 3) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least 3 guardians. Add a new guardian before removing this one.",
        variant: "destructive",
      });
      setRemoveDialogOpen(false);
      return;
    }

    setProcessing(true);
    try {
      const response = await apiRequest("DELETE", `/api/parties/${selectedGuardian.id}`);
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", vaultId, "parties"] });
        toast({
          title: "Guardian Removed",
          description: `${selectedGuardian.name} has been removed as a guardian.`,
        });
        setRemoveDialogOpen(false);
        setSelectedGuardian(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove guardian",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleResendInvite = async (guardian: any) => {
    if (!vaultId) return;
    try {
      const resp = await apiRequest("POST", `/api/vaults/${vaultId}/guardians/invite`, { guardianId: guardian.id });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed to create invite");
      await navigator.clipboard.writeText(data.link);
      toast({ title: "Invite Ready", description: "Invite link copied to clipboard." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to create invite", variant: "destructive" });
    }
  };

  const handleSendReminderSingle = async (guardian: any) => {
    if (!vaultId) return;
    try {
      const resp = await apiRequest("POST", `/api/vaults/${vaultId}/notify-guardian/${guardian.id}`);
      if (!resp.ok) {
        const maybeText = await resp.text();
        let errMsg = "Failed to send reminder";
        try { const j = JSON.parse(maybeText); errMsg = j.message || errMsg; } catch {}
        throw new Error(errMsg);
      }
      toast({ title: "Reminder Sent", description: `Notification sent to ${guardian.name}.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reminder", variant: "destructive" });
    }
  };

  const handleMessageGuardian = (guardian: any) => {
    setSelectedGuardian(guardian);
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedGuardian || !messageText.trim()) return;
    setProcessing(true);
    try {
      const response = await apiRequest("POST", `/api/parties/${selectedGuardian.id}/message`, {
        message: messageText,
        subject: `GuardiaVault: Message from vault owner`,
      });

      if (response.ok) {
        toast({
          title: "Message Sent",
          description: `Message sent to ${selectedGuardian.name}`,
        });
        setMessageDialogOpen(false);
        setMessageText("");
        setSelectedGuardian(null);
      } else {
        const error = await response.json().catch(() => ({ message: "Failed to send message" }));
        throw new Error(error.message || "Failed to send message");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewHistory = async (guardian: any) => {
    setSelectedGuardian(guardian);
    setHistoryDialogOpen(true);
    // History will be fetched by the dialog component if needed
  };

  const handleEditGuardian = (guardian: any) => {
    setSelectedGuardian(guardian);
    // Pre-fill form with guardian data
    setNewGuardianName(guardian.name);
    setNewGuardianEmail(guardian.email);
    setNewGuardianPhone(guardian.phone || "");
    setReplaceDialogOpen(true);
  };

  const handleBulkInvite = async () => {
    if (!vaultId) return;

    // Validate at least one guardian
    const validGuardians = bulkGuardians.filter(g => g.name && g.email);
    if (validGuardians.length === 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter at least one guardian with name and email.",
        variant: "destructive",
      });
      return;
    }

    setBulkInviting(true);
    try {
      const response = await apiRequest("POST", `/api/vaults/${vaultId}/guardians/invite-bulk`, {
        guardians: validGuardians,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to invite guardians");
      }

      const data = await response.json();
      const successful = data.results?.filter((r: any) => r.success) || [];
      const failed = data.results?.filter((r: any) => !r.success) || [];

      if (successful.length > 0) {
        toast({
          title: "Invitations Sent",
          description: `Successfully invited ${successful.length} guardian(s). ${failed.length > 0 ? `${failed.length} failed.` : ""}`,
        });
      }

      if (failed.length > 0) {
        failed.forEach((f: any) => {
          toast({
            title: "Invitation Failed",
            description: `${f.email}: ${f.error}`,
            variant: "destructive",
          });
        });
      }

      // Reset form
      setBulkGuardians([
        { name: "", email: "", phone: "" },
        { name: "", email: "", phone: "" },
        { name: "", email: "", phone: "" },
      ]);
      setBulkInviteDialogOpen(false);

      // Refresh guardians list
      queryClient.invalidateQueries({ queryKey: ["/api/vaults", vaultId, "parties"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite guardians",
        variant: "destructive",
      });
    } finally {
      setBulkInviting(false);
    }
  };

  const handleSendReminder = async () => {
    if (!vaultId) return;
    setNotifying(true);
    try {
      const resp = await apiRequest("POST", `/api/vaults/${vaultId}/notify-guardians`);
      if (!resp.ok) {
        const maybeText = await resp.text();
        let errMsg = "Failed to send reminders";
        try { const j = JSON.parse(maybeText); errMsg = j.message || errMsg; } catch {}
        throw new Error(errMsg);
      }
      const raw = await resp.text();
      const data = (() => { try { return JSON.parse(raw); } catch { return {}; } })();
      const sent = (data?.sent || []).filter((s: any) => s.ok).length;
      toast({ title: "Reminders Sent", description: `Sent ${sent} notification(s) to guardians.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reminders", variant: "destructive" });
    } finally {
      setNotifying(false);
    }
  };

  if (vaultsLoading || guardiansLoading) {
    return (
      <SidebarProvider>
        <EnhancedAppSidebar />
        <SidebarInset>
          <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="mesh-gradient" />
            <div className="noise-overlay" />
            <div className="container max-w-6xl mx-auto py-8 px-6 relative z-10">
              <Skeleton className="h-12 w-48 mb-8 bg-slate-800/50" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 bg-slate-800/50" />
                ))}
              </div>
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
                    <Shield className="w-10 h-10 text-blue-400" />
                    Guardians
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Your trusted guardians who help protect your cryptocurrency
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass px-6 py-3 rounded-xl"
                  >
                    <Badge variant="outline" className="text-lg px-4 py-2 bg-white/5 border-white/10">
                      {guardians.length} / 3
                    </Badge>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setBulkInviteDialogOpen(true)}
                    disabled={!vaultId || guardians.length >= 5}
                    className="btn-premium btn-primary flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite Guardians
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendReminder}
                    disabled={notifying || !vaultId}
                    className="btn-premium btn-glass flex items-center gap-2"
                  >
                    {notifying ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {notifying ? "Sending..." : "Send Reminder"}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {guardians.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-12 text-center"
              >
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-2xl font-bold text-white mb-2 display-font">No Guardians Added</h3>
                <p className="text-slate-400 mb-6 text-lg">
                  You need at least 3 guardians to create a vault. Add guardians when creating a new vault.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation("/create-vault")}
                  className="btn-premium btn-primary"
                >
                  Create Vault with Guardians
                </motion.button>
              </motion.div>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guardians.map((guardian, index) => {
              // Calculate allocation (equal distribution for guardians, or from backend)
              const allocationPercent = guardians.length > 0 ? Math.round(100 / guardians.length) : 0;
              
              return (
                <EnhancedGuardianCard
                  key={guardian.id}
                  id={guardian.id}
                  name={guardian.name}
                  email={guardian.email}
                  phone={guardian.phone}
                  role={guardian.role}
                  status={guardian.status === "inactive" ? "declined" : (guardian.status as "active" | "pending" | "declined")}
                  fragmentId={(guardian as any).fragmentId || `frag-${index + 1}`}
                  allocationPercent={allocationPercent}
                  walletAddress={(guardian as any).walletAddress}
                  onReplace={() => handleReplaceGuardian(guardian)}
                  onRemove={() => handleRemoveGuardian(guardian)}
                  onResendInvite={() => handleResendInvite(guardian)}
                  onSendReminder={() => handleSendReminderSingle(guardian)}
                  onMessage={() => handleMessageGuardian(guardian)}
                  onEdit={() => handleEditGuardian(guardian)}
                  onChangeHistory={() => handleViewHistory(guardian)}
                />
              );
            })}
          </div>
        )}

              {activeClaimId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 glass-card p-6 border border-blue-500/20 bg-blue-500/5"
                >
                    <h3 className="text-xl font-bold text-white mb-2 display-font">Vault Recovery Confirmation</h3>
                  <p className="text-slate-400 mb-6">Confirm that the vault owner needs help. Your decision is securely recorded.</p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          const resp = await apiRequest("POST", `/api/claims/${activeClaimId}/attest`, { decision: "approve" });
                          const ok = resp.ok; const data = await resp.json().catch(() => ({}));
                          toast({ title: ok ? "Confirmed" : "Error", description: ok ? "You've confirmed they need help." : data?.message || "Failed", variant: ok ? "default" : "destructive" });
                        } catch (e: any) {
                          toast({ title: "Error", description: e.message || "Failed to confirm", variant: "destructive" });
                        }
                      }}
                      className="btn-premium btn-primary"
                    >
                      Yes, They Need Help
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          const resp = await apiRequest("POST", `/api/claims/${activeClaimId}/attest`, { decision: "reject" });
                          const ok = resp.ok; const data = await resp.json().catch(() => ({}));
                          toast({ title: ok ? "Confirmed" : "Error", description: ok ? "You've confirmed they're fine." : data?.message || "Failed", variant: ok ? "default" : "destructive" });
                        } catch (e: any) {
                          toast({ title: "Error", description: e.message || "Failed to confirm", variant: "destructive" });
                        }
                      }}
                      className="btn-premium btn-glass text-red-400 hover:text-red-300 border-red-500/20"
                    >
                      Reject
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Guardian Education Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <GuardianEducation vaultOwnerName={user?.email?.split("@")[0] || "You"} vaultName={vault?.name || "Your Vault"} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 glass-card p-8"
              >
                <h2 className="text-2xl font-bold display-font text-white mb-6">How Guardians Work</h2>
                <p className="text-slate-400 mb-6 text-lg">
                  Guardians are trusted people who help protect your cryptocurrency. Your recovery key is split into pieces, 
                  and multiple guardians must work together to restore access.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass p-6 rounded-2xl">
                    <h4 className="font-bold text-white mb-4 text-lg">Simple & Secure</h4>
                    <ul className="text-sm text-slate-400 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Recovery pieces stored securely
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        2 out of 3 guardians must agree
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        No single guardian can access funds alone
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Military-grade security protection
                      </li>
                    </ul>
                  </div>
                  <div className="glass p-6 rounded-2xl">
                    <h4 className="font-bold text-white mb-4 text-lg">The Recovery Process</h4>
                    <ul className="text-sm text-slate-400 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Guardians confirm you need help
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Beneficiaries request recovery
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Multiple guardians provide their recovery pieces
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Access is safely restored
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>

        {/* Replace Guardian Dialog */}
        <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Replace Guardian</DialogTitle>
              <DialogDescription>
                Replace {selectedGuardian?.name} with a new guardian. The old guardian will be removed and a new encrypted fragment will be distributed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">New Guardian Name</Label>
                <Input
                  id="new-name"
                  placeholder="John Doe"
                  value={newGuardianName}
                  onChange={(e) => setNewGuardianName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">New Guardian Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="john@example.com"
                  value={newGuardianEmail}
                  onChange={(e) => setNewGuardianEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone">New Guardian Phone (SMS)</Label>
                <Input
                  id="new-phone"
                  type="tel"
                  placeholder="+1 555 555 5555"
                  value={newGuardianPhone}
                  onChange={(e) => setNewGuardianPhone(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplaceDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmReplace} disabled={processing || !newGuardianName || !newGuardianEmail}>
                {processing ? "Replacing..." : "Replace Guardian"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Guardian Dialog */}
        <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Remove Guardian
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedGuardian?.name} as a guardian? This action cannot be undone.
                {guardians.length <= 3 && (
                  <span className="block mt-2 text-destructive font-semibold">
                    Warning: You have only {guardians.length} guardians. You need at least 3 guardians for the vault to function.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRemove}
                disabled={processing || guardians.length <= 3}
              >
                {processing ? "Removing..." : "Remove Guardian"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Message Guardian Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message to Guardian</DialogTitle>
              <DialogDescription>
                Send a message to {selectedGuardian?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setMessageDialogOpen(false);
                setMessageText("");
                setSelectedGuardian(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={processing || !messageText.trim()}>
                {processing ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Invite Dialog */}
        <Dialog open={bulkInviteDialogOpen} onOpenChange={setBulkInviteDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite 3 Guardians
              </DialogTitle>
              <DialogDescription>
                Invite up to 3 guardians at once. They'll receive email invitations with tokenized access links.
                <br />
                <span className="text-blue-400 font-semibold mt-2 block">
                  💡 No account required! Guardians can participate via email-only access.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {bulkGuardians.map((guardian, index) => (
                <div key={index} className="glass p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-white">Guardian {index + 1}</h4>
                  <div className="space-y-2">
                    <Label htmlFor={`bulk-name-${index}`}>Name *</Label>
                    <Input
                      id={`bulk-name-${index}`}
                      placeholder="John Doe"
                      value={guardian.name}
                      onChange={(e) => {
                        const updated = [...bulkGuardians];
                        updated[index].name = e.target.value;
                        setBulkGuardians(updated);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`bulk-email-${index}`}>Email *</Label>
                    <Input
                      id={`bulk-email-${index}`}
                      type="email"
                      placeholder="john@example.com"
                      value={guardian.email}
                      onChange={(e) => {
                        const updated = [...bulkGuardians];
                        updated[index].email = e.target.value;
                        setBulkGuardians(updated);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`bulk-phone-${index}`}>Phone (Optional)</Label>
                    <Input
                      id={`bulk-phone-${index}`}
                      type="tel"
                      placeholder="+1 555 555 5555"
                      value={guardian.phone}
                      onChange={(e) => {
                        const updated = [...bulkGuardians];
                        updated[index].phone = e.target.value;
                        setBulkGuardians(updated);
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  <strong>Benefits for Guardians:</strong> Invited guardians get 50% off premium plans if they sign up later.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkInvite}
                disabled={bulkInviting || bulkGuardians.filter(g => g.name && g.email).length === 0}
                className="gap-2"
              >
                {bulkInviting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitations
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change History Dialog */}
        <PartyHistoryDialog
          partyId={selectedGuardian?.id}
          partyName={selectedGuardian?.name}
          open={historyDialogOpen}
          onOpenChange={(open) => {
            setHistoryDialogOpen(open);
            if (!open) {
              setSelectedGuardian(null);
            }
          }}
        />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

