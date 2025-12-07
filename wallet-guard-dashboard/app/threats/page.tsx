'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import ThreatTimeline from '@/app/components/ThreatTimeline'
import { toastService } from '@/lib/toast'
import toast from 'react-hot-toast'
import { DashboardSkeleton } from '@/app/components/LoadingSkeleton'
import EmptyState from '@/app/components/EmptyState'
import Breadcrumbs from '@/app/components/Breadcrumbs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'

interface ThreatAlert {
  alert_id: string
  wallet_address: string
  threat_type: string
  severity: string
  description: string
  status: string
  created_at: string
  resolved_at?: string
  resolution?: string
}

export default function ThreatsPage() {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [filter])

  const fetchAlerts = async () => {
    try {
      const data = filter === 'active' 
        ? await apiClient.getActiveAlerts()
        : await apiClient.getAlerts()
      
      let alerts = data.alerts || []
      
      if (filter === 'resolved') {
        alerts = alerts.filter((a: ThreatAlert) => a.status === 'resolved')
      }
      
      setAlerts(alerts)
      setLoading(false)
    } catch (error) {
      toastService.error('Failed to load threat alerts. Please refresh the page.')
      setLoading(false)
    }
  }

  const handleResolve = async (alertId: string) => {
    const loadingToast = toastService.loading('Resolving alert...')
    try {
      await apiClient.resolveAlert(alertId, 'Resolved via dashboard')
      toast.dismiss(loadingToast)
      toastService.success('Alert resolved successfully')
      fetchAlerts()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to resolve alert')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30'
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium': return 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getThreatTypeLabel = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return <DashboardSkeleton />
  }

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
            Threat Alerts
          </h1>
          <p className="mt-2 text-gray-400">
            Monitor and manage security threats detected by the system
          </p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-cyan-500/30"
      >
        {(['all', 'active', 'resolved'] as const).map((f) => (
          <motion.button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-medium transition-colors relative ${
              filter === f
                ? 'text-cyber-blue border-b-2 border-cyber-blue'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? alerts.length : alerts.filter(a => 
              f === 'active' ? a.status === 'active' : a.status === 'resolved'
            ).length})
          </motion.button>
        ))}
      </motion.div>

      {/* View Toggle */}
      <div className="flex items-center justify-end mb-4">
        <motion.button
          onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
          className="flex items-center gap-2 px-4 py-2 bg-black/30 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/10 text-white backdrop-blur-md text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Filter className="w-4 h-4" />
          {viewMode === 'list' ? 'Timeline View' : 'List View'}
        </motion.button>
      </div>

      {/* Alerts List/Timeline */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={`No ${filter === 'all' ? '' : filter} Alerts`}
            description={
              filter === 'active'
                ? "Great! You don't have any active threats. Your wallets are secure."
                : filter === 'resolved'
                ? "No resolved alerts yet. Resolved alerts will appear here."
                : "No alerts found. Alerts will appear here when threats are detected."
            }
          />
        ) : viewMode === 'timeline' ? (
          <div className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
            <ThreatTimeline threats={alerts.map(a => ({
              id: a.alert_id,
              type: a.description,
              severity: a.severity,
              timestamp: a.created_at,
              status: a.status
            }))} />
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.alert_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
                style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.severity === 'critical' ? 'text-cyber-orange' :
                        alert.severity === 'high' ? 'text-red-400' :
                        alert.severity === 'medium' ? 'text-cyber-yellow' :
                        'text-gray-400'
                      }`} />
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-cyber-blue/20 text-cyber-blue text-xs rounded border border-cyber-blue/30">
                        {getThreatTypeLabel(alert.threat_type)}
                      </span>
                      {alert.status === 'resolved' && (
                        <span className="px-2 py-1 bg-cyber-green/20 text-cyber-green text-xs rounded border border-cyber-green/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {alert.description}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-400">
                      <p>
                        <span className="font-medium text-gray-300">Wallet:</span>{' '}
                        <span className="font-mono text-cyan-400">{alert.wallet_address}</span>
                      </p>
                      <p>
                        <span className="font-medium text-gray-300">Detected:</span>{' '}
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                      {alert.resolved_at && (
                        <p>
                          <span className="font-medium text-gray-300">Resolved:</span>{' '}
                          {new Date(alert.resolved_at).toLocaleString()}
                        </p>
                      )}
                      {alert.resolution && (
                        <p>
                          <span className="font-medium text-gray-300">Resolution:</span> {alert.resolution}
                        </p>
                      )}
                    </div>
                  </div>
                  {alert.status === 'active' && (
                    <motion.button
                      onClick={() => handleResolve(alert.alert_id)}
                      className="px-4 py-2 bg-cyber-green/20 text-cyber-green rounded-xl hover:bg-cyber-green/30 transition-colors text-sm border border-cyber-green/30 backdrop-blur-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Resolve
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
