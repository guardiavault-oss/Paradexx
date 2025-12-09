'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { wsClient } from '@/lib/websocket'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Listen to WebSocket messages
    const handleMessage = (message: any) => {
      if (message.type === 'alert_created') {
        addNotification({
          type: 'warning',
          title: 'New Threat Alert',
          message: message.alert?.description || 'A new threat has been detected'
        })
      } else if (message.type === 'wallet_monitor_started') {
        addNotification({
          type: 'success',
          title: 'Monitoring Started',
          message: `Started monitoring wallet: ${message.data?.address?.slice(0, 8)}...`
        })
      } else if (message.type === 'transaction_analysis') {
        if (message.analysis?.risk_level === 'critical' || message.analysis?.risk_level === 'high') {
          addNotification({
            type: 'error',
            title: 'High Risk Transaction',
            message: `Transaction flagged: ${message.analysis?.risk_level.toUpperCase()}`
          })
        }
      }
    }

    wsClient.on('*', handleMessage)

    return () => {
      wsClient.off('*', handleMessage)
    }
  }, [])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)) // Keep last 10
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png'
      })
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id)
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-cyber-green" />
      case 'error': return <XCircle className="w-5 h-5 text-cyber-orange" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-cyber-yellow" />
      default: return <Info className="w-5 h-5 text-cyber-blue" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-cyber-green/20 border-cyber-green/30'
      case 'error': return 'bg-cyber-orange/20 border-cyber-orange/30'
      case 'warning': return 'bg-cyber-yellow/20 border-cyber-yellow/30'
      default: return 'bg-cyber-blue/20 border-cyber-blue/30'
    }
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-xl backdrop-blur-md border border-cyan-500/30 bg-black/30 hover:bg-cyan-500/10 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="w-5 h-5 text-cyan-400" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-cyber-orange text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-black/50"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

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
              className="fixed top-20 right-6 w-96 max-h-[600px] rounded-2xl backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 z-50 overflow-hidden"
              style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)' }}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
            >
              <div className="p-4 border-b border-cyan-500/30 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[500px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No notifications</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    <AnimatePresence>
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border backdrop-blur-md cursor-pointer transition-all ${
                            notification.read ? 'opacity-60' : ''
                          } ${getBgColor(notification.type)}`}
                          onClick={() => markAsRead(notification.id)}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-white mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-400 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {notification.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNotification(notification.id)
                              }}
                              className="flex-shrink-0 text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 border-t border-cyan-500/30">
                  <button
                    onClick={() => {
                      setNotifications([])
                      setIsOpen(false)
                    }}
                    className="w-full px-4 py-2 bg-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/30 border border-gray-500/30 backdrop-blur-md text-sm"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

