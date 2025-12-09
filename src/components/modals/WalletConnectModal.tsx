import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeStyles } from '../../design-system';
import {
  X,
  QrCode,
  Link2,
  Trash2,
  ExternalLink,
  Globe,
  Shield,
  AlertCircle,
  Camera,
  Copy,
  CheckCircle,
  Sparkles,
  Activity,
  Search,
} from 'lucide-react';

interface WalletConnectSession {
  topic: string;
  peerMeta: {
    name: string;
    url: string;
    icons: string[];
  };
  connectedAt: number;
}

import { API_URL } from '../../config/api';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'degen' | 'regen';
}

// Haptic feedback utility
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [15],
      heavy: [20, 10, 20],
    };
    navigator.vibrate(patterns[style]);
  }
};

// Session Card Component
function SessionCard({
  session,
  onDisconnect,
  index,
  accentColor,
}: {
  session: WalletConnectSession;
  onDisconnect: () => void;
  index: number;
  accentColor: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update time every minute to keep duration accurate
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const connectedDuration = currentTime - session.connectedAt;
  const hours = Math.floor(connectedDuration / (1000 * 60 * 60));
  const minutes = Math.floor((connectedDuration % (1000 * 60 * 60)) / (1000 * 60));

  const handleDisconnect = () => {
    triggerHaptic('heavy');
    setShowDisconnectConfirm(true);
    setTimeout(() => {
      onDisconnect();
      setShowDisconnectConfirm(false);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      {/* Disconnect Confirmation Overlay */}
      <AnimatePresence>
        {showDisconnectConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-500/20 backdrop-blur-sm rounded-xl z-20 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 text-red-400"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Disconnecting...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 bg-white/5 border border-[var(--border-neutral)]/10 rounded-xl hover:border-[var(--border-neutral)]/20 transition-all relative overflow-hidden">
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        <div className="flex items-start gap-4 relative z-10">
          {/* Icon */}
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}40`,
            }}
          >
            {session.peerMeta.icons[0]}
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{session.peerMeta.name}</h3>
            <p className="text-xs text-[var(--text-primary)]/60 mb-2 truncate">{session.peerMeta.url}</p>

            <div className="flex items-center gap-3 text-xs text-[var(--text-primary)]/60">
              <motion.div
                className="flex items-center gap-1"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Connected</span>
              </motion.div>
              <span>•</span>
              <span>
                {hours > 0 ? `${hours}h ` : ''}
                {minutes}m ago
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.a
              whileTap={{ scale: 0.9 }}
              href={session.peerMeta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => triggerHaptic('light')}
            >
              <ExternalLink className="w-4 h-4 text-[var(--text-primary)]/60" />
            </motion.a>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleDisconnect}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
            >
              <Trash2 className="w-4 h-4 text-[var(--text-primary)]/60 group-hover:text-red-400" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function WalletConnectModal({ isOpen, onClose, type }: WalletConnectModalProps) {
  const [view, setView] = useState<'list' | 'connect'>('list');
  const [uri, setUri] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<WalletConnectSession[]>([]);
  const [loading, setLoading] = useState(false);

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const secondaryColor = isDegen ? '#8B0000' : '#000080';

  // Fetch active WalletConnect sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/walletconnect/sessions`);
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        }
      } catch (err) {
        console.debug('Failed to fetch WalletConnect sessions:', err);
      }
    };

    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  // Filter sessions based on search
  const filteredSessions = sessions.filter(
    (session) =>
      session.peerMeta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.peerMeta.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConnect = async () => {
    if (!uri) {
      setError('Please enter a WalletConnect URI');
      return;
    }

    if (!uri.startsWith('wc:')) {
      setError('Invalid WalletConnect URI format');
      return;
    }

    try {
      triggerHaptic('medium');
      setLoading(true);
      // Simulate connection
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setUri('');
      setError(null);
      setView('list');
      triggerHaptic('light');
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      triggerHaptic('heavy');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = (topic: string) => {
    setSessions((prev) => prev.filter((s) => s.topic !== topic));
    triggerHaptic('medium');
  };

  const handlePasteUri = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('wc:')) {
        setUri(text);
        setError(null);
        triggerHaptic('light');
      } else {
        setError('Clipboard does not contain a valid WalletConnect URI');
        triggerHaptic('heavy');
      }
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[var(--bg-base)]/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[var(--bg-base)] rounded-2xl border border-[var(--border-neutral)]/10 overflow-hidden relative"
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-30"
            animate={{
              background: [
                `radial-gradient(circle at 0% 0%, ${accentColor}40 0%, transparent 50%)`,
                `radial-gradient(circle at 100% 100%, ${secondaryColor}40 0%, transparent 50%)`,
                `radial-gradient(circle at 0% 0%, ${accentColor}40 0%, transparent 50%)`,
              ],
            }}
            transition={{
              repeat: Infinity,
              duration: 10,
              ease: 'linear',
            }}
          />

          {/* Header */}
          <div className="p-6 border-b border-[var(--border-neutral)]/10 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 rounded-lg"
                style={{
                  background: `${accentColor}20`,
                  border: `1px solid ${accentColor}40`,
                }}
                animate={{ rotate: [0, 360] }}
                transition={{
                  repeat: Infinity,
                  duration: 20,
                  ease: 'linear',
                }}
              >
                <Link2 className="w-6 h-6" style={{ color: accentColor }} />
              </motion.div>
              <div>
                <h2 className="text-xl font-black uppercase text-[var(--text-primary)] flex items-center gap-2">
                  WalletConnect
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                    }}
                  >
                    <Activity className="w-4 h-4" style={{ color: accentColor }} />
                  </motion.div>
                </h2>
                <p className="text-xs text-[var(--text-primary)]/60">
                  {sessions.length} connected dApp{sessions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                onClose();
                triggerHaptic('light');
              }}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5 text-[var(--text-primary)]/60" />
            </motion.button>
          </div>

          {/* View Tabs */}
          <div className="flex border-b border-[var(--border-neutral)]/10 relative">
            <motion.div
              className="absolute bottom-0 h-0.5"
              style={{ background: accentColor }}
              initial={false}
              animate={{
                x: view === 'list' ? '0%' : '100%',
                width: '50%',
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            />
            <button
              onClick={() => {
                setView('list');
                triggerHaptic('light');
              }}
              className="flex-1 py-3 text-sm font-bold transition-colors"
              style={{
                color: view === 'list' ? accentColor : 'rgba(255, 255, 255, 0.6)',
              }}
            >
              Active Sessions ({sessions.length})
            </button>
            <button
              onClick={() => {
                setView('connect');
                triggerHaptic('light');
              }}
              className="flex-1 py-3 text-sm font-bold transition-colors"
              style={{
                color: view === 'connect' ? accentColor : 'rgba(255, 255, 255, 0.6)',
              }}
            >
              New Connection
            </button>
          </div>

          {/* Content */}
          <div className="p-6 relative z-10 max-h-[60vh] overflow-y-auto">
            {view === 'list' ? (
              <div className="space-y-3">
                {/* Search Bar */}
                {sessions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-4"
                  >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-primary)]/40" />
                    <input
                      type="text"
                      placeholder="Search dApps..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-[var(--border-neutral)]/10 rounded-xl text-sm text-[var(--text-primary)] placeholder-white/40 focus:border-[var(--border-neutral)]/30 outline-none"
                    />
                  </motion.div>
                )}

                {filteredSessions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center"
                      animate={{
                        boxShadow: [
                          `0 0 0 0 ${accentColor}40`,
                          `0 0 0 20px ${accentColor}00`,
                        ],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                      }}
                    >
                      <Link2 className="w-8 h-8 text-[var(--text-primary)]/40" />
                    </motion.div>
                    <p className="text-sm text-[var(--text-primary)]/60 mb-2">
                      {searchQuery ? 'No matching dApps' : 'No active connections'}
                    </p>
                    <p className="text-xs text-[var(--text-primary)]/40">
                      {searchQuery
                        ? 'Try a different search'
                        : 'Connect to a dApp to get started'}
                    </p>
                    {!searchQuery && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setView('connect');
                          triggerHaptic('light');
                        }}
                        className="mt-4 px-4 py-2 text-[var(--text-primary)] rounded-xl font-bold"
                        style={{ background: accentColor }}
                      >
                        Connect to dApp
                      </motion.button>
                    )}
                  </motion.div>
                ) : (
                  filteredSessions.map((session, index) => (
                    <SessionCard
                      key={session.topic}
                      session={session}
                      onDisconnect={() => handleDisconnect(session.topic)}
                      index={index}
                      accentColor={accentColor}
                    />
                  ))
                )}
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    Connect via WalletConnect
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: 'linear',
                      }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
                    </motion.div>
                  </h3>

                  {/* QR Placeholder */}
                  <motion.div
                    className="mb-4 p-8 bg-white/5 rounded-xl border-2 border-dashed border-[var(--border-neutral)]/10 flex flex-col items-center justify-center cursor-pointer"
                    whileHover={{
                      scale: 1.02,
                      borderColor: `${accentColor}40`,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                      }}
                    >
                      <Camera className="w-12 h-12 text-[var(--text-primary)]/40 mb-3" />
                    </motion.div>
                    <p className="text-sm text-[var(--text-primary)]/60 text-center mb-2">Tap to scan QR code</p>
                    <p className="text-xs text-[var(--text-primary)]/40 text-center">
                      Or paste the WalletConnect URI below
                    </p>
                  </motion.div>

                  {/* URI Input */}
                  <div className="space-y-2">
                    <label className="text-xs text-[var(--text-primary)]/60 flex items-center justify-between">
                      WalletConnect URI
                      <AnimatePresence>
                        {copied && (
                          <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-1"
                            style={{ color: accentColor }}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Copied!
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </label>
                    <div className="flex gap-2">
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        value={uri}
                        onChange={(e) => {
                          setUri(e.target.value);
                          setError(null);
                        }}
                        placeholder="wc:..."
                        className="flex-1 p-3 bg-white/5 border border-[var(--border-neutral)]/10 rounded-xl text-sm text-[var(--text-primary)] placeholder-white/40 focus:border-[var(--border-neutral)]/30 outline-none transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePasteUri}
                        className="px-4 py-3 bg-white/5 border border-[var(--border-neutral)]/10 text-[var(--text-primary)] rounded-xl hover:bg-white/10 transition-all text-sm flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Paste
                      </motion.button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Connect Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConnect}
                    disabled={loading || !uri}
                    className="w-full mt-4 py-3 text-[var(--text-primary)] rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                    style={{ background: accentColor }}
                  >
                    <AnimatePresence>
                      {loading && (
                        <motion.div
                          initial={{ opacity: 0, x: -200 }}
                          animate={{ opacity: 1, x: 200 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                      )}
                    </AnimatePresence>
                    <span className="relative z-10">{loading ? 'Connecting...' : 'Connect'}</span>
                  </motion.button>
                </div>

                {/* Instructions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl"
                  style={{
                    background: `${accentColor}10`,
                    border: `1px solid ${accentColor}30`,
                  }}
                >
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: accentColor }}>
                    <Shield className="w-4 h-4" />
                    How to Connect
                  </h4>
                  <ol className="space-y-1 text-xs text-[var(--text-primary)]/60 list-decimal list-inside">
                    {[
                      'Open a dApp that supports WalletConnect',
                      'Click "Connect Wallet" and select WalletConnect',
                      'Scan the QR code or copy the connection URI',
                      'Paste the URI above and click Connect',
                    ].map((step, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.3 + index * 0.1,
                        }}
                      >
                        {step}
                      </motion.li>
                    ))}
                  </ol>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
