import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Star, Copy, Check, UserPlus, Trash2, Clock, Plus } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export interface Contact {
  id: string;
  name: string;
  address: string;
  ensName?: string;
  category?: "personal" | "exchange" | "contract" | "favorite";
  notes?: string;
  addedAt: number;
  lastUsed?: number;
}

interface AddressBookProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact?: (contact: Contact) => void;
  type: "degen" | "regen";
}

export function AddressBook({
  isOpen,
  onClose,
  onSelectContact,
  type,
}: AddressBookProps) {
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";
  
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "1",
      name: "Mom's Wallet",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a",
      category: "personal",
      addedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastUsed: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: "2",
      name: "Binance Deposit",
      address: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
      category: "exchange",
      notes: "Don't forget memo!",
      addedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      lastUsed: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
    {
      id: "3",
      name: "vitalik.eth",
      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      ensName: "vitalik.eth",
      category: "favorite",
      addedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.ensName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const recentContacts = [...contacts]
    .filter((c) => c.lastUsed)
    .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
    .slice(0, 3);

  const recentContactIds = new Set(recentContacts.map((c) => c.id));
  const mainListContacts = filteredContacts.filter(
    (c) => !recentContactIds.has(c.id) || searchQuery,
  );

  const copyAddress = (contact: Contact) => {
    copyToClipboard(contact.address);
    setCopiedId(contact.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteContact = (id: string) => {
    if (confirm("Delete this contact?")) {
      setContacts(contacts.filter((c) => c.id !== id));
    }
  };

  const getCategoryIcon = (category?: Contact["category"]) => {
    switch (category) {
      case "favorite": return "⭐";
      case "exchange": return "🏦";
      case "contract": return "📝";
      default: return "👤";
    }
  };

  const getCategoryColor = (category?: Contact["category"]) => {
    switch (category) {
      case "favorite": return "#FFA500";
      case "exchange": return "#8B5CF6";
      case "contract": return primaryColor;
      default: return "rgba(255, 255, 255, 0.3)";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="address-book-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      />

      <motion.div
        key="address-book-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 md:inset-10 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-2xl lg:h-auto lg:max-h-[90vh] rounded-2xl z-50 flex flex-col"
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${primaryColor}40`,
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: `${primaryColor}20` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `${primaryColor}20` }}>
                <UserPlus className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-xl text-white">Address Book</h2>
                <p className="text-xs text-white/60">{contacts.length} contacts saved</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white placeholder-white/40 outline-none"
              style={{ border: `1px solid ${primaryColor}20` }}
            />
          </div>
        </div>

        {/* Recent Contacts */}
        {!searchQuery && recentContacts.length > 0 && (
          <div className="p-6 border-b" style={{ borderColor: `${primaryColor}20` }}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-white/60" />
              <span className="text-xs text-white/60">Recent</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    if (onSelectContact) {
                      onSelectContact(contact);
                      onClose();
                    }
                  }}
                  className="flex-shrink-0 p-3 rounded-xl transition-all"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${primaryColor}20`,
                  }}
                >
                  <div className="text-2xl mb-1">{getCategoryIcon(contact.category)}</div>
                  <div className="text-xs text-white mb-1">{contact.name}</div>
                  <div className="text-xs text-white/60 font-mono">
                    {contact.address.slice(0, 6)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-6">
          {mainListContacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📇</div>
              <p className="text-sm text-white/60 mb-2">
                {searchQuery ? "No contacts found" : "No contacts yet"}
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="text-sm hover:underline"
                style={{ color: primaryColor }}
              >
                Add your first contact
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {mainListContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-xl transition-all group"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${primaryColor}20`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ backgroundColor: `${getCategoryColor(contact.category)}20` }}
                    >
                      {getCategoryIcon(contact.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-white">{contact.name}</span>
                        {contact.category === "favorite" && (
                          <Star className="w-3 h-3 text-yellow-500" fill="#FFA500" />
                        )}
                      </div>

                      <div className="font-mono text-xs text-white/60 mb-1 break-all">
                        {contact.ensName || `${contact.address.slice(0, 10)}...${contact.address.slice(-8)}`}
                      </div>

                      {contact.notes && (
                        <p className="text-xs text-white/40 italic">{contact.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyAddress(contact)}
                        className="p-2 hover:bg-white/10 rounded-lg"
                        title="Copy address"
                      >
                        {copiedId === contact.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white/60" />
                        )}
                      </button>

                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="p-2 hover:bg-white/10 rounded-lg"
                        title="Delete contact"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-3 px-4 text-white rounded-xl transition-all flex items-center justify-center gap-2"
            style={{
              background: primaryColor,
              boxShadow: `0 4px 20px ${primaryColor}40`,
            }}
          >
            <Plus className="w-5 h-5" />
            <span>Add New Contact</span>
          </button>
        </div>
      </motion.div>

      {/* Add Contact Modal */}
      {isAdding && (
        <AddContactModal
          onAdd={(contact) => {
            setContacts([...contacts, { ...contact, id: Date.now().toString() }]);
            setIsAdding(false);
          }}
          onClose={() => setIsAdding(false)}
          type={type}
        />
      )}
    </AnimatePresence>
  );
}

// Add Contact Modal
interface AddContactModalProps {
  onAdd: (contact: Omit<Contact, "id">) => void;
  onClose: () => void;
  type: "degen" | "regen";
}

function AddContactModal({ onAdd, onClose, type }: AddContactModalProps) {
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<Contact["category"]>("personal");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    if (!name || !address) return;
    onAdd({
      name,
      address,
      category,
      notes: notes || undefined,
      addedAt: Date.now(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          border: `1px solid ${primaryColor}40`,
        }}
      >
        <div className="p-6">
          <h3 className="text-xl text-white mb-4">Add New Contact</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/60 mb-2 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mom's Wallet"
                className="w-full p-3 bg-white/5 rounded-xl text-white outline-none"
                style={{ border: `1px solid ${primaryColor}20` }}
              />
            </div>

            <div>
              <label className="text-xs text-white/60 mb-2 block">Address or ENS</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... or name.eth"
                className="w-full p-3 bg-white/5 rounded-xl text-white font-mono text-sm outline-none"
                style={{ border: `1px solid ${primaryColor}20` }}
              />
            </div>

            <div>
              <label className="text-xs text-white/60 mb-2 block">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {(["personal", "exchange", "contract", "favorite"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="p-3 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: category === cat ? primaryColor : `${primaryColor}20`,
                      background: category === cat ? `${primaryColor}20` : "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div className="text-2xl mb-1">
                      {cat === "personal" && "👤"}
                      {cat === "exchange" && "🏦"}
                      {cat === "contract" && "📝"}
                      {cat === "favorite" && "⭐"}
                    </div>
                    <div className="text-xs text-white/60 capitalize">{cat}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60 mb-2 block">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={2}
                className="w-full p-3 bg-white/5 rounded-xl text-white text-sm outline-none resize-none"
                style={{ border: `1px solid ${primaryColor}20` }}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 text-white rounded-xl transition-all"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${primaryColor}20`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!name || !address}
              className="flex-1 py-3 px-4 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: primaryColor }}
            >
              Add Contact
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}