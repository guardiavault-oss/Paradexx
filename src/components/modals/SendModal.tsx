import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeStyles } from '../../design-system';
import {
  X,
  Send,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  BookUser,
  Plus,
  Edit2,
  Trash2,
  Star,
  User,
  Loader2,
} from 'lucide-react';
import { useTokenPrices } from '../../hooks/useMarketData';
import { useTokenBalances } from '../../hooks/api/useWallet';
import { useAuth } from '../../contexts/AuthContext';

interface SendModalProps {
  type: 'degen' | 'regen';
  onClose: () => void;
  walletAddress?: string;
  chainId?: number;
}

interface Contact {
  id: string;
  name: string;
  address: string;
  isFavorite?: boolean;
  emoji?: string;
}

interface TokenOption {
  symbol: string;
  name: string;
  balance: string;
  icon: string;
  price?: number;
}

// Token icon mapping
const TOKEN_ICONS: Record<string, string> = {
  ETH: '⟠',
  WETH: '⟠',
  USDC: '💵',
  USDT: '₮',
  DAI: '◈',
  WBTC: '₿',
  UNI: '🦄',
  LINK: '⛓️',
  AAVE: '👻',
  ARB: '🔷',
  OP: '🔴',
  MATIC: '🟣',
};

// Default tokens as fallback
const DEFAULT_TOKENS: TokenOption[] = [
  { symbol: 'ETH', name: 'Ethereum', balance: '0', icon: '⟠' },
  { symbol: 'USDC', name: 'USD Coin', balance: '0', icon: '💵' },
  { symbol: 'DAI', name: 'Dai Stablecoin', balance: '0', icon: '◈' },
];

