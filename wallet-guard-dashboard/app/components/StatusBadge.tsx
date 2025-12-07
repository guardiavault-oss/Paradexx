'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error'
  label?: string
  pulse?: boolean
}

export default function StatusBadge({ status, label, pulse = false }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          color: 'cyber-green',
          bg: 'bg-cyber-green/20',
          border: 'border-cyber-green/30',
          text: 'text-cyber-green',
          icon: CheckCircle
        }
      case 'inactive':
        return {
          color: 'gray',
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          icon: XCircle
        }
      case 'pending':
        return {
          color: 'cyber-yellow',
          bg: 'bg-cyber-yellow/20',
          border: 'border-cyber-yellow/30',
          text: 'text-cyber-yellow',
          icon: Clock
        }
      case 'error':
        return {
          color: 'cyber-orange',
          bg: 'bg-cyber-orange/20',
          border: 'border-cyber-orange/30',
          text: 'text-cyber-orange',
          icon: AlertCircle
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md ${config.bg} ${config.border} ${config.text}`}
      animate={pulse ? {
        boxShadow: [
          `0 0 8px ${status === 'active' ? '#39FF14' : status === 'error' ? '#FF6B35' : '#FFD700'}`,
          `0 0 16px ${status === 'active' ? '#39FF14' : status === 'error' ? '#FF6B35' : '#FFD700'}`,
          `0 0 8px ${status === 'active' ? '#39FF14' : status === 'error' ? '#FF6B35' : '#FFD700'}`
        ]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{label || status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </motion.div>
  )
}

