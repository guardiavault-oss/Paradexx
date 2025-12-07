import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type TransactionState = 
  | 'pending' 
  | 'confirmed' 
  | 'failed' 
  | 'replaced' 
  | 'dropped';

export interface Transaction {
  hash: string;
  state: TransactionState;
  timestamp: Date;
  network: string;
  value?: string;
  gasPrice?: string;
  nonce?: number;
  replacedBy?: string; // Hash of replacement tx
  confirmations?: number;
  requiredConfirmations?: number;
  error?: string;
}

interface TransactionStateManagerProps {
  transaction: Transaction;
  onStateChange?: (hash: string, newState: TransactionState) => void;
  showProgress?: boolean;
  compact?: boolean;
}

const stateConfig = {
  pending: {
    label: 'Pending',
    icon: Loader2,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    animate: true,
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    animate: false,
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    animate: false,
  },
  replaced: {
    label: 'Replaced',
    icon: RefreshCw,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    animate: false,
  },
  dropped: {
    label: 'Dropped',
    icon: AlertTriangle,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    animate: false,
  },
};

export function TransactionStateManager({
  transaction,
  onStateChange,
  showProgress = true,
  compact = false,
}: TransactionStateManagerProps) {
  const config = stateConfig[transaction.state];
  const Icon = config.icon;

  const [previousState, setPreviousState] = useState<TransactionState>(transaction.state);

  useEffect(() => {
    if (previousState !== transaction.state) {
      onStateChange?.(transaction.hash, transaction.state);
      setPreviousState(transaction.state);
    }
  }, [transaction.state, transaction.hash, onStateChange, previousState]);

  const progress = transaction.confirmations && transaction.requiredConfirmations
    ? Math.min((transaction.confirmations / transaction.requiredConfirmations) * 100, 100)
    : 0;

  if (compact) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={transaction.state}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Badge 
            variant="outline" 
            className={`${config.bg} ${config.color} ${config.border} border`}
          >
            <Icon className={`w-3 h-3 mr-1.5 ${config.animate ? 'animate-spin' : ''}`} />
            {config.label}
          </Badge>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transaction.state}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`rounded-lg border p-3 ${config.bg} ${config.border}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
            <span className={`text-sm ${config.color}`}>
              {config.label}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {transaction.hash.slice(0, 8)}...{transaction.hash.slice(-6)}
          </span>
        </div>

        {/* Progress bar for pending confirmations */}
        {showProgress && transaction.state === 'pending' && transaction.confirmations !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Confirmations</span>
              <span>
                {transaction.confirmations} / {transaction.requiredConfirmations || 12}
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}

        {/* Error message for failed transactions */}
        {transaction.state === 'failed' && transaction.error && (
          <div className="mt-2 text-xs text-red-400">
            {transaction.error}
          </div>
        )}

        {/* Replacement info */}
        {transaction.state === 'replaced' && transaction.replacedBy && (
          <div className="mt-2 text-xs text-gray-400">
            Replaced by:{' '}
            <span className="font-mono text-orange-400">
              {transaction.replacedBy.slice(0, 10)}...
            </span>
          </div>
        )}

        {/* Additional transaction details */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span>{transaction.network}</span>
          <span>•</span>
          <span>{new Date(transaction.timestamp).toLocaleTimeString()}</span>
          {transaction.value && (
            <>
              <span>•</span>
              <span>{transaction.value}</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Transaction List Component with state management
 */
interface TransactionListProps {
  transactions: Transaction[];
  onStateChange?: (hash: string, newState: TransactionState) => void;
  maxItems?: number;
}

export function TransactionList({ 
  transactions, 
  onStateChange,
  maxItems = 10 
}: TransactionListProps) {
  const displayTransactions = transactions.slice(0, maxItems);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {displayTransactions.map((tx) => (
          <motion.div
            key={tx.hash}
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <TransactionStateManager
              transaction={tx}
              onStateChange={onStateChange}
              showProgress={true}
              compact={false}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
