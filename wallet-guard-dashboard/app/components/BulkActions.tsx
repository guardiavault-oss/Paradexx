'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Square, Trash2, Download, MoreVertical, X } from 'lucide-react'

interface BulkAction {
  id: string
  label: string
  icon: typeof Trash2
  onClick: (selectedIds: string[]) => void | Promise<void>
  variant?: 'danger' | 'warning' | 'default'
  requiresConfirmation?: boolean
}

interface BulkActionsProps {
  items: Array<{ id: string; [key: string]: any }>
  actions: BulkAction[]
  onSelectionChange?: (selectedIds: string[]) => void
  selectAllLabel?: string
  selectedLabel?: string
}

export default function BulkActions({
  items,
  actions,
  onSelectionChange,
  selectAllLabel = 'Select All',
  selectedLabel = 'selected',
}: BulkActionsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showActions, setShowActions] = useState(false)

  const allSelected = selectedIds.size === items.length && items.length > 0
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(item => item.id)))
    }
    updateSelection()
  }

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
    updateSelection()
  }

  const updateSelection = () => {
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds))
    }
  }

  const handleAction = async (action: BulkAction) => {
    const ids = Array.from(selectedIds)
    if (action.requiresConfirmation) {
      if (confirm(`Are you sure you want to ${action.label.toLowerCase()} ${ids.length} item(s)?`)) {
        await action.onClick(ids)
        setSelectedIds(new Set())
        setShowActions(false)
      }
    } else {
      await action.onClick(ids)
      setSelectedIds(new Set())
      setShowActions(false)
    }
  }

  if (items.length === 0) return null

  return (
    <>
      {/* Selection Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30 backdrop-blur-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {allSelected ? 'Deselect All' : selectAllLabel}
                  </span>
                </motion.button>
                <span className="text-sm text-gray-300">
                  {selectedIds.size} {selectedLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {actions.map((action) => {
                  const Icon = action.icon
                  const variantStyles = {
                    danger: 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30 hover:bg-cyber-orange/30',
                    warning: 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30 hover:bg-cyber-yellow/30',
                    default: 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30 hover:bg-cyber-blue/30',
                  }
                  
                  return (
                    <motion.button
                      key={action.id}
                      onClick={() => handleAction(action)}
                      className={`px-4 py-2 rounded-xl border backdrop-blur-md font-medium transition-colors flex items-center gap-2 ${variantStyles[action.variant || 'default']}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{action.label}</span>
                    </motion.button>
                  )
                })}
                <motion.button
                  onClick={() => {
                    setSelectedIds(new Set())
                    setShowActions(false)
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select Checkboxes (to be added to list items) */}
      {/* This component provides the selection logic, but checkboxes should be added to individual items */}
    </>
  )
}

// Hook for using bulk actions
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    setSelectedIds(new Set(items.map(item => item.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const isSelected = (id: string) => selectedIds.has(id)
  const allSelected = selectedIds.size === items.length && items.length > 0
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length

  return {
    selectedIds: Array.from(selectedIds),
    toggleSelect,
    selectAll,
    deselectAll,
    isSelected,
    allSelected,
    someSelected,
    selectedCount: selectedIds.size,
  }
}

