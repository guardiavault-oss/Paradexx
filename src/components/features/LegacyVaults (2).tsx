import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Shield,
  Heart,
  Settings,
  Users,
  Clock,
  Activity,
} from "lucide-react";
import { BeneficiaryVisualization } from "./inheritance/BeneficiaryVisualization";
import { EnhancedCheckIn } from "./inheritance/EnhancedCheckIn";
import { GuardianInvitation } from "./inheritance/GuardianInvitation";
import { MultiStageTimelock } from "./inheritance/MultiStageTimelock";
import { VaultHealthDashboard } from "./inheritance/VaultHealthDashboard";

interface LegacyVaultsProps {
  type: "degen" | "regen";
  onClose: () => void;
}

type TabType = "overview" | "beneficiaries" | "guardians" | "timeline" | "checkin";

export function LegacyVaults({ type, onClose }: LegacyVaultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(false);
  
  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";

  // Mock data
  const beneficiaries = [
    {
      id: "1",
      name: "Sarah Chen",
      relationship: "Spouse",
      allocation: 50,
      address: "0x742d35cc6634c0532925a3b844bc9e7fe1e3f4a",
    },
    {
      id: "2",
      name: "Michael Chen",
      relationship: "Son",
      allocation: 30,
      address: "0x8b2a91c4f6e3b7d8a2c5f9e1b4d7a3c6f8e9c1e",
    },
    {
      id: "3",
      name: "Emily Chen",
      relationship: "Daughter",
      allocation: 20,
      address: "0x1a3c5f7d9e2b4c6a8f1d3e5b7c9a2d4f6e8b5d7f",
    },
  ];

  const guardians = [
    {
      id: "g1",
      name: "John Smith",
      email: "john@example.com",
      address: "0x9f3e7d5c1a8b6f4e2d9c7a5b3f1e8d6c4a2b9f7e",
      status: "active" as const,
      trustScore: 95,
      responseTime: 2,
      acceptedAt: new Date("2024-01-15"),
    },
    {
      id: "g2",
      name: "Alice Johnson",
      phone: "+1 (555) 123-4567",
      address: "0x7e5d3c1a9f8b6e4d2c9a7f5b3e1d9c7a5f3e1d9c",
      status: "active" as const,
      trustScore: 88,
      responseTime: 4,
      acceptedAt: new Date("2024-02-20"),
    },
    {
      id: "g3",
      email: "pending@example.com",
      address: "0x3f1e9d7c5a3b1f9e7d5c3a1f9e7d5c3a1f9e7d5c",
      status: "invited" as const,
      invitedAt: new Date("2024-12-01"),
    },
  ];

  const setupSteps = [
    { id: "beneficiaries", label: "Add Beneficiaries", completed: true, description: "Define who inherits your assets" },
    { id: "guardians", label: "Appoint Guardians", completed: true, description: "Select trusted verifiers" },
    { id: "timelock", label: "Configure Timelock", completed: true, description: "Set inactivity period" },
    { id: "checkin", label: "First Check-in", completed: false, description: "Prove you're active" },
    { id: "backup", label: "Backup Plan", completed: false, description: "Set recovery options" },
  ];

  const vaultHealth = 60;

  const handleCheckIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log("Check-in successful");
    }, 2000);
  };

  const handleInviteGuardian = (inviteType: 'email' | 'sms', contact: string) => {
    console.log(`Inviting guardian via ${inviteType}: ${contact}`);
  };

  const handleRemoveGuardian = (guardianId: string) => {
    console.log(`Removing guardian: ${guardianId}`);
  };

  const handleStepClick = (stepId: string) => {
    console.log(`Navigate to step: ${stepId}`);
    // Switch to appropriate tab
    if (stepId === "beneficiaries") setActiveTab("beneficiaries");
    if (stepId === "guardians") setActiveTab("guardians");
    if (stepId === "timelock") setActiveTab("timeline");
    if (stepId === "checkin") setActiveTab("checkin");
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Activity },
    { id: "beneficiaries" as TabType, label: "Beneficiaries", icon: Heart },
    { id: "guardians" as TabType, label: "Guardians", icon: Users },
    { id: "timeline" as TabType, label: "Timeline", icon: Clock },
    { id: "checkin" as TabType, label: "Check-In", icon: Shield },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white pb-24 md:pb-20"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 border border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background: `${accentColor}20`,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                <Heart className="w-6 h-6" style={{ color: accentColor }} />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black uppercase">
                  Legacy Vaults
                </h1>
                <p className="text-xs md:text-sm text-white/50">
                  Digital inheritance platform
                </p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-white/5 border border-white/10"
          >
            <Settings className="w-5 h-5 text-white/70" />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-6 max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-transparent text-white/50 hover:text-white/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <VaultHealthDashboard
                vaultHealth={vaultHealth}
                setupSteps={setupSteps}
                onStepClick={handleStepClick}
              />
            </motion.div>
          )}

          {activeTab === "beneficiaries" && (
            <motion.div
              key="beneficiaries"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <BeneficiaryVisualization
                beneficiaries={beneficiaries}
                ownerName="You"
                onBeneficiaryClick={(beneficiary) => {
                  console.log("Clicked beneficiary:", beneficiary);
                }}
              />
            </motion.div>
          )}

          {activeTab === "guardians" && (
            <motion.div
              key="guardians"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <GuardianInvitation
                guardians={guardians}
                onInvite={handleInviteGuardian}
                onRemove={handleRemoveGuardian}
                loading={loading}
              />
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <MultiStageTimelock
                daysRemaining={25}
                totalDays={30}
                isPaused={false}
                onPause={() => console.log("Pause timeline")}
                onResume={() => console.log("Resume timeline")}
                loading={loading}
              />
            </motion.div>
          )}

          {activeTab === "checkin" && (
            <motion.div
              key="checkin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <EnhancedCheckIn
                onCheckIn={handleCheckIn}
                loading={loading}
                isConnected={true}
                isOnSepolia={true}
                daysRemaining={25}
                checkInStreak={7}
                lastCheckIn={new Date()}
                last90Days={Array.from({ length: 90 }, (_, i) => ({
                  date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                  checkedIn: Math.random() > 0.3,
                }))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
