import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Fuel, 
  TrendingDown, 
  TrendingUp, 
  Clock,
  Zap,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'motion/react';
import { api, StatsData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';

interface GasPrices {
  slow: number;
  standard: number;
  fast: number;
  rapid: number;
  baseFee: number;
  priorityFee: {
    slow: number;
    standard: number;
    fast: number;
    rapid: number;
  };
  timestamp: Date;
}

interface GasRecommendation {
  type: 'wait' | 'use-alt-chain' | 'proceed' | 'urgent-warning';
  title: string;
  description: string;
  savings?: string;
  waitTime?: string;
  altChain?: string;
  altChainSavings?: string;
}

export function GasTracker() {
  const [gasPrices, setGasPrices] = useState<GasPrices>({
    slow: 25,
    standard: 35,
    fast: 45,
    rapid: 60,
    baseFee: 20,
    priorityFee: {
      slow: 1,
      standard: 2,
      fast: 3,
      rapid: 5,
    },
    timestamp: new Date(),
  });

  const [gasHistory, setGasHistory] = useState<Array<{ time: string; value: number }>>([]);
  const [selectedTier, setSelectedTier] = useState<'slow' | 'standard' | 'fast' | 'rapid'>('standard');
  const [totalGasSpent, setTotalGasSpent] = useState({
    allTime: 2.456,
    thisMonth: 0.847,
    thisWeek: 0.234,
  });
  const [gasSaved, setGasSaved] = useState(1.234);

  // Simulate real-time gas updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGasPrices(prev => {
        const volatility = 0.05; // 5% change
        const randomChange = () => 1 + (Math.random() - 0.5) * volatility;
        
        return {
          slow: Math.max(10, prev.slow * randomChange()),
          standard: Math.max(15, prev.standard * randomChange()),
          fast: Math.max(20, prev.fast * randomChange()),
          rapid: Math.max(30, prev.rapid * randomChange()),
          baseFee: Math.max(10, prev.baseFee * randomChange()),
          priorityFee: {
            slow: Math.max(0.5, prev.priorityFee.slow * randomChange()),
            standard: Math.max(1, prev.priorityFee.standard * randomChange()),
            fast: Math.max(1.5, prev.priorityFee.fast * randomChange()),
            rapid: Math.max(2, prev.priorityFee.rapid * randomChange()),
          },
          timestamp: new Date(),
        };
      });

      // Update history
      setGasHistory(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newData = { time: timeStr, value: gasPrices.standard };
        return [...prev.slice(-23), newData]; // Keep last 24 data points
      });
    }, 12000); // Every 12 seconds (simulating Ethereum block time)

    return () => clearInterval(interval);
  }, [gasPrices.standard]);

  // Calculate recommendations
  const getRecommendation = (): GasRecommendation => {
    const currentGas = gasPrices.standard;

    if (currentGas > 100) {
      return {
        type: 'urgent-warning',
        title: 'Extremely High Gas Prices',
        description: `Gas is ${Math.round((currentGas / 30 - 1) * 100)}% above normal. Consider waiting or using an alternative chain.`,
        waitTime: '2-4 hours',
        savings: '$' + ((currentGas - 30) * 0.5).toFixed(2),
        altChain: 'Polygon',
        altChainSavings: '$' + (currentGas * 0.5 * 0.95).toFixed(2),
      };
    } else if (currentGas > 60) {
      return {
        type: 'wait',
        title: 'High Gas Prices - Consider Waiting',
        description: 'Gas prices are elevated. Waiting a few hours could save you money.',
        waitTime: '1-2 hours',
        savings: '$' + ((currentGas - 30) * 0.5).toFixed(2),
      };
    } else if (currentGas > 40) {
      return {
        type: 'use-alt-chain',
        title: 'Moderate Gas - Alternative Chains Available',
        description: 'Gas is moderate. Consider using Polygon or Arbitrum for significant savings.',
        altChain: 'Polygon',
        altChainSavings: '$' + (currentGas * 0.5 * 0.95).toFixed(2),
      };
    } else {
      return {
        type: 'proceed',
        title: 'Good Time to Transact',
        description: 'Gas prices are low. This is a good time to submit transactions.',
      };
    }
  };

  const recommendation = getRecommendation();

  const gasTiers = [
    {
      id: 'slow' as const,
      label: 'Slow',
      icon: Clock,
      time: '~5 min',
      probability: 50,
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
    },
    {
      id: 'standard' as const,
      label: 'Standard',
      icon: Fuel,
      time: '~1 min',
      probability: 80,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      id: 'fast' as const,
      label: 'Fast',
      icon: TrendingUp,
      time: '~30 sec',
      probability: 95,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    {
      id: 'rapid' as const,
      label: 'Rapid',
      icon: Zap,
      time: '~15 sec',
      probability: 99,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
  ];

  const calculateTxCost = (gasPrice: number, gasUnits: number = 21000) => {
    const ethPrice = 3500; // Mock ETH price
    const costInEth = (gasPrice * gasUnits) / 1e9;
    const costInUsd = costInEth * ethPrice;
    return {
      eth: costInEth.toFixed(6),
      usd: costInUsd.toFixed(2),
    };
  };

  return (
    <div className="space-y-6">
      {/* Current Gas Prices */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {gasTiers.map((tier) => {
          const gasPrice = gasPrices[tier.id];
          const cost = calculateTxCost(gasPrice);
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.id;

          return (
            <motion.div
              key={tier.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? `${tier.bg} ${tier.border} border-2`
                    : 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#1f1f1f]'
                }`}
                onClick={() => setSelectedTier(tier.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${tier.color}`} />
                    <span className="text-white text-sm">{tier.label}</span>
                  </div>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${tier.bg} ${tier.color} ${tier.border}`}
                  >
                    {tier.probability}%
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className={`text-2xl font-mono ${tier.color}`}>
                    {gasPrice.toFixed(0)}
                    <span className="text-sm text-gray-500 ml-1">gwei</span>
                  </div>
                  <div className="text-xs text-gray-500">{tier.time}</div>
                  <div className="text-xs text-gray-400 font-mono">
                    ${cost.usd}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* EIP-1559 Breakdown */}
      <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4 flex items-center gap-2">
          <Fuel className="w-4 h-4 text-emerald-400" />
          EIP-1559 Gas Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Base Fee</div>
            <div className="text-xl text-white font-mono">
              {gasPrices.baseFee.toFixed(2)} gwei
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Burned by network (dynamic)
            </p>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Priority Fee ({selectedTier})</div>
            <div className="text-xl text-emerald-400 font-mono">
              {gasPrices.priorityFee[selectedTier].toFixed(2)} gwei
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tip to validators (optional)
            </p>
          </div>
        </div>
      </Card>

      {/* Recommendation */}
      <Card 
        className={`p-4 border ${
          recommendation.type === 'urgent-warning' 
            ? 'bg-red-500/10 border-red-500/20'
            : recommendation.type === 'wait'
            ? 'bg-yellow-500/10 border-yellow-500/20'
            : recommendation.type === 'proceed'
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-blue-500/10 border-blue-500/20'
        }`}
      >
        <div className="flex items-start gap-3">
          {recommendation.type === 'urgent-warning' && (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          {recommendation.type === 'wait' && (
            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          )}
          {recommendation.type === 'proceed' && (
            <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          )}
          {recommendation.type === 'use-alt-chain' && (
            <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1">
            <h4 className="text-white mb-1">{recommendation.title}</h4>
            <p className="text-sm text-gray-400">{recommendation.description}</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {recommendation.waitTime && (
                <Badge variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a]">
                  Wait {recommendation.waitTime} to save {recommendation.savings}
                </Badge>
              )}
              {recommendation.altChain && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Use {recommendation.altChain} • Save {recommendation.altChainSavings}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 24-Hour History Chart */}
      <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
        <h3 className="text-white mb-4">24-Hour Gas History</h3>
        {gasHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={gasHistory}>
              <XAxis 
                dataKey="time" 
                stroke="#666"
                tick={{ fill: '#666', fontSize: 11 }}
              />
              <YAxis 
                stroke="#666"
                tick={{ fill: '#666', fontSize: 11 }}
                label={{ value: 'gwei', angle: -90, position: 'insideLeft', fill: '#666' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            Loading gas history...
          </div>
        )}
      </Card>

      {/* Gas Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="text-xs text-gray-500 mb-1">Total Gas Spent</div>
          <div className="text-2xl text-white font-mono mb-1">
            {totalGasSpent.allTime.toFixed(3)} ETH
          </div>
          <div className="text-xs text-gray-500">
            ${(totalGasSpent.allTime * 3500).toFixed(2)} USD
          </div>
        </Card>

        <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="text-xs text-gray-500 mb-1">This Month</div>
          <div className="text-2xl text-white font-mono mb-1">
            {totalGasSpent.thisMonth.toFixed(3)} ETH
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingDown className="w-3 h-3" />
            <span>15% less than last month</span>
          </div>
        </Card>

        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <div className="text-xs text-emerald-400 mb-1">Gas Saved via MEV Protection</div>
          <div className="text-2xl text-emerald-400 font-mono mb-1">
            {gasSaved.toFixed(3)} ETH
          </div>
          <div className="text-xs text-emerald-400">
            ${(gasSaved * 3500).toFixed(2)} USD saved
          </div>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {gasPrices.timestamp.toLocaleTimeString()}
        {' • '}
        Updates every block (~12 seconds)
      </div>
    </div>
  );
}