'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, TrendingUp, TrendingDown, Activity, Shield } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toastService } from '@/lib/toast'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'


const COLORS = ['#00D4FF', '#39FF14', '#FFD700', '#FF6B35', '#8B5CF6', '#EC4899']

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])

  useEffect(() => {
    fetchAnalyticsData()
    const interval = setInterval(fetchAnalyticsData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      const [statsData, alertsData, walletsData] = await Promise.all([
        apiClient.getStats().catch(() => null),
        apiClient.getAlerts().catch(() => ({ alerts: [] })),
        apiClient.listMonitoredWallets().catch(() => ({ wallets: [] }))
      ])

      if (statsData) setStats(statsData)
      if (alertsData) setAlerts(alertsData.alerts || [])
      if (walletsData) setWallets(walletsData.wallets || [])
    } catch (error) {
      toastService.error('Failed to load analytics data. Please refresh the page.')
    }
  }

  // Process data for charts
  const threatTypeData = alerts.reduce((acc: any, alert: any) => {
    acc[alert.threat_type] = (acc[alert.threat_type] || 0) + 1
    return acc
  }, {})

  const threatByType = Object.entries(threatTypeData).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }))

  const severityData = alerts.reduce((acc: any, alert: any) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1
    return acc
  }, {})

  const severityDistribution = Object.entries(severityData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))

  const monthlyData = [
    { month: 'Jan', threats: 120, blocked: 95 },
    { month: 'Feb', threats: 135, blocked: 110 },
    { month: 'Mar', threats: 150, blocked: 125 },
    { month: 'Apr', threats: 142, blocked: 118 },
    { month: 'May', threats: 165, blocked: 140 },
    { month: 'Jun', threats: 178, blocked: 152 },
  ]

  const exportToCSV = () => {
    const csv = [
      ['Metric', 'Value'].join(','),
      ['Wallets Protected', stats?.stats.wallets_protected || 0].join(','),
      ['Threats Detected', stats?.stats.threats_detected || 0].join(','),
      ['Threats Blocked', stats?.stats.threats_blocked || 0].join(','),
      ['Transactions Analyzed', stats?.stats.transactions_analyzed || 0].join(',')
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            Analytics & Reports
          </h1>
          <p className="mt-2 text-gray-400">
            Comprehensive analytics and insights into your wallet protection system
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

      {/* Summary Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {[
            { title: 'Wallets Protected', value: stats.stats.wallets_protected, color: 'cyber-blue', icon: Shield },
            { title: 'Threats Detected', value: stats.stats.threats_detected, color: 'cyber-orange', icon: Activity },
            { title: 'Threats Blocked', value: stats.stats.threats_blocked, color: 'cyber-green', icon: Shield },
            { title: 'Transactions Analyzed', value: stats.stats.transactions_analyzed, color: 'cyber-purple', icon: Activity }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
              style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="p-3 rounded-xl border"
                  style={{
                    backgroundColor: stat.color === 'cyber-blue' ? 'rgba(0, 212, 255, 0.2)' :
                                   stat.color === 'cyber-orange' ? 'rgba(255, 107, 53, 0.2)' :
                                   stat.color === 'cyber-green' ? 'rgba(57, 255, 20, 0.2)' :
                                   'rgba(139, 92, 246, 0.2)',
                    borderColor: stat.color === 'cyber-blue' ? 'rgba(0, 212, 255, 0.3)' :
                                stat.color === 'cyber-orange' ? 'rgba(255, 107, 53, 0.3)' :
                                stat.color === 'cyber-green' ? 'rgba(57, 255, 20, 0.3)' :
                                'rgba(139, 92, 246, 0.3)'
                  }}
                >
                  <stat.icon
                    className="w-5 h-5"
                    style={{
                      color: stat.color === 'cyber-blue' ? '#00D4FF' :
                             stat.color === 'cyber-orange' ? '#FF6B35' :
                             stat.color === 'cyber-green' ? '#39FF14' :
                             '#8B5CF6'
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
              <p
                className="text-3xl font-bold"
                style={{
                  color: stat.color === 'cyber-blue' ? '#00D4FF' :
                         stat.color === 'cyber-orange' ? '#FF6B35' :
                         stat.color === 'cyber-green' ? '#39FF14' :
                         '#8B5CF6'
                }}
              >
                {stat.value.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Threat Types */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
          style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyber-blue" />
            Threats by Type
          </h2>
          {threatByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={threatByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 10, 15, 0.9)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="value" fill="#00D4FF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No threat data available
            </div>
          )}
        </motion.div>

        {/* Severity Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
          style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyber-purple" />
            Severity Distribution
          </h2>
          {severityDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 10, 15, 0.9)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No severity data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyber-green" />
          Threat Trends (Last 6 Months)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 15, 0.9)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend
              wrapperStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="threats" stroke="#FF6B35" name="Threats Detected" strokeWidth={2} dot={{ fill: '#FF6B35', r: 4 }} />
            <Line type="monotone" dataKey="blocked" stroke="#39FF14" name="Threats Blocked" strokeWidth={2} dot={{ fill: '#39FF14', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Additional Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
        >
          {[
            { title: 'Phishing Attempts Stopped', value: stats.stats.phishing_attempts_stopped, color: 'cyber-purple' },
            { title: 'Blacklisted Addresses', value: stats.stats.blacklisted_addresses, color: 'cyber-orange' },
            { title: 'Whitelisted Addresses', value: stats.stats.whitelisted_addresses, color: 'cyber-green' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
              style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                {stat.title}
              </h3>
              <p
                className="text-2xl font-bold"
                style={{
                  color: stat.color === 'cyber-purple' ? '#8B5CF6' :
                         stat.color === 'cyber-orange' ? '#FF6B35' :
                         '#39FF14'
                }}
              >
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