export function SendModal({ type, onClose, walletAddress, chainId = 1 }: SendModalProps) {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'send' | 'addressbook'>('send');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

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
  const { data: tokenData, isLoading: tokensLoading } = useTokenBalances(
    walletAddress || '',
    chainName,
    { enabled: !!walletAddress && !!session }
  );

  // Transform API tokens to component format
  const tokens: TokenOption[] = useMemo(() => {
    if (!tokenData || tokenData.length === 0) return DEFAULT_TOKENS;

    return tokenData.map((t: any) => ({
      symbol: t.symbol,
      name: t.name || t.symbol,
      balance: t.balance?.toString() || '0',
      icon: TOKEN_ICONS[t.symbol?.toUpperCase()] || '🪙',
      price: t.price,
    }));
  }, [tokenData]);

  const [selectedToken, setSelectedToken] = useState<TokenOption>(DEFAULT_TOKENS[0]);

  // Update selected token when real data loads
  useEffect(() => {
    if (tokens.length > 0 && tokens !== DEFAULT_TOKENS) {
      setSelectedToken(tokens[0]);
    }
  }, [tokens]);

  // Fetch real ETH price from API
  const { prices } = useTokenPrices(['ETH']);
  const ethPrice = useMemo(() => prices?.ETH?.price || 2500, [prices]);

  // Address book state
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: "Mom's Wallet",
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      isFavorite: true,
      emoji: '👩',
    },
    {
      id: '2',
      name: 'Trading Account',
      address: '0x8b2a1D9c4E5f6B8A9c1e2d3f4A5B6c7D8e9f0A1B',
      isFavorite: true,
      emoji: '💼',
    },
    {
      id: '3',
      name: 'Hardware Wallet',
      address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
      emoji: '🔐',
    },
    {
      id: '4',
      name: 'Friend Alice',
      address: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e',
      emoji: '👤',
    },
    {
      id: '5',
      name: 'DeFi Protocol',
      address: '0x5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c',
      emoji: '🏦',
    },
  ]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Use design system theme styles
  const theme = getThemeStyles(type);
  const accentColor = theme.primaryColor;

  const handleSend = async () => {
    if (!recipient || !amount || !walletAddress) return;

    setStatus('sending');

    try {
      const { apiServices } = await import('@/services');
      const response = await apiServices.wallet.sendTransaction({
        from: walletAddress,
        to: recipient,
        amount,
        token: selectedToken.symbol,
        chainId,
      });

      if (response.success) {
        setStatus('success');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(response.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Send error:', error);
      setStatus('error');
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setRecipient(contact.address);
    setActiveTab('send');
  };

  const handleAddContact = () => {
    if (!newContactName || !newContactAddress) return;

    const newContact: Contact = {
      id: Date.now().toString(),
      name: newContactName,
      address: newContactAddress,
      emoji: '👤',
    };

    setContacts([...contacts, newContact]);
    setNewContactName('');
    setNewContactAddress('');
    setShowAddContact(false);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((c: Contact) => c.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setContacts(
      contacts.map((c: Contact) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  // Calculate USD value using real price (falls back to 2500 if price unavailable)
  const usdValue = parseFloat(amount || '0') * (selectedToken.symbol === 'ETH' ? ethPrice : 1);

  const favoriteContacts = contacts.filter((c: Contact) => c.isFavorite);
  const regularContacts = contacts.filter((c: Contact) => !c.isFavorite);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[var(--bg-overlay)] backdrop-blur-[var(--blur-md)]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-neutral)] bg-[var(--bg-surface)] shadow-[var(--shadow-2xl)] backdrop-blur-[var(--blur-xl)]"
        style={{
          boxShadow: `0 0 60px ${accentColor}40`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-neutral)] p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              {activeTab === 'send' ? (
                <Send className="h-5 w-5" style={{ color: accentColor }} />
              ) : (
                <BookUser className="h-5 w-5" style={{ color: accentColor }} />
              )}
            </div>
            <div>
              <h2 className="text-[var(--text-primary)]">
                {activeTab === 'send' ? 'Send Crypto' : 'Address Book'}
              </h2>
              <p className="text-[var(--text-muted)] text-[var(--text-xs)]">
                {activeTab === 'send' ? 'Transfer tokens to any address' : 'Manage your contacts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-hover)] transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
            title="Close send modal"
            aria-label="Close send modal"
          >
            <X className="h-4 w-4 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mx-6 mt-4 flex gap-2 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] p-1">
          <button
            onClick={() => setActiveTab('send')}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all"
            style={{
              background: activeTab === 'send' ? accentColor : 'transparent',
              color: activeTab === 'send' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            <Send className="h-4 w-4" />
            Send
          </button>
          <button
            onClick={() => setActiveTab('addressbook')}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all"
            style={{
              background: activeTab === 'addressbook' ? accentColor : 'transparent',
              color: activeTab === 'addressbook' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            <BookUser className="h-4 w-4" />
            Contacts
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'send' && (
              <motion.div
                key="send"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 p-6"
              >
                {/* Token Selector */}
                <div>
                  <label className="mb-2 block text-[var(--text-sm)] text-[var(--text-tertiary)]">
                    Token
                  </label>
                  <button
                    onClick={() => setShowTokenSelect(!showTokenSelect)}
                    className="flex w-full items-center justify-between rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-4 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedToken.icon}</span>
                      <div className="text-left">
                        <p className="text-[var(--text-primary)]">{selectedToken.symbol}</p>
                        <p className="text-[var(--text-muted)] text-[var(--text-xs)]">
                          Balance: {selectedToken.balance}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-[var(--text-muted)]" />
                  </button>

                  {/* Token Dropdown */}
                  <AnimatePresence>
                    {showTokenSelect && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-surface)]"
                      >
                        {tokens.map(token => (
                          <button
                            key={token.symbol}
                            onClick={() => {
                              setSelectedToken(token);
                              setShowTokenSelect(false);
                            }}
                            className="flex w-full items-center gap-3 p-3 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-hover)]"
                          >
                            <span className="text-xl">{token.icon}</span>
                            <div className="flex-1 text-left">
                              <p className="text-[var(--text-primary)] text-[var(--text-sm)]">
                                {token.symbol}
                              </p>
                              <p className="text-[var(--text-muted)] text-[var(--text-xs)]">
                                {token.name}
                              </p>
                            </div>
                            <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                              {token.balance}
                            </p>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Recipient Address */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                      Recipient Address
                    </label>
                    <button
                      onClick={() => setActiveTab('addressbook')}
                      className="flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--bg-hover)] px-2 py-1 text-[var(--text-xs)] transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                      style={{ color: accentColor }}
                    >
                      <BookUser className="h-3 w-3" />
                      Contacts
                    </button>
                  </div>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRecipient(e.target.value)
                    }
                    placeholder="0x... or select from contacts"
                    className="placeholder:[var(--text-muted)] w-full rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-4 text-[var(--text-primary)] transition-all duration-[var(--duration-normal)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>

                {/* Amount */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                      Amount
                    </label>
                    <button
                      onClick={() => setAmount(selectedToken.balance)}
                      className="rounded-[var(--radius-md)] bg-[var(--bg-hover)] px-2 py-1 text-[var(--text-xs)] transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                      style={{ color: accentColor }}
                    >
                      Max
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAmount(e.target.value)
                      }
                      placeholder="0.0"
                      className="placeholder:[var(--text-muted)] w-full rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-4 text-[var(--text-primary)] text-[var(--text-xl)] transition-all duration-[var(--duration-normal)] focus:border-[var(--border-strong)] focus:outline-none"
                    />
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[var(--text-muted)]">
                      {selectedToken.symbol}
                    </div>
                  </div>
                  {amount && (
                    <p className="mt-2 text-[var(--text-muted)] text-[var(--text-sm)]">
                      ≈ $
                      {usdValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>

                {/* Status Messages */}
                <AnimatePresence>
                  {status === 'sending' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--regen-primary)]/20 bg-[var(--regen-primary)]/10 p-4"
                    >
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--regen-secondary)] border-t-transparent" />
                      <p className="text-[var(--regen-secondary)] text-[var(--text-sm)]">
                        Sending transaction...
                      </p>
                    </motion.div>
                  )}

                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--regen-primary)]/20 bg-[var(--regen-primary)]/10 p-4"
                    >
                      <CheckCircle2 className="h-5 w-5 text-[var(--regen-primary)]" />
                      <p className="text-[var(--regen-primary)] text-[var(--text-sm)]">
                        Transaction sent successfully!
                      </p>
                    </motion.div>
                  )}

                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--degen-primary)]/20 bg-[var(--degen-primary)]/10 p-4"
                    >
                      <AlertCircle className="h-5 w-5 text-[var(--degen-primary)]" />
                      <p className="text-[var(--degen-primary)] text-[var(--text-sm)]">
                        Transaction failed. Please try again.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    disabled={status === 'sending'}
                    className="flex-1 rounded-[var(--radius-xl)] bg-[var(--bg-hover)] px-4 py-3 text-[var(--text-primary)] transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!recipient || !amount || status === 'sending' || status === 'success'}
                    className="flex-1 rounded-[var(--radius-xl)] px-4 py-3 text-[var(--text-primary)] transition-all duration-[var(--duration-normal)] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: accentColor,
                      opacity: !recipient || !amount ? 0.5 : 1,
                    }}
                  >
                    {status === 'sending' ? 'Sending...' : status === 'success' ? 'Sent!' : 'Send'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'addressbook' && (
              <motion.div
                key="addressbook"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 p-6"
              >
                {/* Add Contact Button */}
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--border-neutral)] p-4 text-[var(--text-tertiary)] transition-all duration-[var(--duration-normal)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add New Contact</span>
                </button>

                {/* Add Contact Form */}
                <AnimatePresence>
                  {showAddContact && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-4"
                    >
                      <input
                        type="text"
                        value={newContactName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewContactName(e.target.value)
                        }
                        placeholder="Contact name"
                        className="placeholder:[var(--text-muted)] w-full rounded-[var(--radius-lg)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-3 text-[var(--text-primary)] text-[var(--text-sm)] focus:border-[var(--border-strong)] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newContactAddress}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewContactAddress(e.target.value)
                        }
                        placeholder="0x..."
                        className="placeholder:[var(--text-muted)] w-full rounded-[var(--radius-lg)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-3 text-[var(--text-primary)] text-[var(--text-sm)] focus:border-[var(--border-strong)] focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowAddContact(false);
                            setNewContactName('');
                            setNewContactAddress('');
                          }}
                          className="flex-1 rounded-[var(--radius-lg)] bg-[var(--bg-hover)] px-3 py-2 text-[var(--text-primary)] text-[var(--text-sm)] transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddContact}
                          disabled={!newContactName || !newContactAddress}
                          className="flex-1 rounded-[var(--radius-lg)] px-3 py-2 text-[var(--text-primary)] text-[var(--text-sm)] transition-all duration-[var(--duration-normal)] disabled:opacity-50"
                          style={{ backgroundColor: accentColor }}
                        >
                          Add
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Favorites */}
                {favoriteContacts.length > 0 && (
                  <div>
                    <h3 className="mb-2 px-1 tracking-wider text-[var(--text-muted)] text-[var(--text-xs)] uppercase">
                      Favorites
                    </h3>
                    <div className="space-y-2">
                      {favoriteContacts.map(contact => (
                        <motion.button
                          key={contact.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectContact(contact)}
                          className="group flex w-full items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-4 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                        >
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            {contact.emoji}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-[var(--font-weight-medium)] text-[var(--text-primary)]">
                              {contact.name}
                            </p>
                            <p className="font-mono text-[var(--text-muted)] text-[var(--text-xs)]">
                              {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleToggleFavorite(contact.id);
                              }}
                              className="rounded-[var(--radius-lg)] p-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                              title="Toggle favorite"
                              aria-label="Toggle favorite"
                            >
                              <Star className="h-4 w-4 fill-[var(--degen-secondary)] text-[var(--degen-secondary)]" />
                            </button>
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                              className="rounded-[var(--radius-lg)] p-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--degen-primary)]/20"
                              title="Delete contact"
                              aria-label="Delete contact"
                            >
                              <Trash2 className="h-4 w-4 text-[var(--degen-primary)]" />
                            </button>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Contacts */}
                {regularContacts.length > 0 && (
                  <div>
                    <h3 className="mb-2 px-1 tracking-wider text-[var(--text-muted)] text-[var(--text-xs)] uppercase">
                      All Contacts
                    </h3>
                    <div className="space-y-2">
                      {regularContacts.map(contact => (
                        <motion.button
                          key={contact.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectContact(contact)}
                          className="group flex w-full items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--border-neutral)] bg-[var(--bg-hover)] p-4 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                        >
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            {contact.emoji}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-[var(--font-weight-medium)] text-[var(--text-primary)]">
                              {contact.name}
                            </p>
                            <p className="font-mono text-[var(--text-muted)] text-[var(--text-xs)]">
                              {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleToggleFavorite(contact.id);
                              }}
                              className="rounded-[var(--radius-lg)] p-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-active)]"
                              title="Toggle favorite"
                              aria-label="Toggle favorite"
                            >
                              <Star className="h-4 w-4 text-[var(--text-muted)]" />
                            </button>
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                              className="rounded-[var(--radius-lg)] p-2 transition-all duration-[var(--duration-normal)] hover:bg-[var(--degen-primary)]/20"
                              title="Delete contact"
                              aria-label="Delete contact"
                            >
                              <Trash2 className="h-4 w-4 text-[var(--degen-primary)]" />
                            </button>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {contacts.length === 0 && !showAddContact && (
                  <div className="py-12 text-center">
                    <BookUser className="mx-auto mb-3 h-12 w-12 text-[var(--text-muted)]" />
                    <p className="mb-2 text-[var(--text-muted)]">No contacts yet</p>
                    <p className="text-[var(--text-muted)] text-[var(--text-sm)]">
                      Add your first contact to get started
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
