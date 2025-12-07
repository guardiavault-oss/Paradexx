import { motion, AnimatePresence } from 'motion/react';
import { Settings, Bell, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { NotificationCenter } from './NotificationCenter';
import { NetworkSelector } from './NetworkSelector';
import { Button } from './ui/Button';

interface HeaderProps {
  type: 'degen' | 'regen';
  onNavigate: (path: string) => void;
  user: {
    avatar: string;
    username: string;
    score: number;
    walletAddress: string;
  };
  network: {
    id: number;
    name: string;
    logo: string;
    color: string;
  };
  onNetworkChange: (network: any) => void;
  unreadNotifications?: number;
  onLogout?: () => void;
}

export function Header({
  type,
  onNavigate,
  user,
  network,
  onNetworkChange,
  unreadNotifications = 0,
  onLogout,
}: HeaderProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-[-14px] px-[26px] h-16 flex items-center justify-between relative py-[-15px] my-[15px]">
          {/* Left: Profile + Network Selector */}
          <div className="flex items-center gap-2 relative z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLogoutModal(true)}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all relative overflow-hidden group"
            >
              <div className="text-xl group-hover:opacity-20 transition-opacity">
                {user.avatar}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[rgba(255,255,255,0)]">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
            </motion.button>

            {/* Network Selector */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNetworkSelector(true)}
              className="h-10 flex items-center gap-2 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className="text-lg leading-none">{network.logo}</span>
              <span className="hidden sm:block text-sm text-white/80">{network.name}</span>
              <ChevronDown className="w-3 h-3 text-white/50" />
            </motion.button>
          </div>

          {/* Center: Paradex Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <h1
              className="hidden sm:block"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "28px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: "transparent",
                background: "linear-gradient(180deg, #E0E0E0 0%, #FFFFFF 20%, #888888 45%, #444444 50%, #CCCCCC 70%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }}
            >
              Paradex
            </h1>
            {/* Mobile Logo (Smaller) */}
             <h1
              className="sm:hidden"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "20px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: "transparent",
                background: "linear-gradient(180deg, #E0E0E0 0%, #FFFFFF 20%, #888888 45%, #444444 50%, #CCCCCC 70%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }}
            >
              Paradex
            </h1>
          </div>

          {/* Right: Notifications & Settings (Evenly sized) */}
          <div className="flex items-center gap-2 relative z-10">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
            >
              <Bell className="w-5 h-5 text-white" />
              
              {unreadNotifications > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{
                    background: accentColor,
                  }}
                >
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </motion.div>
              )}
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('/settings')}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
            >
              <Settings className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-black border border-white/10 rounded-2xl p-6 z-[101] shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Sign Out?</h3>
              <p className="text-white/60 mb-6">
                Are you sure you want to disconnect your wallet?
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => {
                    setShowLogoutModal(false);
                    onLogout?.();
                  }}
                  style={{
                    background: '#DC143C',
                    borderColor: '#DC143C',
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, y: -10 }}
              className="fixed top-20 right-4 w-[400px] max-w-[calc(100vw-32px)] z-[70]"
            >
              <NotificationCenter
                type={type}
                onClose={() => setShowNotifications(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Network Selector */}
      <NetworkSelector
        isOpen={showNetworkSelector}
        onClose={() => setShowNetworkSelector(false)}
        currentNetwork={network}
        onNetworkChange={(net) => {
          onNetworkChange(net);
          setShowNetworkSelector(false);
        }}
        type={type}
      />
    </>
  );
}

// Mobile-optimized compact header - Just re-export main header as it's now responsive
export function CompactHeader(props: HeaderProps) {
  return <Header {...props} />;
}