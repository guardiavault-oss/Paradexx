'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Maximize2, Minimize2, RefreshCw } from 'lucide-react'
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
  ResponsiveContainer,
} from 'recharts'

interface ChartData {
  [key: string]: any
}

interface EnhancedChartProps {
  type: 'line' | 'bar' | 'pie'
  data: ChartData[]
  dataKey: string
  nameKey?: string
  title?: string
  height?: number
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
  onExport?: () => void
  onRefresh?: () => void
  isLoading?: boolean
}

const DEFAULT_COLORS = ['#00D4FF', '#39FF14', '#FFD700', '#FF6B35', '#8B5CF6', '#EC4899']

export default function EnhancedChart({
  type,
  data,
  dataKey,
  nameKey = 'name',
  title,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showGrid = true,
  onExport,
  onRefresh,
  isLoading = false,
}: EnhancedChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const renderChart = () => {
    const chartProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    switch (type) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />}
            <XAxis dataKey={nameKey} stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ color: '#fff' }} />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...chartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />}
            <XAxis dataKey={nameKey} stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ color: '#fff' }} />}
            <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 0, 0]} />
          </BarChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
          </PieChart>
        )

      default:
        return null
    }
  }

  return (
    <div className="rounded-2xl backdrop-blur-md border border-cyan-500/30 overflow-hidden"
      style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
    >
      {/* Header */}
      {(title || onExport || onRefresh) && (
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
          {title && (
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          )}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <motion.button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            )}
            {onExport && (
              <motion.button
                onClick={onExport}
                className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Download className="w-4 h-4" />
              </motion.button>
            )}
            <motion.button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-4" style={{ height: isFullscreen ? '80vh' : `${height}px` }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="cyber-spinner"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div className="flex items-center justify-center h-full text-gray-400">No chart data available</div>}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

