import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, ExternalLink, Shield, Eye } from 'lucide-react';
import { useState } from 'react';

interface PhishingWarningProps {
  isVisible: boolean;
  onClose: () => void;
  url?: string;
  reason?: string;
  type?: 'degen' | 'regen';
}

export function PhishingWarning({
  isVisible,
  onClose,
  url = 'unknown-site.com',
  reason = 'Suspicious domain detected',
  type = 'degen',
}: PhishingWarningProps) {
  const [understood, setUnderstood] = useState(false);
  const [proceedAnyway, setProceedAnyway] = useState(false);

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const warningReasons = [
    '❌ Domain not verified',
    '❌ Suspicious SSL certificate',
    '❌ Known phishing pattern',
    '❌ Requests sensitive data',
    '❌ Mimics legitimate site',
  ];

  const protectionTips = [
    '✅ Always check the URL carefully',
    '✅ Look for HTTPS and lock icon',
    '✅ Never share your seed phrase',
    '✅ Use official bookmarks',
    '✅ Enable 2FA when possible',
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-black/95 backdrop-blur-xl rounded-2xl border-2 border-red-500/50 overflow-hidden shadow-2xl"
            style={{
              boxShadow: `0 0 60px rgba(255, 0, 0, 0.3), 0 0 120px rgba(255, 0, 0, 0.1)`,
            }}
          >
            {/* Pulsing Border */}
            <motion.div
              className="absolute inset-0 border-2 border-red-500/30 rounded-2xl pointer-events-none"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-red-500/20 to-red-900/20 border-b border-red-500/30 relative">
              <motion.div
                className="absolute inset-0 bg-red-500/10"
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <motion.div
                    className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/40"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-black text-red-400 uppercase tracking-tight mb-1">
                      ⚠️ Phishing Warning
                    </h2>
                    <p className="text-sm text-red-200 uppercase tracking-wider">
                      Suspicious Activity Detected
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
              {/* Main Warning */}
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex gap-3">
                  <Shield className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-100 font-bold mb-2">
                      This site may be trying to steal your information!
                    </p>
                    <p className="text-xs text-red-200/80">
                      {reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suspicious URL */}
              <div>
                <label className="text-xs text-white/50 mb-2 block uppercase tracking-wider font-bold">
                  Suspicious URL
                </label>
                <div className="p-3 bg-black/60 border border-red-500/30 rounded-xl flex items-center gap-3">
                  <Eye className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <code className="text-sm text-red-300 font-mono break-all flex-1">
                    {url}
                  </code>
                  <ExternalLink className="w-4 h-4 text-white/30 flex-shrink-0" />
                </div>
              </div>

              {/* Warning Reasons */}
              <div>
                <label className="text-xs text-white/50 mb-3 block uppercase tracking-wider font-bold">
                  Why This Is Dangerous
                </label>
                <div className="space-y-2">
                  {warningReasons.map((reason, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 text-sm text-red-200 p-2 bg-red-500/5 rounded-lg"
                    >
                      <span className="text-red-400">{reason.split(' ')[0]}</span>
                      <span>{reason.split(' ').slice(1).join(' ')}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Protection Tips */}
              <div>
                <label className="text-xs text-white/50 mb-3 block uppercase tracking-wider font-bold">
                  Stay Safe Online
                </label>
                <div className="space-y-2">
                  {protectionTips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-3 text-sm text-green-200 p-2 bg-green-500/5 rounded-lg"
                    >
                      <span className="text-green-400">{tip.split(' ')[0]}</span>
                      <span>{tip.split(' ').slice(1).join(' ')}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Acknowledgment Checkbox */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-1">
                    <input
                      type="checkbox"
                      checked={understood}
                      onChange={(e) => setUnderstood(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-white/30 rounded peer-checked:border-red-400 peer-checked:bg-red-500/20 transition-all" />
                    {understood && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-red-400 rounded-sm" />
                      </motion.div>
                    )}
                  </div>
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                    I understand the risks and will not share my seed phrase or
                    private keys
                  </span>
                </label>

                {understood && (
                  <motion.label
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="relative mt-1">
                      <input
                        type="checkbox"
                        checked={proceedAnyway}
                        onChange={(e) => setProceedAnyway(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border-2 border-white/30 rounded peer-checked:border-yellow-400 peer-checked:bg-yellow-500/20 transition-all" />
                      {proceedAnyway && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-yellow-400 rounded-sm" />
                        </motion.div>
                      )}
                    </div>
                    <span className="text-sm text-yellow-200/80 group-hover:text-yellow-200 transition-colors">
                      I want to proceed anyway (NOT RECOMMENDED)
                    </span>
                  </motion.label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-lg"
                style={{
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)',
                }}
              >
                Go Back (Recommended)
              </motion.button>

              {understood && proceedAnyway && (
                <motion.button
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-black uppercase tracking-wider rounded-xl transition-all border border-red-500/40"
                >
                  Proceed at Risk
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
