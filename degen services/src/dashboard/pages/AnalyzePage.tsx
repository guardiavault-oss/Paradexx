import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Shield, AlertTriangle, CheckCircle, XCircle,
  Droplets, Lock, Unlock, Users, Code, Coins, ExternalLink,
  TrendingUp, ChevronRight, RefreshCw, Copy, Check
} from 'lucide-react';
import {
  MobileContainer, PageHeader, Section, Card, Button, Input,
  Badge, Alert, ScoreRing, ProgressBar, cn, Divider, ListItem,
  EmptyState, Skeleton
} from '../components/ui';
import { useAppStore } from '../store/appStore';

interface TokenAnalysis {
  token: string;
  score: number;
  riskLevel: string;
  flags: Array<{ type: string; severity: string; message: string }>;
  honeypotTest: {
    isHoneypot: boolean;
    buyTax: number;
    sellTax: number;
    transferTax: number;
  };
  contractAnalysis: {
    verified: boolean;
    isProxy: boolean;
    hasBlacklist: boolean;
    hasWhitelist: boolean;
    hasPauseFunction: boolean;
    hasMintFunction: boolean;
    hasModifiableTax: boolean;
    hasHiddenOwner: boolean;
  };
  liquidityAnalysis: {
    totalLiquidityUSD: number;
    isLocked: boolean;
    lockDuration?: number;
  };
  ownerAnalysis: {
    isRenounced: boolean;
    ownerPercentage: number;
  };
}

