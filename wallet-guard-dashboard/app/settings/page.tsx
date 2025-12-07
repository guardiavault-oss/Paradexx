'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Bell, Shield, Globe, Database, Zap } from 'lucide-react'
import { toastService } from '@/lib/toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      webhook: true,
    },
    security: {
      autoBlock: false,
      riskThreshold: 70,
      requireApproval: true,
    },
    monitoring: {
      interval: 60,
      enableMempool: true,
      enableMEV: true,
    }
  })

  const handleSave = () => {
    // Save settings logic here
    toastService.success('Settings saved successfully!')
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="mt-2 text-gray-400">
          Configure your wallet protection preferences and system settings
        </p>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyber-blue/20 border border-cyber-blue/30">
            <Bell className="w-5 h-5 text-cyber-blue" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Notifications
          </h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-black/20 transition-colors">
            <span className="text-gray-300">Email Notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications.email}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email: e.target.checked }
              })}
              className="w-4 h-4 text-cyber-blue rounded focus:ring-cyan-500 bg-black/30 border-cyan-500/30"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-black/20 transition-colors">
            <span className="text-gray-300">SMS Notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications.sms}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, sms: e.target.checked }
              })}
              className="w-4 h-4 text-cyber-blue rounded focus:ring-cyan-500 bg-black/30 border-cyan-500/30"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-black/20 transition-colors">
            <span className="text-gray-300">Webhook Notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications.webhook}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, webhook: e.target.checked }
              })}
              className="w-4 h-4 text-cyber-blue rounded focus:ring-cyan-500 bg-black/30 border-cyan-500/30"
            />
          </label>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyber-green/20 border border-cyber-green/30">
            <Shield className="w-5 h-5 text-cyber-green" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Security Settings
          </h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-black/20 transition-colors">
            <div>
              <span className="text-gray-300">Auto-Block High Risk</span>
              <p className="text-sm text-gray-500">Automatically block high-risk transactions</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.autoBlock}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, autoBlock: e.target.checked }
              })}
              className="w-4 h-4 text-cyber-blue rounded focus:ring-cyan-500 bg-black/30 border-cyan-500/30"
            />
          </label>
          <div className="p-3 rounded-xl bg-black/20">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Risk Threshold: <span className="text-cyber-blue font-bold">{settings.security.riskThreshold}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.security.riskThreshold}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, riskThreshold: parseInt(e.target.value) }
              })}
              className="w-full accent-cyan-500"
            />
          </div>
          <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-black/20 transition-colors">
            <div>
              <span className="text-gray-300">Require Manual Approval</span>
              <p className="text-sm text-gray-500">Require approval for medium+ risk transactions</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.requireApproval}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, requireApproval: e.target.checked }
              })}
              className="w-4 h-4 text-cyber-blue rounded focus:ring-cyan-500 bg-black/30 border-cyan-500/30"
            />
          </label>
        </div>
      </motion.div>

      {/* Monitoring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyber-purple/20 border border-cyber-purple/30">
            <Globe className="w-5 h-5 text-cyber-purple" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Monitoring Settings
          </h2>
        </div>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-black/20">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monitoring Interval: <span className="text-cyber-blue font-bold">{settings.monitoring.interval}s</span>
            </label>
            <input
              type="range"
              min="10"
              max="300"
              step="10"
              value={settings.monitoring.interval}
              onChange={(e) => setSettings({
                ...settings,
                monitoring: { ...settings.monitoring, interval: parseInt(e.target.value) }
              })}
              className="w-full accent-cyan-500"
            />
          </div>
          <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-black/20 transition-colors">
            <span className="text-gray-300">Enable Mempool Monitoring</span>
            <input
              type="checkbox"
              checked={settings.monitoring.enableMempool}
              onChange={(e) => setSettings({
                ...settings,
                monitoring: { ...settings.monitoring, enableMempool: e.target.checked }
              })}
              className="w-4 h-4 text-cyber-blue rounded focus:ring-cyan-500 bg-black/30 border-cyan-500/30"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-black/20 transition-colors">
            <span className="text-gray-300">Enable MEV Detection</span>
            <input
              type="checkbox"
              checked={settings.monitoring.enableMEV}
              onChange={(e) => setSettings({
                ...settings,
                monitoring: { ...settings.monitoring, enableMEV: e.target.checked }
              })}
              className="w-4 h-4 text-cyber-blue rounded focus:ring-cyan-500 bg-black/30 border-cyan-500/30"
            />
          </label>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end"
      >
        <motion.button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 border border-cyber-blue/30 backdrop-blur-md font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Save className="w-5 h-5" />
          Save Settings
        </motion.button>
      </motion.div>
    </div>
  )
}

