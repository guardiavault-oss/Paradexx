'use client'

import { motion } from 'framer-motion'
import { Shield, AlertTriangle, XCircle } from 'lucide-react'

interface RiskMeterProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function RiskMeter({ score, size = 'md', showLabel = true }: RiskMeterProps) {
  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: 'Critical', color: '#FF6B35', icon: XCircle }
    if (score >= 50) return { level: 'High', color: '#FF6B35', icon: AlertTriangle }
    if (score >= 30) return { level: 'Medium', color: '#FFD700', icon: AlertTriangle }
    return { level: 'Low', color: '#39FF14', icon: Shield }
  }

  const risk = getRiskLevel(score)
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const circumference = 2 * Math.PI * 40 // radius = 40
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: sizeClasses[size], height: sizeClasses[size] }}>
        <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(0, 212, 255, 0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={risk.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`font-bold ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'}`} style={{ color: risk.color }}>
              {score}
            </div>
            <div className="text-xs text-gray-400">/100</div>
          </div>
        </div>
      </div>
      
      {showLabel && (
        <div className="flex items-center gap-2">
          <risk.icon className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: risk.color }} />
          <span className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`} style={{ color: risk.color }}>
            {risk.level}
          </span>
        </div>
      )}
    </div>
  )
}

