'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Search, Plus, Trash2, Ban, Check, X } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toastService } from '@/lib/toast'
import toast from 'react-hot-toast'
import FormField from '@/app/components/FormField'

interface ReputationData {
  address: string
  reputation: string
  reputation_score: number
  risk_level: string
  risk_score: number
  tags: string[]
  is_blacklisted: boolean
  is_whitelisted: boolean
}

export default function ReputationPage() {
  const [activeTab, setActiveTab] = useState<'check' | 'blacklist' | 'whitelist'>('check')
  const [searchAddress, setSearchAddress] = useState('')
  const [reputationResult, setReputationResult] = useState<ReputationData | null>(null)
  const [blacklist, setBlacklist] = useState<string[]>([])
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [chainId, setChainId] = useState<number>(1)
  const [newBlacklistAddress, setNewBlacklistAddress] = useState('')
  const [newBlacklistReason, setNewBlacklistReason] = useState('')
  const [newWhitelistAddress, setNewWhitelistAddress] = useState('')
  const [newWhitelistLabel, setNewWhitelistLabel] = useState('')

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      const [blacklistData, whitelistData] = await Promise.all([
        apiClient.getBlacklist(),
        apiClient.getWhitelist()
      ])
      setBlacklist(blacklistData.addresses || [])
      setWhitelist(whitelistData.addresses || [])
    } catch (error) {
      console.error('Failed to fetch lists:', error)
    }
  }

  const handleCheckReputation = async () => {
    if (!searchAddress.trim()) {
      toastService.error('Please enter an address to check')
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(searchAddress)) {
      toastService.error('Invalid address format. Must be a valid Ethereum address.')
      return
    }

    setLoading(true)
    const loadingToast = toastService.loading('Checking address reputation...')

    try {
      const result = await apiClient.checkAddressReputation(searchAddress, chainId)
      toast.dismiss(loadingToast)
      toastService.success('Reputation check completed')
      setReputationResult(result)
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to check reputation')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToBlacklist = async () => {
    if (!newBlacklistAddress.trim()) {
      toastService.error('Please enter an address')
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newBlacklistAddress)) {
      toastService.error('Invalid address format. Must be a valid Ethereum address.')
      return
    }

    if (!newBlacklistReason.trim()) {
      toastService.error('Please provide a reason for blacklisting')
      return
    }

    const loadingToast = toastService.loading('Adding address to blacklist...')

    try {
      await apiClient.addToBlacklist(newBlacklistAddress, newBlacklistReason, chainId)
      toast.dismiss(loadingToast)
      toastService.success('Address added to blacklist successfully')
      setNewBlacklistAddress('')
      setNewBlacklistReason('')
      fetchLists()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to add to blacklist')
    }
  }

  const handleAddToWhitelist = async () => {
    if (!newWhitelistAddress.trim()) {
      toastService.error('Please enter an address')
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newWhitelistAddress)) {
      toastService.error('Invalid address format. Must be a valid Ethereum address.')
      return
    }

    const loadingToast = toastService.loading('Adding address to whitelist...')

    try {
      await apiClient.addToWhitelist(newWhitelistAddress, chainId, newWhitelistLabel || undefined)
      toast.dismiss(loadingToast)
      toastService.success('Address added to whitelist successfully')
      setNewWhitelistAddress('')
      setNewWhitelistLabel('')
      fetchLists()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to add to whitelist')
    }
  }

  const getReputationColor = (score: number) => {
    if (score >= 70) return 'text-cyber-green'
    if (score >= 40) return 'text-cyber-yellow'
    return 'text-cyber-orange'
  }

  const getReputationBgColor = (score: number) => {
    if (score >= 70) return 'bg-cyber-green/20 border-cyber-green/30'
    if (score >= 40) return 'bg-cyber-yellow/20 border-cyber-yellow/30'
    return 'bg-cyber-orange/20 border-cyber-orange/30'
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
            Address Reputation
          </h1>
          <p className="mt-2 text-gray-400">
            Check address reputation and manage blacklist/whitelist
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-cyan-500/30"
      >
        {(['check', 'blacklist', 'whitelist'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-cyber-blue border-b-2 border-cyber-blue'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </motion.div>

      {/* Check Reputation Tab */}
      {activeTab === 'check' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
            style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyber-blue/20 border border-cyber-blue/30">
                <Search className="w-5 h-5 text-cyber-blue" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Check Address Reputation
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono backdrop-blur-md"
                />
              </div>

              <motion.button
                onClick={handleCheckReputation}
                disabled={loading}
                className="w-full px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 disabled:opacity-50 disabled:cursor-not-allowed border border-cyber-blue/30 backdrop-blur-md font-medium"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Checking...' : 'Check Reputation'}
              </motion.button>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
            style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyber-purple/20 border border-cyber-purple/30">
                <Shield className="w-5 h-5 text-cyber-purple" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Reputation Results
              </h2>
            </div>

            {reputationResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${getReputationBgColor(reputationResult.reputation_score)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Reputation Score</span>
                    <span className={`px-3 py-1 rounded-full text-white font-bold border ${getReputationBgColor(reputationResult.reputation_score)} ${getReputationColor(reputationResult.reputation_score)}`}>
                      {reputationResult.reputation_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-3 mt-2 overflow-hidden">
                    <motion.div
                      className={`h-3 rounded-full ${
                        reputationResult.reputation_score >= 70 ? 'bg-cyber-green' :
                        reputationResult.reputation_score >= 40 ? 'bg-cyber-yellow' :
                        'bg-cyber-orange'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${reputationResult.reputation_score}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-400">Reputation Level</p>
                    <p className="text-lg font-semibold text-white capitalize">
                      {reputationResult.reputation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Risk Level</p>
                    <span className={`px-2 py-1 text-xs rounded border ${
                      reputationResult.risk_level === 'low' ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' :
                      reputationResult.risk_level === 'medium' ? 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30' :
                      'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30'
                    }`}>
                      {reputationResult.risk_level.toUpperCase()}
                    </span>
                  </div>
                  {reputationResult.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {reputationResult.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-cyber-blue/20 text-cyber-blue text-xs rounded border border-cyber-blue/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-2">
                    {reputationResult.is_blacklisted && (
                      <span className="flex items-center gap-2 text-cyber-orange">
                        <Ban className="w-4 h-4" />
                        Blacklisted
                      </span>
                    )}
                    {reputationResult.is_whitelisted && (
                      <span className="flex items-center gap-2 text-cyber-green">
                        <CheckCircle className="w-4 h-4" />
                        Whitelisted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>Enter an address and click "Check Reputation"</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Blacklist Tab */}
      {activeTab === 'blacklist' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
            style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5 text-cyber-orange" />
              Add to Blacklist
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={newBlacklistAddress}
                  onChange={(e) => setNewBlacklistAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono backdrop-blur-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={newBlacklistReason}
                  onChange={(e) => setNewBlacklistReason(e.target.value)}
                  placeholder="Reason for blacklisting..."
                  rows={3}
                  className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
                />
              </div>
              <motion.button
                onClick={handleAddToBlacklist}
                className="w-full px-4 py-2 bg-cyber-orange/20 text-cyber-orange rounded-xl hover:bg-cyber-orange/30 border border-cyber-orange/30 backdrop-blur-md font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add to Blacklist
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
            style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Blacklisted Addresses ({blacklist.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {blacklist.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No blacklisted addresses</p>
              ) : (
                blacklist.map((address, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-black/30 border border-cyber-orange/20 flex items-center justify-between"
                  >
                    <span className="font-mono text-sm text-white">{address}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Whitelist Tab */}
      {activeTab === 'whitelist' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
            style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-cyber-green" />
              Add to Whitelist
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={newWhitelistAddress}
                  onChange={(e) => setNewWhitelistAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono backdrop-blur-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  value={newWhitelistLabel}
                  onChange={(e) => setNewWhitelistLabel(e.target.value)}
                  placeholder="Friendly name..."
                  className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
                />
              </div>
              <motion.button
                onClick={handleAddToWhitelist}
                className="w-full px-4 py-2 bg-cyber-green/20 text-cyber-green rounded-xl hover:bg-cyber-green/30 border border-cyber-green/30 backdrop-blur-md font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add to Whitelist
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
            style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Whitelisted Addresses ({whitelist.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {whitelist.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No whitelisted addresses</p>
              ) : (
                whitelist.map((address, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-black/30 border border-cyber-green/20 flex items-center justify-between"
                  >
                    <span className="font-mono text-sm text-white">{address}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

