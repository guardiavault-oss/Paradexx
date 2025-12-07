/**
 * Add Beneficiary Modal
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface AddBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (beneficiary: any) => Promise<void>;
  accentColor: string;
}

export function AddBeneficiaryModal({
  isOpen,
  onClose,
  onAdd,
  accentColor,
}: AddBeneficiaryModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [allocation, setAllocation] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      alert("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        walletAddress: walletAddress.trim() || undefined,
        allocation,
      });
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setWalletAddress("");
      setAllocation(0);
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
          className="relative bg-black border border-white/20 rounded-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black uppercase">Add Beneficiary</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0100"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Wallet Address (optional)</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Allocation %</label>
              <input
                type="number"
                value={allocation}
                onChange={(e) => setAllocation(Number(e.target.value))}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                required
              />
            </div>

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
                {isSubmitting ? "Adding..." : "Add Beneficiary"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

