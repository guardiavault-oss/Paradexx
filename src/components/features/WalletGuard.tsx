import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, CheckCircle, AlertTriangle, Lock, Eye, Target } from 'lucide-react';
import { TransactionSimulator } from '../transaction/TransactionSimulator';

interface WalletGuardProps {
  type: 'degen' | 'regen';
  onClose: () => void;
}

export function WalletGuard({ type, onClose }: WalletGuardProps) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator'>('overview');

  const securityChecks = [
    { name: 'Phishing Protection', status: 'active', desc: 'Blocks malicious sites' },
    { name: 'Token Approval Monitor', status: 'active', desc: '12 approvals tracked' },
    { name: 'Transaction Simulation', status: 'active', desc: 'Pre-flight checks enabled' },
    { name: 'Address Whitelist', status: 'warning', desc: '2 addresses pending review' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white pb-24"
    >
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl" style={{ background: `${accentColor}20` }}>
            <Shield className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">WALLET GUARD</h1>
            <p className="text-xs text-white/50">Real-time protection</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === 'overview'
                ? 'text-white border-b-2'
                : 'text-white/40 hover:text-white/60'
            }`}
            style={activeTab === 'overview' ? { borderColor: accentColor } : {}}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === 'simulator'
                ? 'text-white border-b-2'
                : 'text-white/40 hover:text-white/60'
            }`}
            style={activeTab === 'simulator' ? { borderColor: accentColor } : {}}
          >
            <div className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              Simulator
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="p-4 space-y-6">
          {/* Security Score */}
          <div className="p-6 rounded-xl" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}30` }}>
            <div className="text-center mb-4">
              <div className="text-5xl font-black mb-2" style={{ color: accentColor }}>94%</div>
              <div className="text-sm text-white/60 uppercase tracking-wider">Security Score</div>
            </div>
            <div className="text-xs text-center text-white/50">
              Your wallet is well protected
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Threats Blocked', value: '247' },
              { label: 'Safe Days', value: '89' },
              { label: 'Scans', value: '1.2K' },
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 text-center border border-white/10">
                <div className="text-xl font-black">{stat.value}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Security Checks */}
          <div>
            <h3 className="text-base font-black mb-4 uppercase tracking-wider">ACTIVE PROTECTIONS</h3>
            <div className="space-y-2">
              {securityChecks.map((check, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    {check.status === 'active' ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-bold mb-1 uppercase tracking-wider">{check.name}</div>
                      <div className="text-xs text-white/60">{check.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'simulator' && (
        <div className="p-4">
          <TransactionSimulator
            type={type}
            walletAddress="0x742d35Cc6634C0532925a3b844Bc9e7595f0b4c9"
            ethBalance="2.5"
            ethPrice={2000}
            onExecute={(txHash) => {
              console.log('Executing transaction:', txHash);
              // Handle transaction execution
            }}
          />
        </div>
      )}
    </motion.div>
  );
}