'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Shield, Trash2, Edit, AlertCircle, CheckCircle, X, Save } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toastService } from '@/lib/toast'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import EmptyState from '@/app/components/EmptyState'
import FormField from '@/app/components/FormField'
import ChainSelector from '@/app/components/ChainSelector'

interface SecurityRule {
  rule_id: string
  wallet_address: string
  rule_type: string
  parameters: Record<string, any>
  created_at: string
  active: boolean
}

const RULE_TYPES = [
  { value: 'max_value', label: 'Maximum Transaction Value', description: 'Block transactions above a certain value' },
  { value: 'whitelist_only', label: 'Whitelist Only', description: 'Only allow transactions to whitelisted addresses' },
  { value: 'require_approval', label: 'Require Approval', description: 'Require manual approval for all transactions' },
  { value: 'block_contracts', label: 'Block Contracts', description: 'Block all contract interactions' },
  { value: 'time_limit', label: 'Time Limit', description: 'Only allow transactions during specific hours' },
  { value: 'daily_limit', label: 'Daily Limit', description: 'Limit total value per day' }
]

export default function SecurityRulesPage() {
  const [rules, setRules] = useState<SecurityRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState('')
  const [formData, setFormData] = useState({
    wallet_address: '',
    rule_type: 'max_value',
    parameters: {} as Record<string, any>
  })
  const [walletAddress, setWalletAddress] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; ruleId: string | null }>({
    isOpen: false,
    ruleId: null
  })

  useEffect(() => {
    if (walletAddress) {
      fetchRules(walletAddress)
    }
  }, [walletAddress])

  const fetchRules = async (address: string) => {
    try {
      setLoading(true)
      const data = await apiClient.getSecurityRules(address)
      setRules(data.rules || [])
    } catch (error) {
      console.error('Failed to fetch security rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.wallet_address)) {
      toastService.error('Invalid wallet address format. Please enter a valid Ethereum address.')
      return
    }

    const loadingToast = toastService.loading('Creating security rule...')

    try {
      await apiClient.createSecurityRule(formData)
      toast.dismiss(loadingToast)
      toastService.success('Security rule created successfully')
      setShowAddModal(false)
      setFormData({ wallet_address: '', rule_type: 'max_value', parameters: {} })
      if (formData.wallet_address) {
        fetchRules(formData.wallet_address)
      }
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to create rule')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    setConfirmDelete({ isOpen: true, ruleId })
  }

  const confirmDeleteRule = async () => {
    if (!confirmDelete.ruleId) return
    
    const loadingToast = toastService.loading('Deleting security rule...')
    
    try {
      await apiClient.deleteSecurityRule(confirmDelete.ruleId)
      toast.dismiss(loadingToast)
      toastService.success('Security rule deleted successfully')
      setConfirmDelete({ isOpen: false, ruleId: null })
      if (walletAddress) {
        fetchRules(walletAddress)
      }
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to delete rule')
    }
  }

  const getRuleTypeLabel = (type: string) => {
    return RULE_TYPES.find(r => r.value === type)?.label || type
  }

  const getRuleTypeDescription = (type: string) => {
    return RULE_TYPES.find(r => r.value === type)?.description || ''
  }

  const renderParameterInputs = () => {
    switch (formData.rule_type) {
      case 'max_value':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Value (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.parameters.max_value || ''}
              onChange={(e) => setFormData({
                ...formData,
                parameters: { ...formData.parameters, max_value: parseFloat(e.target.value) }
              })}
              className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
              placeholder="10.0"
            />
          </div>
        )
      case 'time_limit':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Hour (0-23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={formData.parameters.start_hour || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, start_hour: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Hour (0-23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={formData.parameters.end_hour || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, end_hour: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
              />
            </div>
          </div>
        )
      case 'daily_limit':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Limit (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.parameters.daily_limit || ''}
              onChange={(e) => setFormData({
                ...formData,
                parameters: { ...formData.parameters, daily_limit: parseFloat(e.target.value) }
              })}
              className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
              placeholder="100.0"
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            Security Rules
          </h1>
          <p className="mt-2 text-gray-400">
            Create and manage custom security rules for your wallets
          </p>
        </div>
        <motion.button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 border border-cyber-blue/30 backdrop-blur-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          Create Rule
        </motion.button>
      </motion.div>

      {/* Wallet Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
      >
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Search Rules by Wallet Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono backdrop-blur-md"
          />
          <motion.button
            onClick={() => walletAddress && fetchRules(walletAddress)}
            className="px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 border border-cyber-blue/30 backdrop-blur-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Search
          </motion.button>
        </div>
      </motion.div>

      {/* Rules List */}
      {loading ? (
        <div className="rounded-2xl backdrop-blur-md border border-cyan-500/30 p-12 text-center" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
          <div className="cyber-spinner mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-2xl backdrop-blur-md border border-cyan-500/30 p-12 text-center" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No security rules found</p>
          <p className="text-sm text-gray-500 mt-2">Create a rule to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {rules.map((rule, index) => (
              <motion.div
                key={rule.rule_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card relative overflow-hidden"
                style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyber-blue/20 border border-cyber-blue/30">
                      <Shield className="w-5 h-5 text-cyber-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {getRuleTypeLabel(rule.rule_type)}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {getRuleTypeDescription(rule.rule_type)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.rule_id)}
                    className="p-2 text-cyber-orange hover:bg-cyber-orange/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Wallet Address</p>
                    <p className="text-sm font-mono text-cyan-400 break-all">
                      {rule.wallet_address.slice(0, 6)}...{rule.wallet_address.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span className={`px-2 py-1 text-xs rounded border ${
                      rule.active
                        ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {Object.keys(rule.parameters).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Parameters</p>
                      <div className="bg-black/30 p-2 rounded border border-cyan-500/20">
                        <pre className="text-xs text-gray-300 font-mono">
                          {JSON.stringify(rule.parameters, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-cyan-500/30">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(rule.created_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Rule Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl shadow-cyan-500/20 p-6 w-full max-w-md border border-cyan-500/30"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Create Security Rule</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={formData.wallet_address}
                    onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rule Type
                  </label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value, parameters: {} })}
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
                  >
                    {RULE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {getRuleTypeDescription(formData.rule_type)}
                  </p>
                </div>

                {renderParameterInputs()}

                <div className="flex gap-3 pt-4">
                  <motion.button
                    onClick={handleCreateRule}
                    className="flex-1 px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 border border-cyber-blue/30 backdrop-blur-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create Rule
                  </motion.button>
                  <motion.button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 border border-gray-500/30 backdrop-blur-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, ruleId: null })}
        onConfirm={confirmDeleteRule}
        title="Delete Security Rule"
        message="Are you sure you want to delete this security rule? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

