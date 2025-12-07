/**
 * Unified Transaction Flow Component
 * Combines GuardianX security analysis with GuardiaVault guardian approvals
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Info,
  Zap, DollarSign, Clock, Users, Lock, TrendingUp,
  ArrowRight, ChevronLeft, Eye, EyeOff, Copy
} from 'lucide-react';

// Types
interface TransactionFlowProps {
  onClose: () => void;
  onComplete: (txHash: string) => void;
}

interface TransactionData {
  to: string;
  from: string;
  value: string;
  asset: string;
  chain: string;
  gasLimit?: string;
  gasPrice?: string;
  data?: string;
}

interface RiskAnalysis {
  score: number;
  level: 'safe' | 'warning' | 'danger' | 'critical';
  threats: ThreatDetail[];
  suggestions: Suggestion[];
  mevRisk: boolean;
  requiresGuardianApproval: boolean;
}

interface ThreatDetail {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation?: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  impact: string;
  action?: () => void;
}

interface RewriteOption {
  type: string;
  description: string;
  savingsEstimate: string;
  recommended: boolean;
}

type FlowStep = 'input' | 'analyze' | 'confirm' | 'process' | 'complete';

const TransactionFlow: React.FC<TransactionFlowProps> = ({
  onClose,
  onComplete
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<FlowStep>('input');
  const [transaction, setTransaction] = useState<TransactionData>({
    to: '',
    from: '',
    value: '',
    asset: 'ETH',
    chain: 'ethereum'
  });
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [rewriteOptions, setRewriteOptions] = useState<RewriteOption[]>([]);
  const [selectedRewrite, setSelectedRewrite] = useState<string | null>(null);
  const [guardianApprovals, setGuardianApprovals] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mevProtection, setMevProtection] = useState(true);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Mock risk analysis
  const analyzeTransaction = useCallback(async () => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockAnalysis: RiskAnalysis = {
      score: Math.random() > 0.3 ? 85 : 45,
      level: Math.random() > 0.3 ? 'safe' : 'warning',
      threats: [
        {
          type: 'MEV Risk',
          severity: 'medium',
          description: 'Transaction may be vulnerable to sandwich attacks',
          mitigation: 'Enable MEV protection to route through private mempool'
        }
      ],
      suggestions: [
        {
          id: '1',
          title: 'Optimize gas fees',
          description: 'Current gas prices are 15% above average',
          impact: 'Save ~$12.50',
          action: () => console.log('Optimize gas')
        },
        {
          id: '2',
          title: 'Use different route',
          description: 'Bridge through Arbitrum for lower fees',
          impact: 'Save ~$25.00',
          action: () => console.log('Change route')
        }
      ],
      mevRisk: true,
      requiresGuardianApproval: parseFloat(transaction.value) > 1000
    };
    
    setRiskAnalysis(mockAnalysis);
    
    // Mock rewrite options
    setRewriteOptions([
      {
        type: 'MEV Protection',
        description: 'Route through Flashbots private mempool',
        savingsEstimate: 'Protect $45 from MEV',
        recommended: true
      },
      {
        type: 'Gas Optimization',
        description: 'Batch with pending transactions',
        savingsEstimate: 'Save $8.50 in gas',
        recommended: false
      }
    ]);
    
    setIsProcessing(false);
    setCurrentStep('analyze');
  }, [transaction]);

  // Process transaction
  const processTransaction = useCallback(async () => {
    setIsProcessing(true);
    setCurrentStep('process');
    
    // Simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    setTxHash(mockTxHash);
    
    setIsProcessing(false);
    setCurrentStep('complete');
    
    // Notify parent
    setTimeout(() => {
      onComplete(mockTxHash);
    }, 2000);
  }, [transaction, selectedRewrite, onComplete]);

  // Step navigation
  const goToStep = useCallback((step: FlowStep) => {
    setCurrentStep(step);
  }, []);

  const goBack = useCallback(() => {
    const steps: FlowStep[] = ['input', 'analyze', 'confirm', 'process', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      onClose();
    }
  }, [currentStep, onClose]);

  // Risk level colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'danger': return '#EF4444';
      case 'critical': return '#991B1B';
      default: return '#64748B';
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'input':
        return <InputStep />;
      case 'analyze':
        return <AnalyzeStep />;
      case 'confirm':
        return <ConfirmStep />;
      case 'process':
        return <ProcessStep />;
      case 'complete':
        return <CompleteStep />;
      default:
        return null;
    }
  };

  // Input Step Component
  const InputStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content"
    >
      <h2>Send Transaction</h2>
      
      <div className="form-group">
        <label>To Address</label>
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="0x..."
            value={transaction.to}
            onChange={(e) => setTransaction({...transaction, to: e.target.value})}
          />
          <button className="input-action">
            <Copy size={16} />
          </button>
        </div>
      </div>
      
      <div className="form-group">
        <label>Amount</label>
        <div className="amount-input">
          <input
            type="number"
            placeholder="0.0"
            value={transaction.value}
            onChange={(e) => setTransaction({...transaction, value: e.target.value})}
          />
          <select
            value={transaction.asset}
            onChange={(e) => setTransaction({...transaction, asset: e.target.value})}
          >
            <option value="ETH">ETH</option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
          </select>
        </div>
        <span className="input-hint">Balance: 5.234 ETH</span>
      </div>
      
      <div className="form-group">
        <label>Network</label>
        <select
          value={transaction.chain}
          onChange={(e) => setTransaction({...transaction, chain: e.target.value})}
        >
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
        </select>
      </div>
      
      <button 
        className="advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </button>
      
      {showAdvanced && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="advanced-options"
        >
          <div className="form-group">
            <label>Gas Limit</label>
            <input
              type="number"
              placeholder="21000"
              value={transaction.gasLimit}
              onChange={(e) => setTransaction({...transaction, gasLimit: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Gas Price (Gwei)</label>
            <input
              type="number"
              placeholder="Auto"
              value={transaction.gasPrice}
              onChange={(e) => setTransaction({...transaction, gasPrice: e.target.value})}
            />
          </div>
        </motion.div>
      )}
      
      <button 
        className="btn-primary"
        onClick={analyzeTransaction}
        disabled={!transaction.to || !transaction.value}
      >
        Analyze Transaction
        <ArrowRight size={16} />
      </button>
    </motion.div>
  );

  // Analyze Step Component
  const AnalyzeStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content"
    >
      <h2>Security Analysis</h2>
      
      {riskAnalysis && (
        <>
          {/* Risk Score */}
          <div className="risk-score-card">
            <div className="risk-score-circle" style={{
              background: `conic-gradient(${getRiskColor(riskAnalysis.level)} ${riskAnalysis.score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
            }}>
              <div className="risk-score-inner">
                <span className="score-value">{riskAnalysis.score}</span>
                <span className="score-label">{riskAnalysis.level.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="risk-details">
              <h3>Risk Assessment</h3>
              {riskAnalysis.threats.map((threat, index) => (
                <div key={index} className={`threat-item ${threat.severity}`}>
                  <AlertTriangle size={16} />
                  <div>
                    <strong>{threat.type}</strong>
                    <p>{threat.description}</p>
                    {threat.mitigation && (
                      <span className="mitigation">💡 {threat.mitigation}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Suggestions */}
          {riskAnalysis.suggestions.length > 0 && (
            <div className="suggestions-section">
              <h3>Optimization Suggestions</h3>
              {riskAnalysis.suggestions.map(suggestion => (
                <div key={suggestion.id} className="suggestion-card">
                  <div className="suggestion-content">
                    <h4>{suggestion.title}</h4>
                    <p>{suggestion.description}</p>
                    <span className="impact">{suggestion.impact}</span>
                  </div>
                  {suggestion.action && (
                    <button className="btn-apply" onClick={suggestion.action}>
                      Apply
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Rewrite Options */}
          {rewriteOptions.length > 0 && (
            <div className="rewrite-section">
              <h3>Transaction Optimization</h3>
              {rewriteOptions.map((option, index) => (
                <label key={index} className={`rewrite-option ${option.recommended ? 'recommended' : ''}`}>
                  <input
                    type="radio"
                    name="rewrite"
                    value={option.type}
                    checked={selectedRewrite === option.type}
                    onChange={() => setSelectedRewrite(option.type)}
                  />
                  <div className="option-content">
                    <div className="option-header">
                      <strong>{option.type}</strong>
                      {option.recommended && <span className="badge">Recommended</span>}
                    </div>
                    <p>{option.description}</p>
                    <span className="savings">{option.savingsEstimate}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          {/* MEV Protection Toggle */}
          <div className="protection-toggle">
            <label>
              <div className="toggle-content">
                <Shield size={20} />
                <div>
                  <strong>MEV Protection</strong>
                  <p>Route through private mempool to prevent front-running</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={mevProtection}
                onChange={(e) => setMevProtection(e.target.checked)}
              />
              <span className="toggle-switch"></span>
            </label>
          </div>
        </>
      )}
      
      <div className="step-actions">
        <button className="btn-secondary" onClick={goBack}>
          <ChevronLeft size={16} />
          Back
        </button>
        <button 
          className="btn-primary"
          onClick={() => setCurrentStep('confirm')}
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );

  // Confirm Step Component
  const ConfirmStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content"
    >
      <h2>Confirm Transaction</h2>
      
      <div className="confirmation-summary">
        <div className="summary-header">
          <div className="summary-from">
            <span className="label">From</span>
            <span className="address">0x742d...5892</span>
          </div>
          <div className="summary-arrow">
            <ArrowRight size={24} />
          </div>
          <div className="summary-to">
            <span className="label">To</span>
            <span className="address">{transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}</span>
          </div>
        </div>
        
        <div className="summary-amount">
          <span className="amount-value">{transaction.value}</span>
          <span className="amount-asset">{transaction.asset}</span>
          <span className="amount-usd">≈ ${(parseFloat(transaction.value) * 2500).toFixed(2)}</span>
        </div>
        
        <div className="summary-details">
          <div className="detail-row">
            <span>Network</span>
            <span>{transaction.chain}</span>
          </div>
          <div className="detail-row">
            <span>Gas Fee</span>
            <span>$12.50</span>
          </div>
          {selectedRewrite && (
            <div className="detail-row highlight">
              <span>Optimization</span>
              <span>{selectedRewrite}</span>
            </div>
          )}
          {mevProtection && (
            <div className="detail-row highlight">
              <span>MEV Protection</span>
              <span>Enabled</span>
            </div>
          )}
          <div className="detail-row total">
            <span>Total Cost</span>
            <span>${((parseFloat(transaction.value) * 2500) + 12.50).toFixed(2)}</span>
          </div>
        </div>
        
        {riskAnalysis?.requiresGuardianApproval && (
          <div className="guardian-approval-section">
            <h3>Guardian Approval Required</h3>
            <p>This transaction requires approval from your guardians due to the high value.</p>
            <div className="guardian-list">
              <div className="guardian-item pending">
                <Users size={16} />
                <span>Guardian 1</span>
                <span className="status">Pending</span>
              </div>
              <div className="guardian-item pending">
                <Users size={16} />
                <span>Guardian 2</span>
                <span className="status">Pending</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="step-actions">
        <button className="btn-secondary" onClick={goBack}>
          <ChevronLeft size={16} />
          Back
        </button>
        <button 
          className="btn-primary"
          onClick={processTransaction}
        >
          Send Transaction
          <Lock size={16} />
        </button>
      </div>
    </motion.div>
  );

  // Process Step Component
  const ProcessStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="step-content processing"
    >
      <div className="processing-animation">
        <div className="spinner"></div>
        <Shield className="shield-icon" size={48} />
      </div>
      
      <h2>Processing Transaction</h2>
      <p>Your transaction is being securely processed with MEV protection</p>
      
      <div className="processing-steps">
        <div className="process-step active">
          <CheckCircle size={20} />
          <span>Analyzing transaction</span>
        </div>
        <div className="process-step active">
          <div className="step-spinner"></div>
          <span>Applying optimizations</span>
        </div>
        <div className="process-step">
          <div className="step-spinner"></div>
          <span>Broadcasting to network</span>
        </div>
      </div>
    </motion.div>
  );

  // Complete Step Component
  const CompleteStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="step-content complete"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="success-icon"
      >
        <CheckCircle size={64} />
      </motion.div>
      
      <h2>Transaction Sent!</h2>
      <p>Your transaction has been successfully submitted to the network</p>
      
      <div className="transaction-details">
        <div className="tx-hash">
          <span className="label">Transaction Hash</span>
          <div className="hash-value">
            <code>{txHash.slice(0, 20)}...{txHash.slice(-20)}</code>
            <button className="copy-btn">
              <Copy size={16} />
            </button>
          </div>
        </div>
        
        <div className="protection-summary">
          <h3>Protection Applied</h3>
          <ul>
            <li>✓ MEV Protection enabled</li>
            <li>✓ Gas optimized (saved $8.50)</li>
            <li>✓ Transaction monitored</li>
          </ul>
        </div>
      </div>
      
      <div className="step-actions">
        <button className="btn-secondary" onClick={() => window.open(`https://etherscan.io/tx/${txHash}`)}>
          View on Explorer
          <ArrowRight size={16} />
        </button>
        <button className="btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="transaction-flow">
      <div className="flow-container">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{
                width: `${
                  currentStep === 'input' ? 20 :
                  currentStep === 'analyze' ? 40 :
                  currentStep === 'confirm' ? 60 :
                  currentStep === 'process' ? 80 :
                  100
                }%`
              }}
            />
          </div>
        </div>
        
        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
      
      <style jsx>{`
        .transaction-flow {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        
        .flow-container {
          width: 90%;
          max-width: 520px;
          background: var(--color-obsidian);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00BFFF 0%, #8B5CF6 100%);
          transition: width 0.3s ease;
        }
        
        .step-content {
          padding: 2rem;
        }
        
        .step-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 1.5rem 0;
          color: var(--color-slate-50);
        }
        
        /* Form Styles */
        .form-group {
          margin-bottom: 1.25rem;
        }
        
        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-slate-300);
          margin-bottom: 0.5rem;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        input,
        select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--color-slate-50);
          font-size: 1rem;
          transition: all 0.2s;
        }
        
        input:focus,
        select:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(0, 191, 255, 0.1);
        }
        
        .input-action {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.5rem;
          background: transparent;
          border: none;
          color: var(--color-slate-400);
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .input-action:hover {
          color: var(--color-slate-200);
        }
        
        .amount-input {
          display: flex;
          gap: 0.5rem;
        }
        
        .amount-input input {
          flex: 1;
        }
        
        .amount-input select {
          width: 100px;
        }
        
        .input-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--color-slate-500);
          margin-top: 0.25rem;
        }
        
        /* Buttons */
        .btn-primary,
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #00BFFF 0%, #0099FF 100%);
          color: white;
          width: 100%;
          margin-top: 1.5rem;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 191, 255, 0.3);
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--color-slate-300);
        }
        
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        
        /* Advanced Options */
        .advanced-toggle {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: var(--color-slate-400);
          font-size: 0.875rem;
          cursor: pointer;
          margin-top: 1rem;
          transition: all 0.2s;
        }
        
        .advanced-toggle:hover {
          border-color: var(--color-slate-500);
          color: var(--color-slate-300);
        }
        
        .advanced-options {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--glass-border);
        }
        
        /* Risk Analysis */
        .risk-score-card {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          margin-bottom: 1.5rem;
        }
        
        .risk-score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .risk-score-inner {
          width: 100px;
          height: 100px;
          background: var(--color-obsidian);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .score-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }
        
        .score-label {
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 0.25rem;
          opacity: 0.7;
        }
        
        .risk-details {
          flex: 1;
        }
        
        .risk-details h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }
        
        .threat-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }
        
        .threat-item.low {
          border-left: 3px solid #10B981;
        }
        
        .threat-item.medium {
          border-left: 3px solid #F59E0B;
        }
        
        .threat-item.high {
          border-left: 3px solid #EF4444;
        }
        
        .threat-item.critical {
          border-left: 3px solid #991B1B;
        }
        
        .threat-item strong {
          display: block;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        
        .threat-item p {
          font-size: 0.813rem;
          color: var(--color-slate-400);
          margin: 0;
        }
        
        .mitigation {
          display: block;
          font-size: 0.75rem;
          color: var(--color-slate-300);
          margin-top: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 4px;
        }
        
        /* Suggestions */
        .suggestions-section h3,
        .rewrite-section h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }
        
        .suggestion-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          margin-bottom: 0.75rem;
        }
        
        .suggestion-content h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }
        
        .suggestion-content p {
          font-size: 0.813rem;
          color: var(--color-slate-400);
          margin: 0 0 0.5rem 0;
        }
        
        .impact {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .btn-apply {
          padding: 0.5rem 1rem;
          background: rgba(0, 191, 255, 0.1);
          border: 1px solid rgba(0, 191, 255, 0.3);
          border-radius: 8px;
          color: #00BFFF;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-apply:hover {
          background: rgba(0, 191, 255, 0.2);
        }
        
        /* Rewrite Options */
        .rewrite-option {
          display: block;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .rewrite-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .rewrite-option.recommended {
          border-color: rgba(0, 191, 255, 0.3);
          background: rgba(0, 191, 255, 0.05);
        }
        
        .rewrite-option input[type="radio"] {
          display: none;
        }
        
        .option-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        
        .option-header strong {
          font-size: 0.875rem;
        }
        
        .badge {
          padding: 0.125rem 0.5rem;
          background: linear-gradient(135deg, #00BFFF 0%, #0099FF 100%);
          color: white;
          border-radius: 4px;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .option-content p {
          font-size: 0.813rem;
          color: var(--color-slate-400);
          margin: 0 0 0.5rem 0;
        }
        
        .savings {
          font-size: 0.75rem;
          color: #10B981;
          font-weight: 600;
        }
        
        /* Protection Toggle */
        .protection-toggle label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          cursor: pointer;
          margin-top: 1rem;
        }
        
        .toggle-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .toggle-content strong {
          display: block;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        
        .toggle-content p {
          font-size: 0.75rem;
          color: var(--color-slate-400);
          margin: 0;
        }
        
        .protection-toggle input[type="checkbox"] {
          display: none;
        }
        
        .toggle-switch {
          width: 48px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          position: relative;
          transition: background 0.3s;
        }
        
        .toggle-switch::after {
          content: '';
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 10px;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
        }
        
        .protection-toggle input:checked + .toggle-switch {
          background: linear-gradient(135deg, #00BFFF 0%, #0099FF 100%);
        }
        
        .protection-toggle input:checked + .toggle-switch::after {
          transform: translateX(24px);
        }
        
        /* Step Actions */
        .step-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        /* Confirmation Summary */
        .confirmation-summary {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
        }
        
        .summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--glass-border);
        }
        
        .summary-from,
        .summary-to {
          text-align: center;
        }
        
        .summary-from .label,
        .summary-to .label {
          display: block;
          font-size: 0.75rem;
          color: var(--color-slate-500);
          margin-bottom: 0.25rem;
        }
        
        .address {
          font-family: var(--font-mono);
          font-size: 0.875rem;
          color: var(--color-slate-300);
        }
        
        .summary-arrow {
          color: var(--color-slate-500);
        }
        
        .summary-amount {
          text-align: center;
          padding: 1.5rem 0;
          border-bottom: 1px solid var(--glass-border);
        }
        
        .amount-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--color-slate-50);
        }
        
        .amount-asset {
          font-size: 1.5rem;
          color: var(--color-slate-400);
          margin-left: 0.5rem;
        }
        
        .amount-usd {
          display: block;
          font-size: 1rem;
          color: var(--color-slate-500);
          margin-top: 0.5rem;
        }
        
        .summary-details {
          padding-top: 1rem;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          font-size: 0.875rem;
        }
        
        .detail-row:not(:last-child) {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .detail-row.highlight {
          color: #00BFFF;
        }
        
        .detail-row.total {
          font-weight: 600;
          font-size: 1rem;
          padding-top: 1rem;
        }
        
        /* Guardian Approval */
        .guardian-approval-section {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
        }
        
        .guardian-approval-section h3 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #8B5CF6;
        }
        
        .guardian-approval-section p {
          font-size: 0.813rem;
          color: var(--color-slate-400);
          margin: 0 0 1rem 0;
        }
        
        .guardian-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .guardian-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }
        
        .guardian-item .status {
          margin-left: auto;
          padding: 0.125rem 0.5rem;
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        /* Processing State */
        .processing {
          text-align: center;
          padding: 3rem 2rem;
        }
        
        .processing-animation {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 2rem;
        }
        
        .spinner {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid rgba(0, 191, 255, 0.1);
          border-top-color: #00BFFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .shield-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #00BFFF;
        }
        
        .processing-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 2rem;
          text-align: left;
        }
        
        .process-step {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          opacity: 0.5;
        }
        
        .process-step.active {
          opacity: 1;
        }
        
        .step-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0, 191, 255, 0.3);
          border-top-color: #00BFFF;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        
        /* Complete State */
        .complete {
          text-align: center;
          padding: 3rem 2rem;
        }
        
        .success-icon {
          color: #10B981;
          margin-bottom: 1rem;
        }
        
        .transaction-details {
          margin: 2rem 0;
          text-align: left;
        }
        
        .tx-hash {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          margin-bottom: 1rem;
        }
        
        .tx-hash .label {
          display: block;
          font-size: 0.75rem;
          color: var(--color-slate-500);
          margin-bottom: 0.5rem;
        }
        
        .hash-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .hash-value code {
          flex: 1;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--color-slate-300);
          word-break: break-all;
        }
        
        .copy-btn {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: var(--color-slate-400);
          cursor: pointer;
        }
        
        .copy-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--color-slate-200);
        }
        
        .protection-summary {
          padding: 1rem;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
        }
        
        .protection-summary h3 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          color: #10B981;
        }
        
        .protection-summary ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .protection-summary li {
          font-size: 0.813rem;
          color: var(--color-slate-300);
          margin-bottom: 0.5rem;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Mobile Optimizations */
        @media (max-width: 768px) {
          .flow-container {
            width: 100%;
            height: 100%;
            border-radius: 0;
            max-width: none;
          }
          
          .step-content {
            padding: 1.5rem;
          }
          
          .risk-score-card {
            flex-direction: column;
            text-align: center;
          }
          
          .risk-score-circle {
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionFlow;

