'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface DataCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  trend?: 'up' | 'down' | 'neutral'
  change?: string
  onClick?: () => void
}

export default function DataCard({ title, value, icon: Icon, color = 'cyber-blue', trend, change, onClick }: DataCardProps) {
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    'cyber-blue': {
      bg: 'bg-cyber-blue/20',
      border: 'border-cyber-blue/30',
      text: 'text-cyber-blue',
      glow: 'shadow-cyan-500/20'
    },
    'cyber-green': {
      bg: 'bg-cyber-green/20',
      border: 'border-cyber-green/30',
      text: 'text-cyber-green',
      glow: 'shadow-green-500/20'
    },
    'cyber-purple': {
      bg: 'bg-cyber-purple/20',
      border: 'border-cyber-purple/30',
      text: 'text-cyber-purple',
      glow: 'shadow-purple-500/20'
    },
    'cyber-orange': {
      bg: 'bg-cyber-orange/20',
      border: 'border-cyber-orange/30',
      text: 'text-cyber-orange',
      glow: 'shadow-orange-500/20'
    },
    'cyber-yellow': {
      bg: 'bg-cyber-yellow/20',
      border: 'border-cyber-yellow/30',
      text: 'text-cyber-yellow',
      glow: 'shadow-yellow-500/20'
    }
  }

  const colors = colorMap[color] || colorMap['cyber-blue']

  return (
    <motion.div
      className={`rounded-2xl backdrop-blur-md p-6 border cyber-card relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${colors.border}`}
      style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
      whileHover={onClick ? { scale: 1.02, y: -2, boxShadow: `0 10px 40px ${colors.glow}` } : {}}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        {trend && change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-cyber-green' : trend === 'down' ? 'text-cyber-orange' : 'text-gray-400'
          }`}>
            <span>{change}</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${colors.text}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </motion.div>
  )
}

