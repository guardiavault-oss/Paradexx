import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  AlertTriangle,
  Shield,
  ExternalLink,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api, ProtectedAddressesData, ProtectedAddressStatsData } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PageLoader } from './LoadingStates';

interface TokenApproval {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  spenderAddress: string;
  spenderName: string;
  allowance: string;
  isUnlimited: boolean;
  lastUsed: Date;
  approvedAt: Date;
  riskLevel: 'low' | 'medium' | 'high';
  chainId: number;
}

const mockApprovals: TokenApproval[] = [
  {
    id: '1',
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    spenderAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    spenderName: 'Uniswap V3 Router',
    allowance: 'Unlimited',
    isUnlimited: true,
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    riskLevel: 'low',
    chainId: 1,
  },
  {
    id: '2',
    tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    tokenSymbol: 'DAI',
    tokenName: 'Dai Stablecoin',
    spenderAddress: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
    spenderName: 'Unknown Contract',
    allowance: 'Unlimited',
    isUnlimited: true,
    lastUsed: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    approvedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    riskLevel: 'high',
    chainId: 1,
  },
  {
    id: '3',
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    tokenSymbol: 'USDT',
    tokenName: 'Tether USD',
    spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    spenderName: 'Uniswap V2 Router',
    allowance: '50,000',
    isUnlimited: false,
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    approvedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    riskLevel: 'low',
    chainId: 1,
  },
  {
    id: '4',
    tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    tokenSymbol: 'WBTC',
    tokenName: 'Wrapped Bitcoin',
    spenderAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    spenderName: 'Uniswap V3 Router 2',
    allowance: 'Unlimited',
    isUnlimited: true,
    lastUsed: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    approvedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    riskLevel: 'medium',
    chainId: 1,
  },
];

export function TokenApprovalMonitor() {
  const [approvals, setApprovals] = useState<TokenApproval[]>(mockApprovals);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success('Token approvals refreshed');
  };

  const handleRevoke = async (approvalId: string) => {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;

    setRevoking(approvalId);
    
    // Simulate revoke transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setApprovals(prev => prev.filter(a => a.id !== approvalId));
    setRevoking(null);
    toast.success(`Revoked approval for ${approval.tokenSymbol}`);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
  };

  const highRiskCount = approvals.filter(a => a.riskLevel === 'high').length;
  const unlimitedCount = approvals.filter(a => a.isUnlimited).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl mb-1">Token Approval Monitor</h2>
          <p className="text-gray-400 text-sm">
            Monitor and revoke token spending approvals to protect your assets
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="bg-[#1a1a1a] border-[#2a2a2a]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Approvals</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl text-white font-mono">{approvals.length}</div>
          <div className="text-xs text-gray-500 mt-1">
            Across all networks
          </div>
        </Card>

        <Card className="p-4 bg-red-500/5 border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-400 text-sm">High Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl text-red-400 font-mono">{highRiskCount}</div>
          <div className="text-xs text-red-400/60 mt-1">
            Require immediate attention
          </div>
        </Card>

        <Card className="p-4 bg-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 text-sm">Unlimited</span>
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl text-yellow-400 font-mono">{unlimitedCount}</div>
          <div className="text-xs text-yellow-400/60 mt-1">
            Unlimited spending approved
          </div>
        </Card>
      </div>

      {/* Warning */}
      {highRiskCount > 0 && (
        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 mb-1">High Risk Approvals Detected</h4>
              <p className="text-sm text-red-400/80">
                You have {highRiskCount} high-risk token approval{highRiskCount > 1 ? 's' : ''}.
                These are approvals to unknown contracts or haven't been used in over 60 days.
                Consider revoking them to protect your assets.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Approvals List */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <ScrollArea className="h-[600px]">
          <div className="divide-y divide-[#2a2a2a]">
            {approvals.map((approval) => (
              <div key={approval.id} className="p-4 hover:bg-[#1f1f1f] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getRiskIcon(approval.riskLevel)}
                    
                    <div className="flex-1 min-w-0">
                      {/* Token Info */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">
                          {approval.tokenName}
                        </span>
                        <Badge variant="outline" className="text-xs bg-[#0f0f0f] border-[#2a2a2a]">
                          {approval.tokenSymbol}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`text-xs ${getRiskColor(approval.riskLevel)}`}
                        >
                          {approval.riskLevel} risk
                        </Badge>
                      </div>

                      {/* Spender Info */}
                      <div className="text-sm text-gray-400 mb-2">
                        <span className="text-gray-500">Approved to:</span>{' '}
                        <span className={approval.spenderName === 'Unknown Contract' ? 'text-red-400' : ''}>
                          {approval.spenderName}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-gray-500">Allowance</div>
                          <div className={`text-white font-mono ${approval.isUnlimited ? 'text-yellow-400' : ''}`}>
                            {approval.allowance}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Last Used</div>
                          <div className="text-white">
                            {Math.floor((Date.now() - approval.lastUsed.getTime()) / (24 * 60 * 60 * 1000))}d ago
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Approved</div>
                          <div className="text-white">
                            {Math.floor((Date.now() - approval.approvedAt.getTime()) / (24 * 60 * 60 * 1000))}d ago
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Spender Address</div>
                          <div className="text-white font-mono">
                            {approval.spenderAddress.slice(0, 6)}...{approval.spenderAddress.slice(-4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://etherscan.io/address/${approval.spenderAddress}`, '_blank')}
                      className="border-[#2a2a2a]"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(approval.id)}
                      disabled={revoking === approval.id}
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                    >
                      {revoking === approval.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Revoke
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Help Text */}
      <Card className="p-4 bg-[#1a1a1a] border-[#2a2a2a]">
        <h4 className="text-white text-sm mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Security Best Practices
        </h4>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>• Revoke approvals to contracts you no longer use</li>
          <li>• Be cautious of unlimited approvals to unknown contracts</li>
          <li>• Regularly review and audit your token approvals</li>
          <li>• Consider using limited approvals instead of unlimited</li>
          <li>• Verify contract addresses before approving</li>
        </ul>
      </Card>
    </div>
  );
}