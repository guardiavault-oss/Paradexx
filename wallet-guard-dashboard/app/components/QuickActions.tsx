'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Shield, 
  AlertTriangle, 
  Wallet,
  FileText,
  Zap,
  X
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface QuickAction {
  id: string
  label: string
  icon: typeof Plus
  href?: string
  onClick?: () => void
  color: string
  description: string
}

export default function QuickActions() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  const actions: QuickAction[] = [
    {
      id: 'add-wallet',
      label: 'Add Wallet',
      icon: Wallet,
      href: '/wallets',
      color: '#00D4FF',
      description: 'Start monitoring a new wallet',
    },
    {
      id: 'analyze-transaction',
      label: 'Analyze Transaction',
      icon: Search,
      href: '/transactions',
      color: '#8B5CF6',
      description: 'Check transaction safety',
    },
    {
      id: 'view-threats',
      label: 'View Threats',
      icon: AlertTriangle,
      href: '/threats',
      color: '#FF6B35',
      description: 'Check active threats',
    },
    {
      id: 'add-address',
      label: 'Add to Address Book',
      icon: FileText,
      href: '/address-book',
      color: '#39FF14',
      description: 'Save a trusted address',
    },
    {
      id: 'create-rule',
      label: 'Create Security Rule',
      icon: Shield,
      href: '/security-rules',
      color: '#FFD700',
      description: 'Set up protection rules',
    },
  ]
  
  const handleAction = (action: QuickAction) => {
    if (action.href) {
      router.push(action.href)
    } else if (action.onClick) {
      action.onClick()
    }
    setIsOpen(false)
  }
  
  return (
    <>
      {/* Quick Actions Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/50 flex items-center justify-center hover:shadow-xl hover:shadow-cyan-500/70 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Quick Actions"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Zap className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      
      {/* Quick Actions Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Actions Menu */}
            <motion.div
              className="fixed bottom-24 right-6 z-40 w-72 rounded-2xl backdrop-blur-xl bg-black/40 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-4"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Quick Actions
              </h3>
              
              <div className="space-y-2">
                {actions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <motion.button
                      key={action.id}
                      onClick={() => handleAction(action)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/40 border border-cyan-500/20 hover:border-cyan-500/40 transition-all text-left group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${action.color}20`,
                          borderColor: `${action.color}40`,
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: action.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {action.description}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
              
              {/* Keyboard Shortcut Hint */}
              <div className="mt-4 pt-4 border-t border-cyan-500/20">
                <p className="text-xs text-gray-400 text-center">
                  Press <kbd className="px-2 py-1 bg-black/30 rounded border border-cyan-500/30 text-cyan-400">K</kbd> to open
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

