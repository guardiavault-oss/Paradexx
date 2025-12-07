import { motion } from 'motion/react';
import {
  Inbox,
  Search,
  Wallet,
  Activity,
  Image,
  FileText,
  Users,
  Shield,
  Zap,
  TrendingUp,
  LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  type?: 'degen' | 'regen';
  variant?: 'default' | 'minimal' | 'illustration';
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  type = 'degen',
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center py-8 ${className}`}
      >
        <Icon className="w-12 h-12 mx-auto mb-3 text-white/40" />
        <p className="text-sm text-white/60">{title}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-center py-12 px-6 ${className}`}
    >
      {/* Icon with animation */}
      <motion.div
        className="relative inline-flex mb-6"
        animate={
          variant === 'illustration'
            ? {
                y: [0, -10, 0],
              }
            : {
                rotate: [0, -10, 10, -10, 0],
              }
        }
        transition={{
          duration: variant === 'illustration' ? 3 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 blur-2xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
          }}
        />

        {/* Icon container */}
        <div
          className="relative w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{
            background: `${accentColor}20`,
            border: `2px solid ${accentColor}40`,
          }}
        >
          <Icon className="w-12 h-12" style={{ color: accentColor }} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl font-bold text-white mb-2"
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-white/60 max-w-md mx-auto mb-6"
        >
          {description}
        </motion.p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          {action && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className="px-6 py-3 rounded-xl font-bold text-white"
              style={{
                background: accentColor,
              }}
            >
              {action.label}
            </motion.button>
          )}
          {secondaryAction && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={secondaryAction.onClick}
              className="px-6 py-3 rounded-xl font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
            >
              {secondaryAction.label}
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Preset empty states
export function EmptyTransactions({ type = 'degen' }: { type?: 'degen' | 'regen' }) {
  return (
    <EmptyState
      icon={Activity}
      title="No Transactions Yet"
      description="Your transaction history will appear here once you start trading."
      type={type}
    />
  );
}

export function EmptyWallet({ type = 'degen', onAddFunds }: { type?: 'degen' | 'regen'; onAddFunds?: () => void }) {
  return (
    <EmptyState
      icon={Wallet}
      title="Your Wallet is Empty"
      description="Add funds to start trading and exploring the crypto universe."
      action={
        onAddFunds
          ? {
              label: 'Add Funds',
              onClick: onAddFunds,
            }
          : undefined
      }
      type={type}
    />
  );
}

export function EmptyNFTs({ type = 'degen', onExplore }: { type?: 'degen' | 'regen'; onExplore?: () => void }) {
  return (
    <EmptyState
      icon={Image}
      title="No NFTs in Your Collection"
      description="Start collecting NFTs and they'll appear here in your gallery."
      action={
        onExplore
          ? {
              label: 'Explore NFTs',
              onClick: onExplore,
            }
          : undefined
      }
      type={type}
    />
  );
}

export function EmptySearch({ query, type = 'degen' }: { query?: string; type?: 'degen' | 'regen' }) {
  return (
    <EmptyState
      icon={Search}
      title={query ? `No results for "${query}"` : 'No Results Found'}
      description="Try adjusting your search or filters to find what you're looking for."
      type={type}
      variant="default"
    />
  );
}

export function EmptyActivity({ type = 'degen' }: { type?: 'degen' | 'regen' }) {
  return (
    <EmptyState
      icon={Activity}
      title="No Activity Yet"
      description="Your recent activity will show up here."
      type={type}
    />
  );
}

export function EmptyGuardians({ type = 'degen', onAddGuardian }: { type?: 'degen' | 'regen'; onAddGuardian?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No Guardians Added"
      description="Add trusted guardians to help recover your wallet in case you lose access."
      action={
        onAddGuardian
          ? {
              label: 'Add Guardian',
              onClick: onAddGuardian,
            }
          : undefined
      }
      type={type}
    />
  );
}

export function EmptyAlerts({ type = 'degen' }: { type?: 'degen' | 'regen' }) {
  return (
    <EmptyState
      icon={Shield}
      title="No Security Alerts"
      description="All systems are secure. You'll see alerts here if anything needs your attention."
      type={type}
    />
  );
}

export function EmptyPriceAlerts({ type = 'degen', onCreateAlert }: { type?: 'degen' | 'regen'; onCreateAlert?: () => void }) {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No Price Alerts Set"
      description="Create price alerts to get notified when your tokens hit target prices."
      action={
        onCreateAlert
          ? {
              label: 'Create Alert',
              onClick: onCreateAlert,
            }
          : undefined
      }
      type={type}
    />
  );
}

export function EmptyConnections({ type = 'degen', onConnect }: { type?: 'degen' | 'regen'; onConnect?: () => void }) {
  return (
    <EmptyState
      icon={Zap}
      title="No Connected dApps"
      description="Connect to dApps using WalletConnect to interact with the DeFi ecosystem."
      action={
        onConnect
          ? {
              label: 'Connect dApp',
              onClick: onConnect,
            }
          : undefined
      }
      type={type}
    />
  );
}

// Inline empty state (smaller, for sections)
export function EmptyStateInline({
  icon: Icon = Inbox,
  message,
  type = 'degen',
}: {
  icon?: LucideIcon;
  message: string;
  type?: 'degen' | 'regen';
}) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
        style={{
          background: `${accentColor}20`,
          border: `1px solid ${accentColor}40`,
        }}
      >
        <Icon className="w-6 h-6" style={{ color: accentColor }} />
      </div>
      <p className="text-sm text-white/60">{message}</p>
    </div>
  );
}
