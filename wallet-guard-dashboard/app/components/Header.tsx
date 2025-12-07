'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, User, Settings, Activity, Zap, Menu, X } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useSidebar } from '../contexts/sidebar-context'
import NotificationCenter from './NotificationCenter'
import GlobalSearch from './GlobalSearch'
import KeyboardShortcuts from './KeyboardShortcuts'

export default function Header() {
  const { sidebarCollapsed, toggleMobileSidebar } = useSidebar()
  const [health, setHealth] = useState<any>(null)
  const [activeAlerts, setActiveAlerts] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthData, alertsData] = await Promise.all([
          apiClient.getHealth().catch(() => ({ status: 'healthy' })),
          apiClient.getActiveAlerts().catch(() => ({ total: 0 }))
        ])
        setHealth(healthData)
        setActiveAlerts(alertsData.total || 0)
      } catch (error) {
        // Header data fetch error - non-critical, continue without updates
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <motion.header 
        className="fixed top-0 right-0 h-16 md:h-20 z-20 backdrop-blur-xl bg-dark-100/80 border-b border-metamask-purple/20 shadow-lg flex items-center justify-between px-3 sm:px-4 md:px-6"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ 
          left: '0',
          transition: 'left 0.3s ease'
        }}
      >  
        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden p-2 rounded-lg bg-muted/50 border border-metamask-purple/30 hover:bg-metamask-purple/20 transition-colors backdrop-blur-md mr-2"
          onClick={toggleMobileSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu size={20} className="text-metamask-purple" />
        </motion.button>

        {/* Global Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <GlobalSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 ml-2 sm:ml-4 md:ml-6">
          {/* Notifications */}
          <motion.button
            className="relative p-2 sm:p-3 rounded-xl bg-muted/50 border border-metamask-purple/30 hover:bg-metamask-purple/20 transition-colors backdrop-blur-md shadow-lg hover:shadow-metamask-purple/20 touch-manipulation"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} className="text-metamask-purple" />
            {activeAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-metamask-red rounded-full text-xs text-white font-bold flex items-center justify-center shadow-lg glow-error">
                {activeAlerts > 9 ? '9+' : activeAlerts}
              </span>
            )}
          </motion.button>

          {/* Settings */}
          <motion.button
            className="p-2 sm:p-3 rounded-xl bg-muted/50 border border-metamask-purple/30 hover:bg-metamask-purple/20 transition-colors backdrop-blur-md shadow-lg hover:shadow-metamask-purple/20 touch-manipulation hidden sm:flex"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={18} className="text-metamask-purple" />
          </motion.button>

          {/* Status Indicator */}
          <motion.div
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl border backdrop-blur-md touch-manipulation"
            animate={{
              backgroundColor: health?.status === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: health?.status === 'healthy' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
            }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-metamask-green' : 'bg-metamask-red'}`}
              animate={{
                boxShadow: health?.status === 'healthy'
                  ? ['0 0 8px #10B981', '0 0 16px #10B981', '0 0 8px #10B981']
                  : '0 0 0px transparent'
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className={`text-xs font-medium hidden sm:inline ${health?.status === 'healthy' ? 'text-metamask-green' : 'text-metamask-red'}`}>
              {health?.status === 'healthy' ? 'LIVE' : 'OFFLINE'}
            </span>
          </motion.div>

          {/* User Menu */}
          <motion.button
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-muted/50 border border-metamask-purple/30 hover:bg-metamask-purple/20 transition-colors backdrop-blur-md touch-manipulation"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <User size={18} className="text-metamask-purple" />
            <span className="text-sm font-medium text-foreground hidden lg:inline">Admin</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-start justify-end p-2 sm:p-4" onClick={() => setShowNotifications(false)}>
          <motion.div
            className="bg-dark-200/95 backdrop-blur-xl border border-metamask-purple/30 rounded-2xl p-4 sm:p-6 w-full sm:w-80 mt-14 sm:mt-16 mr-0 sm:mr-4 shadow-2xl glow-primary-subtle max-w-sm"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-foreground text-lg">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-metamask-purple hover:text-foreground text-xl font-bold transition-colors">×</button>
            </div>
            <div className="space-y-3">
              {activeAlerts > 0 ? (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="text-red-400 font-medium text-sm">Active Alerts</div>
                  <div className="text-gray-300 text-xs mt-1">{activeAlerts} threat(s) detected</div>
                </div>
              ) : (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-green-400 font-medium text-sm">All Clear</div>
                  <div className="text-gray-300 text-xs mt-1">No active threats</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <motion.div
            className="bg-dark-200/95 backdrop-blur-xl border border-metamask-purple/30 rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:w-96 shadow-2xl glow-primary-subtle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-foreground">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-metamask-purple hover:text-foreground text-xl font-bold transition-colors">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Theme</label>
                <select className="w-full bg-muted/50 text-foreground px-4 py-3 rounded-lg border border-metamask-purple/30 backdrop-blur-md font-semibold focus:border-metamask-purple focus:outline-none transition-colors">
                  <option>Dark (Current)</option>
                  <option>Light</option>
                  <option>Auto</option>
                </select>
              </div>
              <div className="pt-4 border-t border-border flex gap-3">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-foreground font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 metamask-gradient hover:opacity-90 rounded-lg transition-opacity text-white font-medium shadow-lg glow-primary-subtle"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

