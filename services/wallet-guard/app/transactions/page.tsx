'use client'

import { useState } from 'react'
import { Search, AlertCircle, CheckCircle, XCircle, Zap, Shield, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { toastService } from '@/lib/toast'
import toast from 'react-hot-toast'
import FormField from '@/app/components/FormField'
import Breadcrumbs from '@/app/components/Breadcrumbs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'

interface TransactionAnalysis {
  analysis_id: string
  from_address: string
  to_address: string
  chain_id: number
  chain_name: string
  risk_score: number
  risk_level: string
  risk_factors: string[]
  recommendation: string
  timestamp: string
  checks_performed: Record<string, boolean>
}

export default function TransactionsPage() {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null)
  const [formData, setFormData] = useState({
    from_address: '',
    to_address: '',
    value: '',
    data: '',
    chain_id: 1
  })

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.from_address)) {
      toastService.error('Invalid from address format')
      return
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.to_address)) {
      toastService.error('Invalid to address format')
      return
    }
    
    setLoading(true)
    const loadingToast = toastService.loading('Analyzing transaction...')
    
    try {
      const result = await apiClient.analyzeTransaction({
        from_address: formData.from_address,
        to_address: formData.to_address,
        value: formData.value || '0',
        data: formData.data || undefined,
        chain_id: formData.chain_id
      })
      toast.dismiss(loadingToast)
      toastService.success('Transaction analyzed successfully')
      setAnalysis(result)
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to analyze transaction')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'medium': return 'bg-yellow-600'
      default: return 'bg-green-600'
    }
  }

  const chains = [
    { id: 1, name: 'Ethereum' },
    { id: 137, name: 'Polygon' },
    { id: 56, name: 'BSC' },
    { id: 42161, name: 'Arbitrum' },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
          Transaction Analysis
        </h1>
        <p className="mt-2 text-gray-400">
          Analyze transactions for security risks before execution
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analysis Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
          style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyber-blue/20 border border-cyber-blue/30">
              <Activity className="w-5 h-5 text-cyber-blue" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Analyze Transaction
            </h2>
          </div>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                From Address
              </label>
              <input
                type="text"
                value={formData.from_address}
                onChange={(e) => setFormData({ ...formData, from_address: e.target.value })}
                placeholder="0x..."
                required
                className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono backdrop-blur-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                To Address
              </label>
              <input
                type="text"
                value={formData.to_address}
                onChange={(e) => setFormData({ ...formData, to_address: e.target.value })}
                placeholder="0x..."
                required
                className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono backdrop-blur-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Value (in wei)
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="1000000000000000000"
                className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Transaction Data (optional)
              </label>
              <textarea
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                placeholder="0x..."
                rows={3}
                className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono text-sm backdrop-blur-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Blockchain Network
              </label>
              <select
                value={formData.chain_id}
                onChange={(e) => setFormData({ ...formData, chain_id: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
              >
                {chains.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 disabled:opacity-50 disabled:cursor-not-allowed border border-cyber-blue/30 backdrop-blur-md font-medium"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="cyber-spinner w-4 h-4"></div>
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Analyze Transaction
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Analysis Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
          style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyber-purple/20 border border-cyber-purple/30">
              <Shield className="w-5 h-5 text-cyber-purple" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Risk Analysis Results
            </h2>
          </div>
          {analysis ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={analysis.analysis_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl border border-cyan-500/30" style={{ backgroundColor: 'rgba(0, 212, 255, 0.05)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      Risk Score
                    </span>
                    <span className={`px-3 py-1 rounded-full text-white font-bold border ${
                      analysis.risk_level === 'critical' ? 'bg-cyber-orange/20 border-cyber-orange/30 text-cyber-orange' :
                      analysis.risk_level === 'high' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                      analysis.risk_level === 'medium' ? 'bg-cyber-yellow/20 border-cyber-yellow/30 text-cyber-yellow' :
                      'bg-cyber-green/20 border-cyber-green/30 text-cyber-green'
                    }`}>
                      {analysis.risk_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-3 mt-2 overflow-hidden">
                    <motion.div
                      className={`h-3 rounded-full ${
                        analysis.risk_level === 'critical' ? 'bg-cyber-orange' :
                        analysis.risk_level === 'high' ? 'bg-red-500' :
                        analysis.risk_level === 'medium' ? 'bg-cyber-yellow' :
                        'bg-cyber-green'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.risk_score}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyber-purple" />
                    Risk Level: <span className={`${
                      analysis.risk_level === 'critical' ? 'text-cyber-orange' :
                      analysis.risk_level === 'high' ? 'text-red-400' :
                      analysis.risk_level === 'medium' ? 'text-cyber-yellow' :
                      'text-cyber-green'
                    }`}>{analysis.risk_level.toUpperCase()}</span>
                  </h3>
                  <p className="text-sm text-gray-400 pl-6">
                    {analysis.recommendation}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-cyber-orange" />
                    Risk Factors
                  </h3>
                  <ul className="space-y-2 pl-6">
                    {analysis.risk_factors.map((factor, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2 text-sm text-gray-400"
                      >
                        <AlertCircle className="w-4 h-4 text-cyber-orange mt-0.5 flex-shrink-0" />
                        <span>{factor}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyber-green" />
                    Security Checks Performed
                  </h3>
                  <div className="space-y-2 pl-6">
                    {Object.entries(analysis.checks_performed).map(([check, passed], index) => (
                      <motion.div
                        key={check}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        {passed ? (
                          <CheckCircle className="w-4 h-4 text-cyber-green" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-gray-400 capitalize">
                          {check.replace(/_/g, ' ')}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-cyan-500/30">
                  <p className="text-xs text-gray-500 font-mono">
                    Analysis ID: {analysis.analysis_id}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Chain: {analysis.chain_name} (ID: {analysis.chain_id})
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>Submit a transaction to analyze its security risks</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

