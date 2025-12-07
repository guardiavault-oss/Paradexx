'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Download, Filter, Search, ExternalLink, Calendar, Grid, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { apiClient, TransactionHistory } from '@/lib/api-client'
import TransactionCard from '@/app/components/TransactionCard'

export default function TransactionHistoryPage() {
  const searchParams = useSearchParams()
  const address = searchParams.get('address') || ''
  const chainId = parseInt(searchParams.get('chain_id') || '1')
  
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [walletData, setWalletData] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  useEffect(() => {
    if (address) {
      fetchData()
    }
  }, [address, chainId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [txData, balance] = await Promise.all([
        apiClient.getWalletTransactions(address, chainId, 1000),
        apiClient.getWalletBalance(address, chainId)
      ])
      
      setTransactions(txData.transactions || [])
      setWalletData(balance)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getExplorerUrl = (txHash: string) => {
    const chain = chainId === 1 ? 'etherscan.io' :
                  chainId === 137 ? 'polygonscan.com' :
                  chainId === 56 ? 'bscscan.com' :
                  chainId === 42161 ? 'arbiscan.io' : 'etherscan.io'
    return `https://${chain}/tx/${txHash}`
  }

  const formatValue = (value: string) => {
    try {
      const eth = parseFloat(value) / 1e18
      return `${eth.toFixed(6)} ETH`
    } catch {
      return value
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(parseInt(timestamp) * 1000).toLocaleString()
    } catch {
      return timestamp
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' ||
      (filter === 'sent' && tx.from?.toLowerCase() === address.toLowerCase()) ||
      (filter === 'received' && tx.to?.toLowerCase() === address.toLowerCase())
    
    const matchesSearch = !searchTerm || 
      tx.hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const exportToCSV = () => {
    const csv = [
      ['Hash', 'From', 'To', 'Value (ETH)', 'Status', 'Block', 'Timestamp'].join(','),
      ...filteredTransactions.map(tx => [
        tx.hash,
        tx.from,
        tx.to || '',
        formatValue(tx.value || '0'),
        tx.txreceipt_status === '1' ? 'Success' : 'Failed',
        tx.blockNumber,
        formatTimestamp(tx.timeStamp)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${address.slice(0, 8)}_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!address) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">No address provided</p>
        <Link href="/wallets" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Wallets
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/wallets"
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Wallets
      </Link>

      {/* Wallet Summary */}
      {walletData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Wallet Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Balance</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {walletData.balance_eth?.toFixed(6) || '0'} ETH
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{transactions.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by hash, from, or to..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'sent', 'received'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-end gap-2">
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
      </div>

      {/* Transactions View */}
      {loading ? (
        <div className="rounded-2xl backdrop-blur-md border border-cyan-500/30 p-12 text-center" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
          <div className="cyber-spinner mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="rounded-2xl backdrop-blur-md border border-cyan-500/30 p-12 text-center" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
          <p className="text-gray-400">No transactions found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTransactions.map((tx, index) => (
              <TransactionCard
                key={tx.hash}
                transaction={tx}
                address={address}
                chainId={chainId}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-2xl backdrop-blur-md border border-cyan-500/30 overflow-hidden mobile-table-scroll" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[700px]">
              <thead className="bg-black/40 border-b border-cyan-500/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Hash</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Block</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                <AnimatePresence>
                  {filteredTransactions.map((tx, index) => (
                    <motion.tr
                      key={tx.hash}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-cyan-500/5 transition-colors cyber-card"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-white">
                          {tx.hash?.slice(0, 10)}...{tx.hash?.slice(-8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-white">
                          {tx.from?.slice(0, 6)}...{tx.from?.slice(-4)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-white">
                          {tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : 'Contract Creation'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {formatValue(tx.value || '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded border ${
                          tx.txreceipt_status === '1'
                            ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {tx.txreceipt_status === '1' ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {tx.blockNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatTimestamp(tx.timeStamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={getExplorerUrl(tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyber-blue hover:text-cyber-blue/80"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

