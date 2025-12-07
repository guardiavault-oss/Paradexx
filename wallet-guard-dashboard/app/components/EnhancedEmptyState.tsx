'use client'

import { motion } from 'framer-motion'
import { LucideIcon, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface EnhancedEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  primaryAction?: {
    label: string
    onClick: () => void
    href?: string
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    href?: string
  }
  suggestions?: string[]
  illustration?: React.ReactNode
}

export default function EnhancedEmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  suggestions = [],
  illustration,
}: EnhancedEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl backdrop-blur-md p-12 text-center border border-cyan-500/30 relative overflow-hidden"
      style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center relative"
        >
          <Icon className="w-10 h-10 text-cyan-400" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>

        {/* Description */}
        <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">{description}</p>

        {/* Custom Illustration */}
        {illustration && (
          <div className="mb-8">
            {illustration}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-8 text-left max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-gray-300">Quick Tips:</h4>
            </div>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-2 text-sm text-gray-400"
                >
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>{suggestion}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {primaryAction && (
              primaryAction.href ? (
                <Link href={primaryAction.href}>
                  <motion.button
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 rounded-xl hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 backdrop-blur-md font-medium transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                    whileHover={{ scale: 1.05, shadow: '0 0 20px rgba(0, 212, 255, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
                    {primaryAction.label}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              ) : (
                <motion.button
                  onClick={primaryAction.onClick}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 rounded-xl hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 backdrop-blur-md font-medium transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                  whileHover={{ scale: 1.05, shadow: '0 0 20px rgba(0, 212, 255, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
                  {primaryAction.label}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )
            )}
            {secondaryAction && (
              secondaryAction.href ? (
                <Link href={secondaryAction.href}>
                  <motion.button
                    className="px-6 py-3 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 border border-gray-500/30 backdrop-blur-md font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {secondaryAction.label}
                  </motion.button>
                </Link>
              ) : (
                <motion.button
                  onClick={secondaryAction.onClick}
                  className="px-6 py-3 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 border border-gray-500/30 backdrop-blur-md font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {secondaryAction.label}
                </motion.button>
              )
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

