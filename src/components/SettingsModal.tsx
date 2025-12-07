import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
import {
  X,
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
  Users,
  ArrowUpRight,
  Activity,
  TrendingUp,
  Network,
  CreditCard,
  Image,
  Target,
  Flame,
  Waves,
  Gift,
  Trophy,
  ShieldCheck,
  Vault,
  Zap,
  Globe,
  ChevronRight,
  Smartphone,
  Palette,
  AlertTriangle,
  Download,
  FileText,
  Trash2,
  Camera,
  Upload,
  Clock,
  Key,
  LogOut,
  Mail,
  Fingerprint
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface SettingsModalProps {
  type: "degen" | "regen";
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

type Tab = "general" | "features" | "security" | "account" | "notifications";

export default function SettingsModal({ type, isOpen, onClose, onLogout, onNavigate }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);

  // Local state for settings
  const [currentMode, setCurrentMode] = useState(type);
  const [username, setUsername] = useState("ParadexUser");
  const [privacyLevel, setPrivacyLevel] = useState<"public" | "friends" | "private">("public");
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoLock, setAutoLock] = useState("15");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);

  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Use design system theme styles
  const theme = getThemeStyles(currentMode);
  const accentColor = theme.primaryColor;
  const secondaryColor = theme.secondaryColor;

  const seedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  const handleCopySeed = () => {
    navigator.clipboard.writeText(seedPhrase);
    setCopiedSeed(true);
    toast.success("Recovery phrase copied to clipboard");
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const handleSwitchMode = (mode: "degen" | "regen") => {
    setCurrentMode(mode);
    toast.success(`Switched to ${mode === "degen" ? "Degen" : "Regen"} Mode`);
  };

  const handleSavePassword = () => {
    if (!oldPassword || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Password updated successfully");
    setShowPasswordChange(false);
    setOldPassword("");
    setNewPassword("");
  };

  const handleProfileUpload = () => {
    toast.success("Profile picture updated");
  };

  const handleFeatureNavigate = (feature: string) => {
    onNavigate?.(feature);
    onClose();
  };

  // Feature lists
  const degenFeatures = [
    { id: "sniper", icon: Target, label: "Sniper Bot", description: "AI token discovery" },
    { id: "meme-scanner", icon: Flame, label: "Meme Scanner", description: "Trending tokens" },
    { id: "whale-tracker", icon: Waves, label: "Whale Tracker", description: "Track whales" },
    { id: "airdrops", icon: Gift, label: "Airdrop Hunter", description: "Find airdrops" },
    { id: "leaderboard", icon: Trophy, label: "Leaderboard", description: "Compete" },
  ];

  const regenFeatures = [
    { id: "inheritance", icon: Shield, label: "Legacy Vaults", description: "Digital legacy" },
    { id: "recovery", icon: Lock, label: "Social Recovery", description: "Guardian backup" },
    { id: "mev", icon: Zap, label: "MEV Protection", description: "Frontrun shield" },
    { id: "security", icon: ShieldCheck, label: "Security Center", description: "Full security" },
  ];

  const universalFeatures = [
    { id: "bridge", icon: Network, label: "Bridge", description: "Cross-chain" },
    { id: "analytics", icon: TrendingUp, label: "Analytics", description: "Portfolio insights" },
    { id: "buy", icon: CreditCard, label: "Buy Crypto", description: "Fiat on-ramp" },
    { id: "nft", icon: Image, label: "NFT Gallery", description: "View NFTs" },
    { id: "activity", icon: Activity, label: "Activity", description: "Transactions" },
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[var(--bg-base)] z-[var(--z-modal)] overflow-y-auto pb-20"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 backdrop-blur-xl border-b"
        style={{
          background: "var(--bg-surface)",
          borderColor: `${accentColor}20`,
        }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl"
                style={{
                  background: "var(--bg-hover)",
                  border: `1px solid var(--border-neutral)`,
                }}
                title="Close settings"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" style={{ color: accentColor }} />
              </motion.button>
              <div>
                <h2 className="text-[var(--text-primary)] font-bold text-[var(--text-lg)]">Settings</h2>
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                  {isDegen ? "Degen" : "Regen"} Mode Active
                </p>
              </div>
            </div>

            <div
              className="px-3 py-1.5 rounded-full text-xs font-mono"
              style={{
                background: `${accentColor}20`,
                color: accentColor,
              }}
            >
              v1.2.0
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide pb-2">
            {[
              { id: "general", label: "General", icon: SettingsIcon },
              { id: "features", label: "Features", icon: Globe },
              { id: "security", label: "Security", icon: Shield },
              { id: "notifications", label: "Notifs", icon: Bell },
              { id: "account", label: "Account", icon: User },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as Tab)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all"
                style={{
                  background: activeTab === tab.id ? `linear-gradient(135deg, ${accentColor}40 0%, ${accentColor}20 100%)` : "var(--bg-hover)",
                  border: `1px solid ${activeTab === tab.id ? accentColor : "var(--border-neutral)"}`,
                  color: activeTab === tab.id ? accentColor : "var(--text-tertiary)",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 space-y-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">

          {/* General Tab */}
          {activeTab === "general" && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Wallet Mode Switching */}
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-neutral)",
                }}
              >
                <h3 className="text-[var(--text-primary)] font-semibold mb-4 text-[var(--text-lg)]">Tribe Selection</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleSwitchMode("degen")}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-all"
                    style={{
                      background: isDegen ? `linear-gradient(135deg, ${accentColor}40 0%, ${accentColor}20 100%)` : "var(--bg-hover)",
                      border: `1px solid ${isDegen ? accentColor : "var(--border-neutral)"}`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-[#DC143C]/20">
                        <Flame className="w-6 h-6 text-[#ff3366]" />
                      </div>
                      <div className="text-left">
                        <div className="text-[var(--text-primary)] font-bold">Degen Tribe</div>
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">High risk, leverage, apeing</div>
                      </div>
                    </div>
                    {isDegen && <Check className="w-6 h-6 text-[#ff3366]" />}
                  </button>

                  <button
                    onClick={() => handleSwitchMode("regen")}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-all"
                    style={{
                      background: !isDegen ? "linear-gradient(135deg, rgba(0, 128, 255, 0.2), rgba(0,0,0,0))" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${!isDegen ? "#0080FF" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-[#0080FF]/20">
                        <Shield className="w-6 h-6 text-[#00d4ff]" />
                      </div>
                      <div className="text-left">
                        <div className="text-[var(--text-primary)] font-bold">Regen Tribe</div>
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">Safety, yield, governance</div>
                      </div>
                    </div>
                    {!isDegen && <Check className="w-6 h-6 text-[#00d4ff]" />}
                  </button>
                </div>
              </div>

              {/* Appearance */}
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-neutral)",
                }}
              >
                <h3 className="text-[var(--text-primary)] font-semibold mb-4">App Preferences</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-[var(--text-primary)]/70" />
                      <span className="text-sm text-[var(--text-primary)]">Theme</span>
                    </div>
                    <span className="text-xs text-[var(--text-primary)]/50 bg-white/10 px-2 py-1 rounded">Dark Mode</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-[var(--text-primary)]/70" />
                      <span className="text-sm text-[var(--text-primary)]">Language</span>
                    </div>
                    <span className="text-xs text-[var(--text-primary)]/50 bg-white/10 px-2 py-1 rounded">English</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Password Change */}
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-neutral)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[var(--text-primary)] font-semibold">Password & Authentication</h3>
                  <Key className="w-5 h-5 text-[var(--text-primary)]/50" />
                </div>

                {!showPasswordChange ? (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="w-full py-3 rounded-xl font-medium transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white"
                    }}
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-[var(--bg-base)]/50 border border-[var(--border-neutral)]/10 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-neutral)]/30"
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[var(--bg-base)]/50 border border-[var(--border-neutral)]/10 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-neutral)]/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPasswordChange(false)}
                        className="flex-1 py-3 rounded-xl font-medium bg-white/10 text-[var(--text-primary)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePassword}
                        className="flex-1 py-3 rounded-xl font-medium text-[var(--text-primary)]"
                        style={{ background: colors.primary }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2FA & Biometrics */}
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-neutral)",
                }}
              >
                <h3 className="text-[var(--text-primary)] font-semibold mb-4">Two-Factor Authentication</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-[var(--text-primary)]/70" />
                      <div>
                        <div className="text-[var(--text-primary)] text-sm">Authenticator App</div>
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">Google Auth, Authy</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTwoFactor(!twoFactor);
                        toast.success(twoFactor ? "2FA Disabled" : "2FA Enabled");
                      }}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors ${twoFactor ? "" : "bg-white/10"}`}
                      style={{ background: twoFactor ? colors.primary : undefined }}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${twoFactor ? "translate-x-6" : ""}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="w-5 h-5 text-[var(--text-primary)]/70" />
                      <div>
                        <div className="text-[var(--text-primary)] text-sm">Biometrics</div>
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">FaceID / TouchID</div>
                      </div>
                    </div>
                    <div className="text-xs text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Enabled
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto Lock */}
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-neutral)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[var(--text-primary)] font-semibold">Auto-Lock Timer</h3>
                  <Clock className="w-5 h-5 text-[var(--text-primary)]/50" />
                </div>
                <select
                  value={autoLock}
                  onChange={(e) => {
                    setAutoLock(e.target.value);
                    toast.success("Auto-lock timer updated");
                  }}
                  className="w-full bg-[var(--bg-base)]/50 border border-[var(--border-neutral)]/10 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="0">Immediately</option>
                  <option value="1">After 1 minute</option>
                  <option value="5">After 5 minutes</option>
                  <option value="15">After 15 minutes</option>
                  <option value="60">After 1 hour</option>
                </select>
              </div>

              {/* Recovery Phrase */}
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: "rgba(255, 51, 102, 0.05)",
                  borderColor: "rgba(255, 51, 102, 0.2)",
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-[#ff3366]" />
                  <div>
                    <h3 className="text-[var(--text-primary)] mb-1">Recovery Phrase</h3>
                    <p className="text-xs text-[var(--text-primary)]/70">
                      Never share your recovery phrase with anyone.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                  className="w-full p-3 rounded-xl flex items-center justify-between mb-3 bg-[var(--bg-base)]/40 border border-[var(--border-neutral)]/10"
                >
                  <span className="text-sm text-[var(--text-primary)]">
                    {showSeedPhrase ? "Hide" : "Show"} Phrase
                  </span>
                  {showSeedPhrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {showSeedPhrase && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <div className="p-4 rounded-xl mb-3 bg-[var(--bg-base)]/60 border border-[var(--border-neutral)]/10 font-mono text-sm text-[var(--text-primary)]/80">
                      {seedPhrase}
                    </div>
                    <button
                      onClick={handleCopySeed}
                      className="w-full p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-[var(--text-primary)] transition-all hover:opacity-90"
                      style={{ background: colors.primary }}
                    >
                      {copiedSeed ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedSeed ? "Copied" : "Copy to Clipboard"}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Profile Section */}
              <div
                className="p-5 rounded-2xl border flex flex-col items-center text-center"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-neutral)",
                }}
              >
                <div className="relative mb-4 group cursor-pointer" onClick={handleProfileUpload}>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center overflow-hidden border-2 border-[var(--border-neutral)]/10">
                    <User className="w-10 h-10 text-[var(--text-primary)]/50" />
                  </div>
                  <div className="absolute inset-0 bg-[var(--bg-base)]/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-[var(--text-primary)]" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{username}</h3>
                <p className="text-sm text-[var(--text-primary)]/50 mb-4">{currentMode === 'degen' ? 'Degen Elite' : 'Regen Guardian'}</p>

                <button
                  className="px-4 py-2 rounded-lg bg-white/5 border border-[var(--border-neutral)]/10 text-sm text-[var(--text-primary)] hover:bg-white/10 transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              {/* Privacy Level */}
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-neutral)",
                }}
              >
                <h3 className="text-[var(--text-primary)] font-semibold mb-4">Privacy Level</h3>
                <div className="space-y-3">
                  {['public', 'friends', 'private'].map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setPrivacyLevel(level as any);
                        toast.success(`Privacy set to ${level}`);
                      }}
                      className="w-full p-3 rounded-xl flex items-center justify-between transition-all"
                      style={{
                        background: privacyLevel === level ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.2)",
                        border: `1px solid ${privacyLevel === level ? colors.primary : "transparent"}`,
                      }}
                    >
                      <div className="capitalize text-[var(--text-primary)]">{level}</div>
                      {privacyLevel === level && <Check className="w-4 h-4" style={{ color: accentColor }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Actions */}
              <div className="space-y-3">
                <button className="w-full p-4 rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 flex items-center justify-between text-[var(--text-primary)] hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5" />
                    Export Account Data
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50" />
                </button>
                <button className="w-full p-4 rounded-xl border border-[var(--border-neutral)]/10 bg-white/5 flex items-center justify-between text-[var(--text-primary)] hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    Privacy Policy
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50" />
                </button>
              </div>

              {/* Danger Zone */}
              <button
                onClick={onLogout}
                className="w-full p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-neutral)",
                }}
              >
                <h3 className="text-[var(--text-primary)] font-semibold mb-4">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-[var(--text-primary)]/70" />
                      <div>
                        <div className="text-[var(--text-primary)] text-sm">Push Notifications</div>
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">Alerts on your device</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPushEnabled(!pushEnabled);
                        toast.success(`Push notifications ${!pushEnabled ? 'enabled' : 'disabled'}`);
                      }}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors ${pushEnabled ? "" : "bg-white/10"}`}
                      style={{ background: pushEnabled ? colors.primary : undefined }}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${pushEnabled ? "translate-x-6" : ""}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-[var(--text-primary)]/70" />
                      <div>
                        <div className="text-[var(--text-primary)] text-sm">Email Notifications</div>
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">Weekly digests & security</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEmailEnabled(!emailEnabled);
                        toast.success(`Email notifications ${!emailEnabled ? 'enabled' : 'disabled'}`);
                      }}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors ${emailEnabled ? "" : "bg-white/10"}`}
                      style={{ background: emailEnabled ? colors.primary : undefined }}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${emailEnabled ? "translate-x-6" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: "var(--bg-hover)",
                  borderColor: "var(--border-neutral)",
                }}
              >
                <h3 className="text-[var(--text-primary)] font-semibold mb-4">Alert Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-[var(--text-primary)]/70" />
                      <div className="text-[var(--text-primary)] text-sm">Price Volatility</div>
                    </div>
                    <button
                      onClick={() => setPriceAlerts(!priceAlerts)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors ${priceAlerts ? "" : "bg-white/10"}`}
                      style={{ background: priceAlerts ? colors.primary : undefined }}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${priceAlerts ? "translate-x-6" : ""}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-[var(--text-primary)]/70" />
                      <div className="text-[var(--text-primary)] text-sm">Transaction Success</div>
                    </div>
                    <div className="text-xs text-green-400">Always On</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Features Tab */}
          {activeTab === "features" && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h3 className="text-[var(--text-primary)] font-semibold pl-1">
                {currentMode === 'degen' ? 'Degen Arsenal' : 'Regen Tools'}
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {(currentMode === 'degen' ? degenFeatures : regenFeatures).map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureNavigate(feature.id)}
                    className="w-full p-4 rounded-xl flex items-center justify-between group transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-lg transition-colors group-hover:scale-110 duration-200"
                        style={{ background: `${colors.primary}20` }}
                      >
                        <feature.icon className="w-5 h-5" style={{ color: accentColor }} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[${colors.primary}] transition-colors">
                          {feature.label}
                        </div>
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">{feature.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/30 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}