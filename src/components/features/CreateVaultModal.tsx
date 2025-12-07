/**
 * Create Vault Modal
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Trash2 } from "lucide-react";
import { CreateVaultParams } from "../../services/guardiavault-api.service";

interface CreateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: CreateVaultParams) => Promise<void>;
  accentColor: string;
}

export function CreateVaultModal({
  isOpen,
  onClose,
  onCreate,
  accentColor,
}: CreateVaultModalProps) {
  const [name, setName] = useState("");
  const [checkInIntervalDays, setCheckInIntervalDays] = useState(90);
  const [gracePeriodDays, setGracePeriodDays] = useState(14);
  const [guardians, setGuardians] = useState<Array<{ name: string; email: string; phone?: string }>>([
    { name: "", email: "" },
  ]);
  const [beneficiaries, setBeneficiaries] = useState<Array<{
    name: string;
    email: string;
    phone?: string;
    walletAddress?: string;
    allocation: number;
  }>>([
    { name: "", email: "", allocation: 100 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddGuardian = () => {
    setGuardians([...guardians, { name: "", email: "" }]);
  };

  const handleRemoveGuardian = (index: number) => {
    setGuardians(guardians.filter((_, i) => i !== index));
  };

  const handleGuardianChange = (index: number, field: string, value: string) => {
    const updated = [...guardians];
    updated[index] = { ...updated[index], [field]: value };
    setGuardians(updated);
  };

  const handleAddBeneficiary = () => {
    setBeneficiaries([...beneficiaries, { name: "", email: "", allocation: 0 }]);
  };

  const handleRemoveBeneficiary = (index: number) => {
    setBeneficiaries(beneficiaries.filter((_, i) => i !== index));
  };

  const handleBeneficiaryChange = (index: number, field: string, value: string | number) => {
    const updated = [...beneficiaries];
    updated[index] = { ...updated[index], [field]: value };
    setBeneficiaries(updated);
  };

  const validateForm = () => {
    if (!name.trim()) {
      return "Vault name is required";
    }
    if (guardians.length < 2) {
      return "At least 2 guardians are required";
    }
    if (guardians.some(g => !g.name.trim() || !g.email.trim())) {
      return "All guardians must have a name and email";
    }
    if (beneficiaries.length === 0) {
      return "At least one beneficiary is required";
    }
    if (beneficiaries.some(b => !b.name.trim() || !b.email.trim())) {
      return "All beneficiaries must have a name and email";
    }
    const totalAllocation = beneficiaries.reduce((sum, b) => sum + (b.allocation || 0), 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return `Total allocation must equal 100% (currently ${totalAllocation}%)`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        name,
        checkInIntervalDays,
        gracePeriodDays,
        guardians: guardians.filter(g => g.name.trim() && g.email.trim()),
        beneficiaries: beneficiaries.filter(b => b.name.trim() && b.email.trim()),
      });
      // Reset form
      setName("");
      setCheckInIntervalDays(90);
      setGracePeriodDays(14);
      setGuardians([{ name: "", email: "" }]);
      setBeneficiaries([{ name: "", email: "", allocation: 100 }]);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-black border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black uppercase">Create Inheritance Vault</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vault Name */}
            <div>
              <label className="block text-sm font-bold mb-2">Vault Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Inheritance Vault"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                required
              />
            </div>

            {/* Check-in Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Check-in Interval (days)</label>
                <select
                  value={checkInIntervalDays}
                  onChange={(e) => setCheckInIntervalDays(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-white/40"
                >
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                  <option value={365}>365 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Grace Period (days)</label>
                <select
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-white/40"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
              </div>
            </div>

            {/* Guardians */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold">Guardians (minimum 2)</label>
                <button
                  type="button"
                  onClick={handleAddGuardian}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold"
                  style={{ background: `${accentColor}20`, color: accentColor }}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {guardians.map((guardian, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={guardian.name}
                      onChange={(e) => handleGuardianChange(index, "name", e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={guardian.email}
                      onChange={(e) => handleGuardianChange(index, "email", e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                      required
                    />
                    {guardians.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGuardian(index)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Beneficiaries */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold">Beneficiaries</label>
                <button
                  type="button"
                  onClick={handleAddBeneficiary}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold"
                  style={{ background: `${accentColor}20`, color: accentColor }}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {beneficiaries.map((beneficiary, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={beneficiary.name}
                        onChange={(e) => handleBeneficiaryChange(index, "name", e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={beneficiary.email}
                        onChange={(e) => handleBeneficiaryChange(index, "email", e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                        required
                      />
                      <input
                        type="number"
                        placeholder="%"
                        min="0"
                        max="100"
                        value={beneficiary.allocation}
                        onChange={(e) => handleBeneficiaryChange(index, "allocation", Number(e.target.value))}
                        className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                        required
                      />
                      {beneficiaries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBeneficiary(index)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Wallet Address (optional)"
                      value={beneficiary.walletAddress || ""}
                      onChange={(e) => handleBeneficiaryChange(index, "walletAddress", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/40 mt-2">
                Total allocation: {beneficiaries.reduce((sum, b) => sum + (b.allocation || 0), 0)}%
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg font-bold border border-white/20 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg font-bold text-white"
                style={{ background: isSubmitting ? `${accentColor}60` : accentColor }}
              >
                {isSubmitting ? "Creating..." : "Create Vault"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

