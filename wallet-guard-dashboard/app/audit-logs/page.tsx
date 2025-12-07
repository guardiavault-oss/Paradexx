'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Filter, Search, Clock, FileText, Activity } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toastService } from '@/lib/toast'
import Breadcrumbs from '@/app/components/Breadcrumbs'

interface AuditLog {
  id: string
  action: string
  user: string
  details: any
  timestamp: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [limit, setLimit] = useState(100)

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [limit, filter])

  const fetchLogs = async () => {
    try {
      const data = await apiClient.getAuditLogs(limit, filter !== 'all' ? filter : undefined)
      setLogs(data.logs || [])
      setLoading(false)
    } catch (error) {
      toastService.error('Failed to load audit logs. Please refresh the page.')
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const csv = [
      ['ID', 'Action', 'User', 'Timestamp', 'Details'].join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.action,
        log.user,
        log.timestamp,
        JSON.stringify(log.details).replace(/,/g, ';')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredLogs = logs.filter(log =>
    (filter === 'all' || log.action === filter) &&
    (searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)))

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
            Audit Logs
          </h1>
          <p className="mt-2 text-gray-400">
            View all system actions and events
          </p>
        </div>
        <motion.button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-green/20 text-cyber-green rounded-xl hover:bg-cyber-green/30 border border-cyber-green/30 backdrop-blur-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-5 h-5" />
          Export CSV
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500 backdrop-blur-md"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-black/30 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white backdrop-blur-md"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
          className="px-4 py-2 bg-black/30 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white backdrop-blur-md"
        >
          <option value={50}>50 logs</option>
          <option value={100}>100 logs</option>
          <option value={500}>500 logs</option>
          <option value={1000}>1000 logs</option>
        </select>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl backdrop-blur-md border border-cyan-500/30 overflow-hidden cyber-card"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="cyber-spinner mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto mobile-table-scroll -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[600px]">
              <thead className="bg-black/40 border-b border-cyan-500/30">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">ID</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Action</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider hidden md:table-cell">User</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider hidden lg:table-cell">Details</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                <AnimatePresence>
                  {filteredLogs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-cyan-500/5 transition-colors cyber-card"
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white font-mono">
                        {log.id.slice(0, 8)}...
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-cyber-blue/20 text-cyber-blue text-xs rounded border border-cyber-blue/30">
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white hidden md:table-cell">
                        {log.user}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-400 max-w-md hidden lg:table-cell">
                        <pre className="text-xs bg-black/30 p-2 rounded border border-cyan-500/20 overflow-auto font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

