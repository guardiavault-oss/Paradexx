'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Open global search', category: 'Navigation' },
  { keys: ['⌘', '1'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['⌘', '2'], description: 'Go to Wallets', category: 'Navigation' },
  { keys: ['⌘', '3'], description: 'Go to Threats', category: 'Navigation' },
  { keys: ['⌘', '4'], description: 'Go to Transactions', category: 'Navigation' },
  { keys: ['⌘', '5'], description: 'Go to Analytics', category: 'Navigation' },
  
  // Actions
  { keys: ['N'], description: 'New wallet (when on wallets page)', category: 'Actions' },
  { keys: ['A'], description: 'Analyze transaction (when on transactions page)', category: 'Actions' },
  { keys: ['F'], description: 'Focus search/filter', category: 'Actions' },
  
  // General
  { keys: ['Esc'], description: 'Close modals/dialogs', category: 'General' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'General' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar', category: 'General' },
]

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMac, setIsMac] = useState(false)
  
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])
  
  const formatKey = (key: string) => {
    if (key === '⌘') return isMac ? '⌘' : 'Ctrl'
    if (key === '⌥') return isMac ? '⌥' : 'Alt'
    return key
  }
  
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
          
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl mx-4 bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                  <Keyboard className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {Object.entries(groupedShortcuts).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3">{category}</h3>
                  <div className="space-y-2">
                    {items.map((shortcut, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="text-sm text-gray-300">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex}>
                              <kbd className="px-2 py-1 text-xs bg-black/30 rounded border border-cyan-500/30 text-cyan-400">
                                {formatKey(key)}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="mx-1 text-gray-500">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-cyan-500/20 text-xs text-gray-400 text-center">
              Press <kbd className="px-2 py-1 bg-black/30 rounded border border-cyan-500/30 text-cyan-400">?</kbd> to toggle this menu
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

