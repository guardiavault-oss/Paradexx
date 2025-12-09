'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Wallet, BookOpen } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toastService } from '@/lib/toast'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import EmptyState from '@/app/components/EmptyState'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import FormField from '@/app/components/FormField'

interface AddressBookEntry {
  id?: string
  address: string
  label: string
  notes?: string
  chain_id?: number
  created_at?: string
}

export default function AddressBookPage() {
  const [entries, setEntries] = useState<AddressBookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<AddressBookEntry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<AddressBookEntry>({
    address: '',
    label: '',
    notes: '',
    chain_id: 1
  })
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; entryId: string | null }>({
    isOpen: false,
    entryId: null
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const data = await apiClient.getAddressBook()
      setEntries(data.entries || [])
      setLoading(false)
    } catch (error) {
      toastService.error('Failed to load address book. Please refresh the page.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.address)) {
      toastService.error('Invalid address format. Please enter a valid Ethereum address.')
      return
    }

    const loadingToast = toastService.loading(
      editingEntry?.id ? 'Updating address...' : 'Adding address...'
    )

    try {
      if (editingEntry?.id) {
        await apiClient.updateAddressBookEntry(editingEntry.id, formData)
        toast.dismiss(loadingToast)
        toastService.success('Address updated successfully')
      } else {
        await apiClient.addAddressBookEntry(formData)
        toast.dismiss(loadingToast)
        toastService.success('Address added successfully')
      }
      
      setShowAddModal(false)
      setEditingEntry(null)
      setFormData({ address: '', label: '', notes: '', chain_id: 1 })
      fetchEntries()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to save entry')
    }
  }

  const handleEdit = (entry: AddressBookEntry) => {
    setEditingEntry(entry)
    setFormData(entry)
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    setConfirmDelete({ isOpen: true, entryId: id })
  }

  const confirmDeleteEntry = async () => {
    if (!confirmDelete.entryId) return
    
    const loadingToast = toastService.loading('Deleting address...')
    
    try {
      await apiClient.deleteAddressBookEntry(confirmDelete.entryId)
      toast.dismiss(loadingToast)
      toastService.success('Address deleted successfully')
      setConfirmDelete({ isOpen: false, entryId: null })
      fetchEntries()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to delete entry')
    }
  }

  const filteredEntries = entries.filter(entry =>
    entry.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const chains = [
    { id: 1, name: 'Ethereum' },
    { id: 137, name: 'Polygon' },
    { id: 56, name: 'BSC' },
    { id: 42161, name: 'Arbitrum' },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            Address Book
          </h1>
          <p className="mt-2 text-gray-400">
            Save and manage frequently used addresses
          </p>
        </div>
        <motion.button
          onClick={() => {
            setEditingEntry(null)
            setFormData({ address: '', label: '', notes: '', chain_id: 1 })
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 border border-cyber-blue/30 backdrop-blur-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          Add Address
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
        <input
          type="text"
          placeholder="Search by label or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-black/30 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500 backdrop-blur-md"
        />
      </motion.div>

      {/* Address Book Entries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="cyber-spinner mx-auto"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="col-span-full text-center py-12 rounded-2xl backdrop-blur-md border border-cyan-500/30" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No addresses saved</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card relative overflow-hidden"
                style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{entry.label}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {chains.find(c => c.id === entry.chain_id)?.name || 'Ethereum'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleEdit(entry)}
                      className="p-2 text-cyber-blue hover:bg-cyber-blue/10 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => entry.id && handleDelete(entry.id)}
                      className="p-2 text-cyber-orange hover:bg-cyber-orange/10 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                <p className="font-mono text-sm text-cyan-400 break-all mb-2">
                  {entry.address}
                </p>
                {entry.notes && (
                  <p className="text-sm text-gray-400">{entry.notes}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl p-6 w-full max-w-md border border-cyan-500/30"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  {editingEntry ? 'Edit Address' : 'Add Address'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingEntry(null)
                    setFormData({ address: '', label: '', notes: '', chain_id: 1 })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Label/Name
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono backdrop-blur-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chain
                  </label>
                  <select
                    value={formData.chain_id}
                    onChange={(e) => setFormData({ ...formData, chain_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
                  >
                    {chains.map((chain) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 border border-cyber-blue/30 backdrop-blur-md font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingEntry ? 'Update' : 'Add'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingEntry(null)
                      setFormData({ address: '', label: '', notes: '', chain_id: 1 })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 border border-gray-500/30 backdrop-blur-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, entryId: null })}
        onConfirm={confirmDeleteEntry}
        title="Delete Address"
        message="Are you sure you want to delete this address from your address book? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
