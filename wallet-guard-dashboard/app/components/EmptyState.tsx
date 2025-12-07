'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl backdrop-blur-md p-12 text-center border border-cyan-500/30"
      style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center"
      >
        <Icon className="w-8 h-8 text-cyan-400" />
      </motion.div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {action && (
            <motion.button
              onClick={action.onClick}
              className="px-6 py-2.5 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 border border-cyber-blue/30 backdrop-blur-md font-medium transition-colors touch-manipulation flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </motion.button>
          )}
          {secondaryAction && (
            <motion.button
              onClick={secondaryAction.onClick}
              className="px-6 py-2.5 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 border border-gray-500/30 backdrop-blur-md font-medium transition-colors touch-manipulation"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {secondaryAction.label}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  )
}

