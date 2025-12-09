import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown, TrendingUp, TrendingDown, Wallet, Settings,
  AlertTriangle, ChevronRight, RefreshCw, Shield, Zap,
  Percent, Clock, Check, X
} from 'lucide-react';
import {
  MobileContainer, PageHeader, Section, Card, Button, Input,
  Select, Toggle, Badge, Alert, Tabs, cn, Divider
} from '../components/ui';
import { useAppStore } from '../store/appStore';

const TradePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { wallets, positions, buyToken, sellToken, analyzeToken } = useAppStore();
  
  // Trade Mode
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  
  // Form State
  const [tokenAddress, setTokenAddress] = useState(searchParams.get('token') || '');
  const [amount, setAmount] = useState('0.1');
  const [selectedWallet, setSelectedWallet] = useState(wallets[0]?.id || '');
  const [slippage, setSlippage] = useState('10');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced Settings
  const [safetyCheck, setSafetyCheck] = useState(true);
  const [useFlashbots, setUseFlashbots] = useState(true);
  const [gasMultiplier, setGasMultiplier] = useState('1.5');
  const [maxGas, setMaxGas] = useState('150');
  
  // Sell specific
  const [sellPercent, setSellPercent] = useState(100);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tokenAnalysis, setTokenAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Analyze token when address changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (tokenAddress && tokenAddress.length === 42 && mode === 'buy') {
        setIsAnalyzing(true);
        try {
          const analysis = await analyzeToken(tokenAddress);
          setTokenAnalysis(analysis);
        } catch (e) {
          setTokenAnalysis(null);
        }
        setIsAnalyzing(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [tokenAddress, mode]);

  // Set default wallet
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0].id);
    }
  }, [wallets]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    
    try {
      if (mode === 'buy') {
        const result = await buyToken(tokenAddress, amount, selectedWallet, {
          slippage: parseInt(slippage),
          safetyCheck,
          method: useFlashbots ? 'FLASHBOTS' : 'DIRECT',
          gasMultiplier: parseFloat(gasMultiplier),
          maxGasPrice: parseInt(maxGas) * 1e9,
        });
        setSuccess(`Buy order submitted! TX: ${result.txHash?.slice(0, 10)}...`);
      } else {
        const position = positions.find(p => p.id === selectedPosition);
        if (!position) throw new Error('Please select a position to sell');
        
        const result = await sellToken(
          position.token, 
          sellPercent.toString(), 
          selectedWallet,
          {
            slippage: parseInt(slippage),
            isPercent: true,
          }
        );
        setSuccess(`Sell order submitted! TX: ${result.txHash?.slice(0, 10)}...`);
      }
    } catch (e) {
      setError((e as Error).message);
    }
    
    setIsSubmitting(false);
  };

  const quickAmounts = ['0.05', '0.1', '0.25', '0.5', '1'];
  const quickSlippages = ['5', '10', '15', '25'];
  const sellPercentages = [25, 50, 75, 100];

  return (
    <MobileContainer>
      <PageHeader 
        title="Trade" 
        subtitle="Buy & sell tokens"
        action={
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-dark-400 hover:text-white transition-colors"
          >
            <Settings size={20} />
          </button>
        }
      />

      {/* Mode Tabs */}
      <Section>
        <Tabs
          tabs={[
            { id: 'buy', label: 'Buy', icon: <TrendingUp size={16} /> },
            { id: 'sell', label: 'Sell', icon: <TrendingDown size={16} /> },
          ]}
          activeTab={mode}
          onChange={(id) => setMode(id as 'buy' | 'sell')}
        />
      </Section>

      {/* Alerts */}
      {error && (
        <Section>
          <Alert 
            type="error" 
            title="Transaction Failed" 
            message={error}
            onDismiss={() => setError(null)}
          />
        </Section>
      )}
      
      {success && (
        <Section>
          <Alert 
            type="success" 
            title="Success" 
            message={success}
            onDismiss={() => setSuccess(null)}
          />
        </Section>
      )}

      {/* Buy Mode */}
      {mode === 'buy' && (
        <>
          {/* Token Input */}
          <Section title="Token">
            <Card className="p-4">
              <Input
                value={tokenAddress}
                onChange={setTokenAddress}
                placeholder="Enter token address (0x...)"
                label="Token Contract Address"
              />
              
              {/* Token Analysis Preview */}
              {isAnalyzing && (
                <div className="mt-4 flex items-center gap-2 text-dark-400">
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm">Analyzing token safety...</span>
                </div>
              )}
              
              {tokenAnalysis && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-dark-900/50 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className={
                        tokenAnalysis.score >= 70 ? 'text-accent-green' :
                        tokenAnalysis.score >= 40 ? 'text-accent-orange' : 'text-accent-red'
                      } />
                      <span className="text-sm text-white">Safety Score</span>
                    </div>
                    <Badge variant={
                      tokenAnalysis.score >= 70 ? 'success' :
                      tokenAnalysis.score >= 40 ? 'warning' : 'error'
                    }>
                      {tokenAnalysis.score}/100
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-dark-400">
                      Buy: {tokenAnalysis.honeypotTest?.buyTax || 0}%
                    </span>
                    <span className="text-xs text-dark-400">
                      Sell: {tokenAnalysis.honeypotTest?.sellTax || 0}%
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/analyze/${tokenAddress}`)}
                    className="text-accent-cyan text-xs mt-2 flex items-center gap-1"
                  >
                    View full analysis <ChevronRight size={12} />
                  </button>
                </motion.div>
              )}
            </Card>
          </Section>

          {/* Amount */}
          <Section title="Amount">
            <Card className="p-4">
              <Input
                value={amount}
                onChange={setAmount}
                placeholder="0.0"
                type="number"
                label="Amount (ETH)"
              />
              
              <div className="flex gap-2 mt-3">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                      amount === amt 
                        ? 'bg-accent-cyan text-dark-900' 
                        : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                    )}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </Card>
          </Section>
        </>
      )}

      {/* Sell Mode */}
      {mode === 'sell' && (
        <>
          {/* Position Selection */}
          <Section title="Select Position">
            <Card>
              {positions.length === 0 ? (
                <div className="p-8 text-center">
                  <TrendingDown className="mx-auto mb-3 text-dark-600" size={32} />
                  <p className="text-dark-400">No open positions to sell</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setMode('buy')}
                  >
                    Buy a Token
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-dark-800">
                  {positions.map((pos) => (
                    <div 
                      key={pos.id}
                      className={cn(
                        'p-4 flex items-center gap-3 cursor-pointer transition-colors',
                        selectedPosition === pos.id 
                          ? 'bg-accent-cyan/10' 
                          : 'active:bg-dark-800/50'
                      )}
                      onClick={() => setSelectedPosition(pos.id)}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        selectedPosition === pos.id 
                          ? 'border-accent-cyan bg-accent-cyan' 
                          : 'border-dark-600'
                      )}>
                        {selectedPosition === pos.id && <Check size={12} className="text-dark-900" />}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-bold">
                        {pos.tokenInfo?.symbol?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{pos.tokenInfo?.symbol || 'Unknown'}</p>
                        <p className="text-dark-400 text-sm">
                          ${pos.currentValueUSD?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className={cn(
                        'text-right font-bold',
                        pos.unrealizedPnLPercentage >= 0 ? 'text-accent-green' : 'text-accent-red'
                      )}>
                        {pos.unrealizedPnLPercentage >= 0 ? '+' : ''}{pos.unrealizedPnLPercentage.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Section>

          {/* Sell Percentage */}
          {selectedPosition && (
            <Section title="Sell Amount">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-dark-400">Sell Percentage</span>
                  <span className="text-2xl font-bold text-white">{sellPercent}%</span>
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={sellPercent}
                  onChange={(e) => setSellPercent(parseInt(e.target.value))}
                  className="w-full h-2 bg-dark-700 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                             [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
                             [&::-webkit-slider-thumb]:bg-accent-cyan"
                />
                
                <div className="flex gap-2 mt-4">
                  {sellPercentages.map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setSellPercent(pct)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                        sellPercent === pct 
                          ? 'bg-accent-red text-white' 
                          : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </Card>
            </Section>
          )}
        </>
      )}

      {/* Wallet Selection */}
      <Section title="Wallet">
        <Card className="p-4">
          <Select
            value={selectedWallet}
            onChange={setSelectedWallet}
            options={wallets.map(w => ({
              value: w.id,
              label: `${w.name} (${w.address.slice(0, 6)}...${w.address.slice(-4)})`
            }))}
            label="Select Wallet"
          />
        </Card>
      </Section>

      {/* Slippage */}
      <Section title="Slippage Tolerance">
        <Card className="p-4">
          <div className="flex gap-2">
            {quickSlippages.map((slip) => (
              <button
                key={slip}
                onClick={() => setSlippage(slip)}
                className={cn(
                  'flex-1 py-3 rounded-xl text-sm font-medium transition-colors',
                  slippage === slip 
                    ? 'bg-accent-cyan text-dark-900' 
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                )}
              >
                {slip}%
              </button>
            ))}
            <Input
              value={slippage}
              onChange={setSlippage}
              type="number"
              placeholder="Custom"
              className="w-24"
            />
          </div>
        </Card>
      </Section>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Section title="Advanced Settings">
              <Card className="p-4 space-y-4">
                <Toggle
                  value={safetyCheck}
                  onChange={setSafetyCheck}
                  label="Safety Check"
                  description="Run honeypot detection before buying"
                />
                <Divider />
                <Toggle
                  value={useFlashbots}
                  onChange={setUseFlashbots}
                  label="Use Flashbots"
                  description="Protect against frontrunning"
                />
                <Divider />
                <Input
                  value={gasMultiplier}
                  onChange={setGasMultiplier}
                  type="number"
                  label="Gas Multiplier"
                  helper="Increase gas price for faster execution"
                />
                <Input
                  value={maxGas}
                  onChange={setMaxGas}
                  type="number"
                  label="Max Gas Price (Gwei)"
                  helper="Maximum gas price you're willing to pay"
                />
              </Card>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <Section>
        <Button
          variant={mode === 'buy' ? 'success' : 'danger'}
          size="xl"
          fullWidth
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={
            (mode === 'buy' && (!tokenAddress || !amount)) ||
            (mode === 'sell' && !selectedPosition)
          }
        >
          {mode === 'buy' ? (
            <>
              <TrendingUp size={22} />
              Buy Token
            </>
          ) : (
            <>
              <TrendingDown size={22} />
              Sell {sellPercent}%
            </>
          )}
        </Button>
      </Section>

      {/* Warning */}
      {mode === 'buy' && tokenAnalysis && tokenAnalysis.score < 50 && (
        <Section>
          <Alert
            type="warning"
            title="High Risk Token"
            message="This token has a low safety score. Proceed with caution and consider using smaller amounts."
          />
        </Section>
      )}
    </MobileContainer>
  );
};

export default TradePage;
