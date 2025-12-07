'use client'

import { motion } from 'framer-motion'
import { Wallet, Shield, AlertTriangle, TrendingUp, TrendingDown, Eye, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface WalletCardProps {
  wallet: any
  onStop?: (id: string) => void
  onView?: (id: string) => void
}

export default function WalletCard({ wallet, onStop, onView }: WalletCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getRiskLevel = (alerts: number) => {
    if (alerts === 0) return { level: 'low', color: 'cyber-green', icon: Shield }
    if (alerts < 3) return { level: 'medium', color: 'cyber-yellow', icon: AlertTriangle }
    return { level: 'high', color: 'cyber-orange', icon: AlertTriangle }
  }

  const risk = getRiskLevel(wallet.alerts_triggered || 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card relative overflow-hidden cursor-pointer group"
      style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
    >
      {/* Animated border gradient */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(135deg, 
            rgba(0, 212, 255, 0.2) 0%,
            rgba(139, 92, 246, 0.2) 50%,
            rgba(255, 107, 53, 0.2) 100%
          )`,
          borderRadius: '1rem'
        }}
        animate={{
          backgroundPosition: isHovered ? ['0% 0%', '100% 100%'] : '0% 0%'
        }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 rounded-xl bg-cyber-blue/20 border border-cyber-blue/30">
              <Wallet className="w-5 h-5 text-cyber-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {wallet.chain_name}
              </p>
            </div>
          </div>
          {onStop && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                onStop(wallet.wallet_id)
              }}
              className="p-2 text-gray-400 hover:text-cyber-orange rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-xl bg-black/20 border border-cyan-500/20">
            <p className="text-xs text-gray-400 mb-1">Balance</p>
            <p className="text-sm font-bold text-white">
              {wallet.balance?.toFixed(4) || '0.0000'} ETH
            </p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-cyan-500/20">
            <p className="text-xs text-gray-400 mb-1">Alerts</p>
            <p className="text-sm font-bold text-cyber-orange">
              {wallet.alerts_triggered || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-cyan-500/20">
            <p className="text-xs text-gray-400 mb-1">Transactions</p>
            <p className="text-sm font-bold text-cyber-purple">
              {wallet.transactions_monitored || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-cyan-500/20">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <p className={`text-xs font-bold ${
              wallet.status === 'active' ? 'text-cyber-green' : 'text-gray-400'
            }`}>
              {wallet.status}
            </p>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            risk.color === 'cyber-green' ? 'bg-cyber-green/20 border-cyber-green/30 text-cyber-green' :
            risk.color === 'cyber-yellow' ? 'bg-cyber-yellow/20 border-cyber-yellow/30 text-cyber-yellow' :
            'bg-cyber-orange/20 border-cyber-orange/30 text-cyber-orange'
          }`}>
            <risk.icon className="w-3 h-3" />
            <span className="text-xs font-medium">{risk.level.toUpperCase()} RISK</span>
          </div>
          <span className="text-xs text-gray-500">
            Started {new Date(wallet.started_at).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onView && (
            <Link
              href={`/wallets/${wallet.wallet_id}`}
              className="flex-1 px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 border border-cyber-blue/30 backdrop-blur-md text-sm font-medium text-center transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              View
            </Link>
          )}
          <Link
            href={`/transactions/history?address=${wallet.address}&chain_id=${wallet.chain_id}`}
            className="flex-1 px-4 py-2 bg-cyber-purple/20 text-cyber-purple rounded-xl hover:bg-cyber-purple/30 border border-cyber-purple/30 backdrop-blur-md text-sm font-medium text-center transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            History
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

