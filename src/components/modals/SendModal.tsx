import React, { useState } from 'react';
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
} from 'lucide-react';

interface SendModalProps {
  type: 'degen' | 'regen';
  onClose: () => void;
}

interface Contact {
  id: string;
  name: string;
  address: string;
  isFavorite?: boolean;
  emoji?: string;
}

export function SendModal({ type, onClose }: SendModalProps) {
  const [activeTab, setActiveTab] = useState<'send' | 'addressbook'>('send');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState({
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '2.5',
    icon: '⟠',
  });
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Address book state
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'Mom\'s Wallet', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', isFavorite: true, emoji: '👩' },
    { id: '2', name: 'Trading Account', address: '0x8b2a1D9c4E5f6B8A9c1e2d3f4A5B6c7D8e9f0A1B', isFavorite: true, emoji: '💼' },
    { id: '3', name: 'Hardware Wallet', address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t', emoji: '🔐' },
    { id: '4', name: 'Friend Alice', address: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e', emoji: '👤' },
    { id: '5', name: 'DeFi Protocol', address: '0x5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c', emoji: '🏦' },
  ]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Use design system theme styles
  const theme = getThemeStyles(type);
  const accentColor = theme.primaryColor;

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', balance: '2.5', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', balance: '10000', icon: '💵' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.05', icon: '₿' },
    { symbol: 'DAI', name: 'Dai Stablecoin', balance: '5000', icon: '◈' },
  ];

  const handleSend = async () => {
    if (!recipient || !amount) return;

    setStatus('sending');

    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    setStatus('success');
    setTimeout(() => {
      onClose();
    }, 2000);
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
    setContacts(contacts.map((c: Contact) =>
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
  };

  const usdValue = parseFloat(amount || '0') * 2500; // Mock ETH price

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
        className="relative w-full max-w-md bg-[var(--bg-surface)] backdrop-blur-[var(--blur-xl)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-2xl)] border border-[var(--border-neutral)] overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          boxShadow: `0 0 60px ${accentColor}40`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-neutral)]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              {activeTab === 'send' ? (
                <Send className="w-5 h-5" style={{ color: accentColor }} />
              ) : (
                <BookUser className="w-5 h-5" style={{ color: accentColor }} />
              )}
            </div>
            <div>
              <h2 className="text-[var(--text-primary)]">
                {activeTab === 'send' ? 'Send Crypto' : 'Address Book'}
              </h2>
              <p className="text-[var(--text-xs)] text-[var(--text-muted)]">
                {activeTab === 'send' ? 'Transfer tokens to any address' : 'Manage your contacts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] flex items-center justify-center transition-all duration-[var(--duration-normal)]"
            title="Close send modal"
            aria-label="Close send modal"
          >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[var(--bg-hover)] p-1 mx-6 mt-4 rounded-[var(--radius-xl)]">
          <button
            onClick={() => setActiveTab('send')}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'send' ? accentColor : 'transparent',
              color: activeTab === 'send' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            <Send className="w-4 h-4" />
            Send
          </button>
          <button
            onClick={() => setActiveTab('addressbook')}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'addressbook' ? accentColor : 'transparent',
              color: activeTab === 'addressbook' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            <BookUser className="w-4 h-4" />
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
                className="p-6 space-y-6"
              >
                {/* Token Selector */}
                <div>
                  <label className="block text-[var(--text-sm)] text-[var(--text-tertiary)] mb-2">Token</label>
                  <button
                    onClick={() => setShowTokenSelect(!showTokenSelect)}
                    className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] flex items-center justify-between hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedToken.icon}</span>
                      <div className="text-left">
                        <p className="text-[var(--text-primary)]">{selectedToken.symbol}</p>
                        <p className="text-[var(--text-xs)] text-[var(--text-muted)]">Balance: {selectedToken.balance}</p>
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                  </button>

                  {/* Token Dropdown */}
                  <AnimatePresence>
                    {showTokenSelect && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 bg-[var(--bg-surface)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] overflow-hidden"
                      >
                        {tokens.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => {
                              setSelectedToken(token);
                              setShowTokenSelect(false);
                            }}
                            className="w-full p-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] transition-all duration-[var(--duration-normal)]"
                          >
                            <span className="text-xl">{token.icon}</span>
                            <div className="text-left flex-1">
                              <p className="text-[var(--text-primary)] text-[var(--text-sm)]">{token.symbol}</p>
                              <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{token.name}</p>
                            </div>
                            <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">{token.balance}</p>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Recipient Address */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[var(--text-sm)] text-[var(--text-tertiary)]">Recipient Address</label>
                    <button
                      onClick={() => setActiveTab('addressbook')}
                      className="text-[var(--text-xs)] px-2 py-1 rounded-[var(--radius-md)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)] flex items-center gap-1"
                      style={{ color: accentColor }}
                    >
                      <BookUser className="w-3 h-3" />
                      Contacts
                    </button>
                  </div>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipient(e.target.value)}
                    placeholder="0x... or select from contacts"
                    className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] text-[var(--text-primary)] placeholder:[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-all duration-[var(--duration-normal)]"
                  />
                </div>

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[var(--text-sm)] text-[var(--text-tertiary)]">Amount</label>
                    <button
                      onClick={() => setAmount(selectedToken.balance)}
                      className="text-[var(--text-xs)] px-2 py-1 rounded-[var(--radius-md)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-all duration-[var(--duration-normal)]"
                      style={{ color: accentColor }}
                    >
                      Max
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] text-[var(--text-primary)] text-[var(--text-xl)] placeholder:[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-all duration-[var(--duration-normal)]"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      {selectedToken.symbol}
                    </div>
                  </div>
                  {amount && (
                    <p className="text-[var(--text-sm)] text-[var(--text-muted)] mt-2">
                      ≈ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      className="p-4 bg-[var(--regen-primary)]/10 border border-[var(--regen-primary)]/20 rounded-[var(--radius-xl)] flex items-center gap-3"
                    >
                      <div className="w-5 h-5 border-2 border-[var(--regen-secondary)] border-t-transparent rounded-full animate-spin" />
                      <p className="text-[var(--text-sm)] text-[var(--regen-secondary)]">Sending transaction...</p>
                    </motion.div>
                  )}

                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-[var(--regen-primary)]/10 border border-[var(--regen-primary)]/20 rounded-[var(--radius-xl)] flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[var(--regen-primary)]" />
                      <p className="text-[var(--text-sm)] text-[var(--regen-primary)]">Transaction sent successfully!</p>
                    </motion.div>
                  )}

                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-[var(--degen-primary)]/10 border border-[var(--degen-primary)]/20 rounded-[var(--radius-xl)] flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-[var(--degen-primary)]" />
                      <p className="text-[var(--text-sm)] text-[var(--degen-primary)]">Transaction failed. Please try again.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    disabled={status === 'sending'}
                    className="flex-1 py-3 px-4 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-[var(--radius-xl)] text-[var(--text-primary)] transition-all duration-[var(--duration-normal)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!recipient || !amount || status === 'sending' || status === 'success'}
                    className="flex-1 py-3 px-4 rounded-[var(--radius-xl)] text-[var(--text-primary)] transition-all duration-[var(--duration-normal)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="p-6 space-y-4"
              >
                {/* Add Contact Button */}
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="w-full p-4 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--border-neutral)] hover:border-[var(--border-strong)] transition-all duration-[var(--duration-normal)] flex items-center justify-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Contact</span>
                </button>

                {/* Add Contact Form */}
                <AnimatePresence>
                  {showAddContact && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 p-4 bg-[var(--bg-hover)] rounded-[var(--radius-xl)] border border-[var(--border-neutral)] overflow-hidden"
                    >
                      <input
                        type="text"
                        value={newContactName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactName(e.target.value)}
                        placeholder="Contact name"
                        className="w-full p-3 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] text-[var(--text-sm)]"
                      />
                      <input
                        type="text"
                        value={newContactAddress}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full p-3 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-lg)] text-[var(--text-primary)] placeholder:[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] text-[var(--text-sm)]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowAddContact(false);
                            setNewContactName('');
                            setNewContactAddress('');
                          }}
                          className="flex-1 py-2 px-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-[var(--text-sm)] transition-all duration-[var(--duration-normal)]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddContact}
                          disabled={!newContactName || !newContactAddress}
                          className="flex-1 py-2 px-3 rounded-[var(--radius-lg)] text-[var(--text-primary)] text-[var(--text-sm)] transition-all duration-[var(--duration-normal)] disabled:opacity-50"
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
                    <h3 className="text-[var(--text-xs)] text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">Favorites</h3>
                    <div className="space-y-2">
                      {favoriteContacts.map((contact) => (
                        <motion.button
                          key={contact.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectContact(contact)}
                          className="w-full p-4 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] transition-all duration-[var(--duration-normal)] flex items-center gap-3 group"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            {contact.emoji}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-[var(--text-primary)] font-[var(--font-weight-medium)]">{contact.name}</p>
                            <p className="text-[var(--text-xs)] text-[var(--text-muted)] font-mono">
                              {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleToggleFavorite(contact.id);
                              }}
                              className="p-2 hover:bg-[var(--bg-active)] rounded-[var(--radius-lg)] transition-all duration-[var(--duration-normal)]"
                              title="Toggle favorite"
                              aria-label="Toggle favorite"
                            >
                              <Star className="w-4 h-4 text-[var(--degen-secondary)] fill-[var(--degen-secondary)]" />
                            </button>
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                              className="p-2 hover:bg-[var(--degen-primary)]/20 rounded-[var(--radius-lg)] transition-all duration-[var(--duration-normal)]"
                              title="Delete contact"
                              aria-label="Delete contact"
                            >
                              <Trash2 className="w-4 h-4 text-[var(--degen-primary)]" />
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
                    <h3 className="text-[var(--text-xs)] text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">All Contacts</h3>
                    <div className="space-y-2">
                      {regularContacts.map((contact) => (
                        <motion.button
                          key={contact.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectContact(contact)}
                          className="w-full p-4 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] transition-all duration-[var(--duration-normal)] flex items-center gap-3 group"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            {contact.emoji}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-[var(--text-primary)] font-[var(--font-weight-medium)]">{contact.name}</p>
                            <p className="text-[var(--text-xs)] text-[var(--text-muted)] font-mono">
                              {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleToggleFavorite(contact.id);
                              }}
                              className="p-2 hover:bg-[var(--bg-active)] rounded-[var(--radius-lg)] transition-all duration-[var(--duration-normal)]"
                              title="Toggle favorite"
                              aria-label="Toggle favorite"
                            >
                              <Star className="w-4 h-4 text-[var(--text-muted)]" />
                            </button>
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                              className="p-2 hover:bg-[var(--degen-primary)]/20 rounded-[var(--radius-lg)] transition-all duration-[var(--duration-normal)]"
                              title="Delete contact"
                              aria-label="Delete contact"
                            >
                              <Trash2 className="w-4 h-4 text-[var(--degen-primary)]" />
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
                    <BookUser className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-muted)] mb-2">No contacts yet</p>
                    <p className="text-[var(--text-sm)] text-[var(--text-muted)]">Add your first contact to get started</p>
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
