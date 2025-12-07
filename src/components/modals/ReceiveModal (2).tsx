import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Download, Copy, QrCode, CheckCircle2 } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';

interface ReceiveModalProps {
  type: 'degen' | 'regen';
  onClose: () => void;
}

export function ReceiveModal({ type, onClose }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  // Mock wallet address
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  const handleCopy = async () => {
    const success = await copyToClipboard(walletAddress);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        style={{
          boxShadow: `0 0 60px ${accentColor}40`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Download className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-white">Receive Crypto</h2>
              <p className="text-xs text-white/40">Share your wallet address</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code Section */}
          <div className="flex flex-col items-center">
            {showQR ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-48 h-48 bg-white rounded-xl flex items-center justify-center mb-4"
              >
                {/* Placeholder for QR code - in production, use a QR library */}
                <div className="text-center p-4">
                  <QrCode className="w-full h-full text-black" />
                </div>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => setShowQR(true)}
                className="w-48 h-48 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors flex flex-col items-center justify-center gap-3 mb-4"
              >
                <QrCode className="w-12 h-12 text-white/60" />
                <p className="text-sm text-white/60">Show QR Code</p>
              </motion.button>
            )}

            {showQR && (
              <button
                onClick={() => setShowQR(false)}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Hide QR Code
              </button>
            )}
          </div>

          {/* Address Display */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Your Wallet Address</label>
            <div className="relative">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white break-all text-sm font-mono">
                  {walletAddress}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                style={{
                  backgroundColor: copied ? `${accentColor}20` : undefined,
                }}
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color: accentColor }} />
                ) : (
                  <Copy className="w-5 h-5 text-white/60" />
                )}
              </button>
            </div>
            {copied && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm mt-2"
                style={{ color: accentColor }}
              >
                Address copied to clipboard!
              </motion.p>
            )}
          </div>

          {/* Network Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-blue-400">ℹ</span>
              </div>
              <div>
                <p className="text-sm text-blue-400 mb-1">Important</p>
                <p className="text-xs text-white/60">
                  Only send Ethereum (ETH) and ERC-20 tokens to this address. Sending other assets may result in permanent loss.
                </p>
              </div>
            </div>
          </div>

          {/* Network Selector */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Network</label>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#627EEA]/20 flex items-center justify-center">
                <span className="text-lg">⟠</span>
              </div>
              <div>
                <p className="text-white text-sm">Ethereum Mainnet</p>
                <p className="text-xs text-white/40">ERC-20 Compatible</p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl text-white transition-all"
            style={{ backgroundColor: accentColor }}
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}