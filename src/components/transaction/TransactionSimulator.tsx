import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeStyles } from '../../design-system';
import {
  Play,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  XCircle,
  Clock,
  Fuel,
  Shield,
  Zap,
  Info,
  Wallet,
  RefreshCw,
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
  Lock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceUSD?: number;
  logo?: string;
}

interface TransactionSimulatorProps {
  type: 'degen' | 'regen';
  walletAddress?: string;
  tokens?: Token[];
  ethBalance?: string;
  ethPrice?: number;
  onExecute?: (txHash: string) => void;
  className?: string;
}

type GasSpeed = 'slow' | 'standard' | 'fast';

const gasSpeedConfig = {
  slow: { label: 'Slow', icon: Clock, color: 'text-blue-400', time: '~5 min' },
  standard: { label: 'Standard', icon: Zap, color: 'text-yellow-400', time: '~2 min' },
  fast: { label: 'Fast', icon: Fuel, color: 'text-green-400', time: '~30 sec' },
};

// Mock simulation result
const mockSimulationResult = {
  success: true,
  expectedOutcome: 'success' as const,
  gasCostETH: '0.0023',
  gasPriceGwei: '25',
  gasCostUSD: 4.6,
  riskAssessment: {
    level: 'low' as const,
    score: 15,
    warnings: [],
    recommendations: ['Transaction will complete successfully', 'Gas price is optimal'],
  },
  balanceChanges: [
    { symbol: 'ETH', change: '-0.5', isPositive: false, changeUSD: 1000 },
    { symbol: 'USDC', change: '+1000', isPositive: true, changeUSD: 1000 },
  ],
  tokenApprovals: [],
  contractInteractions: [],
  simulationId: 'sim_' + Math.random().toString(36).substr(2, 9),
};

