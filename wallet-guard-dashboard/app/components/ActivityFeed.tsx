'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react'
// Using native date formatting instead of date-fns for better compatibility
import { wsClient } from '@/lib/websocket'

interface ActivityItem {
  id: string
  type: 'wallet_added' | 'wallet_removed' | 'alert_created' | 'alert_resolved' | 'transaction_analyzed' | 'rule_created'
  title: string
  description: string
  timestamp: string
  icon: typeof Wallet
  color: string
  status?: 'success' | 'warning' | 'error' | 'info'
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  
  useEffect(() => {
    // Listen to WebSocket updates
    const handleUpdate = (message: any) => {
      let newActivity: ActivityItem | null = null
      
      switch (message.type) {
        case 'wallet_monitor_started':
          newActivity = {
            id: `wallet-${Date.now()}`,
            type: 'wallet_added',
            title: 'Wallet Monitoring Started',
            description: `Started monitoring ${message.data?.address?.slice(0, 6)}...${message.data?.address?.slice(-4)}`,
            timestamp: new Date().toISOString(),
            icon: Wallet,
            color: '#39FF14',
            status: 'success',
          }
          break
        case 'wallet_monitor_stopped':
          newActivity = {
            id: `wallet-stop-${Date.now()}`,
            type: 'wallet_removed',
            title: 'Wallet Monitoring Stopped',
            description: `Stopped monitoring wallet ${message.wallet_id}`,
            timestamp: new Date().toISOString(),
            icon: Wallet,
            color: '#FF6B35',
            status: 'info',
          }
          break
        case 'alert_created':
          newActivity = {
            id: `alert-${Date.now()}`,
            type: 'alert_created',
            title: 'New Threat Alert',
            description: message.alert?.description || 'Threat detected',
            timestamp: new Date().toISOString(),
            icon: AlertTriangle,
            color: '#FF6B35',
            status: 'warning',
          }
          break
        case 'alert_resolved':
          newActivity = {
            id: `alert-resolved-${Date.now()}`,
            type: 'alert_resolved',
            title: 'Alert Resolved',
            description: `Alert ${message.alert_id} has been resolved`,
            timestamp: new Date().toISOString(),
            icon: CheckCircle,
            color: '#39FF14',
            status: 'success',
          }
          break
        case 'transaction_analysis':
          newActivity = {
            id: `tx-${Date.now()}`,
            type: 'transaction_analyzed',
            title: 'Transaction Analyzed',
            description: `Risk level: ${message.analysis?.risk_level || 'unknown'}`,
            timestamp: new Date().toISOString(),
            icon: Activity,
            color: '#8B5CF6',
            status: 'info',
          }
          break
      }
      
      if (newActivity) {
        setActivities(prev => [newActivity!, ...prev].slice(0, 10))
      }
    }
    
    wsClient.on('*', handleUpdate)
    
    return () => {
      wsClient.off('*', handleUpdate)
    }
  }, [])
  
  return (
    <div className="fixed bottom-6 left-6 z-40 w-80 max-w-[calc(100vw-2rem)]">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 rounded-xl bg-black/40 backdrop-blur-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/20 flex items-center justify-between hover:border-cyan-400 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Recent Activity</span>
          {activities.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
              {activities.length}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Clock className="w-4 h-4 text-gray-400" />
        </motion.div>
      </motion.button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="mt-2 rounded-xl bg-black/40 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="max-h-96 overflow-y-auto p-2">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity, index) => {
                    const Icon = activity.icon
                    return (
                      <motion.div
                        key={activity.id}
                        className="p-3 rounded-xl bg-black/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{
                              backgroundColor: `${activity.color}20`,
                              borderColor: `${activity.color}40`,
                            }}
                          >
                            <Icon className="w-4 h-4" style={{ color: activity.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{activity.title}</p>
                            <p className="text-xs text-gray-400 mt-1 truncate">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(() => {
                                const date = new Date(activity.timestamp)
                                const now = new Date()
                                const diff = now.getTime() - date.getTime()
                                const seconds = Math.floor(diff / 1000)
                                const minutes = Math.floor(seconds / 60)
                                const hours = Math.floor(minutes / 60)
                                const days = Math.floor(hours / 24)
                                
                                if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
                                if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
                                if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
                                return 'Just now'
                              })()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

