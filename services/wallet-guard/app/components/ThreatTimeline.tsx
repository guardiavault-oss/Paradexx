'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ThreatTimelineProps {
  threats: Array<{
    id: string
    type: string
    severity: string
    timestamp: string
    status: string
  }>
}

export default function ThreatTimeline({ threats }: ThreatTimelineProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'border-cyber-orange bg-cyber-orange/20 text-cyber-orange'
      case 'high': return 'border-red-500 bg-red-500/20 text-red-400'
      case 'medium': return 'border-cyber-yellow bg-cyber-yellow/20 text-cyber-yellow'
      default: return 'border-gray-500 bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyber-blue via-cyber-purple to-cyber-green opacity-30" />

      <div className="space-y-6">
        {threats.map((threat, index) => (
          <motion.div
            key={threat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-16"
          >
            {/* Timeline dot */}
            <div className={`absolute left-3 top-2 w-6 h-6 rounded-full border-2 ${getSeverityColor(threat.severity)} flex items-center justify-center`}>
              {threat.status === 'resolved' ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
            </div>

            {/* Content */}
            <div className="rounded-xl backdrop-blur-md p-4 border border-cyan-500/30 cyber-card" style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">{threat.type}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(threat.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded border ${getSeverityColor(threat.severity)}`}>
                  {threat.severity.toUpperCase()}
                </span>
              </div>
              {threat.status === 'resolved' && (
                <div className="flex items-center gap-2 mt-2 text-xs text-cyber-green">
                  <CheckCircle className="w-3 h-3" />
                  <span>Resolved</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

