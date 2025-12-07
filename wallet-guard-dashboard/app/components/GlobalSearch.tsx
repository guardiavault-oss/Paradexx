'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Wallet, AlertTriangle, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

interface SearchResult {
  type: 'wallet' | 'threat' | 'transaction' | 'address' | 'page'
  id: string
  title: string
  description: string
  href: string
  icon: typeof Wallet
  color: string
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  // Search function
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }
    
    setIsSearching(true)
    const searchResults: SearchResult[] = []
    
    // Search pages
    const pages: SearchResult[] = [
      { type: 'page', id: 'dashboard', title: 'Dashboard', description: 'Overview and statistics', href: '/', icon: TrendingUp, color: '#00D4FF' },
      { type: 'page', id: 'wallets', title: 'Wallets', description: 'Monitor wallet addresses', href: '/wallets', icon: Wallet, color: '#39FF14' },
      { type: 'page', id: 'threats', title: 'Threats', description: 'View security alerts', href: '/threats', icon: AlertTriangle, color: '#FF6B35' },
      { type: 'page', id: 'transactions', title: 'Transactions', description: 'Analyze transactions', href: '/transactions', icon: FileText, color: '#8B5CF6' },
      { type: 'page', id: 'analytics', title: 'Analytics', description: 'View analytics and reports', href: '/analytics', icon: TrendingUp, color: '#FFD700' },
      { type: 'page', id: 'address-book', title: 'Address Book', description: 'Manage saved addresses', href: '/address-book', icon: FileText, color: '#00D4FF' },
      { type: 'page', id: 'audit-logs', title: 'Audit Logs', description: 'View system logs', href: '/audit-logs', icon: FileText, color: '#39FF14' },
    ]
    
    // Filter pages by query
    const matchingPages = pages.filter(page =>
      page.title.toLowerCase().includes(query.toLowerCase()) ||
      page.description.toLowerCase().includes(query.toLowerCase())
    )
    searchResults.push(...matchingPages)
    
    // Search wallets (if query looks like an address)
    if (/^0x[a-fA-F0-9]{40}$/.test(query) || query.length > 10) {
      searchResults.push({
        type: 'wallet',
        id: query,
        title: `Wallet: ${query.slice(0, 6)}...${query.slice(-4)}`,
        description: 'View wallet details',
        href: `/wallets?search=${query}`,
        icon: Wallet,
        color: '#39FF14',
      })
    }
    
    // Simulate API search (in real implementation, call API)
    setTimeout(() => {
      setResults(searchResults)
      setIsSearching(false)
    }, 300)
  }, [query])
  
  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    setIsOpen(false)
    setQuery('')
  }
  
  return (
    <>
      {/* Search Trigger */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="relative flex-1 max-w-md hidden sm:flex items-center gap-2 px-4 py-2 bg-black/30 border border-cyan-500/30 rounded-xl text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-all backdrop-blur-md"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Search wallets, addresses, transactions...</span>
        <kbd className="ml-auto px-2 py-1 text-xs bg-black/30 rounded border border-cyan-500/30 text-cyan-400">
          ⌘K
        </kbd>
      </motion.button>
      
      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Search Box */}
            <motion.div
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-4"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
            >
              <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-cyan-500/20">
                  <Search className="w-5 h-5 text-cyan-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search wallets, addresses, transactions, pages..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg"
                    autoFocus
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-8 text-center text-gray-400">
                      <div className="cyber-spinner mx-auto mb-2"></div>
                      <p>Searching...</p>
                    </div>
                  ) : results.length > 0 ? (
                    <div className="p-2">
                      {results.map((result, index) => {
                        const Icon = result.icon
                        return (
                          <motion.button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cyan-500/10 transition-colors text-left group"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: 4 }}
                          >
                            <div
                              className="p-2 rounded-lg"
                              style={{
                                backgroundColor: `${result.color}20`,
                                borderColor: `${result.color}40`,
                              }}
                            >
                              <Icon className="w-4 h-4" style={{ color: result.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                                {result.title}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {result.description}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100" />
                          </motion.button>
                        )
                      })}
                    </div>
                  ) : query.length >= 2 ? (
                    <div className="p-8 text-center text-gray-400">
                      <p>No results found for "{query}"</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <p>Start typing to search...</p>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="p-3 border-t border-cyan-500/20 bg-black/20">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                      <span>
                        <kbd className="px-2 py-1 bg-black/30 rounded border border-cyan-500/30">↑↓</kbd> Navigate
                      </span>
                      <span>
                        <kbd className="px-2 py-1 bg-black/30 rounded border border-cyan-500/30">Enter</kbd> Select
                      </span>
                    </div>
                    <span>
                      <kbd className="px-2 py-1 bg-black/30 rounded border border-cyan-500/30">Esc</kbd> Close
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

