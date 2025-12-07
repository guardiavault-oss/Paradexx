import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle, Lock, Unlock } from 'lucide-react';

interface DecoyWalletModeProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  onEnterPin?: (pin: string) => void;
  type?: 'degen' | 'regen';
}

export function DecoyWalletMode({
  isActive,
  onToggle,
  onEnterPin,
  type = 'degen',
}: DecoyWalletModeProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [step, setStep] = useState<'info' | 'pin' | 'confirm'>('info');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const secondaryColor = isDegen ? '#8B0000' : '#000080';

  const handleSetupDecoy = () => {
    setShowSetup(true);
    setStep('info');
  };

  const handlePinSubmit = () => {
    if (step === 'pin') {
      setStep('confirm');
    } else if (step === 'confirm') {
      if (pin === confirmPin && pin.length >= 4) {
        onToggle(true);
        setShowSetup(false);
        setPin('');
        setConfirmPin('');
      }
    }
  };

  const decoyFeatures = [
    '🎭 Shows fake wallet with minimal balance',
    '🔒 Real wallet remains hidden',
    '🎯 Protects against forced access',
    '⚡ Activate with special PIN',
    '🛡️ Extra layer of security',
    '👁️ No indication of real balance',
  ];

  return (
    <>
      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}20 100%)`,
              }}
            >
              {isActive ? (
                <Shield className="w-6 h-6" style={{ color: accentColor }} />
              ) : (
                <Shield className="w-6 h-6 text-white/30" />
              )}
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-tight">
                Shadow Mode
              </h3>
              <p className="text-xs text-white/50 uppercase tracking-wider">
                {isActive ? 'Active - Real wallet hidden' : 'Inactive'}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (isActive ? onToggle(false) : handleSetupDecoy())}
            className={`px-4 py-2 rounded-xl font-black uppercase tracking-wider text-sm transition-all ${
              isActive ? 'bg-white/10 text-white' : 'text-white'
            }`}
            style={
              !isActive
                ? {
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                    boxShadow: `0 0 20px ${accentColor}40`,
                  }
                : {}
            }
          >
            {isActive ? (
              <>
                <Unlock className="w-4 h-4 inline mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 inline mr-2" />
                Activate
              </>
            )}
          </motion.button>
        </div>

        {/* Active Warning */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
          >
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-200">
                <p className="font-bold mb-1">DECOY MODE ACTIVE</p>
                <p>
                  Your real wallet is hidden. Enter your decoy PIN to access real
                  funds. Anyone viewing will only see the decoy wallet.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Setup Modal */}
      <AnimatePresence>
        {showSetup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div
                className="p-6 border-b border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8" style={{ color: accentColor }} />
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      Setup Decoy Wallet
                    </h2>
                    <p className="text-xs text-white/50 uppercase tracking-wider">
                      {step === 'info'
                        ? 'Learn about protection'
                        : step === 'pin'
                        ? 'Create your PIN'
                        : 'Confirm your PIN'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'info' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-white/70">
                      Decoy Wallet Mode creates a fake wallet that shows minimal
                      balance, protecting your real funds in threatening situations.
                    </p>

                    <div className="space-y-2">
                      {decoyFeatures.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 text-sm text-white/80"
                        >
                          <span className="text-lg">{feature.split(' ')[0]}</span>
                          <span>{feature.split(' ').slice(1).join(' ')}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div className="text-xs text-red-200">
                          <p className="font-bold mb-1">IMPORTANT</p>
                          <p>
                            Remember your decoy PIN! You'll need it to exit decoy mode
                            and access real funds.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'pin' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm text-white/70 mb-2 block uppercase tracking-wider font-bold">
                        Create 4-digit PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? 'text' : 'password'}
                          value={pin}
                          onChange={(e) =>
                            setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          placeholder="••••"
                          className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-2xl text-center tracking-[0.5em] focus:border-white/30 outline-none font-mono"
                          maxLength={4}
                        />
                        <button
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
                        >
                          {showPin ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* PIN Dots */}
                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={`w-4 h-4 rounded-full transition-all ${
                            pin.length > i
                              ? 'shadow-lg'
                              : 'bg-white/20'
                          }`}
                          style={
                            pin.length > i
                              ? {
                                  background: accentColor,
                                  boxShadow: `0 0 20px ${accentColor}60`,
                                }
                              : {}
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'confirm' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm text-white/70 mb-2 block uppercase tracking-wider font-bold">
                        Confirm your PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? 'text' : 'password'}
                          value={confirmPin}
                          onChange={(e) =>
                            setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          placeholder="••••"
                          className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-2xl text-center tracking-[0.5em] focus:border-white/30 outline-none font-mono"
                          maxLength={4}
                        />
                        <button
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
                        >
                          {showPin ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {confirmPin.length === 4 && confirmPin !== pin && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl"
                      >
                        <p className="text-xs text-red-200 text-center font-bold">
                          PINs don't match
                        </p>
                      </motion.div>
                    )}

                    {/* PIN Dots */}
                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={`w-4 h-4 rounded-full transition-all ${
                            confirmPin.length > i
                              ? confirmPin === pin || confirmPin.length < 4
                                ? 'shadow-lg'
                                : 'bg-red-500'
                              : 'bg-white/20'
                          }`}
                          style={
                            confirmPin.length > i &&
                            (confirmPin === pin || confirmPin.length < 4)
                              ? {
                                  background: accentColor,
                                  boxShadow: `0 0 20px ${accentColor}60`,
                                }
                              : {}
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-white/10 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowSetup(false);
                    setPin('');
                    setConfirmPin('');
                    setStep('info');
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-wider rounded-xl transition-all border border-white/10"
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (step === 'info') {
                      setStep('pin');
                    } else {
                      handlePinSubmit();
                    }
                  }}
                  disabled={
                    (step === 'pin' && pin.length !== 4) ||
                    (step === 'confirm' &&
                      (confirmPin.length !== 4 || confirmPin !== pin))
                  }
                  className="flex-1 py-3 text-white font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                    boxShadow: `0 0 20px ${accentColor}40`,
                  }}
                >
                  {step === 'info' ? 'Next' : step === 'pin' ? 'Continue' : 'Activate'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}