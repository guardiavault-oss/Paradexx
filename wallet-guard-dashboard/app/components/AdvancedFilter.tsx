'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, Check, ChevronDown } from 'lucide-react'

interface FilterOption {
  id: string
  label: string
  value: any
}

interface FilterGroup {
  id: string
  label: string
  type: 'select' | 'multiselect' | 'date' | 'range'
  options?: FilterOption[]
  value?: any
  multiple?: boolean
}

interface AdvancedFilterProps {
  filters: FilterGroup[]
  onFilterChange: (filters: Record<string, any>) => void
  onReset?: () => void
  showReset?: boolean
}

export default function AdvancedFilter({
  filters,
  onFilterChange,
  onReset,
  showReset = true,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(
    filters.reduce((acc, filter) => {
      acc[filter.id] = filter.value || (filter.multiple ? [] : '')
      return acc
    }, {} as Record<string, any>)
  )
  const [activeFilters, setActiveFilters] = useState(0)

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...localFilters, [filterId]: value }
    setLocalFilters(newFilters)
    
    // Count active filters
    const active = Object.values(newFilters).filter(v => 
      v !== '' && v !== null && v !== undefined && 
      (Array.isArray(v) ? v.length > 0 : true)
    ).length
    setActiveFilters(active)
    
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters = filters.reduce((acc, filter) => {
      acc[filter.id] = filter.multiple ? [] : ''
      return acc
    }, {} as Record<string, any>)
    
    setLocalFilters(resetFilters)
    setActiveFilters(0)
    onFilterChange(resetFilters)
    if (onReset) onReset()
  }

  return (
    <div className="relative">
      {/* Filter Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-black/30 border border-cyan-500/30 rounded-xl hover:border-cyan-400 transition-colors backdrop-blur-md text-white"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium">Filters</span>
        {activeFilters > 0 && (
          <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
            {activeFilters}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="absolute top-full left-0 mt-2 w-80 rounded-2xl bg-black/40 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-4 z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-cyan-400" />
                  Filter Options
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filters.map((filter) => (
                  <div key={filter.id}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {filter.label}
                    </label>
                    {filter.type === 'select' && (
                      <select
                        value={localFilters[filter.id] || ''}
                        onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-md"
                      >
                        <option value="">All</option>
                        {filter.options?.map((option) => (
                          <option key={option.id} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {filter.type === 'multiselect' && (
                      <div className="space-y-2">
                        {filter.options?.map((option) => {
                          const isSelected = (localFilters[filter.id] || []).includes(option.value)
                          return (
                            <motion.button
                              key={option.id}
                              onClick={() => {
                                const current = localFilters[filter.id] || []
                                const newValue = isSelected
                                  ? current.filter((v: any) => v !== option.value)
                                  : [...current, option.value]
                                handleFilterChange(filter.id, newValue)
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
                                isSelected
                                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                  : 'bg-black/20 border-cyan-500/20 text-gray-300 hover:border-cyan-500/40'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className="text-sm">{option.label}</span>
                              {isSelected && <Check className="w-4 h-4" />}
                            </motion.button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {showReset && activeFilters > 0 && (
                <div className="mt-4 pt-4 border-t border-cyan-500/20">
                  <motion.button
                    onClick={handleReset}
                    className="w-full px-4 py-2 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 border border-gray-500/30 backdrop-blur-md font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reset Filters
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

