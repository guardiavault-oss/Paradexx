import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import { X, Search, Plus, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTokenBalances } from '../../hooks/api/useWallet';
import { useAuth } from '../../contexts/AuthContext';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  address?: string;
  isVisible: boolean;
  isCustom?: boolean;
  icon?: string;
}

interface TokenManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'degen' | 'regen';
  walletAddress?: string;
  chainId?: number;
}

// Default tokens when API is unavailable
const DEFAULT_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', balance: '0', value: '$0', isVisible: true },
  { symbol: 'USDC', name: 'USD Coin', balance: '0', value: '$0', isVisible: true },
  { symbol: 'DAI', name: 'Dai Stablecoin', balance: '0', value: '$0', isVisible: true },
];

export function TokenManagementModal({
  isOpen,
  onClose,
  type = 'degen',
  walletAddress,
  chainId = 1,
}: TokenManagementModalProps) {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [hideSpam, setHideSpam] = useState(true);

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  // Map chainId to chain name
  const chainName = useMemo(() => {
    const chains: Record<number, 'eth' | 'polygon' | 'arbitrum' | 'optimism' | 'base'> = {
      1: 'eth',
      137: 'polygon',
      42161: 'arbitrum',
      10: 'optimism',
      8453: 'base',
    };
    return chains[chainId] || 'eth';
  }, [chainId]);

  // Fetch real token balances
  const { data: tokenData } = useTokenBalances(walletAddress || '', chainName, {
    enabled: !!walletAddress && !!session && isOpen,
  });

  // Transform API data to component format
  const apiTokens = useMemo<Token[]>(() => {
    if (!tokenData || tokenData.length === 0) return DEFAULT_TOKENS;

    return tokenData.map(
      (t: {
        symbol: string;
        name?: string;
        balance?: string | number;
        valueUsd?: string;
        address?: string;
      }) => ({
        symbol: t.symbol,
        name: t.name || t.symbol,
        balance: t.balance?.toString() || '0',
        value: t.valueUsd ? `$${parseFloat(t.valueUsd).toLocaleString()}` : '$0',
        address: t.address,
        isVisible: parseFloat(t.balance?.toString() || '0') > 0,
        isCustom: false,
      })
    );
  }, [tokenData]);

  // Track user visibility overrides
  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, boolean>>({});

  // Merge API data with user overrides
  const tokens = useMemo(() => {
    return apiTokens.map(t => ({
      ...t,
      isVisible: visibilityOverrides[t.symbol] ?? t.isVisible,
    }));
  }, [apiTokens, visibilityOverrides]);

  const toggleVisibility = (symbol: string) => {
    setVisibilityOverrides(prev => ({
      ...prev,
      [symbol]: !tokens.find(t => t.symbol === symbol)?.isVisible,
    }));
  };

  const handleImport = () => {
    // Simulate token import
    if (customAddress) {
      setTokens([
        ...tokens,
        {
          symbol: 'PEPE',
          name: 'Pepe',
          balance: '0.00',
          value: '$0.00',
          address: customAddress,
          isVisible: true,
          isCustom: true,
        },
      ]);
      setCustomAddress('');
      setActiveTab('list');
    }
  };

  const filteredTokens = tokens.filter(
    t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h2 className="font-black tracking-tight text-white uppercase">Manage Tokens</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5 text-white/50" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10 p-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 rounded-lg py-2 text-xs font-black tracking-wider uppercase transition-all ${
                activeTab === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Token List
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 rounded-lg py-2 text-xs font-black tracking-wider uppercase transition-all ${
                activeTab === 'import'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Import Custom
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'list' ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search name or symbol..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pr-4 pl-10 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                  />
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-xs tracking-wider text-white/50 uppercase">
                    {filteredTokens.length} tokens
                  </span>
                  <button
                    onClick={() => setHideSpam(!hideSpam)}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-all ${
                      hideSpam ? 'text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                    style={
                      hideSpam
                        ? {
                            background: `${accentColor}20`,
                            color: accentColor,
                          }
                        : {}
                    }
                  >
                    {hideSpam ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-white/40" />
                    )}
                    <span className="font-black tracking-wider uppercase">Hide Spam</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {filteredTokens.map(token => (
                    <div
                      key={token.symbol}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3 transition-all hover:border-white/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--color-purple)] text-xs font-black text-white">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{token.name}</div>
                          <div className="text-xs text-white/50">
                            {token.balance} {token.symbol}
                          </div>
                        </div>
                      </div>

                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={token.isVisible}
                          onChange={() => toggleVisibility(token.symbol)}
                        />
                        <div
                          className="peer h-6 w-11 rounded-full peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
                          style={{
                            background: token.isVisible ? accentColor : 'rgba(255,255,255,0.1)',
                          }}
                        ></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-400" />
                  <div className="text-xs text-yellow-200">
                    Anyone can create a token, including fake versions of existing tokens. Learn
                    about scams and security risks.
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold tracking-wider text-white/50 uppercase">
                      Token Contract Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customAddress}
                      onChange={e => setCustomAddress(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                    />
                  </div>

                  {customAddress.length > 10 && (
                    <div className="space-y-2 rounded-xl border border-white/10 bg-black/40 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="tracking-wider text-white/50 uppercase">Symbol</span>
                        <span className="font-bold text-white">PEPE</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="tracking-wider text-white/50 uppercase">Decimals</span>
                        <span className="font-bold text-white">18</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleImport}
                    disabled={!customAddress}
                    className="w-full rounded-xl py-3 font-black tracking-wider text-white uppercase transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${isDegen ? '#8B0000' : '#000080'} 100%)`,
                      boxShadow: `0 0 30px ${accentColor}40`,
                    }}
                  >
                    Import Token
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
