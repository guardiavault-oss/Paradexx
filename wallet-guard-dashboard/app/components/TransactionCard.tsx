'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface TransactionCardProps {
  transaction: any
  address: string
  chainId: number
}

export default function TransactionCard({ transaction, address, chainId }: TransactionCardProps) {
  const isSent = transaction.from?.toLowerCase() === address.toLowerCase()
  const isReceived = transaction.to?.toLowerCase() === address.toLowerCase()
  
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

  const getExplorerUrl = (txHash: string) => {
    const chain = chainId === 1 ? 'etherscan.io' :
                  chainId === 137 ? 'polygonscan.com' :
                  chainId === 56 ? 'bscscan.com' :
                  chainId === 42161 ? 'arbiscan.io' : 'etherscan.io'
    return `https://${chain}/tx/${txHash}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="rounded-xl backdrop-blur-md p-4 border border-cyan-500/30 cyber-card"
      style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg ${
            isSent ? 'bg-cyber-orange/20 border border-cyber-orange/30' :
            isReceived ? 'bg-cyber-green/20 border border-cyber-green/30' :
            'bg-cyber-purple/20 border border-cyber-purple/30'
          }`}>
            {isSent ? (
              <ArrowUpRight className={`w-4 h-4 ${isSent ? 'text-cyber-orange' : 'text-cyber-green'}`} />
            ) : isReceived ? (
              <ArrowDownLeft className="w-4 h-4 text-cyber-green" />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-cyber-purple" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm text-cyan-400 break-all">
              {transaction.hash?.slice(0, 10)}...{transaction.hash?.slice(-8)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatTimestamp(transaction.timeStamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded border ${
            transaction.txreceipt_status === '1'
              ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {transaction.txreceipt_status === '1' ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
          </span>
          <Link
            href={getExplorerUrl(transaction.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-blue hover:text-cyber-blue/80"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">From:</span>
          <span className="font-mono text-white text-xs">
            {transaction.from?.slice(0, 6)}...{transaction.from?.slice(-4)}
          </span>
        </div>
        {transaction.to && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">To:</span>
            <span className="font-mono text-white text-xs">
              {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Value:</span>
          <span className={`font-bold ${
            isSent ? 'text-cyber-orange' : 'text-cyber-green'
          }`}>
            {isSent ? '-' : '+'}{formatValue(transaction.value || '0')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Block:</span>
          <span className="text-white">{transaction.blockNumber}</span>
        </div>
      </div>
    </motion.div>
  )
}

