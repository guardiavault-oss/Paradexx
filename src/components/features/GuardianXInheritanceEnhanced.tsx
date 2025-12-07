/**
 * Enhanced GuardianX Inheritance Component
 * Integrated with GuardiaVault API
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Users,
  Shield,
  Heart,
  Clock,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useVaults, useCheckIn, useCheckInStatus, useCreateVault, useInviteGuardian, useAddBeneficiary } from "../../hooks/useGuardiaVault";
import { toast } from "sonner";
import { CreateVaultModal } from "./CreateVaultModal";
import { AddBeneficiaryModal } from "./AddBeneficiaryModal";
import { AddGuardianModal } from "./AddGuardianModal";

interface GuardianXInheritanceProps {
  type: "degen" | "regen";
  onClose: () => void;
}

export function GuardianXInheritanceEnhanced({
  type,
  onClose,
}: GuardianXInheritanceProps) {
  const isDegen = type === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);

  // Fetch vaults
  const { data: vaultsData, isLoading: vaultsLoading, refetch: refetchVaults } = useVaults();
  const vaults = vaultsData?.vaults || [];
  const guardians = vaultsData?.guardians || [];
  
  const hasVault = vaults.length > 0;
  const primaryVault = vaults[0] || null;

  // Check-in functionality
  const checkInMutation = useCheckIn();
  const { data: checkInStatus } = useCheckInStatus(primaryVault?.id || null);

  // Create vault mutation
  const createVaultMutation = useCreateVault();
  const inviteGuardianMutation = useInviteGuardian();
  const addBeneficiaryMutation = useAddBeneficiary();

  // Get beneficiaries for primary vault
  const beneficiaries = guardians.filter((g: any) => g.role === 'beneficiary') || [];
  const vaultGuardians = guardians.filter((g: any) => g.role === 'guardian' && g.vaultId === primaryVault?.id) || [];

  // Calculate stats
  const vaultStats = primaryVault ? [
    { label: "Status", value: primaryVault.status.toUpperCase() },
    { label: "Beneficiaries", value: beneficiaries.length.toString() },
    { label: "Guardians", value: vaultGuardians.length.toString() },
    { 
      label: "Next Check-In", 
      value: checkInStatus?.daysUntilNext 
        ? `${checkInStatus.daysUntilNext} days`
        : "N/A"
    },
  ] : [
    { label: "Protected Assets", value: "$0" },
    { label: "Beneficiaries", value: "0" },
    { label: "Guardians", value: "0" },
    { label: "Inactivity", value: "N/A" },
  ];

  const handleCheckIn = async () => {
    if (!primaryVault) return;
    
    try {
      await checkInMutation.mutateAsync({
        vaultId: primaryVault.id,
        options: {
          message: "Manual check-in from wallet app",
        },
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateVault = async (params: any) => {
    try {
      await createVaultMutation.mutateAsync(params);
      setShowCreateVault(false);
      await refetchVaults();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAddBeneficiary = async (beneficiary: any) => {
    if (!primaryVault) return;
    
    try {
      await addBeneficiaryMutation.mutateAsync({
        vaultId: primaryVault.id,
        beneficiary,
      });
      setShowAddBeneficiary(false);
      await refetchVaults();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleInviteGuardian = async (guardian: any) => {
    if (!primaryVault) return;
    
    try {
      await inviteGuardianMutation.mutateAsync({
        vaultId: primaryVault.id,
        params: guardian,
      });
      setShowAddGuardian(false);
      await refetchVaults();
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (vaultsLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

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
                <Heart
                  className="w-6 h-6"
                  style={{ color: accentColor }}
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black uppercase">
                  GuardianX
                </h1>
                <p className="text-xs md:text-sm text-white/50">
                  Digital legacy platform
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasVault && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending}
                className="px-4 py-2 rounded-lg font-bold text-sm border"
                style={{
                  borderColor: accentColor,
                  color: accentColor,
                  background: `${accentColor}10`,
                }}
              >
                {checkInMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Check In
                  </>
                )}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/5 border border-white/10"
            >
              <Settings className="w-5 h-5 text-white/70" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Status Banner */}
        {hasVault ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border"
            style={{
              background: primaryVault?.status === 'active' 
                ? "rgba(34, 197, 94, 0.1)"
                : primaryVault?.status === 'warning'
                ? "rgba(251, 146, 60, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              borderColor: primaryVault?.status === 'active'
                ? "rgba(34, 197, 94, 0.3)"
                : primaryVault?.status === 'warning'
                ? "rgba(251, 146, 60, 0.3)"
                : "rgba(239, 68, 68, 0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                primaryVault?.status === 'active' ? 'text-green-400' :
                primaryVault?.status === 'warning' ? 'text-orange-400' :
                'text-red-400'
              }`} />
              <div>
                <div className={`text-sm font-bold ${
                  primaryVault?.status === 'active' ? 'text-green-400' :
                  primaryVault?.status === 'warning' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  Vault {primaryVault?.status === 'active' ? 'Active' : 
                         primaryVault?.status === 'warning' ? 'Warning' : 
                         primaryVault?.status?.toUpperCase()}
                </div>
                <p className="text-xs text-white/60">
                  {primaryVault?.name || 'Inheritance Vault'} • Last check-in: {
                    primaryVault?.lastCheckInAt 
                      ? new Date(primaryVault.lastCheckInAt).toLocaleDateString()
                      : 'Never'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border"
            style={{
              background: "rgba(251, 146, 60, 0.1)",
              borderColor: "rgba(251, 146, 60, 0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-bold text-orange-400 mb-2">
                  No Vault Configured
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateVault(true)}
                  className="px-4 py-2 rounded-lg font-bold text-sm"
                  style={{ background: accentColor }}
                >
                  Create Inheritance Vault
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {vaultStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="text-2xl font-black text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <div className="p-4 md:p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-base font-black uppercase mb-4">
            How GuardianX Works
          </h3>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Set Inactivity Period",
                desc: "Choose how long before vault activates (30, 60, 90, or 180 days)",
              },
              {
                step: 2,
                title: "Add Beneficiaries",
                desc: "Specify who receives your assets and their allocation percentages",
              },
              {
                step: 3,
                title: "Appoint Guardians",
                desc: "Trusted contacts who can verify inactivity and trigger distribution",
              },
              {
                step: 4,
                title: "Stay Active",
                desc: "Regular wallet activity resets the inactivity timer automatically",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{
                    background: `${accentColor}30`,
                    color: accentColor,
                    border: `2px solid ${accentColor}`,
                  }}
                >
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white mb-1">
                    {item.title}
                  </div>
                  <p className="text-xs text-white/60">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Beneficiaries List */}
        {hasVault && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black uppercase">
                Beneficiaries
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddBeneficiary(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm"
                style={{ background: accentColor }}
              >
                <Plus className="w-4 h-4" />
                Add
              </motion.button>
            </div>

            <div className="space-y-3">
              {beneficiaries.length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No beneficiaries added yet</p>
                </div>
              ) : (
                beneficiaries.map((beneficiary: any, index: number) => (
                  <motion.div
                    key={beneficiary.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-lg">
                          {beneficiary.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white">
                              {beneficiary.name || 'Unknown'}
                            </span>
                            {beneficiary.status === 'accepted' && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <div className="text-sm text-white/60">
                            {beneficiary.email}
                          </div>
                        </div>
                      </div>
                      {beneficiary.allocation && (
                        <div
                          className="px-3 py-1.5 rounded-lg font-bold text-sm"
                          style={{
                            background: `${accentColor}20`,
                            color: accentColor,
                          }}
                        >
                          {beneficiary.allocation}%
                        </div>
                      )}
                    </div>

                    {beneficiary.walletAddress && (
                      <div className="pt-3 border-t border-white/10">
                        <div className="text-xs text-white/40 mb-1">
                          Wallet Address
                        </div>
                        <div className="text-sm font-mono text-white/80">
                          {beneficiary.walletAddress.slice(0, 6)}...{beneficiary.walletAddress.slice(-4)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Guardians Section */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users
                className="w-5 h-5"
                style={{ color: accentColor }}
              />
              <h3 className="text-base font-black uppercase">
                Guardians
              </h3>
            </div>
            <span className="text-sm text-white/60">
              {vaultGuardians.filter((g: any) => g.status === 'accepted' || g.status === 'active').length} Active
            </span>
          </div>
          <p className="text-xs text-white/60 mb-3">
            Guardians can verify your inactivity and help
            trigger asset distribution. They cannot access or
            control your funds.
          </p>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddGuardian(true)}
              disabled={!hasVault}
              className="flex-1 py-2 rounded-lg font-bold text-sm border"
              style={{
                borderColor: hasVault ? accentColor : "rgba(255, 255, 255, 0.2)",
                color: hasVault ? accentColor : "rgba(255, 255, 255, 0.4)",
                background: hasVault ? `${accentColor}10` : "transparent",
              }}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Guardian
            </motion.button>
          </div>
        </div>

        {/* Security Note */}
        <div
          className="p-4 rounded-xl border"
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            borderColor: "rgba(59, 130, 246, 0.3)",
          }}
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-blue-400 mb-1">
                Secure & Non-Custodial
              </div>
              <p className="text-xs text-white/60">
                GuardianX uses smart contracts to ensure your
                assets automatically transfer to beneficiaries.
                No one can access your funds until the
                inactivity conditions are met. You remain in
                full control.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateVault && (
        <CreateVaultModal
          isOpen={showCreateVault}
          onClose={() => setShowCreateVault(false)}
          onCreate={handleCreateVault}
          accentColor={accentColor}
        />
      )}

      {showAddBeneficiary && primaryVault && (
        <AddBeneficiaryModal
          isOpen={showAddBeneficiary}
          onClose={() => setShowAddBeneficiary(false)}
          onAdd={handleAddBeneficiary}
          accentColor={accentColor}
        />
      )}

      {showAddGuardian && primaryVault && (
        <AddGuardianModal
          isOpen={showAddGuardian}
          onClose={() => setShowAddGuardian(false)}
          onInvite={handleInviteGuardian}
          accentColor={accentColor}
        />
      )}
    </motion.div>
  );
}

