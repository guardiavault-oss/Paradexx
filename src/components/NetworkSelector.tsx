import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Activity, AlertCircle } from 'lucide-react';

interface Network {
  id: number;
  name: string;
  symbol: string;
  logo: string;
  color: string;
  rpcUrl?: string;
  explorerUrl?: string;
}

interface NetworkSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetwork: Network;
  onNetworkChange: (network: Network) => void;
  type?: 'degen' | 'regen';
}

const NETWORKS: Network[] = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    logo: '⟠',
    color: '#627EEA',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://etherscan.io',
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    logo: '◆',
    color: '#8247E5',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ARB',
    logo: '🔷',
    color: '#28A0F0',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
  },
  {
    id: 10,
    name: 'Optimism',
    symbol: 'OP',
    logo: '🔴',
    color: '#FF0420',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
  },
  {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    logo: '🔵',
    color: '#0052FF',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
  },
  {
    id: 56,
    name: 'BSC',
    symbol: 'BNB',
    logo: '⬣',
    color: '#F3BA2F',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
  },
];

export function NetworkSelector({
  isOpen,
  onClose,
  currentNetwork,
  onNetworkChange,
  type = 'degen',
}: NetworkSelectorProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-black border border-white/10 rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-black text-white">Select Network</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </motion.button>
                </div>
                <p className="text-sm text-white/60">
                  Switch between supported networks
                </p>
              </div>

              {/* Network List */}
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {NETWORKS.map((network, index) => {
                  const isActive = network.id === currentNetwork.id;

                  return (
                    <motion.button
                      key={network.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNetworkChange(network)}
                      className={`w-full p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-white/10 border-white/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Logo */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{
                            background: `${network.color}20`,
                            border: `2px solid ${network.color}40`,
                          }}
                        >
                          {network.logo}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white">
                              {network.name}
                            </span>
                            {isActive && (
                              <div
                                className="px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{
                                  background: `${accentColor}20`,
                                  color: accentColor,
                                }}
                              >
                                Active
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <Activity className="w-3 h-3" />
                            <span>{network.symbol}</span>
                            <span>•</span>
                            <span>Chain {network.id}</span>
                          </div>
                        </div>

                        {/* Check Icon */}
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: accentColor }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex items-start gap-2 text-xs text-white/60">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Switching networks will reload your wallet data. Make sure no
                    transactions are pending.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Quick network switcher (compact)
export function QuickNetworkSwitch({
  currentNetwork,
  onNetworkChange,
  type = 'degen',
}: {
  currentNetwork: Network;
  onNetworkChange: (network: Network) => void;
  type?: 'degen' | 'regen';
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all"
      >
        <span className="text-lg">{currentNetwork.logo}</span>
        <span className="text-sm font-bold text-white hidden sm:block">
          {currentNetwork.name}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-64 bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
            >
              <div className="p-2 space-y-1">
                {NETWORKS.map((network) => {
                  const isActive = network.id === currentNetwork.id;
                  return (
                    <motion.button
                      key={network.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onNetworkChange(network);
                        setIsOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg flex items-center gap-3 transition-all ${
                        isActive ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: `${network.color}20`,
                        }}
                      >
                        <span className="text-lg">{network.logo}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-white">
                          {network.name}
                        </div>
                        <div className="text-xs text-white/60">
                          {network.symbol}
                        </div>
                      </div>
                      {isActive && (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
