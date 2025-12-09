/**
 * Example: Complete Integration of Enhanced Component Library
 * Shows how to use all systems together in a real wallet component
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

// Import all our new systems
import AnimationEngine from '@/lib/animation-engine';
import { useSwipe, useLongPress } from '@/lib/gestures';
import { SharedElement } from '@/lib/shared-transitions';
import { useHaptics, useAutoHaptics } from '@/lib/haptics';
import { 
  useAccessibleAnnounce, 
  useFocusTrap, 
  useReducedMotion 
} from '@/lib/accessibility';
import { useCelebrations, useMilestoneCelebration } from '@/lib/celebrations';
import { useThemeMode, useTimeBasedTheming } from '@/lib/theme-engine';
import { 
  useTransactionMachine, 
  useNotificationQueue 
} from '@/lib/ui-machines';

// Import UI components
import PriceTicker from '@/components/viz/PriceTicker';
import SmartSkeleton, { WalletCardSkeleton } from '@/components/ui/SmartSkeleton';
import VirtualizedList from '@/components/ui/VirtualizedList';

// ==============================================
// EXAMPLE 1: ENHANCED WALLET CARD
// ==============================================

interface WalletCardProps {
  address: string;
  balance: number;
  name: string;
  priceHistory: number[];
  onSelect: () => void;
}

export function EnhancedWalletCard({
  address,
  balance,
  name,
  priceHistory,
  onSelect,
}: WalletCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Gesture support
  const swipeState = useSwipe(cardRef, {
    threshold: 100,
    onSwipeLeft: () => console.log('Archive wallet'),
    onSwipeRight: () => console.log('Share wallet'),
  });

  const { isPressed } = useLongPress(cardRef, {
    delay: 500,
    onLongPress: () => console.log('Show context menu'),
  });

  // Haptic feedback
  const { medium } = useHaptics();
  useAutoHaptics(buttonRef, 'button');

  // Accessibility
  const announce = useAccessibleAnnounce();
  const shouldReduceMotion = useReducedMotion();

  // Celebrations for milestones
  useMilestoneCelebration(balance, [1000, 10000, 100000], 'confetti');

  const handleSelect = () => {
    medium(); // Haptic feedback
    announce(`Selected wallet ${name}`, 'polite');
    onSelect();
  };

  return (
    <SharedElement id={`wallet-${address}`}>
      <motion.div
        ref={cardRef}
        className="wallet-card p-6 border rounded-xl bg-white dark:bg-gray-800"
        whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          scale: isPressed ? 0.95 : 1,
          boxShadow: isPressed
            ? '0 10px 40px rgba(0,0,0,0.2)'
            : '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div className="wallet-header mb-4">
          <h3 className="text-xl font-bold">{name}</h3>
          <span className="text-sm text-gray-500">{address.slice(0, 8)}...</span>
        </div>

        <PriceTicker
          value={balance}
          decimals={2}
          currency="$"
          showChange={true}
          showSparkline={true}
          history={priceHistory}
          size="lg"
        />

        <button
          ref={buttonRef}
          onClick={handleSelect}
          className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          View Details
        </button>
      </motion.div>
    </SharedElement>
  );
}

// ==============================================
// EXAMPLE 2: TRANSACTION FLOW WITH STATE MACHINE
// ==============================================

export function TransactionFlow() {
  const modalRef = useRef<HTMLDivElement>(null);
  const { state, context, send, getCurrentAnimation } = useTransactionMachine();
  const { visible, add } = useNotificationQueue();
  const { celebrate } = useCelebrations();
  const haptics = useHaptics();
  const announce = useAccessibleAnnounce();

  // Focus trap for modal
  useFocusTrap(modalRef, { returnFocus: true });

  // Handle state transitions
  useEffect(() => {
    const animation = getCurrentAnimation();
    console.log('State:', state, 'Animation:', animation);

    if (state === 'success') {
      celebrate('confetti', { intensity: 'high' });
      haptics.success();
      announce('Transaction completed successfully', 'assertive');
      add({
        message: 'Transaction confirmed!',
        priority: 'success',
        duration: 5000,
      });
    } else if (state === 'error') {
      haptics.error();
      announce(`Transaction failed: ${context.error}`, 'assertive');
      add({
        message: context.error || 'Transaction failed',
        priority: 'error',
      });
    }
  }, [state, context, celebrate, haptics, announce, add, getCurrentAnimation]);

  return (
    <div ref={modalRef} className="transaction-modal">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl"
      >
        {state === 'inputting' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Send Transaction</h2>
            <input className="w-full mb-3 p-2 border rounded" placeholder="To address" />
            <input className="w-full mb-3 p-2 border rounded" placeholder="Amount" />
            <button
              onClick={() => send({ type: 'VALIDATE' })}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Next
            </button>
          </div>
        )}

        {state === 'validating' && (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span>Validating transaction...</span>
          </div>
        )}

        {state === 'success' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">✅ Success!</h2>
            <p>Transaction hash: {context.txHash}</p>
            <button
              onClick={() => send({ type: 'RESET' })}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>

      {/* Notification display */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {visible.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-4 rounded-lg shadow-lg ${
              notification.priority === 'success' ? 'bg-green-500' :
              notification.priority === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ==============================================
// EXAMPLE 3: VIRTUALIZED WALLET LIST
// ==============================================

export function WalletListView() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setWallets(generateMockWallets(100));
      setIsLoading(false);
    }, 2000);
  }, []);

  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setWallets(generateMockWallets(100));
  };

  return (
    <SmartSkeleton
      isLoading={isLoading}
      skeleton={
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <WalletCardSkeleton key={i} />
          ))}
        </div>
      }
      morphDuration={600}
    >
      <VirtualizedList
        items={wallets}
        height={600}
        itemHeight={120}
        overscan={2}
        renderItem={(wallet: any) => (
          <EnhancedWalletCard
            {...wallet}
            onSelect={() => console.log('Selected', wallet.address)}
          />
        )}
        enterAnimation="slideUp"
        pullToRefresh={true}
        onRefresh={handleRefresh}
      />
    </SmartSkeleton>
  );
}

