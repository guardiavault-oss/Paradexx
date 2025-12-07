import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { ConnectionStatus } from './ConnectionStatus';
import { MEVAttackDetail, type MEVAttack } from './MEVAttackDetail';
import { TransactionList, type Transaction, type TransactionState } from './TransactionStateManager';
import { Badge } from './ui/badge';
import { 
  Activity,
  AlertTriangle,
  TrendingUp,
  Zap,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { ConnectionStatus as StatusType } from '../lib/websocket-manager';

export function EdgeCaseDemo() {
  // WebSocket connection simulation
  const [connectionStatus, setConnectionStatus] = useState<StatusType>('disconnected');
  const [connectionStats, setConnectionStats] = useState({
    messagesReceived: 0,
    reconnectAttempts: 0,
    lastHeartbeat: null as Date | null,
    duplicatesDropped: 0,
  });

  // MEV Attack demo
  const [selectedAttack, setSelectedAttack] = useState<MEVAttack | null>(null);
  const [showAttackDetail, setShowAttackDetail] = useState(false);

  // Transaction state demo
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Demo MEV attacks
  const demoAttacks: MEVAttack[] = [
    {
      id: 'attack_1',
      type: 'sandwich',
      confidence: 94,
      timestamp: new Date(),
      network: 'Ethereum',
      victimTx: {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0xYourWallet',
        to: '0xUniswapRouter',
        value: '1.5 ETH',
        gasPrice: '50 gwei',
      },
      attackerTxs: [
        {
          hash: '0xattacker1234567890abcdef1234567890abcdef1234567890abcdef12345',
          from: '0xAttackerBot',
          type: 'entry',
          gasPrice: '51 gwei',
          position: 'before',
        },
        {
          hash: '0xattacker7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
          from: '0xAttackerBot',
          type: 'exit',
          gasPrice: '50.5 gwei',
          position: 'after',
        },
      ],
      impact: {
        slippageIncrease: 2.3,
        victimLoss: '124.50',
        attackerProfit: '185.30',
        gasCost: '60.80',
        netProfit: '124.50',
      },
      detection: {
        detectedAt: new Date(),
        responseTime: 145,
        prevented: true,
        method: 'Pattern recognition + Gas price analysis',
      },
      similar: {
        count: 23,
        timeframe: 'last 24 hours',
        sameAttacker: 8,
      },
    },
    {
      id: 'attack_2',
      type: 'frontrun',
      confidence: 87,
      timestamp: new Date(Date.now() - 3600000),
      network: 'Arbitrum',
      victimTx: {
        hash: '0xfrontrun567890abcdef1234567890abcdef1234567890abcdef1234567890',
        from: '0xYourWallet',
        to: '0xNFTMarketplace',
        value: '0.5 ETH',
        gasPrice: '0.1 gwei',
      },
      attackerTxs: [
        {
          hash: '0xfrontrunnerbcdef1234567890abcdef1234567890abcdef1234567890ab',
          from: '0xFrontrunBot',
          type: 'entry',
          gasPrice: '0.15 gwei',
          position: 'before',
        },
      ],
      impact: {
        slippageIncrease: 0,
        victimLoss: '500.00',
        attackerProfit: '500.00',
        gasCost: '0.15',
        netProfit: '499.85',
      },
      detection: {
        detectedAt: new Date(Date.now() - 3600000),
        responseTime: 89,
        prevented: false,
        method: 'NFT sniping detection',
      },
    },
    {
      id: 'attack_3',
      type: 'jit',
      confidence: 72,
      timestamp: new Date(Date.now() - 7200000),
      network: 'Polygon',
      victimTx: {
        hash: '0xjit567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
        from: '0xYourWallet',
        to: '0xDEXRouter',
        value: '1000 USDC',
        gasPrice: '100 gwei',
      },
      attackerTxs: [
        {
          hash: '0xjitattacker1234567890abcdef1234567890abcdef1234567890abcdef',
          from: '0xJITBot',
          type: 'entry',
          gasPrice: '150 gwei',
          position: 'before',
        },
        {
          hash: '0xjitattacker7890abcdef1234567890abcdef1234567890abcdef123456',
          from: '0xJITBot',
          type: 'exit',
          gasPrice: '120 gwei',
          position: 'after',
        },
      ],
      impact: {
        slippageIncrease: 1.8,
        victimLoss: '18.00',
        attackerProfit: '42.50',
        gasCost: '24.50',
        netProfit: '18.00',
      },
      detection: {
        detectedAt: new Date(Date.now() - 7200000),
        responseTime: 234,
        prevented: true,
        method: 'Liquidity pattern analysis',
      },
      similar: {
        count: 5,
        timeframe: 'last 7 days',
        sameAttacker: 3,
      },
    },
  ];

  // Simulate WebSocket connection states
  useEffect(() => {
    if (!isSimulating) return;

    const statusSequence: StatusType[] = [
      'connecting',
      'connected',
      'connected',
      'stale',
      'reconnecting',
      'connected',
    ];
    let currentIndex = 0;

    const interval = setInterval(() => {
      const newStatus = statusSequence[currentIndex % statusSequence.length];
      setConnectionStatus(newStatus);

      // Update stats
      if (newStatus === 'connected') {
        setConnectionStats(prev => ({
          messagesReceived: prev.messagesReceived + Math.floor(Math.random() * 10) + 5,
          reconnectAttempts: prev.reconnectAttempts,
          lastHeartbeat: new Date(),
          duplicatesDropped: prev.duplicatesDropped + Math.floor(Math.random() * 2),
        }));
      }

      if (newStatus === 'reconnecting') {
        setConnectionStats(prev => ({
          ...prev,
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));
      }

      currentIndex++;
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Simulate transaction state transitions
  useEffect(() => {
    if (!isSimulating) return;

    const createTransaction = (): Transaction => {
      const states: TransactionState[] = ['pending'];
      return {
        hash: `0x${Math.random().toString(16).slice(2)}`,
        state: states[0],
        timestamp: new Date(),
        network: ['Ethereum', 'Polygon', 'Arbitrum'][Math.floor(Math.random() * 3)],
        value: `${(Math.random() * 5).toFixed(2)} ETH`,
        gasPrice: `${Math.floor(Math.random() * 100 + 50)} gwei`,
        nonce: Math.floor(Math.random() * 1000),
        confirmations: 0,
        requiredConfirmations: 12,
      };
    };

    // Add new transaction periodically
    const addInterval = setInterval(() => {
      setTransactions(prev => {
        if (prev.length >= 10) return prev;
        return [createTransaction(), ...prev];
      });
    }, 5000);

    // Update transaction states
    const updateInterval = setInterval(() => {
      setTransactions(prev => prev.map(tx => {
        if (tx.state === 'pending') {
          const confirmations = (tx.confirmations || 0) + 1;
          
          // Random state transitions
          const rand = Math.random();
          if (confirmations >= (tx.requiredConfirmations || 12)) {
            return { ...tx, state: 'confirmed' as TransactionState, confirmations };
          } else if (rand < 0.05) {
            return { 
              ...tx, 
              state: 'failed' as TransactionState, 
              error: 'Gas price too low' 
            };
          } else if (rand < 0.08) {
            return { 
              ...tx, 
              state: 'replaced' as TransactionState,
              replacedBy: `0x${Math.random().toString(16).slice(2)}`,
            };
          }
          
          return { ...tx, confirmations };
        }
        return tx;
      }));
    }, 2000);

    return () => {
      clearInterval(addInterval);
      clearInterval(updateInterval);
    };
  }, [isSimulating]);

  const handleTransactionStateChange = (hash: string, newState: TransactionState) => {
    const stateLabels = {
      pending: 'Pending',
      confirmed: 'Confirmed ✓',
      failed: 'Failed ✗',
      replaced: 'Replaced',
      dropped: 'Dropped',
    };

    toast.success(`Transaction ${hash.slice(0, 10)}... → ${stateLabels[newState]}`);
  };

  const handleReportFalsePositive = (attackId: string, reason: string) => {
    console.log('False positive reported:', attackId, reason);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white mb-2">Edge Case Handling Demo</h1>
        <p className="text-gray-400">
          Comprehensive demonstration of real-time data edge cases, MEV detection accuracy,
          and transaction state management.
        </p>
      </div>

      {/* Simulation Controls */}
      <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="text-white">Live Simulation</span>
            <ConnectionStatus status={connectionStatus} stats={connectionStats} />
          </div>
          <Button
            onClick={() => setIsSimulating(!isSimulating)}
            className={isSimulating 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-emerald-600 hover:bg-emerald-700'
            }
          >
            {isSimulating ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Simulation
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="websocket" className="space-y-4">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
          <TabsTrigger value="websocket">WebSocket Edge Cases</TabsTrigger>
          <TabsTrigger value="mev">MEV Detection</TabsTrigger>
          <TabsTrigger value="transactions">Transaction States</TabsTrigger>
        </TabsList>

        {/* WebSocket Tab */}
        <TabsContent value="websocket" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Connection Management
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Status:</span>
                  <ConnectionStatus status={connectionStatus} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Messages Received:</span>
                  <span className="text-white font-mono">
                    {connectionStats.messagesReceived.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reconnect Attempts:</span>
                  <span className="text-white font-mono">
                    {connectionStats.reconnectAttempts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duplicates Dropped:</span>
                  <span className="text-white font-mono">
                    {connectionStats.duplicatesDropped}
                  </span>
                </div>
                {connectionStats.lastHeartbeat && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Heartbeat:</span>
                    <span className="text-white font-mono text-xs">
                      {connectionStats.lastHeartbeat.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
              <h3 className="text-white mb-4">Features Implemented</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Exponential backoff reconnection</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Heartbeat/ping-pong stale detection</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Event deduplication logic</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Backfill missed events</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Token refresh on expiry</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Connection state notifications</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* MEV Detection Tab */}
        <TabsContent value="mev" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoAttacks.map((attack) => (
              <Card 
                key={attack.id} 
                className="p-4 bg-[#1a1a1a] border-[#2a2a2a] cursor-pointer hover:bg-[#1f1f1f] transition-colors"
                onClick={() => {
                  setSelectedAttack(attack);
                  setShowAttackDetail(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white text-sm mb-1">
                      {attack.type.charAt(0).toUpperCase() + attack.type.slice(1)} Attack
                    </h3>
                    <p className="text-xs text-gray-500">{attack.network}</p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={attack.detection.prevented 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }
                  >
                    {attack.detection.prevented ? 'Prevented' : 'Not Prevented'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className={
                      attack.confidence >= 90 ? 'text-red-500' :
                      attack.confidence >= 70 ? 'text-orange-500' :
                      'text-yellow-500'
                    }>
                      {attack.confidence}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Loss:</span>
                    <span className="text-red-400">${attack.impact.victimLoss}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Attacker Profit:</span>
                    <span className="text-gray-300">${attack.impact.netProfit}</span>
                  </div>
                </div>

                <Button 
                  variant="outline"
                  className="w-full mt-3 border-[#2a2a2a] text-emerald-400 hover:bg-[#2a2a2a]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAttack(attack);
                    setShowAttackDetail(true);
                  }}
                >
                  View Details
                </Button>
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
            <h3 className="text-white mb-4">Attack Type Coverage</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-[#0f0f0f] rounded-lg p-3 border border-[#2a2a2a]">
                <div className="text-red-500 mb-1">🥪 Sandwich</div>
                <div className="text-xs text-gray-500">Detected & Explained</div>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-3 border border-[#2a2a2a]">
                <div className="text-orange-500 mb-1">🏃 Front-running</div>
                <div className="text-xs text-gray-500">Separate Indicator</div>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-3 border border-[#2a2a2a]">
                <div className="text-yellow-500 mb-1">🎯 Back-running</div>
                <div className="text-xs text-gray-500">Tracked Separately</div>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-3 border border-[#2a2a2a]">
                <div className="text-purple-500 mb-1">⚡ JIT Liquidity</div>
                <div className="text-xs text-gray-500">Pattern Analysis</div>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-3 border border-[#2a2a2a]">
                <div className="text-pink-500 mb-1">💧 Liquidation</div>
                <div className="text-xs text-gray-500">Specific Detection</div>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-3 border border-[#2a2a2a]">
                <div className="text-cyan-500 mb-1">🔮 Generalized</div>
                <div className="text-xs text-gray-500">Catch-all MEV</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Transaction States Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white">Live Transaction Feed</h3>
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                {transactions.length} Transactions
              </Badge>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Start simulation to see live transaction state transitions</p>
              </div>
            ) : (
              <TransactionList
                transactions={transactions}
                onStateChange={handleTransactionStateChange}
                maxItems={10}
              />
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
              <h3 className="text-white mb-4">State Transitions Handled</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Pending → Confirmed (smooth animation)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Pending → Failed (error display)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Pending → Replaced (nonce collision)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Transaction dropped handling</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Progress tracking (confirmations)</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
              <h3 className="text-white mb-4">Performance Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Virtual scrolling (10,000+ tx/sec capable)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Memory management (auto-cleanup)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Smooth animations with Motion</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Toast notifications on state change</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-gray-400">Multi-chain support</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* MEV Attack Detail Modal */}
      <MEVAttackDetail
        attack={selectedAttack}
        isOpen={showAttackDetail}
        onClose={() => {
          setShowAttackDetail(false);
          setSelectedAttack(null);
        }}
        onReportFalsePositive={handleReportFalsePositive}
      />
    </div>
  );
}
