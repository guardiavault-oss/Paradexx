import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, ArrowRightLeft, Shield } from 'lucide-react';

interface NetworkSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dappName: string;
  currentNetwork: string;
  requestedNetwork: string;
  onSwitch: () => void;
  type: 'degen' | 'regen';
}

const networkLogos: Record<string, string> = {
  Ethereum: '⟠',
  Polygon: '◆',
  Arbitrum: '🔷',
  Optimism: '🔴',
  Base: '🔵',
  BSC: '⬣',
};

const networkColors: Record<string, string> = {
  Ethereum: '#627EEA',
  Polygon: '#8247E5',
  Arbitrum: '#28A0F0',
  Optimism: '#FF0420',
  Base: '#0052FF',
  BSC: '#F3BA2F',
};

export function NetworkSwitchModal({
  isOpen,
  onClose,
  dappName,
  currentNetwork,
  requestedNetwork,
  onSwitch,
  type,
}: NetworkSwitchModalProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  const handleSwitch = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10]);
    }
    onSwitch();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-black rounded-2xl z-[70] border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(251, 146, 60, 0.1)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
              }}
            >
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">Switch Network?</h2>
              <p className="text-sm text-white/60">
                <span style={{ color: accentColor }}>{dappName}</span> wants to switch networks
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-1 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Network Comparison */}
          <div className="flex items-center gap-3">
            {/* Current Network */}
            <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-xs text-white/40 mb-2">Current</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl" style={{ filter: 'grayscale(50%)' }}>
                  {networkLogos[currentNetwork]}
                </span>
                <span className="text-sm text-white">{currentNetwork}</span>
              </div>
            </div>

            {/* Arrow */}
            <ArrowRightLeft className="w-5 h-5 text-white/40 flex-shrink-0" />

            {/* Requested Network */}
            <div
              className="flex-1 p-4 rounded-xl border-2"
              style={{
                backgroundColor: `${networkColors[requestedNetwork]}10`,
                borderColor: `${networkColors[requestedNetwork]}80`,
              }}
            >
              <div className="text-xs text-white/40 mb-2">Switch to</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{networkLogos[requestedNetwork]}</span>
                <span className="text-sm font-bold" style={{ color: networkColors[requestedNetwork] }}>
                  {requestedNetwork}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            className="p-4 rounded-xl mb-6"
            style={{
              background: `${accentColor}10`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
              <div className="text-xs text-white/80 leading-relaxed">
                <p className="mb-2">
                  <strong style={{ color: accentColor }}>What happens next:</strong>
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your wallet will switch to {requestedNetwork}</li>
                  <li>You'll see balances for {requestedNetwork} network</li>
                  <li>You can switch back anytime in Settings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSwitch}
              className="flex-1 py-3 px-4 text-white rounded-xl transition-all font-bold"
              style={{
                background: accentColor,
                boxShadow: `0 4px 20px ${accentColor}40`,
              }}
            >
              Switch Network
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
