import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Fuel,
  ExternalLink,
  Flag,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

export interface MEVAttack {
  id: string;
  type: 'sandwich' | 'frontrun' | 'backrun' | 'jit' | 'liquidation' | 'generalized';
  confidence: number; // 0-100
  timestamp: Date;
  network: string;
  
  // Victim transaction
  victimTx: {
    hash: string;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
  };
  
  // Attacker transaction(s)
  attackerTxs: Array<{
    hash: string;
    from: string;
    type: 'entry' | 'exit';
    gasPrice: string;
    position: 'before' | 'after';
  }>;
  
  // Impact analysis
  impact: {
    slippageIncrease: number; // percentage
    victimLoss: string; // USD
    attackerProfit: string; // USD
    gasCost: string; // USD
    netProfit: string; // USD
  };
  
  // Detection metadata
  detection: {
    detectedAt: Date;
    responseTime: number; // ms
    prevented: boolean;
    method: string;
  };
  
  // Similar attacks
  similar?: {
    count: number;
    timeframe: string;
    sameAttacker: number;
  };
}

interface MEVAttackDetailProps {
  attack: MEVAttack | null;
  isOpen: boolean;
  onClose: () => void;
  onReportFalsePositive?: (attackId: string, reason: string) => void;
}

const attackTypeConfig = {
  sandwich: {
    name: 'Sandwich Attack',
    description: 'Attacker places a buy order before and a sell order after victim\'s transaction to profit from price movement',
    color: 'text-red-500',
    icon: '🥪',
  },
  frontrun: {
    name: 'Front-Running',
    description: 'Attacker copies victim\'s transaction with higher gas to execute first',
    color: 'text-orange-500',
    icon: '🏃',
  },
  backrun: {
    name: 'Back-Running',
    description: 'Attacker executes immediately after victim to profit from state changes',
    color: 'text-yellow-500',
    icon: '🎯',
  },
  jit: {
    name: 'JIT Liquidity Attack',
    description: 'Attacker adds liquidity just before victim\'s swap and removes it immediately after',
    color: 'text-purple-500',
    icon: '⚡',
  },
  liquidation: {
    name: 'Liquidation Front-Run',
    description: 'Attacker front-runs liquidation to claim liquidation rewards',
    color: 'text-pink-500',
    icon: '💧',
  },
  generalized: {
    name: 'Generalized MEV',
    description: 'Other forms of MEV extraction',
    color: 'text-cyan-500',
    icon: '🔮',
  },
};

export function MEVAttackDetail({ 
  attack, 
  isOpen, 
  onClose,
  onReportFalsePositive 
}: MEVAttackDetailProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');

  if (!attack) return null;

  const config = attackTypeConfig[attack.type];
  const confidenceColor = attack.confidence >= 90 ? 'text-red-500' : 
                         attack.confidence >= 70 ? 'text-orange-500' : 
                         'text-yellow-500';

  const handleReport = () => {
    if (onReportFalsePositive && reportReason) {
      onReportFalsePositive(attack.id, reportReason);
      toast.success('Thank you! Your report has been submitted for review.');
      setShowReportDialog(false);
      setReportReason('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <span className="text-2xl">{config.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {config.name}
                <Badge 
                  variant="outline" 
                  className={`${attack.detection.prevented ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                >
                  {attack.detection.prevented ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Prevented</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Not Prevented</>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mt-1">{config.description}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Confidence Score */}
            <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Detection Confidence</span>
                <span className={`font-mono ${confidenceColor}`}>
                  {attack.confidence}%
                </span>
              </div>
              <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    attack.confidence >= 90 ? 'bg-red-500' : 
                    attack.confidence >= 70 ? 'bg-orange-500' : 
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${attack.confidence}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Detected using: {attack.detection.method} • Response time: {attack.detection.responseTime}ms
              </p>
            </div>

            {/* Transaction Flow Visual */}
            <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#2a2a2a]">
              <h4 className="text-sm text-gray-400 mb-4">Transaction Flow</h4>
              <div className="space-y-3">
                {attack.attackerTxs
                  .filter(tx => tx.position === 'before')
                  .map((tx, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Attacker {tx.type === 'entry' ? 'Entry' : 'Exit'}
                          </Badge>
                          <span className="text-xs text-gray-500 font-mono">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Fuel className="w-3 h-3" />
                          Gas: {tx.gasPrice}
                        </div>
                      </div>
                    </div>
                  ))}
                
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </div>

                {/* Victim Transaction */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        Your Transaction
                      </Badge>
                      <span className="text-xs text-gray-500 font-mono">
                        {attack.victimTx.hash.slice(0, 10)}...{attack.victimTx.hash.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Value: {attack.victimTx.value}
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" />
                        Gas: {attack.victimTx.gasPrice}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </div>

                {attack.attackerTxs
                  .filter(tx => tx.position === 'after')
                  .map((tx, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Attacker {tx.type === 'entry' ? 'Entry' : 'Exit'}
                          </Badge>
                          <span className="text-xs text-gray-500 font-mono">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Fuel className="w-3 h-3" />
                          Gas: {tx.gasPrice}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Impact Analysis */}
            <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#2a2a2a]">
              <h4 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Financial Impact
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Your Loss</div>
                  <div className="text-red-400 font-mono">
                    ${attack.impact.victimLoss}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Slippage Increase</div>
                  <div className="text-orange-400 font-mono">
                    +{attack.impact.slippageIncrease}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Attacker Profit</div>
                  <div className="text-gray-300 font-mono">
                    ${attack.impact.attackerProfit}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Gas Cost</div>
                  <div className="text-gray-300 font-mono">
                    ${attack.impact.gasCost}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Net Attacker Profit</div>
                  <div className="text-emerald-400 font-mono">
                    ${attack.impact.netProfit}
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Attacks */}
            {attack.similar && (
              <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#2a2a2a]">
                <h4 className="text-sm text-gray-400 mb-3">Similar Attacks Detected</h4>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-white font-mono">{attack.similar.count}</span>
                    <span className="text-gray-500 ml-1">total in {attack.similar.timeframe}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4 bg-[#2a2a2a]" />
                  <div>
                    <span className="text-white font-mono">{attack.similar.sameAttacker}</span>
                    <span className="text-gray-500 ml-1">from same attacker</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Links */}
            <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#2a2a2a]">
              <h4 className="text-sm text-gray-400 mb-3">Explorer Links</h4>
              <div className="space-y-2">
                <a
                  href={`https://etherscan.io/tx/${attack.victimTx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  View your transaction on Etherscan
                </a>
                {attack.attackerTxs.map((tx, idx) => (
                  <a
                    key={idx}
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View attacker transaction {idx + 1}
                  </a>
                ))}
              </div>
            </div>

            {/* Report False Positive */}
            {!showReportDialog ? (
              <Button
                variant="outline"
                className="w-full border-[#2a2a2a] text-gray-400 hover:text-gray-300 hover:bg-[#2a2a2a]"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="w-4 h-4 mr-2" />
                Report as False Positive
              </Button>
            ) : (
              <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#2a2a2a] space-y-3">
                <h4 className="text-sm text-gray-400">Report False Positive</h4>
                <textarea
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Please describe why this is not an actual attack..."
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#2a2a2a]"
                    onClick={() => {
                      setShowReportDialog(false);
                      setReportReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleReport}
                    disabled={!reportReason.trim()}
                  >
                    Submit Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
