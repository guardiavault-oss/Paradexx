'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { useState } from 'react'

interface Chain {
  id: number
  name: string
  symbol: string
  icon?: string
}

interface ChainSelectorProps {
  chains: Chain[]
  selected: number
  onSelect: (chainId: number) => void
}

const chainIcons: Record<number, string> = {
  1: '⟠',
  137: '⬟',
  56: '◉',
  42161: '🔷',
  10: '⚡',
  43114: '🔺'
}

export default function ChainSelector({ chains, selected, onSelect }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedChain = chains.find(c => c.id === selected)

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-black/30 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/10 transition-all backdrop-blur-md text-white"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {selectedChain && (
          <>
            <span className="text-lg">{chainIcons[selectedChain.id] || '◉'}</span>
            <span className="font-medium">{selectedChain.name}</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="absolute top-full left-0 mt-2 w-64 rounded-xl backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 z-50 overflow-hidden"
              style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="p-2 max-h-80 overflow-y-auto">
                {chains.map((chain) => (
                  <motion.button
                    key={chain.id}
                    onClick={() => {
                      onSelect(chain.id)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      chain.id === selected
                        ? 'bg-cyber-blue/20 border border-cyber-blue/30'
                        : 'hover:bg-black/20'
                    }`}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-xl">{chainIcons[chain.id] || '◉'}</span>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-white">{chain.name}</div>
                      <div className="text-xs text-gray-400">{chain.symbol}</div>
                    </div>
                    {chain.id === selected && (
                      <Check className="w-4 h-4 text-cyber-blue" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

