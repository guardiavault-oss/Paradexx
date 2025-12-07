'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, MoreVertical, Eye, Shield, X, Wallet as WalletIcon, Link as LinkIcon, Grid, List, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { apiClient, WalletData } from '@/lib/api-client'
import { walletConnectClient } from '@/lib/walletconnect'
import WalletCard from '@/app/components/WalletCard'
import ChainSelector from '@/app/components/ChainSelector'
import { useRouter } from 'next/navigation'
import { toastService } from '@/lib/toast'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import EmptyState from '@/app/components/EmptyState'
import EnhancedEmptyState from '@/app/components/EnhancedEmptyState'
import { DashboardSkeleton, TableSkeleton } from '@/app/components/LoadingSkeleton'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import { HelpTooltip } from '@/app/components/Tooltip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'

interface MonitoredWallet {
  wallet_id: string
  address: string
  chain_id: number
  chain_name: string
  started_at: string
  status: string
  alert_threshold: number
  monitoring_interval: number
  alerts_triggered: number
  transactions_monitored: number
  balance?: number
}

export default function WalletsPage() {
  const router = useRouter()
  const [wallets, setWallets] = useState<MonitoredWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newWallet, setNewWallet] = useState({ address: '', chain_id: 1 })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [chainFilter, setChainFilter] = useState<number | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    walletId: string | null
  }>({ isOpen: false, walletId: null })

  useEffect(() => {
    fetchWallets()
    const interval = setInterval(fetchWallets, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchWallets = async () => {
    try {
      const data = await apiClient.listMonitoredWallets()
      setWallets(data.wallets || [])
      setLoading(false)
    } catch (error) {
      toastService.error('Failed to fetch wallets. Please try again.')
      setLoading(false)
    }
  }

  const fetchWalletBalance = async (address: string, chainId: number) => {
    try {
      return await apiClient.getWalletBalance(address, chainId)
    } catch (error) {
      // Balance fetch error - non-critical, continue without balance update
      return null
    }
  }

  const handleAddWallet = async () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(newWallet.address)) {
      toastService.error('Invalid wallet address format. Please enter a valid Ethereum address.')
      return
    }
    
    const loadingToast = toastService.loading('Adding wallet to monitoring...')
    
    try {
      await apiClient.startMonitoring(
        newWallet.address,
        newWallet.chain_id,
        0.7
      )
      toast.dismiss(loadingToast)
      toastService.success(`Wallet ${newWallet.address.slice(0, 6)}...${newWallet.address.slice(-4)} added successfully`)
      setShowAddModal(false)
      setNewWallet({ address: '', chain_id: 1 })
      fetchWallets()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to add wallet. Please try again.')
    }
  }

  const handleStopMonitoring = async (walletId: string) => {
    setConfirmDialog({ isOpen: true, walletId })
  }

  const confirmStopMonitoring = async () => {
    if (!confirmDialog.walletId) return
    
    const loadingToast = toastService.loading('Stopping wallet monitoring...')
    
    try {
      await apiClient.stopMonitoring(confirmDialog.walletId)
      toast.dismiss(loadingToast)
      toastService.success('Wallet monitoring stopped successfully')
      setConfirmDialog({ isOpen: false, walletId: null })
      fetchWallets()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to stop monitoring')
    }
  }

  const handleConnectWallet = async () => {
    const loadingToast = toastService.loading('Connecting wallet...')
    
    try {
      const connection = await walletConnectClient.createConnection()
      toast.dismiss(loadingToast)
      toastService.info(`Scan QR code: ${connection.wc_uri}`, { duration: 6000 })
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to connect wallet')
    }
  }

  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.chain_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesChain = chainFilter === null || wallet.chain_id === chainFilter
    return matchesSearch && matchesChain
  })

  const uniqueChains = Array.from(new Set(wallets.map(w => ({ id: w.chain_id, name: w.chain_name }))))
  
  const chains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 56, name: 'BSC', symbol: 'BNB' },
    { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
    { id: 10, name: 'Optimism', symbol: 'ETH' },
    { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
  ]

  const getRiskBadge = (alerts: number) => {
    if (alerts === 0) return <span className="px-2 py-1 bg-cyber-green/20 text-cyber-green text-xs rounded border border-cyber-green/30">Safe</span>
    if (alerts < 3) return <span className="px-2 py-1 bg-cyber-yellow/20 text-cyber-yellow text-xs rounded border border-cyber-yellow/30">Medium</span>
    return <span className="px-2 py-1 bg-cyber-orange/20 text-cyber-orange text-xs rounded border border-cyber-orange/30">High Risk</span>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent flex items-center gap-2">
              Wallet Monitoring
              <HelpTooltip content="Monitor your crypto wallets across multiple blockchains. Get real-time alerts for suspicious activity, track balances, and view transaction history." />
            </h1>
            <p className="mt-2 text-gray-400">
              Monitor and protect your crypto wallets across multiple blockchains
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={handleConnectWallet}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-purple/20 text-cyber-purple rounded-xl hover:bg-cyber-purple/30 transition-all border border-cyber-purple/30 backdrop-blur-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LinkIcon className="w-5 h-5" />
            Connect Wallet
          </motion.button>
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 transition-all border border-cyber-blue/30 backdrop-blur-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            Add Wallet
          </motion.button>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder="Search by address or chain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500 backdrop-blur-md"
          />
        </div>
        <ChainSelector
          chains={chains}
          selected={chainFilter || 1}
          onSelect={(id) => setChainFilter(id === chainFilter ? null : id)}
        />
        <div className="flex items-center gap-2 bg-black/30 border border-cyan-500/30 rounded-xl p-1 backdrop-blur-md">
          <motion.button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-gray-400 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Grid className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-gray-400 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <List className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Wallets View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {loading ? (
          <div className="rounded-2xl backdrop-blur-md border border-cyan-500/30 p-12 text-center" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
            <div className="cyber-spinner mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading wallets...</p>
          </div>
        ) : filteredWallets.length === 0 ? (
          <EnhancedEmptyState
            icon={WalletIcon}
            title={searchTerm || chainFilter ? "No Wallets Found" : "No Wallets Being Monitored"}
            description={searchTerm || chainFilter 
              ? "No wallets match your current filters. Try adjusting your search or filter criteria."
              : "Start monitoring your crypto wallets to receive real-time security alerts and protect your assets across multiple blockchains."}
            primaryAction={{
              label: "Add Your First Wallet",
              onClick: () => setShowAddModal(true),
              icon: Plus,
            }}
            suggestions={[
              "Add wallets from different blockchains for comprehensive protection",
              "Set up security rules to customize protection levels",
              "Monitor wallet balances and transaction history",
              "Receive instant alerts when threats are detected"
            ]}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredWallets.map((wallet, index) => (
                <WalletCard
                  key={wallet.wallet_id}
                  wallet={wallet}
                  onStop={handleStopMonitoring}
                  onView={(id) => {
                    router.push(`/wallets/${id}`)
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : filteredWallets.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title="No Wallets Found"
            description={searchTerm || chainFilter 
              ? "No wallets match your current filters. Try adjusting your search or filter criteria."
              : "You haven't added any wallets to monitor yet. Start by adding your first wallet to begin monitoring."}
            action={{
              label: "Add Wallet",
              onClick: () => setShowAddModal(true),
              icon: Plus
            }}
          />
        ) : (
          <div className="rounded-2xl backdrop-blur-md border border-cyan-500/30 overflow-hidden mobile-table-scroll" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="w-full min-w-[600px]">
                <thead className="bg-black/40 border-b border-cyan-500/30">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Wallet Address</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Chain</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider hidden md:table-cell">Risk Level</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Alerts</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider hidden lg:table-cell">Transactions</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider hidden lg:table-cell">Started</th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  <AnimatePresence>
                    {filteredWallets.map((wallet, index) => (
                      <motion.tr
                        key={wallet.wallet_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-cyan-500/5 transition-colors cyber-card"
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyber-blue" />
                            <span className="text-xs sm:text-sm font-medium text-white font-mono">
                              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-cyber-blue/20 text-cyber-blue text-xs rounded border border-cyber-blue/30">
                            {wallet.chain_name}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded border ${
                            wallet.status === 'active'
                              ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>
                            {wallet.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          {getRiskBadge(wallet.alerts_triggered)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                          {wallet.alerts_triggered}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white hidden lg:table-cell">
                          {wallet.transactions_monitored}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400 hidden lg:table-cell">
                          {new Date(wallet.started_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/wallets/${wallet.wallet_id}`}
                              className="text-cyber-blue hover:text-cyber-blue/80"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/transactions/history?address=${wallet.address}&chain_id=${wallet.chain_id}`}
                              className="text-cyber-purple hover:text-cyber-purple/80"
                            >
                              <Search className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleStopMonitoring(wallet.wallet_id)}
                              className="text-cyber-orange hover:text-cyber-orange/80"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Wallet Modal */}
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
              className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl shadow-cyan-500/20 p-4 sm:p-6 w-full max-w-md border border-cyan-500/30 mobile-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Add Wallet to Monitor</h2>
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
                    value={newWallet.address}
                    onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 dark:text-white backdrop-blur-md text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Blockchain Network
                  </label>
                  <select
                    value={newWallet.chain_id}
                    onChange={(e) => setNewWallet({ ...newWallet, chain_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
                  >
                    {chains.map((chain) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    onClick={handleAddWallet}
                    className="flex-1 px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 border border-cyber-blue/30 backdrop-blur-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Monitoring
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

      {/* Confirm Stop Monitoring Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, walletId: null })}
        onConfirm={confirmStopMonitoring}
        title="Stop Monitoring Wallet"
        message="Are you sure you want to stop monitoring this wallet? You will no longer receive alerts for this wallet."
        confirmText="Stop Monitoring"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
