'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Search, Link as LinkIcon, FileCode, Zap } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toastService } from '@/lib/toast'
import toast from 'react-hot-toast'
import FormField from '@/app/components/FormField'

interface PhishingCheckResult {
  url?: string
  contract_address?: string
  chain_id?: number
  is_phishing?: boolean
  is_malicious?: boolean
  risk_score: number
  verification_status?: string
  detected_issues?: string[]
  recommendation?: string
  checked_at: string
}

export default function PhishingProtectionPage() {
  const [activeTab, setActiveTab] = useState<'url' | 'contract'>('url')
  const [url, setUrl] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const [chainId, setChainId] = useState(1)
  const [loading, setLoading] = useState(false)
  const [urlResult, setUrlResult] = useState<PhishingCheckResult | null>(null)
  const [contractResult, setContractResult] = useState<PhishingCheckResult | null>(null)

  const chains = [
    { id: 1, name: 'Ethereum' },
    { id: 137, name: 'Polygon' },
    { id: 56, name: 'BSC' },
    { id: 42161, name: 'Arbitrum' },
    { id: 10, name: 'Optimism' },
    { id: 43114, name: 'Avalanche' },
  ]

  const handleCheckUrl = async () => {
    if (!url.trim()) {
      toastService.error('Please enter a URL to check')
      return
    }

    setLoading(true)
    const loadingToast = toastService.loading('Checking URL for phishing...')

    try {
      const result = await apiClient.checkUrlForPhishing(url)
      toast.dismiss(loadingToast)
      if (result.is_phishing) {
        toastService.warning('Phishing threat detected! This URL is unsafe.')
      } else {
        toastService.success('URL appears safe')
      }
      setUrlResult(result)
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to check URL')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckContract = async () => {
    if (!contractAddress.trim()) {
      toastService.error('Please enter a contract address')
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      toastService.error('Invalid contract address format. Must be a valid Ethereum address.')
      return
    }

    setLoading(true)
    const loadingToast = toastService.loading('Checking contract for phishing...')

    try {
      const result = await apiClient.checkContractForPhishing(contractAddress, chainId)
      toast.dismiss(loadingToast)
      if (result.is_phishing) {
        toastService.warning('Phishing threat detected! This contract is unsafe.')
      } else {
        toastService.success('Contract appears safe')
      }
      setContractResult(result)
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toastService.error(error.message || 'Failed to check contract')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-cyber-orange'
    if (score >= 40) return 'text-cyber-yellow'
    return 'text-cyber-green'
  }

  const getRiskBgColor = (score: number) => {
    if (score >= 70) return 'bg-cyber-orange/20 border-cyber-orange/30'
    if (score >= 40) return 'bg-cyber-yellow/20 border-cyber-yellow/30'
    return 'bg-cyber-green/20 border-cyber-green/30'
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
            Phishing Protection
          </h1>
          <p className="mt-2 text-gray-400">
            Check URLs and smart contracts for phishing attempts and malicious code
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-cyan-500/30"
      >
        <motion.button
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'url'
              ? 'text-cyber-blue border-b-2 border-cyber-blue'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            URL Check
          </span>
        </motion.button>
        <motion.button
          onClick={() => setActiveTab('contract')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'contract'
              ? 'text-cyber-blue border-b-2 border-cyber-blue'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Contract Check
          </span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* URL Check */}
        {activeTab === 'url' && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
              style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyber-blue/20 border border-cyber-blue/30">
                  <LinkIcon className="w-5 h-5 text-cyber-blue" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Check URL for Phishing
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white backdrop-blur-md"
                  />
                </div>

                <motion.button
                  onClick={handleCheckUrl}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-xl hover:bg-cyber-blue/30 disabled:opacity-50 disabled:cursor-not-allowed border border-cyber-blue/30 backdrop-blur-md font-medium"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="cyber-spinner w-4 h-4"></div>
                      Checking...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      Check URL
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* URL Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
              style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyber-purple/20 border border-cyber-purple/30">
                  <Shield className="w-5 h-5 text-cyber-purple" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Analysis Results
                </h2>
              </div>

              {urlResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${getRiskBgColor(urlResult.risk_score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Risk Score</span>
                      <span className={`px-3 py-1 rounded-full text-white font-bold border ${getRiskBgColor(urlResult.risk_score)} ${getRiskColor(urlResult.risk_score)}`}>
                        {urlResult.risk_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-3 mt-2 overflow-hidden">
                      <motion.div
                        className={`h-3 rounded-full ${
                          urlResult.risk_score >= 70 ? 'bg-cyber-orange' :
                          urlResult.risk_score >= 40 ? 'bg-cyber-yellow' :
                          'bg-cyber-green'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${urlResult.risk_score}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {urlResult.is_phishing ? (
                      <AlertTriangle className="w-5 h-5 text-cyber-orange" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-cyber-green" />
                    )}
                    <span className={`font-semibold ${
                      urlResult.is_phishing ? 'text-cyber-orange' : 'text-cyber-green'
                    }`}>
                      {urlResult.is_phishing ? 'Phishing Detected' : 'URL Appears Safe'}
                    </span>
                  </div>

                  {urlResult.recommendation && (
                    <div className="p-3 rounded-lg bg-black/30 border border-cyan-500/20">
                      <p className="text-sm text-gray-300">{urlResult.recommendation}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-cyan-500/30">
                    <p className="text-xs text-gray-500">
                      Checked: {new Date(urlResult.checked_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p>Enter a URL and click "Check URL" to analyze</p>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Contract Check */}
        {activeTab === 'contract' && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
              style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyber-blue/20 border border-cyber-blue/30">
                  <FileCode className="w-5 h-5 text-cyber-blue" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Check Smart Contract
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contract Address
                  </label>
                  <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-cyan-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/30 text-white font-mono backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Blockchain Network
                  </label>
                  <select
                    value={chainId}
                    onChange={(e) => setChainId(parseInt(e.target.value))}
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
                  onClick={handleCheckContract}
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
                      Analyze Contract
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Contract Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl backdrop-blur-md p-6 border border-cyan-500/30 cyber-card"
              style={{ backgroundColor: 'rgba(10, 10, 15, 0.8)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyber-purple/20 border border-cyber-purple/30">
                  <Shield className="w-5 h-5 text-cyber-purple" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Analysis Results
                </h2>
              </div>

              {contractResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${getRiskBgColor(contractResult.risk_score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Risk Score</span>
                      <span className={`px-3 py-1 rounded-full text-white font-bold border ${getRiskBgColor(contractResult.risk_score)} ${getRiskColor(contractResult.risk_score)}`}>
                        {contractResult.risk_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-3 mt-2 overflow-hidden">
                      <motion.div
                        className={`h-3 rounded-full ${
                          contractResult.risk_score >= 70 ? 'bg-cyber-orange' :
                          contractResult.risk_score >= 40 ? 'bg-cyber-yellow' :
                          'bg-cyber-green'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${contractResult.risk_score}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {contractResult.is_malicious ? (
                      <AlertTriangle className="w-5 h-5 text-cyber-orange" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-cyber-green" />
                    )}
                    <span className={`font-semibold ${
                      contractResult.is_malicious ? 'text-cyber-orange' : 'text-cyber-green'
                    }`}>
                      {contractResult.is_malicious ? 'Malicious Contract' : 'Contract Appears Safe'}
                    </span>
                  </div>

                  {contractResult.verification_status && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Verification Status</p>
                      <span className={`px-2 py-1 text-xs rounded border ${
                        contractResult.verification_status === 'verified'
                          ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {contractResult.verification_status}
                      </span>
                    </div>
                  )}

                  {contractResult.detected_issues && contractResult.detected_issues.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-white mb-2">Detected Issues</p>
                      <ul className="space-y-1">
                        {contractResult.detected_issues.map((issue, index) => (
                          <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-cyber-orange mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {contractResult.recommendation && (
                    <div className="p-3 rounded-lg bg-black/30 border border-cyan-500/20">
                      <p className="text-sm text-gray-300">{contractResult.recommendation}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-cyan-500/30">
                    <p className="text-xs text-gray-500">
                      Checked: {new Date(contractResult.checked_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p>Enter a contract address and click "Analyze Contract"</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