// ==============================================
// EXAMPLE 4: THEME SWITCHER
// ==============================================

export function ThemeSwitcher() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { mode, toggleMode } = useThemeMode();
  const { glow } = useCelebrations();
  const { medium } = useHaptics();
  const announce = useAccessibleAnnounce();

  // Enable time-based theming
  useTimeBasedTheming({
    enabled: true,
    dimAtNight: true,
    sunriseSunset: true,
  });

  const handleToggle = async () => {
    medium();
    toggleMode();
    
    if (buttonRef.current) {
      await glow(buttonRef.current, 500);
    }

    const newMode = mode === 'degen' ? 'regen' : 'degen';
    announce(`Switched to ${newMode} mode`, 'polite');
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
    >
      {mode === 'degen' ? '🔥' : '🌱'} {mode}
    </button>
  );
}

// ==============================================
// EXAMPLE 5: COMPLETE APP INTEGRATION
// ==============================================

export function EnhancedWalletApp() {
  // Initialize animation engine
  useEffect(() => {
    AnimationEngine.initialize();
    
    // Enable profiler in development
    if (process.env.NODE_ENV === 'development') {
      AnimationEngine.getProfiler().enable();
    }

    return () => {
      AnimationEngine.getProfiler().disable();
    };
  }, []);

  return (
    <div className="app min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="p-4 bg-white dark:bg-gray-800 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Paradexx Wallet</h1>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="p-4">
        <WalletListView />
      </main>

      <TransactionFlow />
    </div>
  );
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function generateMockWallets(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    address: `0x${Math.random().toString(16).slice(2, 42)}`,
    balance: Math.random() * 10000,
    name: `Wallet ${i + 1}`,
    priceHistory: Array.from({ length: 10 }, () => Math.random() * 1000),
  }));
}

export default EnhancedWalletApp;
