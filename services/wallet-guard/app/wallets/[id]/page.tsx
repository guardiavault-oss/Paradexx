'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Wallet, AlertTriangle, Activity, Shield, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'

export default function WalletDetailPage() {
  const params = useParams()
  const router = useRouter()
  const walletId = params.id as string
  
  const [wallet, setWallet] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (walletId) {
      fetchWalletData()
    }
  }, [walletId])

  const fetchWalletData = async () => {
    setLoading(true)
    try {
      const walletData = await apiClient.getWalletMonitoringStatus(walletId)
      setWallet(walletData)
      
      if (walletData) {
        const [walletBalance, walletAlerts, walletTxs, walletHealth] = await Promise.all([
          apiClient.getWalletBalance(walletData.address, walletData.chain_id).catch(() => null),
          apiClient.getAlerts().catch(() => ({ alerts: [] })),
          apiClient.getWalletTransactions(walletData.address, walletData.chain_id, 50).catch(() => ({ transactions: [] })),
          apiClient.getWalletHealth(walletData.address, walletData.chain_id).catch(() => null)
        ])

        setBalance(walletBalance)
        
        const walletAlertsFiltered = walletAlerts.alerts?.filter((a: any) => a.wallet_address === walletData.address) || []
        setAlerts(walletAlertsFiltered)
        setTransactions(walletTxs?.transactions || [])
        setHealth(walletHealth)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch wallet data:', error)
      setLoading(false)
    }
  }

  const getRiskLevel = () => {
    if (!wallet || !alerts) return 'low'
    if (alerts.filter((a: any) => a.severity === 'critical').length > 0) return 'critical'
    if (alerts.filter((a: any) => a.severity === 'high').length > 0) return 'high'
    if (alerts.length > 0) return 'medium'
    return 'low'
  }

  const riskLevel = getRiskLevel()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="cyber-spinner"></div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-400">Wallet not found</p>
        <Link href="/wallets" className="text-cyber-blue hover:underline mt-4 inline-block">
          Back to Wallets
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          href="/wallets"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Wallets
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
              Wallet Details
            </h1>
            <p className="text-gray-400 font-mono text-sm break-all">{wallet.address}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl border backdrop-blur-md ${
            riskLevel === 'critical' ? 'bg-cyber-orange/20 border-cyber-orange/30 text-cyber-orange' :
            riskLevel === 'high' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
            riskLevel === 'medium' ? 'bg-cyber-yellow/20 border-cyber-yellow/30 text-cyber-yellow' :
            'bg-cyber-green/20 border-cyber-green/30 text-cyber-green'
          }`}>
            <span className="font-bold">{riskLevel.toUpperCase()} RISK</span>
          </div>
        </div>
      </motion.div>

      {/* Wallet Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
          style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-cyber-blue/20 border border-cyber-blue/30">
              <Wallet className="w-5 h-5 text-cyber-blue" />
            </div>
            <div>
              <h3 className="text-sm text-gray-400">Balance</h3>
              <p className="text-2xl font-bold text-white">
                {balance?.balance_eth?.toFixed(6) || '0.000000'} ETH
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
          style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-cyber-orange/20 border border-cyber-orange/30">
              <AlertTriangle className="w-5 h-5 text-cyber-orange" />
            </div>
            <div>
              <h3 className="text-sm text-gray-400">Alerts</h3>
              <p className="text-2xl font-bold text-cyber-orange">{alerts.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
          style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-cyber-purple/20 border border-cyber-purple/30">
              <Activity className="w-5 h-5 text-cyber-purple" />
            </div>
            <div>
              <h3 className="text-sm text-gray-400">Transactions</h3>
              <p className="text-2xl font-bold text-cyber-purple">{transactions.length}</p>
            </div>
          </div>
        </motion.div>

        {health && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
            style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl border ${
                health.status === 'healthy' 
                  ? 'bg-cyber-green/20 border-cyber-green/30' 
                  : 'bg-cyber-orange/20 border-cyber-orange/30'
              }`}>
                <Shield className={`w-5 h-5 ${
                  health.status === 'healthy' ? 'text-cyber-green' : 'text-cyber-orange'
                }`} />
              </div>
              <div>
                <h3 className="text-sm text-gray-400">Security Score</h3>
                <p className={`text-2xl font-bold ${
                  health.status === 'healthy' ? 'text-cyber-green' : 'text-cyber-orange'
                }`}>
                  {health.security_score}/100
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Wallet Health Details */}
      {health && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
          style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyber-blue" />
            Wallet Health Report
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Status</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                health.status === 'healthy'
                  ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                  : 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30'
              }`}>
                {health.status === 'healthy' ? 'Healthy' : 'At Risk'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Reputation</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                health.reputation?.reputation === 'trusted'
                  ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                  : health.reputation?.reputation === 'malicious'
                  ? 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}>
                {health.reputation?.reputation || 'Unknown'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Risk Score</p>
              <span className="text-lg font-bold text-white">
                {health.reputation?.risk_score || 0}/100
              </span>
            </div>
          </div>
          {health.reputation?.tags && health.reputation.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-cyan-500/30">
              <p className="text-sm text-gray-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {health.reputation.tags.map((tag: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-cyber-blue/20 text-cyber-blue text-xs rounded border border-cyber-blue/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-cyber-orange" />
          Recent Alerts
        </h2>
        {alerts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No alerts for this wallet</p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert: any) => (
              <div
                key={alert.alert_id}
                className="p-4 rounded-xl border border-cyan-500/20 bg-black/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs rounded border ${
                    alert.severity === 'critical' ? 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30' :
                    alert.severity === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-white">{alert.description}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyber-purple" />
            Recent Transactions
          </h2>
          <Link
            href={`/transactions/history?address=${wallet.address}&chain_id=${wallet.chain_id}`}
            className="text-cyber-blue hover:text-cyber-blue/80 text-sm"
          >
            View All
          </Link>
        </div>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No transactions found</p>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx: any) => (
              <div
                key={tx.hash}
                className="p-4 rounded-xl border border-cyan-500/20 bg-black/20 hover:bg-black/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-cyan-400 break-all">
                      {tx.hash?.slice(0, 10)}...{tx.hash?.slice(-8)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded border ${
                    tx.txreceipt_status === '1'
                      ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {tx.txreceipt_status === '1' ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
