import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

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
    setContacts(contacts.filter(c => c.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
  };

  const usdValue = parseFloat(amount || '0') * 2500; // Mock ETH price

  const favoriteContacts = contacts.filter(c => c.isFavorite);
  const regularContacts = contacts.filter(c => !c.isFavorite);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          boxShadow: `0 0 60px ${accentColor}40`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
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
              <h2 className="text-white">
                {activeTab === 'send' ? 'Send Crypto' : 'Address Book'}
              </h2>
              <p className="text-xs text-white/40">
                {activeTab === 'send' ? 'Transfer tokens to any address' : 'Manage your contacts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 p-1 mx-6 mt-4 rounded-xl">
          <button
            onClick={() => setActiveTab('send')}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'send' ? accentColor : 'transparent',
              color: activeTab === 'send' ? 'white' : 'rgba(255, 255, 255, 0.6)',
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
              color: activeTab === 'addressbook' ? 'white' : 'rgba(255, 255, 255, 0.6)',
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
                  <label className="block text-sm text-white/60 mb-2">Token</label>
                  <button
                    onClick={() => setShowTokenSelect(!showTokenSelect)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedToken.icon}</span>
                      <div className="text-left">
                        <p className="text-white">{selectedToken.symbol}</p>
                        <p className="text-xs text-white/40">Balance: {selectedToken.balance}</p>
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  </button>

                  {/* Token Dropdown */}
                  <AnimatePresence>
                    {showTokenSelect && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 bg-zinc-800/50 border border-white/10 rounded-xl overflow-hidden"
                      >
                        {tokens.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => {
                              setSelectedToken(token);
                              setShowTokenSelect(false);
                            }}
                            className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                          >
                            <span className="text-xl">{token.icon}</span>
                            <div className="text-left flex-1">
                              <p className="text-white text-sm">{token.symbol}</p>
                              <p className="text-xs text-white/40">{token.name}</p>
                            </div>
                            <p className="text-sm text-white/60">{token.balance}</p>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Recipient Address */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/60">Recipient Address</label>
                    <button
                      onClick={() => setActiveTab('addressbook')}
                      className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1"
                      style={{ color: accentColor }}
                    >
                      <BookUser className="w-3 h-3" />
                      Contacts
                    </button>
                  </div>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x... or select from contacts"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/60">Amount</label>
                    <button
                      onClick={() => setAmount(selectedToken.balance)}
                      className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                      style={{ color: accentColor }}
                    >
                      Max
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white text-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                      {selectedToken.symbol}
                    </div>
                  </div>
                  {amount && (
                    <p className="text-sm text-white/40 mt-2">
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
                      className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3"
                    >
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-blue-400">Sending transaction...</p>
                    </motion.div>
                  )}

                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <p className="text-sm text-green-400">Transaction sent successfully!</p>
                    </motion.div>
                  )}

                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-sm text-red-400">Transaction failed. Please try again.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    disabled={status === 'sending'}
                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!recipient || !amount || status === 'sending' || status === 'success'}
                    className="flex-1 py-3 px-4 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full p-4 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors flex items-center justify-center gap-2 text-white/60 hover:text-white"
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
                      className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                    >
                      <input
                        type="text"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Contact name"
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 text-sm"
                      />
                      <input
                        type="text"
                        value={newContactAddress}
                        onChange={(e) => setNewContactAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowAddContact(false);
                            setNewContactName('');
                            setNewContactAddress('');
                          }}
                          className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddContact}
                          disabled={!newContactName || !newContactAddress}
                          className="flex-1 py-2 px-3 rounded-lg text-white text-sm transition-all disabled:opacity-50"
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
                    <h3 className="text-xs text-white/40 uppercase tracking-wider mb-2 px-1">Favorites</h3>
                    <div className="space-y-2">
                      {favoriteContacts.map((contact) => (
                        <motion.button
                          key={contact.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectContact(contact)}
                          className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-3 group"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            {contact.emoji}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white font-medium">{contact.name}</p>
                            <p className="text-xs text-white/40 font-mono">
                              {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(contact.id);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
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
                    <h3 className="text-xs text-white/40 uppercase tracking-wider mb-2 px-1">All Contacts</h3>
                    <div className="space-y-2">
                      {regularContacts.map((contact) => (
                        <motion.button
                          key={contact.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectContact(contact)}
                          className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-3 group"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            {contact.emoji}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white font-medium">{contact.name}</p>
                            <p className="text-xs text-white/40 font-mono">
                              {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(contact.id);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Star className="w-4 h-4 text-white/40" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
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
                    <BookUser className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 mb-2">No contacts yet</p>
                    <p className="text-sm text-white/30">Add your first contact to get started</p>
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
