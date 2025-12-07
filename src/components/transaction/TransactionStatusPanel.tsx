/**
 * TransactionStatusPanel - Post-Transaction Status Display
 * 
 * Shows transaction states: creating → pending → confirmed → failed
 * With Etherscan link on all completed transactions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2, Check, X, ExternalLink, Copy, Clock,
  AlertTriangle, RefreshCw, ChevronDown, Zap, Shield
} from 'lucide-react';

type TransactionStatus = 'creating' | 'pending' | 'confirmed' | 'failed';

interface TransactionStatusPanelProps {
  status: TransactionStatus;
  txHash?: string;
  chainId?: number;
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  toAmount?: string;
  networkFee?: string;
  serviceFee?: string;
  timestamp?: Date;
  confirmations?: number;
  requiredConfirmations?: number;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
  onViewDetails?: () => void;
  type?: 'degen' | 'regen';
}

const CHAIN_EXPLORERS: Record<number, { name: string; url: string }> = {
  1: { name: 'Etherscan', url: 'https://etherscan.io' },
  10: { name: 'Optimism Explorer', url: 'https://optimistic.etherscan.io' },
  137: { name: 'Polygonscan', url: 'https://polygonscan.com' },
  42161: { name: 'Arbiscan', url: 'https://arbiscan.io' },
  8453: { name: 'BaseScan', url: 'https://basescan.org' },
  43114: { name: 'Snowtrace', url: 'https://snowtrace.io' },
};

export function TransactionStatusPanel({
  status,
  txHash,
  chainId = 1,
  fromToken = 'ETH',
  toToken = 'USDC',
  fromAmount = '1.0',
  toAmount = '3,600',
  networkFee = '0.0012',
  serviceFee = '0.79%',
  timestamp = new Date(),
  confirmations = 0,
  requiredConfirmations = 12,
  errorMessage,
  onRetry,
  onClose,
  onViewDetails,
  type = 'degen',
}: TransactionStatusPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const isDegen = type === 'degen';
  const primaryColor = isDegen ? '#DC143C' : '#0080FF';
  const secondaryColor = isDegen ? '#8B0000' : '#000080';

  const explorer = CHAIN_EXPLORERS[chainId] || CHAIN_EXPLORERS[1];

  // Timer for pending transactions
  useEffect(() => {
    if (status === 'pending' || status === 'creating') {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const explorerUrl = txHash ? `${explorer.url}/tx/${txHash}` : undefined;

  const getStatusConfig = () => {
    switch (status) {
      case 'creating':
        return {
          icon: Loader2,
          color: primaryColor,
          bgColor: `${primaryColor}10`,
          borderColor: `${primaryColor}30`,
          title: 'Creating Transaction',
          subtitle: 'Preparing your transaction...',
          animate: true,
        };
      case 'pending':
        return {
          icon: Clock,
          color: '#FFC107',
          bgColor: 'rgba(255, 193, 7, 0.1)',
          borderColor: 'rgba(255, 193, 7, 0.3)',
          title: 'Transaction Pending',
          subtitle: 'Waiting for confirmation...',
          animate: true,
        };
      case 'confirmed':
        return {
          icon: Check,
          color: '#00FF88',
          bgColor: 'rgba(0, 255, 136, 0.1)',
          borderColor: 'rgba(0, 255, 136, 0.3)',
          title: 'Transaction Confirmed',
          subtitle: 'Your transaction was successful!',
          animate: false,
        };
      case 'failed':
        return {
          icon: X,
          color: '#FF3B3B',
          bgColor: 'rgba(255, 59, 59, 0.1)',
          borderColor: 'rgba(255, 59, 59, 0.3)',
          title: 'Transaction Failed',
          subtitle: 'Something went wrong',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className="bg-black/40 backdrop-blur-xl rounded-2xl border overflow-hidden"
      style={{ borderColor: config.borderColor }}
    >
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{
          background: config.bgColor,
          borderColor: config.borderColor,
        }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={config.animate ? { rotate: 360 } : {}}
            transition={config.animate ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
            className="p-3 rounded-full"
            style={{ background: config.bgColor }}
          >
            <Icon className="w-8 h-8" style={{ color: config.color }} />
          </motion.div>
          <div className="flex-1">
            <h3
              className="text-lg font-black uppercase tracking-tight"
              style={{ color: config.color }}
            >
              {config.title}
            </h3>
            <p className="text-sm text-white/50">{config.subtitle}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          )}
        </div>

        {/* Progress bar for pending */}
        {status === 'pending' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-white/50 mb-2">
              <span>Confirmations: {confirmations}/{requiredConfirmations}</span>
              <span>Elapsed: {formatTime(elapsedTime)}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: config.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(confirmations / requiredConfirmations) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Transaction Summary */}
      <div className="p-4">
        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl mb-3 border border-white/10">
          <div className="text-center flex-1">
            <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Sent</p>
            <p className="text-white font-black">{fromAmount} {fromToken}</p>
          </div>
          <div className="px-4">
            <motion.div
              animate={status === 'pending' ? { x: [0, 5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Zap className="w-5 h-5" style={{ color: primaryColor }} />
            </motion.div>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Received</p>
            <p className="text-green-400 font-black">{toAmount} {toToken}</p>
          </div>
        </div>

        {/* Transaction Hash */}
        {txHash && (
          <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl mb-3 border border-white/10">
            <span className="text-xs text-white/40 uppercase tracking-wider">Tx Hash:</span>
            <span className="text-xs text-white font-mono flex-1 truncate">
              {txHash}
            </span>
            <button
              onClick={handleCopyTxHash}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/50" />
              )}
            </button>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4" style={{ color: primaryColor }} />
              </a>
            )}
          </div>
        )}

        {/* Expandable Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-3 bg-black/40 rounded-xl hover:bg-white/5 transition-colors border border-white/10"
        >
          <span className="text-sm text-white/50 uppercase tracking-wider">Transaction Details</span>
          <motion.div
            animate={{ rotate: showDetails ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-white/40" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2">
                <DetailRow label="Network Fee" value={`${networkFee} ETH`} />
                <DetailRow label="Service Fee" value={serviceFee} />
                <DetailRow label="Chain" value={explorer.name} />
                <DetailRow label="Time" value={timestamp.toLocaleString()} />
                {status === 'confirmed' && (
                  <DetailRow label="Block Confirmations" value={`${confirmations} blocks`} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {status === 'failed' && errorMessage && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400 font-bold uppercase tracking-wider">Error Details</p>
                <p className="text-xs text-red-300/80 mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          {status === 'failed' && onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-black uppercase tracking-wider transition-all hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: `0 0 20px ${primaryColor}40`,
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          {status === 'confirmed' && explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-black uppercase tracking-wider transition-all hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: `0 0 20px ${primaryColor}40`,
              }}
            >
              <ExternalLink className="w-4 h-4" />
              View on {explorer.name}
            </a>
          )}

          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider rounded-xl transition-all border border-white/10"
            >
              View Details
            </button>
          )}
        </div>

        {/* Success Next Steps */}
        {status === 'confirmed' && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-xs text-green-400">
              ✓ Transaction confirmed! Your {toToken} balance has been updated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/40 uppercase tracking-wider text-xs">{label}</span>
      <span className="text-white font-bold">{value}</span>
    </div>
  );
}

// Compact status badge for inline use
export function TransactionStatusBadge({
  status,
  size = 'md',
  type = 'degen',
}: {
  status: TransactionStatus;
  size?: 'sm' | 'md';
  type?: 'degen' | 'regen';
}) {
  const isDegen = type === 'degen';
  const primaryColor = isDegen ? '#DC143C' : '#0080FF';

  const getConfig = () => {
    switch (status) {
      case 'creating':
        return { icon: Loader2, color: primaryColor, label: 'Creating', animate: true };
      case 'pending':
        return { icon: Clock, color: '#FFC107', label: 'Pending', animate: true };
      case 'confirmed':
        return { icon: Check, color: '#00FF88', label: 'Confirmed', animate: false };
      case 'failed':
        return { icon: X, color: '#FF3B3B', label: 'Failed', animate: false };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-3 py-1 text-xs gap-1.5';

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center ${sizeClasses} rounded-full font-black uppercase tracking-wider`}
      style={{
        background: `${config.color}20`,
        color: config.color,
      }}
    >
      <motion.span
        animate={config.animate ? { rotate: 360 } : {}}
        transition={config.animate ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
      >
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </motion.span>
      {config.label}
    </motion.span>
  );
}

export default TransactionStatusPanel;
