import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Shield, Clock, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LockConfirmationProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  autoLockTime?: number; // in seconds
  type?: 'degen' | 'regen';
}

export function LockConfirmation({
  isVisible,
  onConfirm,
  onCancel,
  autoLockTime = 10,
  type = 'degen',
}: LockConfirmationProps) {
  const [countdown, setCountdown] = useState(autoLockTime);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const secondaryColor = isDegen ? '#8B0000' : '#000080';

  useEffect(() => {
    if (isVisible && isCountingDown) {
      setCountdown(autoLockTime);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onConfirm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, isCountingDown, autoLockTime, onConfirm]);

  const progress = ((autoLockTime - countdown) / autoLockTime) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div
              className="p-6 border-b border-white/10 relative"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <motion.div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border relative overflow-hidden"
                    style={{
                      background: `${accentColor}20`,
                      borderColor: `${accentColor}40`,
                    }}
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    {/* Animated background pulse */}
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: accentColor }}
                      animate={{
                        opacity: [0.1, 0.3, 0.1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                    <Lock
                      className="w-8 h-8 relative z-10"
                      style={{ color: accentColor }}
                    />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                      Lock Wallet?
                    </h2>
                    <p className="text-sm text-white/50 uppercase tracking-wider">
                      Secure your funds
                    </p>
                  </div>
                </div>

                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Info Section */}
              <div className="space-y-3">
                <p className="text-sm text-white/70">
                  Your wallet will be locked and you'll need to enter your password
                  to access it again.
                </p>

                {/* What Happens */}
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-bold">
                    What happens when locked:
                  </label>
                  {[
                    { icon: Shield, text: 'Funds remain secure' },
                    { icon: Lock, text: 'Transactions blocked' },
                    { icon: AlertTriangle, text: 'Password required to unlock' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <item.icon className="w-5 h-5 text-white/50" />
                      <span className="text-sm text-white/80">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Auto-lock Option */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-white/50 group-hover:text-white/70 transition-colors" />
                    <div>
                      <p className="text-sm text-white font-bold">
                        Auto-lock in {autoLockTime}s
                      </p>
                      <p className="text-xs text-white/50">
                        Cancel to choose manually
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isCountingDown}
                      onChange={(e) => setIsCountingDown(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className="w-11 h-6 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{
                        background: isCountingDown ? accentColor : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  </div>
                </label>

                {/* Progress Bar */}
                {isCountingDown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4"
                  >
                    <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                      <span>Locking in...</span>
                      <span className="font-mono font-bold">{countdown}s</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Security Tip */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-200 font-bold mb-1">
                      💡 Security Tip
                    </p>
                    <p className="text-xs text-blue-200/80">
                      Lock your wallet whenever you step away from your device to
                      protect your funds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-wider rounded-xl transition-all border border-white/10"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="flex-1 py-3 text-white font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                  boxShadow: `0 0 20px ${accentColor}40`,
                }}
              >
                <Lock className="w-4 h-4" />
                Lock Now
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
