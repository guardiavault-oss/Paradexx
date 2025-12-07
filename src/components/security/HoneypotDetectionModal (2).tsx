import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Info, ExternalLink, Shield, TrendingDown } from 'lucide-react';

interface HoneypotDetectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  tokenSymbol?: string;
  tokenName?: string;
  contractAddress?: string;
  honeypotDetails?: {
    canSell: boolean;
    buyTax: number;
    sellTax: number;
    transferTax: number;
    isHoneypot: boolean;
    honeypotReason?: string;
  };
  type?: 'degen' | 'regen';
}

export function HoneypotDetectionModal({
  isVisible,
  onClose,
  tokenSymbol = 'SCAM',
  tokenName = 'Unknown Token',
  contractAddress = '0x...',
  honeypotDetails = {
    canSell: false,
    buyTax: 5,
    sellTax: 99,
    transferTax: 50,
    isHoneypot: true,
    honeypotReason: 'Cannot sell - honeypot detected',
  },
  type = 'degen',
}: HoneypotDetectionModalProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const riskLevel =
    honeypotDetails.isHoneypot || !honeypotDetails.canSell
      ? 'EXTREME'
      : honeypotDetails.sellTax > 50
      ? 'HIGH'
      : honeypotDetails.sellTax > 20
      ? 'MEDIUM'
      : 'LOW';

  const riskColor =
    riskLevel === 'EXTREME'
      ? 'red'
      : riskLevel === 'HIGH'
      ? 'orange'
      : riskLevel === 'MEDIUM'
      ? 'yellow'
      : 'green';

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-black/95 backdrop-blur-xl rounded-2xl border-2 overflow-hidden shadow-2xl"
            style={{
              borderColor: `${riskColor === 'red' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(251, 146, 60, 0.5)'}`,
              boxShadow: `0 0 60px ${riskColor === 'red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 146, 60, 0.3)'}`,
            }}
          >
            {/* Animated Border */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                border: `2px solid ${riskColor === 'red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 146, 60, 0.3)'}`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />

            {/* Header */}
            <div
              className="p-6 border-b border-white/10 relative"
              style={{
                background: `linear-gradient(135deg, ${
                  riskColor === 'red' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 146, 60, 0.2)'
                } 0%, rgba(0, 0, 0, 0.2) 100%)`,
              }}
            >
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <motion.div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border`}
                    style={{
                      background: `${riskColor === 'red' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 146, 60, 0.2)'}`,
                      borderColor: `${riskColor === 'red' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 146, 60, 0.4)'}`,
                    }}
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <AlertTriangle
                      className="w-8 h-8"
                      style={{
                        color: riskColor === 'red' ? '#ef4444' : '#fb923c',
                      }}
                    />
                  </motion.div>
                  <div>
                    <h2
                      className="text-2xl font-black uppercase tracking-tight mb-1"
                      style={{
                        color: riskColor === 'red' ? '#ef4444' : '#fb923c',
                      }}
                    >
                      🍯 Honeypot Detected
                    </h2>
                    <p className="text-sm text-white/50 uppercase tracking-wider">
                      {riskLevel} Risk Token
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Token Info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    {tokenSymbol}
                  </h3>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider"
                    style={{
                      background: `${riskColor === 'red' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 146, 60, 0.2)'}`,
                      color: riskColor === 'red' ? '#ef4444' : '#fb923c',
                      border: `1px solid ${riskColor === 'red' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 146, 60, 0.4)'}`,
                    }}
                  >
                    {riskLevel} RISK
                  </span>
                </div>
                <p className="text-sm text-white/70 mb-3">{tokenName}</p>
                <div className="p-3 bg-black/60 border border-white/10 rounded-xl flex items-center gap-3">
                  <code className="text-xs text-white/50 font-mono break-all flex-1">
                    {contractAddress}
                  </code>
                  <ExternalLink className="w-4 h-4 text-white/30 flex-shrink-0" />
                </div>
              </div>

              {/* Main Warning */}
              {honeypotDetails.isHoneypot && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex gap-3">
                    <Shield className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-100 font-bold mb-2">
                        ⚠️ HONEYPOT DETECTED - DO NOT BUY
                      </p>
                      <p className="text-xs text-red-200/80">
                        {honeypotDetails.honeypotReason ||
                          'This token cannot be sold. You will lose your funds!'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Analysis */}
              <div>
                <label className="text-xs text-white/50 mb-3 block uppercase tracking-wider font-bold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Tax Analysis
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">
                      Buy Tax
                    </p>
                    <p
                      className={`text-xl font-black ${
                        honeypotDetails.buyTax > 10
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {honeypotDetails.buyTax}%
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">
                      Sell Tax
                    </p>
                    <p
                      className={`text-xl font-black ${
                        honeypotDetails.sellTax > 20
                          ? 'text-red-400'
                          : honeypotDetails.sellTax > 10
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {honeypotDetails.sellTax}%
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">
                      Transfer
                    </p>
                    <p
                      className={`text-xl font-black ${
                        honeypotDetails.transferTax > 10
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {honeypotDetails.transferTax}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Sell Ability */}
              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div
                  className={`w-3 h-3 rounded-full ${
                    honeypotDetails.canSell ? 'bg-green-400' : 'bg-red-400'
                  }`}
                  style={{
                    boxShadow: honeypotDetails.canSell
                      ? '0 0 10px rgba(74, 222, 128, 0.5)'
                      : '0 0 10px rgba(239, 68, 68, 0.5)',
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">
                    {honeypotDetails.canSell ? 'Can Sell' : 'Cannot Sell'}
                  </p>
                  <p className="text-xs text-white/50">
                    {honeypotDetails.canSell
                      ? 'Selling is enabled but check taxes'
                      : 'CRITICAL: You will not be able to sell this token'}
                  </p>
                </div>
              </div>

              {/* Warning Signs */}
              <div>
                <label className="text-xs text-white/50 mb-3 block uppercase tracking-wider font-bold flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Red Flags
                </label>
                <div className="space-y-2">
                  {[
                    {
                      condition: !honeypotDetails.canSell,
                      text: '🚨 Selling disabled - HONEYPOT',
                    },
                    {
                      condition: honeypotDetails.sellTax > 50,
                      text: '⚠️ Extremely high sell tax',
                    },
                    {
                      condition: honeypotDetails.buyTax > 10,
                      text: '⚠️ High buy tax detected',
                    },
                    {
                      condition: honeypotDetails.transferTax > 10,
                      text: '⚠️ High transfer tax',
                    },
                    {
                      condition:
                        honeypotDetails.sellTax - honeypotDetails.buyTax > 20,
                      text: '⚠️ Large difference between buy/sell tax',
                    },
                  ]
                    .filter((item) => item.condition)
                    .map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 text-sm text-red-200 p-2 bg-red-500/5 rounded-lg border border-red-500/20"
                      >
                        <span>{item.text}</span>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Safety Tips */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-sm font-bold text-blue-200 mb-2">
                  💡 Stay Safe
                </p>
                <ul className="text-xs text-blue-200/80 space-y-1 list-disc list-inside">
                  <li>Never buy tokens with sell tax above 20%</li>
                  <li>Always check contract before buying</li>
                  <li>Use small test amounts first</li>
                  <li>Research the project thoroughly</li>
                  <li>Beware of tokens you cannot sell</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-lg"
                style={{
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)',
                }}
              >
                I Understand - Go Back
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
