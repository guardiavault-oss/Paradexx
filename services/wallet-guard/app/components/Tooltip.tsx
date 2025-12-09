'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle } from 'lucide-react'

interface TooltipProps {
  content: string | ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  maxWidth?: string
  variant?: 'default' | 'info' | 'warning' | 'error'
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = '200px',
  variant = 'default',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay)
    setTimeoutId(id)
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setIsVisible(false)
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  }

  const variantStyles = {
    default: 'bg-black/90 border-cyan-500/30 text-white',
    info: 'bg-cyber-blue/90 border-cyber-blue/50 text-white',
    warning: 'bg-cyber-yellow/90 border-cyber-yellow/50 text-white',
    error: 'bg-cyber-orange/90 border-cyber-orange/50 text-white',
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`absolute z-50 px-3 py-2 rounded-lg border backdrop-blur-md text-sm font-medium shadow-lg ${positionClasses[position]} ${variantStyles[variant]}`}
            style={{ maxWidth }}
            initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {content}
            {/* Arrow */}
            <div
              className={`absolute ${
                position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-transparent' :
                position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-b-4 border-l-4 border-r-4 border-transparent' :
                position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-l-4 border-t-4 border-b-4 border-transparent' :
                'right-full top-1/2 transform -translate-y-1/2 border-r-4 border-t-4 border-b-4 border-transparent'
              }`}
              style={{
                borderColor: variant === 'default' ? 'rgba(0, 212, 255, 0.3)' :
                            variant === 'info' ? 'rgba(0, 212, 255, 0.5)' :
                            variant === 'warning' ? 'rgba(255, 215, 0, 0.5)' :
                            'rgba(255, 107, 53, 0.5)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper component for info tooltips
export function InfoTooltip({ content, children }: { content: string | ReactNode; children: ReactNode }) {
  return (
    <Tooltip content={content} variant="info" position="top">
      {children}
    </Tooltip>
  )
}

// Helper component with help icon
export function HelpTooltip({ content }: { content: string | ReactNode }) {
  return (
    <Tooltip content={content} variant="info" position="top">
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-cyan-400 cursor-help transition-colors" />
    </Tooltip>
  )
}

