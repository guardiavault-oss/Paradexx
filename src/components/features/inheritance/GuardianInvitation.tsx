import { motion, AnimatePresence } from "motion/react";
import { Shield, Mail, MessageSquare, CheckCircle2, Clock, UserPlus, Copy, Check } from "lucide-react";
import { useState } from "react";

interface Guardian {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address: string;
  status: 'invited' | 'accepted' | 'active' | 'declined';
  invitedAt?: Date;
  acceptedAt?: Date;
  trustScore?: number;
  responseTime?: number;
}

interface GuardianInvitationProps {
  guardians: Guardian[];
  onInvite: (type: 'email' | 'sms', contact: string) => void;
  onRemove?: (guardianId: string) => void;
  loading?: boolean;
}

export function GuardianInvitation({
  guardians,
  onInvite,
  onRemove,
  loading = false,
}: GuardianInvitationProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState<'email' | 'sms'>('email');
  const [contact, setContact] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeGuardians = guardians.filter(g => g.status === 'active').length;
  const pendingInvites = guardians.filter(g => g.status === 'invited').length;

  const handleInvite = () => {
    if (!contact) return;
    onInvite(inviteType, contact);
    setContact('');
    setShowInviteModal(false);
  };

  const copyAddress = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: Guardian['status']) => {
    switch (status) {
      case 'active': return 'var(--success-bright)';
      case 'accepted': return 'var(--accent-primary)';
      case 'invited': return 'var(--warning)';
      case 'declined': return 'var(--error-bright)';
      default: return '#808080';
    }
  };

  const getStatusIcon = (status: Guardian['status']) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-5 h-5" />;
      case 'accepted': return <CheckCircle2 className="w-5 h-5" />;
      case 'invited': return <Clock className="w-5 h-5" />;
      case 'declined': return <span className="text-lg">✕</span>;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 backdrop-blur-xl rounded-2xl"
        style={{
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-neutral)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Guardian Network</h3>
            <p className="text-sm text-gray-400">
              {activeGuardians} active · {pendingInvites} pending
            </p>
          </div>
          <Shield className="w-8 h-8 text-[var(--success-bright)]" />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 rounded-xl bg-gray-800/30">
            <div className="text-2xl font-bold text-white">{activeGuardians}</div>
            <div className="text-xs text-gray-400 mt-1">Active</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-800/30">
            <div className="text-2xl font-bold text-[var(--warning)]">{pendingInvites}</div>
            <div className="text-xs text-gray-400 mt-1">Pending</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-800/30">
            <div className="text-2xl font-bold text-[var(--accent-primary)]">{guardians.length}</div>
            <div className="text-xs text-gray-400 mt-1">Total</div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowInviteModal(true)}
          className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-[var(--success-bright)] to-[var(--accent-primary)] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Invite Guardian
        </motion.button>
      </motion.div>

      {/* Guardian list */}
      <div className="space-y-3">
        {guardians.map((guardian, idx) => (
          <motion.div
            key={guardian.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-5 backdrop-blur-xl rounded-xl"
            style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-neutral)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 flex-1">
                <motion.div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: `${getStatusColor(guardian.status)}20`,
                    border: `2px solid ${getStatusColor(guardian.status)}`,
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  <div style={{ color: getStatusColor(guardian.status) }}>
                    {getStatusIcon(guardian.status)}
                  </div>
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-semibold text-white">
                      {guardian.name || 'Anonymous Guardian'}
                    </h4>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: `${getStatusColor(guardian.status)}20`,
                        color: getStatusColor(guardian.status),
                      }}
                    >
                      {guardian.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs text-gray-400 font-mono">
                      {guardian.address.slice(0, 6)}...{guardian.address.slice(-4)}
                    </code>
                    <button
                      onClick={() => copyAddress(guardian.address, guardian.id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedId === guardian.id ? (
                        <Check className="w-3 h-3 text-[var(--success-bright)]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {guardian.email && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {guardian.email}
                    </div>
                  )}
                  {guardian.phone && (
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MessageSquare className="w-3 h-3" />
                      {guardian.phone}
                    </div>
                  )}

                  {guardian.trustScore !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="text-xs text-gray-400">Trust Score:</div>
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[var(--success-bright)] to-[var(--accent-primary)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${guardian.trustScore}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-white">{guardian.trustScore}%</div>
                    </div>
                  )}

                  {guardian.responseTime !== undefined && guardian.status === 'active' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Avg response: {guardian.responseTime}h
                    </div>
                  )}
                </div>
              </div>

              {onRemove && guardian.status !== 'active' && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRemove(guardian.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <span className="text-lg">✕</span>
                </motion.button>
              )}
            </div>

            {guardian.invitedAt && guardian.status === 'invited' && (
              <div className="mt-3 text-xs text-gray-500">
                Invited {new Date(guardian.invitedAt).toLocaleDateString()}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 backdrop-blur-xl rounded-2xl"
              style={{
                background: 'rgba(10, 10, 15, 0.95)',
                border: '1px solid rgba(128, 128, 128, 0.2)',
              }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Invite Guardian</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Invite via</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInviteType('email')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                        inviteType === 'email'
                          ? 'bg-[var(--success-bright)] text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </button>
                    <button
                      onClick={() => setInviteType('sms')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                        inviteType === 'sms'
                          ? 'bg-[var(--success-bright)] text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      SMS
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    {inviteType === 'email' ? 'Email Address' : 'Phone Number'}
                  </label>
                  <input
                    type={inviteType === 'email' ? 'email' : 'tel'}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={inviteType === 'email' ? 'guardian@example.com' : '+1 (555) 000-0000'}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--success-bright)] transition-colors"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 px-4 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={!contact || loading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-[var(--success-bright)] to-[var(--accent-primary)] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
