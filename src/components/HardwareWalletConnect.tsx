import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { X, Shield, Usb, ChevronRight } from "lucide-react";

interface HardwareWalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
  type: "degen" | "regen";
}

export function HardwareWalletConnect({
  isOpen,
  onClose,
  type,
}: HardwareWalletConnectProps) {
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg rounded-2xl z-[70] max-h-[90vh] overflow-y-auto"
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          border: `1px solid ${primaryColor}40`,
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: `${primaryColor}20` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `${primaryColor}20` }}>
                <Shield className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-sm text-white">Hardware Wallet</h2>
                <p className="text-xs text-white/60">Maximum Security</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl text-white mb-2">Connect Hardware Wallet</h2>
          <p className="text-sm text-white/60 mb-6">Choose your hardware wallet type</p>

          <div className="space-y-3">
            {/* Ledger */}
            <button
              className="w-full p-4 rounded-xl border-2 transition-all text-left group"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderColor: `${primaryColor}40`,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${primaryColor}20` }}>
                  <Shield className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white mb-1">Ledger</div>
                  <p className="text-xs text-white/60">Nano S, Nano S Plus, Nano X</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              </div>
            </button>

            {/* Trezor */}
            <button
              className="w-full p-4 rounded-xl border-2 transition-all text-left group"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderColor: `${primaryColor}40`,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white mb-1">Trezor</div>
                  <p className="text-xs text-white/60">Model One, Model T</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              </div>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-xl" style={{ background: `${primaryColor}20`, border: `1px solid ${primaryColor}40` }}>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
              <div className="text-xs text-white leading-relaxed">
                <strong style={{ color: primaryColor }}>Maximum Security:</strong>{" "}
                Hardware wallets keep your private keys offline, protecting you from malware and phishing attacks.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
