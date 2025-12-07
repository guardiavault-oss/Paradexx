import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Bell,
  Smartphone,
  Mail,
  MessageSquare,
  Globe,
  Cpu,
  Eye,
  EyeOff,
  Check,
  X,
  CreditCard,
  ChevronRight,
  Sparkles,
  Lock,
  Fingerprint,
  Wallet,
  Radio,
  Save,
  ArrowLeft,
  QrCode,
  Copy,
  KeyRound,
} from "lucide-react";
import { registerWebAuthnCredential, getWebAuthnStatus, isWebAuthnSupported, isMobileDevice, getBiometricTypeName } from "@/lib/webauthn";
import { useVaults } from "@/hooks/useVaults";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { HardwareDevices } from "@/components/HardwareDevices";
import BiometricSetup from "@/components/BiometricSetup";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { logError } from "@/utils/logger";

// Import design system
import "../design-system.css";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { data: vaultsData } = useVaults();
  const { toast } = useToast();
  const { user } = useWallet();
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const vault = vaultsData?.vaults?.[0];
  const vaultId = vault?.id;

  // Fetch subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) {
        setSubscriptionLoading(false);
        return;
      }
      
      try {
        const response = await fetch("/api/subscriptions/status", {
          credentials: "include",
        });
        
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        
        if (response.ok && isJson) {
          try {
            const data = await response.json();
            setSubscription(data);
          } catch {
            setSubscription(null);
          }
        } else {
          setSubscription(null);
        }
      } catch {
        setSubscription(null);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.id]);

  // Fetch 2FA status
  useEffect(() => {
    const fetch2FAStatus = async () => {
      if (!user?.id) {
        setTotpLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/auth/totp/status", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setTotpEnabled(data.enabled || false);
        }
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "fetch2FAStatus",
        });
      } finally {
        setTotpLoading(false);
      }
    };
    fetch2FAStatus();
  }, [user?.id]);

  // Settings state
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [web3Enabled, setWeb3Enabled] = useState(false);
  const [hardwareEnabled, setHardwareEnabled] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState("");
  const [web3Address, setWeb3Address] = useState("");
  const [hardwareId, setHardwareId] = useState("");
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message?: string }>>({});
  
  // 2FA/TOTP state
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpLoading, setTotpLoading] = useState(true);
  const [totpSetupOpen, setTotpSetupOpen] = useState(false);
  const [totpQRCode, setTotpQRCode] = useState<string>("");
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [totpVerifyToken, setTotpVerifyToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpDisableOpen, setTotpDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  // Biometric Authentication state (kept for compatibility, but BiometricSetup component handles its own state)
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Fetch biometric status for display
  useEffect(() => {
    const fetchBiometricStatus = async () => {
      if (!user?.id) return;
      try {
        const status = await getWebAuthnStatus();
        setBiometricEnabled(status?.hasCredentials || false);
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "fetchBiometricStatus",
        });
        setBiometricEnabled(false);
      }
    };
    fetchBiometricStatus();
  }, [user?.id]);

  // Hydrate from vault
  useEffect(() => {
    if (!vault) return;
    setAiEnabled(Boolean((vault as any).aiSentinelEnabled));
    const channels = (vault as any).checkInChannels || {};
    setEmailEnabled(channels.email ?? true);
    setSmsEnabled(channels.sms ?? false);
    setTelegramUsername(channels.telegramUsername || "");
    setWeb3Address(channels.web3Address || "");
    setHardwareId(channels.hardwareId || "");
    setTelegramEnabled(Boolean(channels.telegramUsername));
    setWeb3Enabled(Boolean(channels.web3Address));
    setHardwareEnabled(Boolean(channels.hardwareId));
  }, [vault]);

  const handleSave = async () => {
    if (!vaultId) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/vaults/${vaultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          checkInChannels: {
            email: emailEnabled,
            sms: smsEnabled,
            telegramUsername: telegramEnabled ? telegramUsername : undefined,
            web3Address: web3Enabled ? web3Address : undefined,
            hardwareId: hardwareEnabled ? hardwareId : undefined,
          },
          aiSentinelEnabled: aiEnabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save settings");
      }

      toast({
        title: "Settings Saved",
        description: "Your vault settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTOTPSetup = async () => {
    try {
      const response = await fetch("/api/auth/totp/setup", {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to setup 2FA");
      }
      const data = await response.json();
      setTotpQRCode(data.qrCode);
      setTotpSecret(data.secret);
      setTotpSetupOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup 2FA",
        variant: "destructive",
      });
    }
  };

  const handleTOTPEnable = async () => {
    if (!totpVerifyToken || totpVerifyToken.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/totp/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: totpVerifyToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to enable 2FA");
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes || []);
      setTotpEnabled(true);
      setTotpSetupOpen(false);
      setTotpVerifyToken("");
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enable 2FA",
        variant: "destructive",
      });
    }
  };

  const handleTOTPDisable = async () => {
    if (!disablePassword) {
      toast({
        title: "Password Required",
        description: "Please enter your password to disable 2FA",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: disablePassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to disable 2FA");
      }

      setTotpEnabled(false);
      setTotpDisableOpen(false);
      setDisablePassword("");
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been successfully disabled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const handleTestNotification = async (channelId: string, recipient: string) => {
    if (!recipient) {
      toast({
        title: "Recipient Required",
        description: `Please provide a ${channelId === "email" ? "email address" : channelId === "sms" ? "phone number" : "Telegram username"}`,
        variant: "destructive",
      });
      return;
    }

    setTestingChannel(channelId);
    try {
      const response = await fetch(`/api/notifications/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          channel: channelId,
          recipient,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResults({ ...testResults, [channelId]: { success: true, message: data.message } });
        toast({
          title: "Test Sent",
          description: data.message || `Test ${channelId} notification sent successfully`,
        });
      } else {
        setTestResults({ ...testResults, [channelId]: { success: false, message: data.error || data.message } });
        toast({
          title: "Test Failed",
          description: data.error || data.message || `Failed to send test ${channelId} notification`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestResults({ ...testResults, [channelId]: { success: false, message: error.message } });
      toast({
        title: "Error",
        description: error.message || `Failed to send test ${channelId} notification`,
        variant: "destructive",
      });
    } finally {
      setTestingChannel(null);
    }
  };

  const handleTestWeb3 = async () => {
    // Mock/fallback with staging flag
    const isStaging = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'staging';
    const useMock = !web3Address || isStaging;

    if (!web3Address) {
      toast({
        title: "Address Required",
        description: "Please provide a Web3 wallet address",
        variant: "destructive",
      });
      return;
    }

    if (useMock) {
      // Mock response for development/staging
      toast({
        title: "Web3 Signature Test (Mock)",
        description: "Mock Web3 signature verification successful. In production, this would verify against the connected wallet.",
      });
      return;
    }

    try {
      const response = await fetch(`/api/web3/signature/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          address: web3Address,
          message: "Test message from GuardiaVault",
          signature: "0x0000000000000000000000000000000000000000000000000000000000000000",
        }),
      });

      const data = await response.json();
      toast({
        title: data.success ? "Web3 Test Successful" : "Web3 Test Failed",
        description: data.message || (data.success ? "Web3 signature verification (simulated)" : "Failed to verify signature"),
        variant: data.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to test Web3 signature",
        variant: "destructive",
      });
    }
  };

  const handleTestHardware = async () => {
    // Mock/fallback with staging flag
    const isStaging = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'staging';
    const useMock = !hardwareId || isStaging;

    if (useMock) {
      // Mock response for development/staging
      toast({
        title: "Hardware Ping Test (Mock)",
        description: "Mock hardware ping successful. In production, this would connect to the actual hardware device.",
      });
      return;
    }

    if (!hardwareId) {
      toast({
        title: "Device ID Required",
        description: "Please provide a hardware device ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/hardware/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          deviceId: hardwareId,
        }),
      });

      const data = await response.json();
      toast({
        title: data.success ? "Hardware Test Successful" : "Hardware Test Failed",
        description: data.message || (data.success ? "Hardware ping successful (simulated)" : "Failed to ping hardware"),
        variant: data.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to test hardware ping",
        variant: "destructive",
      });
    }
  };

  const notificationChannels = [
    {
      id: "email",
      label: "Email Notifications",
      description: "Receive check-in reminders via email",
      icon: Mail,
      enabled: emailEnabled,
      setEnabled: setEmailEnabled,
      color: "from-blue-500 to-cyan-400",
    },
    {
      id: "sms",
      label: "SMS Notifications",
      description: "Get text message alerts",
      icon: Smartphone,
      enabled: smsEnabled,
      setEnabled: setSmsEnabled,
      color: "from-violet-500 to-purple-400",
    },
    {
      id: "telegram",
      label: "Telegram Bot",
      description: "Connect with our secure Telegram bot",
      icon: MessageSquare,
      enabled: telegramEnabled,
      setEnabled: setTelegramEnabled,
      color: "from-emerald-500 to-green-400",
      hasInput: true,
      inputValue: telegramUsername,
      setInputValue: setTelegramUsername,
      inputPlaceholder: "@your_username",
    },
  ];

  const advancedFeatures = [
    {
      id: "web3",
      label: "Web3 Signature",
      description: "Use wallet signature for proof-of-life",
      icon: Wallet,
      enabled: web3Enabled,
      setEnabled: setWeb3Enabled,
      color: "from-orange-500 to-amber-400",
      hasInput: true,
      inputValue: web3Address,
      setInputValue: setWeb3Address,
      inputPlaceholder: "0x...",
    },
    {
      id: "hardware",
      label: "Hardware Ping",
      description: "Enable hardware keepalive detection",
      icon: Radio,
      enabled: hardwareEnabled,
      setEnabled: setHardwareEnabled,
      color: "from-pink-500 to-rose-400",
      hasInput: true,
      inputValue: hardwareId,
      setInputValue: setHardwareId,
      inputPlaceholder: "device-id",
    },
    {
      id: "ai",
      label: "GuardianX AI Sentinel",
      description: "Biometric liveness & deepfake detection",
      icon: Cpu,
      enabled: aiEnabled,
      setEnabled: setAiEnabled,
      color: "from-indigo-500 to-blue-400",
      premium: true,
    },
  ];

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
              className="absolute top-20 left-20 w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                x: [0, 50, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          <div className="relative z-10 container max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
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
              
              <h1 className="text-5xl font-bold display-font heading-glow mb-3">
                Vault Settings
              </h1>
              <p className="text-slate-400 text-lg">
                Configure your security preferences and notification channels
              </p>
            </motion.div>

            {/* Subscription Status - Premium Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 mb-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold display-font text-white">Subscription Status</h2>
                    <p className="text-slate-400">Your GuardiaVault platform access</p>
                  </div>
                </div>

                {subscriptionLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-32 bg-slate-800/50 rounded animate-pulse" />
                    <div className="h-4 w-48 bg-slate-800/50 rounded animate-pulse" />
                  </div>
                ) : subscription && subscription.status === "active" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass p-6 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow" />
                        <p className="text-sm text-slate-400">Status</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-400">Active</p>
                      <p className="text-sm text-slate-500 mt-1">{subscription.plan} Plan</p>
                    </div>
                    
                    <div className="glass p-6 rounded-2xl">
                      <p className="text-sm text-slate-400 mb-2">Renews On</p>
                      <p className="text-2xl font-bold text-white">
                        {subscription.currentPeriodEnd 
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : "N/A"}
                      </p>
                    </div>
                    
                    <div className="glass p-6 rounded-2xl">
                      <p className="text-sm text-slate-400 mb-2">Annual Cost</p>
                      <p className="text-2xl font-bold text-white">
                        ${subscription.amount ? (subscription.amount / 100) : "0"}/year
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="glass p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5">
                    <div className="flex items-start gap-4">
                      <X className="w-6 h-6 text-orange-400 mt-1" />
                      <div>
                        <p className="font-semibold text-white text-lg mb-2">No Active Subscription</p>
                        <p className="text-slate-400 mb-4">
                          You need an active subscription to create and maintain vaults.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setLocation("/checkout")}
                          className="btn-premium btn-primary"
                        >
                          Subscribe Now <ChevronRight className="w-4 h-4 ml-1" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Two-Factor Authentication */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-8 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold display-font text-white">
                  Two-Factor Authentication
                </h2>
              </div>
              
              <div className="glass p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">TOTP Authentication</h3>
                      <p className="text-sm text-slate-400">
                        {totpEnabled
                          ? "Protect your account with time-based one-time passwords"
                          : "Enable two-factor authentication for enhanced security"}
                      </p>
                    </div>
                  </div>
                  {totpLoading ? (
                    <div className="w-14 h-7 bg-slate-700 rounded-full animate-pulse" />
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (totpEnabled) {
                          setTotpDisableOpen(true);
                        } else {
                          handleTOTPSetup();
                        }
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        totpEnabled ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-slate-700"
                      }`}
                    >
                      <motion.div
                        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                        animate={{ left: totpEnabled ? "32px" : "4px" }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  )}
                </div>

                {totpEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="ml-14 mt-4 space-y-2"
                  >
                    <p className="text-sm text-slate-300">
                      ✓ 2FA is active. You'll need to enter a code from your authenticator app when logging in.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Biometric Authentication */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-8 mb-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400">
                    <Fingerprint className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold display-font text-white mb-2">
                      Biometric Authentication
                    </h2>
                    <p className="text-slate-400">
                      Use fingerprint, Face ID, or Windows Hello for secure check-ins
                    </p>
                  </div>
                </div>
              </div>

              {/* Use BiometricSetup component */}
              <BiometricSetup onComplete={() => {
                // Refresh status after setup
                getWebAuthnStatus().then(status => {
                  setBiometricEnabled(status?.hasCredentials || false);
                });
              }} />
            </motion.div>

            {/* Notification Channels */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 mb-8"
            >
              <h2 className="text-2xl font-bold display-font text-white mb-6">
                Notification Channels
              </h2>
              
              <div className="space-y-4">
                {notificationChannels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <motion.div
                      key={channel.id}
                      whileHover={{ x: 2 }}
                      className="glass p-6 rounded-2xl"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${channel.color}`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{channel.label}</h3>
                            <p className="text-sm text-slate-400">{channel.description}</p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => channel.setEnabled(!channel.enabled)}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            channel.enabled ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-slate-700"
                          }`}
                        >
                          <motion.div
                            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                            animate={{ left: channel.enabled ? "32px" : "4px" }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                      
                      {channel.hasInput && channel.enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-14 space-y-3"
                        >
                          <input
                            type="text"
                            value={channel.inputValue}
                            onChange={(e) => channel.setInputValue(e.target.value)}
                            placeholder={channel.inputPlaceholder}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestNotification(channel.id, channel.inputValue || "")}
                            disabled={testingChannel === channel.id || !channel.inputValue}
                            className="w-full"
                          >
                            {testingChannel === channel.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Testing...
                              </>
                            ) : (
                              <>
                                Send Test {channel.id === "email" ? "Email" : channel.id === "sms" ? "SMS" : "Telegram"}
                              </>
                            )}
                          </Button>
                          {testResults[channel.id] && (
                            <p className={`text-xs ${testResults[channel.id].success ? "text-emerald-400" : "text-red-400"}`}>
                              {testResults[channel.id].message}
                            </p>
                          )}
                        </motion.div>
                      )}
                      {!channel.hasInput && channel.enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-14 mt-3"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const recipient = channel.id === "email" ? (user?.email || "") : channel.id === "sms" ? "" : "";
                              if (!recipient) {
                                toast({
                                  title: "Recipient Required",
                                  description: `Please configure your ${channel.id === "email" ? "email address" : "phone number"} first`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              handleTestNotification(channel.id, recipient);
                            }}
                            disabled={testingChannel === channel.id || (channel.id === "email" && !user?.email)}
                            className="w-full"
                          >
                            {testingChannel === channel.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Testing...
                              </>
                            ) : (
                              <>
                                Send Test {channel.id === "email" ? "Email" : "SMS"}
                              </>
                            )}
                          </Button>
                          {testResults[channel.id] && (
                            <p className={`text-xs mt-2 ${testResults[channel.id].success ? "text-emerald-400" : "text-red-400"}`}>
                              {testResults[channel.id].message}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Advanced Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-8 mb-8"
            >
              <h2 className="text-2xl font-bold display-font text-white mb-6">
                Advanced Security
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advancedFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.id}
                      whileHover={{ scale: 1.02 }}
                      className={`glass p-6 rounded-2xl ${
                        feature.premium ? "border border-gradient-to-r from-yellow-400/20 to-orange-400/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} relative`}>
                            <Icon className="w-5 h-5 text-white" />
                            {feature.premium && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {feature.label}
                              {feature.premium && (
                                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-400">
                                  PREMIUM
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-slate-400">{feature.description}</p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => feature.setEnabled(!feature.enabled)}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            feature.enabled ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-slate-700"
                          }`}
                        >
                          <motion.div
                            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                            animate={{ left: feature.enabled ? "32px" : "4px" }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                      
                      {feature.hasInput && feature.enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-14 space-y-3"
                        >
                          <input
                            type="text"
                            value={feature.inputValue}
                            onChange={(e) => feature.setInputValue(e.target.value)}
                            placeholder={feature.inputPlaceholder}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (feature.id === "web3") {
                                handleTestWeb3();
                              } else if (feature.id === "hardware") {
                                handleTestHardware();
                              }
                            }}
                            disabled={!feature.inputValue}
                            className="w-full"
                          >
                            {feature.id === "web3" ? "Test Web3 Signature" : "Test Hardware Ping"}
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Hardware Devices Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
              <HardwareDevices />
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-end"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving || !vaultId}
                className="btn-premium btn-primary px-8 py-4 text-lg flex items-center gap-3"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Settings
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </SidebarInset>

      {/* TOTP Setup Dialog */}
      <Dialog open={totpSetupOpen} onOpenChange={setTotpSetupOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-slate-400">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>
          
          {backupCodes.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm font-semibold text-amber-400 mb-2">
                  ⚠️ Save these backup codes
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-800 rounded"
                    >
                      <code className="text-sm font-mono text-white">{code}</code>
                      <button
                        onClick={() => copyToClipboard(code)}
                        className="p-1 hover:bg-slate-700 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allCodes = backupCodes.join("\n");
                    copyToClipboard(allCodes);
                  }}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Codes
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => setTotpSetupOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {totpQRCode && (
                  <img src={totpQRCode} alt="TOTP QR Code" className="w-48 h-48 border border-slate-700 rounded-lg" />
                )}
                {totpSecret && (
                  <div className="w-full space-y-2">
                    <p className="text-xs text-slate-400">Or enter this secret manually:</p>
                    <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
                      <code className="text-xs font-mono text-white flex-1">{totpSecret}</code>
                      <button
                        onClick={() => copyToClipboard(totpSecret)}
                        className="p-1 hover:bg-slate-700 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter 6-digit code from your app</label>
                <InputOTP
                  maxLength={6}
                  value={totpVerifyToken}
                  onChange={setTotpVerifyToken}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setTotpSetupOpen(false)}>Cancel</Button>
                <Button onClick={handleTOTPEnable} disabled={totpVerifyToken.length !== 6}>
                  Enable 2FA
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* TOTP Disable Dialog */}
      <Dialog open={totpDisableOpen} onOpenChange={setTotpDisableOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-slate-400">
              Please enter your password to confirm you want to disable 2FA.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setTotpDisableOpen(false)}>Cancel</Button>
              <Button
                onClick={handleTOTPDisable}
                disabled={!disablePassword}
                variant="destructive"
              >
                Disable 2FA
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