const AnalyzePage: React.FC = () => {
  const navigate = useNavigate();
  const { tokenAddress: paramToken } = useParams();
  const { analyzeToken } = useAppStore();
  
  const [tokenInput, setTokenInput] = useState(paramToken || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TokenAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!tokenInput || tokenInput.length < 42) {
      setError('Please enter a valid token address');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeToken(tokenInput);
      setAnalysis(result);
    } catch (err) {
      setError((err as Error).message);
    }
    
    setIsAnalyzing(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(tokenInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'SAFE':
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH':
      case 'CRITICAL':
      case 'HONEYPOT': return 'error';
      default: return 'info';
    }
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Very Safe';
    if (score >= 60) return 'Relatively Safe';
    if (score >= 40) return 'Use Caution';
    if (score >= 20) return 'High Risk';
    return 'Extreme Risk';
  };

  return (
    <MobileContainer>
      <PageHeader 
        title="Token Analysis" 
        subtitle="Check token safety before trading"
      />

      {/* Search Input */}
      <Section>
        <Card className="p-4">
          <div className="flex gap-2">
            <Input
              value={tokenInput}
              onChange={setTokenInput}
              placeholder="Enter token address (0x...)"
              className="flex-1"
              icon={<Search size={18} />}
            />
            <Button 
              onClick={handleAnalyze}
              loading={isAnalyzing}
              disabled={!tokenInput}
            >
              <Search size={18} />
            </Button>
          </div>
          
          {tokenInput && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-dark-500 text-xs truncate flex-1">
                {tokenInput}
              </span>
              <button 
                onClick={copyAddress}
                className="text-dark-400 hover:text-white transition-colors"
              >
                {copied ? <Check size={16} className="text-accent-green" /> : <Copy size={16} />}
              </button>
            </div>
          )}
        </Card>
      </Section>

      {/* Error Display */}
      {error && (
        <Section>
          <Alert 
            type="error" 
            title="Analysis Failed" 
            message={error}
            onDismiss={() => setError(null)}
          />
        </Section>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <Section>
          <Card className="p-6">
            <div className="flex flex-col items-center">
              <RefreshCw className="animate-spin text-accent-cyan mb-4" size={40} />
              <p className="text-white font-medium">Analyzing Token...</p>
              <p className="text-dark-400 text-sm mt-1">Checking multiple sources</p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            </div>
          </Card>
        </Section>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Score Overview */}
            <Section>
              <Card className="p-6">
                <div className="flex items-center gap-6">
                  <ScoreRing score={analysis.score} size={100} />
                  <div className="flex-1">
                    <Badge variant={getRiskColor(analysis.riskLevel)} size="md">
                      {analysis.riskLevel}
                    </Badge>
                    <p className="text-xl font-bold text-white mt-2">
                      {getScoreDescription(analysis.score)}
                    </p>
                    <p className="text-dark-400 text-sm mt-1">
                      Safety Score: {analysis.score}/100
                    </p>
                  </div>
                </div>
              </Card>
            </Section>

            {/* Tax Information */}
            <Section title="Tax Analysis">
              <Card className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-dark-400 text-xs uppercase mb-1">Buy Tax</p>
                    <p className={cn(
                      'text-xl font-bold',
                      analysis.honeypotTest.buyTax <= 5 ? 'text-accent-green' :
                      analysis.honeypotTest.buyTax <= 10 ? 'text-accent-orange' : 'text-accent-red'
                    )}>
                      {analysis.honeypotTest.buyTax}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs uppercase mb-1">Sell Tax</p>
                    <p className={cn(
                      'text-xl font-bold',
                      analysis.honeypotTest.sellTax <= 5 ? 'text-accent-green' :
                      analysis.honeypotTest.sellTax <= 10 ? 'text-accent-orange' : 'text-accent-red'
                    )}>
                      {analysis.honeypotTest.sellTax}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs uppercase mb-1">Transfer</p>
                    <p className={cn(
                      'text-xl font-bold',
                      analysis.honeypotTest.transferTax === 0 ? 'text-accent-green' : 'text-accent-orange'
                    )}>
                      {analysis.honeypotTest.transferTax || 0}%
                    </p>
                  </div>
                </div>
                
                {analysis.honeypotTest.isHoneypot && (
                  <Alert 
                    type="error" 
                    title="⚠️ HONEYPOT DETECTED" 
                    message="This token cannot be sold. Do not buy!"
                  />
                )}
              </Card>
            </Section>

            {/* Contract Analysis */}
            <Section title="Contract Security">
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Code size={16} className="text-dark-400" />
                      <span className="text-dark-300">Verified Contract</span>
                    </div>
                    {analysis.contractAnalysis.verified ? (
                      <CheckCircle size={20} className="text-accent-green" />
                    ) : (
                      <XCircle size={20} className="text-accent-red" />
                    )}
                  </div>
                  <Divider />
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-dark-400" />
                      <span className="text-dark-300">Proxy Contract</span>
                    </div>
                    {analysis.contractAnalysis.isProxy ? (
                      <Badge variant="warning">Yes</Badge>
                    ) : (
                      <Badge variant="success">No</Badge>
                    )}
                  </div>
                  <Divider />
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-dark-400" />
                      <span className="text-dark-300">Blacklist Function</span>
                    </div>
                    {analysis.contractAnalysis.hasBlacklist ? (
                      <Badge variant="warning">Present</Badge>
                    ) : (
                      <Badge variant="success">None</Badge>
                    )}
                  </div>
                  <Divider />
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-dark-400" />
                      <span className="text-dark-300">Pause Function</span>
                    </div>
                    {analysis.contractAnalysis.hasPauseFunction ? (
                      <Badge variant="warning">Present</Badge>
                    ) : (
                      <Badge variant="success">None</Badge>
                    )}
                  </div>
                  <Divider />
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Coins size={16} className="text-dark-400" />
                      <span className="text-dark-300">Mint Function</span>
                    </div>
                    {analysis.contractAnalysis.hasMintFunction ? (
                      <Badge variant="error">Present</Badge>
                    ) : (
                      <Badge variant="success">None</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Section>

            {/* Liquidity Analysis */}
            <Section title="Liquidity">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-dark-400 text-sm">Total Liquidity</p>
                    <p className="text-2xl font-bold text-white">
                      ${analysis.liquidityAnalysis.totalLiquidityUSD.toLocaleString()}
                    </p>
                  </div>
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    analysis.liquidityAnalysis.isLocked 
                      ? 'bg-accent-green/10' 
                      : 'bg-accent-red/10'
                  )}>
                    {analysis.liquidityAnalysis.isLocked ? (
                      <Lock className="text-accent-green" size={24} />
                    ) : (
                      <Unlock className="text-accent-red" size={24} />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-dark-300">Liquidity Lock</span>
                  <Badge variant={analysis.liquidityAnalysis.isLocked ? 'success' : 'error'}>
                    {analysis.liquidityAnalysis.isLocked ? 'Locked' : 'Unlocked'}
                  </Badge>
                </div>
                
                {analysis.liquidityAnalysis.lockDuration && (
                  <>
                    <Divider className="my-2" />
                    <div className="flex items-center justify-between py-2">
                      <span className="text-dark-300">Lock Duration</span>
                      <span className="text-white font-medium">
                        {analysis.liquidityAnalysis.lockDuration} days
                      </span>
                    </div>
                  </>
                )}
              </Card>
            </Section>

            {/* Owner Analysis */}
            <Section title="Ownership">
              <Card className="p-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-dark-300">Ownership Renounced</span>
                  {analysis.ownerAnalysis.isRenounced ? (
                    <Badge variant="success">Yes</Badge>
                  ) : (
                    <Badge variant="warning">No</Badge>
                  )}
                </div>
                <Divider className="my-2" />
                <div className="flex items-center justify-between py-2">
                  <span className="text-dark-300">Owner Holdings</span>
                  <span className={cn(
                    'font-medium',
                    analysis.ownerAnalysis.ownerPercentage <= 5 ? 'text-accent-green' :
                    analysis.ownerAnalysis.ownerPercentage <= 15 ? 'text-accent-orange' : 'text-accent-red'
                  )}>
                    {analysis.ownerAnalysis.ownerPercentage.toFixed(1)}%
                  </span>
                </div>
              </Card>
            </Section>

            {/* Risk Flags */}
            {analysis.flags && analysis.flags.length > 0 && (
              <Section title="Risk Flags">
                <Card className="p-4">
                  <div className="space-y-3">
                    {analysis.flags.map((flag, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          'p-3 rounded-lg border',
                          flag.severity === 'CRITICAL' 
                            ? 'bg-accent-red/10 border-accent-red/20' 
                            : flag.severity === 'WARNING'
                            ? 'bg-accent-orange/10 border-accent-orange/20'
                            : 'bg-accent-cyan/10 border-accent-cyan/20'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle 
                            size={16} 
                            className={
                              flag.severity === 'CRITICAL' ? 'text-accent-red' :
                              flag.severity === 'WARNING' ? 'text-accent-orange' : 'text-accent-cyan'
                            }
                          />
                          <div>
                            <p className="text-white font-medium text-sm">{flag.type}</p>
                            <p className="text-dark-400 text-xs">{flag.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Section>
            )}

            {/* Action Buttons */}
            <Section>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant={analysis.score >= 50 ? 'success' : 'secondary'}
                  size="lg"
                  fullWidth
                  onClick={() => navigate(`/trade?token=${tokenInput}`)}
                  disabled={analysis.honeypotTest.isHoneypot}
                >
                  <TrendingUp size={20} />
                  Trade Token
                </Button>
                <Button 
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => window.open(`https://etherscan.io/token/${tokenInput}`, '_blank')}
                >
                  <ExternalLink size={20} />
                  Etherscan
                </Button>
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!analysis && !isAnalyzing && !error && (
        <Section>
          <EmptyState
            icon={<Shield size={32} />}
            title="Analyze a Token"
            description="Enter a token contract address to check its safety score and potential risks."
          />
        </Section>
      )}
    </MobileContainer>
  );
};

export default AnalyzePage;