export function TransactionSimulator({
  type,
  walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0b4c9',
  tokens = [],
  ethBalance = '2.5',
  ethPrice = 2000,
  onExecute,
  className = '',
}: TransactionSimulatorProps) {
  const isDegen = type === 'degen';
  const primaryColor = isDegen ? '#DC143C' : '#0080FF';
  const secondaryColor = isDegen ? '#8B0000' : '#000080';

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>('ETH');
  const [gasSpeed, setGasSpeed] = useState<GasSpeed>('standard');
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<typeof mockSimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const allTokens = useMemo(() => {
    const eth: Token = {
      address: 'ETH',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      balance: ethBalance,
      balanceUSD: parseFloat(ethBalance) * ethPrice,
    };
    return [eth, ...tokens];
  }, [tokens, ethBalance, ethPrice]);

  const currentToken = useMemo(
    () => allTokens.find((t) => t.symbol === selectedToken) || allTokens[0],
    [allTokens, selectedToken]
  );

  const handleMaxAmount = useCallback(() => {
    if (currentToken) {
      setAmount(currentToken.balance);
    }
  }, [currentToken]);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSimulate = async () => {
    if (!recipient || !amount) {
      setSimulationError('Please enter recipient address and amount');
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);
    setSimulationResult(null);

    // Simulate API call
    setTimeout(() => {
      setSimulationResult(mockSimulationResult);
      setIsSimulating(false);
    }, 1500);
  };

  const handleExecute = async () => {
    if (!simulationResult?.success || !simulationResult.simulationId) return;
    onExecute?.(simulationResult.simulationId);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden bg-[var(--bg-base)]/40 backdrop-blur-xl border border-[var(--border-neutral)]/10"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-neutral)]/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl border"
                style={{
                  background: `${primaryColor}20`,
                  borderColor: `${primaryColor}40`,
                }}
              >
                <Shield className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">
                  Transaction Simulator
                </h2>
                <p className="text-xs text-[var(--text-primary)]/50">Pre-execution risk analysis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-white/10">
          {/* Left Panel - Input Form */}
          <div className="p-6 space-y-5">
            {/* Recipient Address */}
            <div>
              <label className="text-xs text-[var(--text-primary)]/50 mb-2 block font-medium uppercase tracking-wider">
                Recipient Address
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-primary)]/30" />
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[var(--bg-base)]/40 border border-[var(--border-neutral)]/10 rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-white/30 outline-none focus:border-[var(--border-neutral)]/30 transition-colors"
                />
              </div>
            </div>

            {/* Amount with Token Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[var(--text-primary)]/50 font-medium uppercase tracking-wider">
                  Amount
                </label>
                <span className="text-xs text-[var(--text-primary)]/40">
                  Balance: {parseFloat(currentToken?.balance || '0').toFixed(4)} {currentToken?.symbol}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-[var(--bg-base)]/40 border border-[var(--border-neutral)]/10 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-white/30 outline-none focus:border-[var(--border-neutral)]/30 transition-colors"
                  />
                  <button
                    onClick={handleMaxAmount}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
                    style={{ color: primaryColor }}
                  >
                    MAX
                  </button>
                </div>

                {/* Token Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                    className="flex items-center gap-2 bg-[var(--bg-base)]/40 border border-[var(--border-neutral)]/10 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] hover:border-[var(--border-neutral)]/20 transition-colors min-w-[120px]"
                  >
                    <span className="font-bold">{selectedToken}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showTokenDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showTokenDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-base)]/95 backdrop-blur-xl border border-[var(--border-neutral)]/10 rounded-xl overflow-hidden z-50 shadow-xl"
                      >
                        {allTokens.map((token) => (
                          <button
                            key={token.address}
                            onClick={() => {
                              setSelectedToken(token.symbol);
                              setShowTokenDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors ${selectedToken === token.symbol ? 'bg-white/10' : ''
                              }`}
                          >
                            <span className="font-bold text-[var(--text-primary)]">{token.symbol}</span>
                            <span className="text-[var(--text-primary)]/40 text-xs ml-auto">
                              {parseFloat(token.balance).toFixed(4)}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Gas Settings */}
            <div>
              <label className="text-xs text-[var(--text-primary)]/50 mb-3 block font-medium uppercase tracking-wider">
                Transaction Speed
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(gasSpeedConfig) as GasSpeed[]).map((speed) => {
                  const config = gasSpeedConfig[speed];
                  const Icon = config.icon;
                  const isSelected = gasSpeed === speed;

                  return (
                    <motion.button
                      key={speed}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setGasSpeed(speed)}
                      className={`relative p-3 rounded-xl border transition-all ${isSelected
                          ? 'bg-white/10 border-[var(--border-neutral)]/30'
                          : 'bg-[var(--bg-base)]/40 border-[var(--border-neutral)]/10 hover:border-[var(--border-neutral)]/20'
                        }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon
                          className={`w-4 h-4 ${isSelected ? config.color : 'text-[var(--text-primary)]/40'}`}
                        />
                        <span
                          className={`text-xs font-medium ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]/50'}`}
                        >
                          {config.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-primary)]/40">{config.time}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Simulate Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSimulate}
              disabled={isSimulating || !recipient || !amount}
              className="w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: `0 0 30px ${primaryColor}40`,
              }}
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Simulate Transaction
                </>
              )}
            </motion.button>

            {simulationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs text-red-400">{simulationError}</span>
              </motion.div>
            )}
          </div>

          {/* Right Panel - Simulation Results */}
          <div className="p-6 bg-[var(--bg-base)]/20">
            <AnimatePresence mode="wait">
              {!simulationResult && !isSimulating ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="p-4 rounded-2xl bg-[var(--bg-base)]/40 border border-[var(--border-neutral)]/10 mb-4">
                    <Shield className="w-10 h-10 text-[var(--text-primary)]/20" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]/50 mb-2 uppercase tracking-wider">
                    No Simulation Yet
                  </h3>
                  <p className="text-xs text-[var(--text-primary)]/30 max-w-[200px]">
                    Enter transaction details and click simulate to see the risk analysis
                  </p>
                </motion.div>
              ) : isSimulating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center py-12"
                >
                  <div className="relative">
                    <motion.div
                      className="w-16 h-16 rounded-full border-4 border-[var(--border-neutral)]/20"
                      style={{ borderTopColor: primaryColor }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <Shield
                      className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div className="mt-6 space-y-2 text-center">
                    <p className="text-sm text-[var(--text-primary)] font-bold uppercase tracking-wider">Simulating Transaction</p>
                    <p className="text-xs text-[var(--text-primary)]/50">Analyzing risks and state changes...</p>
                  </div>
                </motion.div>
              ) : simulationResult ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Expected Outcome */}
                  <div
                    className={`p-4 rounded-xl border ${simulationResult.expectedOutcome === 'success'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {simulationResult.expectedOutcome === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p
                          className={`text-sm font-black uppercase tracking-wider ${simulationResult.expectedOutcome === 'success'
                              ? 'text-green-400'
                              : 'text-red-400'
                            }`}
                        >
                          {simulationResult.expectedOutcome === 'success'
                            ? 'Transaction will succeed'
                            : 'Transaction will fail'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Gas Estimate */}
                  <div className="p-4 rounded-xl bg-[var(--bg-base)]/40 border border-[var(--border-neutral)]/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-[var(--text-primary)]/50" />
                        <span className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider">
                          Estimated Gas Cost
                        </span>
                      </div>
                      <span className="text-xs text-[var(--text-primary)]/40">{simulationResult.gasPriceGwei} Gwei</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-[var(--text-primary)]">
                        {simulationResult.gasCostETH} ETH
                      </span>
                      <span className="text-sm text-[var(--text-primary)]/50">
                        ≈ ${simulationResult.gasCostUSD.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="p-4 rounded-xl bg-[var(--bg-base)]/40 border border-[var(--border-neutral)]/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--text-primary)]/50" />
                        <span className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider">
                          Risk Assessment
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-black uppercase ${getRiskColor(simulationResult.riskAssessment.level)}`}
                      >
                        {simulationResult.riskAssessment.level}
                      </span>
                    </div>

                    {/* Risk Score Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--text-primary)]/40">Risk Score</span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                          {simulationResult.riskAssessment.score}/100
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${simulationResult.riskAssessment.score}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${simulationResult.riskAssessment.score <= 30
                              ? 'bg-green-500'
                              : simulationResult.riskAssessment.score <= 60
                                ? 'bg-yellow-500'
                                : simulationResult.riskAssessment.score <= 80
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                            }`}
                        />
                      </div>
                    </div>

                    {/* Recommendations */}
                    {simulationResult.riskAssessment.recommendations.length > 0 && (
                      <div className="space-y-1.5">
                        {simulationResult.riskAssessment.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-primary)]/70">
                            <span className="text-green-400">✓</span>
                            {rec}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Balance Changes */}
                  {simulationResult.balanceChanges.length > 0 && (
                    <div className="p-4 rounded-xl bg-[var(--bg-base)]/40 border border-[var(--border-neutral)]/10">
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowRight className="w-4 h-4 text-[var(--text-primary)]/50" />
                        <span className="text-xs text-[var(--text-primary)]/50 uppercase tracking-wider">
                          Balance Changes
                        </span>
                      </div>
                      <div className="space-y-2">
                        {simulationResult.balanceChanges.map((change, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                          >
                            <div className="flex items-center gap-2">
                              {change.isPositive ? (
                                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                              )}
                              <span className="text-xs text-[var(--text-primary)] font-bold">{change.symbol}</span>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-xs font-bold ${change.isPositive ? 'text-green-400' : 'text-red-400'}`}
                              >
                                {change.isPositive ? '+' : ''}
                                {change.change}
                              </span>
                              {change.changeUSD !== undefined && (
                                <span className="text-[10px] text-[var(--text-primary)]/40 ml-2">
                                  ≈ ${Math.abs(change.changeUSD).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execute Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExecute}
                    disabled={
                      !simulationResult.success || simulationResult.expectedOutcome === 'fail'
                    }
                    className="w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-500 text-[var(--text-primary)]"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Execute Transaction
                  </motion.button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default TransactionSimulator;
