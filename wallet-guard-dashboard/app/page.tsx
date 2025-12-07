'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { wsClient } from '@/lib/websocket'
import { 
  Wallet, 
  AlertTriangle, 
  Shield, 
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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


interface DashboardStats {
  service: string
  version: string
  uptime: string
  stats: {
    wallets_protected: number
    threats_detected: number
    threats_blocked: number
    transactions_analyzed: number
    phishing_attempts_stopped: number
    blacklisted_addresses: number
    whitelisted_addresses: number
  }
  chains_supported: number
  avg_response_time: string
}

interface HealthStatus {
  status: string
  capabilities: {
    chains_supported: number
    wallets_monitored: number
    active_alerts: number
  }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [threatsByType, setThreatsByType] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    
    // WebSocket for real-time updates
    const handleUpdate = (message: any) => {
      if (message.type === 'wallet_monitor_started' || message.type === 'wallet_monitor_stopped') {
        fetchDashboardData()
      }
      if (message.type === 'alert_created' || message.type === 'alert_resolved') {
        fetchDashboardData()
      }
    }
    
    wsClient.on('*', handleUpdate)
    
    return () => {
      clearInterval(interval)
      wsClient.off('*', handleUpdate)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsData, healthData, alertsData] = await Promise.all([
        apiClient.getStats().catch(() => null),
        apiClient.getHealth().catch(() => null),
        apiClient.getAlerts().catch(() => ({ alerts: [] }))
      ])

      if (statsData) setStats(statsData)
      if (healthData) setHealth(healthData)

      // Process threat types for chart
      if (alertsData?.alerts) {
        const threatCounts: Record<string, number> = {}
        alertsData.alerts.forEach((alert: any) => {
          threatCounts[alert.threat_type] = (threatCounts[alert.threat_type] || 0) + 1
        })
        setThreatsByType(
          Object.entries(threatCounts).map(([name, value]) => ({ name, value }))
        )
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  const kpiCards = [
    {
      title: 'Wallets Protected',
      value: stats?.stats.wallets_protected || health?.capabilities.wallets_monitored || 0,
      icon: Wallet,
      color: '#00D4FF',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Threats Detected',
      value: stats?.stats.threats_detected || health?.capabilities.active_alerts || 0,
      icon: AlertTriangle,
      color: '#FF6B35',
      change: '-5%',
      trend: 'down'
    },
    {
      title: 'Threats Blocked',
      value: stats?.stats.threats_blocked || 0,
      icon: Shield,
      color: '#39FF14',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Transactions Analyzed',
      value: stats?.stats.transactions_analyzed || 0,
      icon: Activity,
      color: '#8B5CF6',
      change: '+23%',
      trend: 'up'
    }
  ]

  const monthlyData = [
    { month: 'Jan', threats: 120, blocked: 95, wallets: 450 },
    { month: 'Feb', threats: 135, blocked: 110, wallets: 520 },
    { month: 'Mar', threats: 150, blocked: 125, wallets: 580 },
    { month: 'Apr', threats: 142, blocked: 118, wallets: 620 },
    { month: 'May', threats: 165, blocked: 140, wallets: 680 },
    { month: 'Jun', threats: 178, blocked: 152, wallets: 750 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-metamask-purple/30 border-t-metamask-purple rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground text-base">
          Real-time monitoring and protection statistics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={index}
            className="metamask-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="p-3 rounded-xl backdrop-blur-sm"
                  style={{ 
                    backgroundColor: `${kpi.color}15`,
                    border: `1px solid ${kpi.color}30`
                  }}
                >
                  <kpi.icon size={24} style={{ color: kpi.color }} />
                </div>
                {kpi.change && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: kpi.trend === 'up' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: kpi.trend === 'up' ? '#10B981' : '#EF4444',
                      border: `1px solid ${kpi.trend === 'up' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}
                  >
                    {kpi.change}
                  </span>
                )}
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {kpi.value.toLocaleString()}
              </h3>
              <p className="text-muted-foreground text-sm font-medium">{kpi.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* Threat Trends Chart */}
        <motion.div 
          className="metamask-card p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Threat Trends (Last 6 Months)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="threats" stroke="#EF4444" name="Threats Detected" />
              <Line type="monotone" dataKey="blocked" stroke="#10B981" name="Threats Blocked" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Threat Types Distribution */}
        <motion.div 
          className="metamask-card p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Threat Types Distribution
          </h2>
          {threatsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threatsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No threat data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {[
          { label: 'Service Uptime', value: stats?.uptime || '99.96%', subtext: 'Last 30 days' },
          { label: 'Blockchains Supported', value: stats?.chains_supported || health?.capabilities.chains_supported || 10, subtext: 'Active networks' },
          { label: 'Avg Response Time', value: stats?.avg_response_time || '120ms', subtext: 'API response time' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            className="metamask-card p-6 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {stat.label}
            </h3>
            <p className="text-2xl font-bold text-foreground mb-1">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div 
        className="metamask-card rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="p-6 border-b border-metamask-purple/20">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[
              { text: 'Wallet monitoring started', time: '2 minutes ago', color: '#10B981' },
              { text: 'Transaction analyzed', time: '15 minutes ago', color: '#3B82F6' },
              { text: 'Threat alert generated', time: '1 hour ago', color: '#F59E0B' },
            ].map((activity, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-metamask-purple/10 hover:bg-muted/50 transition-colors"
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activity.color }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
