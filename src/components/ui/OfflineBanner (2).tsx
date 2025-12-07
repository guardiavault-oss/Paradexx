import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface OfflineBannerProps {
  type?: 'degen' | 'regen';
}

export function OfflineBanner({ type = 'degen' }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Simulate retry
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRetrying(false);
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[90] pointer-events-none"
        >
          <div className="p-4">
            <motion.div
              className="max-w-4xl mx-auto bg-black/95 backdrop-blur-xl rounded-2xl border-2 border-red-500/50 overflow-hidden shadow-2xl pointer-events-auto"
              style={{
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.3)',
              }}
              animate={{
                boxShadow: [
                  '0 0 40px rgba(239, 68, 68, 0.3)',
                  '0 0 60px rgba(239, 68, 68, 0.5)',
                  '0 0 40px rgba(239, 68, 68, 0.3)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <div className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/40"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <WifiOff className="w-6 h-6 text-red-400" />
                    </motion.div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black text-red-400 uppercase tracking-tight">
                          No Internet Connection
                        </h3>
                        <motion.div
                          className="w-2 h-2 bg-red-400 rounded-full"
                          animate={{
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                          }}
                        />
                      </div>
                      <p className="text-xs text-white/70">
                        Some features may not work. Check your connection.
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-red-400 font-black uppercase tracking-wider text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
                    />
                    {isRetrying ? 'Checking...' : 'Retry'}
                  </motion.button>
                </div>
              </div>

              {/* Feature Warnings */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-t border-red-500/20 bg-black/40"
              >
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { icon: AlertCircle, text: 'Price updates paused' },
                      { icon: AlertCircle, text: 'Transactions disabled' },
                      { icon: AlertCircle, text: 'Balance not synced' },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2 text-xs text-orange-200"
                      >
                        <item.icon className="w-3 h-3 flex-shrink-0" />
                        <span>{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
