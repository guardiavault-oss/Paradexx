import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { ChevronDown, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface Chain {
  id: number;
  name: string;
  symbol: string;
  explorer: string;
  rpcUrl: string;
  blockTime: number; // seconds
  gasUnit: 'gwei' | 'wei';
  icon: string;
  color: string;
  features: {
    mevProtection: boolean;
    flashbots: boolean;
    privateRelay?: string;
  };
}

export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    rpcUrl: 'https://eth.llamarpc.com',
    blockTime: 12,
    gasUnit: 'gwei',
    icon: '⟠',
    color: 'text-blue-400',
    features: {
      mevProtection: true,
      flashbots: true,
      privateRelay: 'Flashbots',
    },
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com',
    rpcUrl: 'https://polygon.llamarpc.com',
    blockTime: 2,
    gasUnit: 'gwei',
    icon: '⬡',
    color: 'text-purple-400',
    features: {
      mevProtection: true,
      flashbots: false,
    },
  },
  {
    id: 56,
    name: 'BSC',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    rpcUrl: 'https://bsc.llamarpc.com',
    blockTime: 3,
    gasUnit: 'gwei',
    icon: '◆',
    color: 'text-yellow-400',
    features: {
      mevProtection: true,
      flashbots: false,
      privateRelay: 'Eden Network',
    },
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    explorer: 'https://arbiscan.io',
    rpcUrl: 'https://arbitrum.llamarpc.com',
    blockTime: 0.25,
    gasUnit: 'gwei',
    icon: '◉',
    color: 'text-blue-300',
    features: {
      mevProtection: true,
      flashbots: false,
    },
  },
  {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
    rpcUrl: 'https://optimism.llamarpc.com',
    blockTime: 2,
    gasUnit: 'gwei',
    icon: '🔴',
    color: 'text-red-400',
    features: {
      mevProtection: true,
      flashbots: false,
    },
  },
  {
    id: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    explorer: 'https://snowtrace.io',
    rpcUrl: 'https://avalanche.llamarpc.com',
    blockTime: 2,
    gasUnit: 'gwei',
    icon: '▲',
    color: 'text-red-500',
    features: {
      mevProtection: true,
      flashbots: false,
    },
  },
  {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    explorer: 'https://basescan.org',
    rpcUrl: 'https://base.llamarpc.com',
    blockTime: 2,
    gasUnit: 'gwei',
    icon: '🔵',
    color: 'text-blue-500',
    features: {
      mevProtection: true,
      flashbots: false,
    },
  },
  {
    id: 100,
    name: 'Gnosis',
    symbol: 'xDAI',
    explorer: 'https://gnosisscan.io',
    rpcUrl: 'https://gnosis.llamarpc.com',
    blockTime: 5,
    gasUnit: 'gwei',
    icon: '◎',
    color: 'text-teal-400',
    features: {
      mevProtection: false,
      flashbots: false,
    },
  },
];

interface ChainSwitcherProps {
  currentChainId: number;
  onChainChange: (chainId: number) => void;
  showAggregateView?: boolean;
  onAggregateToggle?: (enabled: boolean) => void;
}

export function ChainSwitcher({
  currentChainId,
  onChainChange,
  showAggregateView = false,
  onAggregateToggle,
}: ChainSwitcherProps) {
  const [isAggregateView, setIsAggregateView] = useState(false);

  const currentChain = SUPPORTED_CHAINS.find(c => c.id === currentChainId) || SUPPORTED_CHAINS[0];

  const handleChainSwitch = async (chainId: number) => {
    const newChain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    if (!newChain) return;

    try {
      // Attempt to switch network in wallet
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      }

      onChainChange(chainId);
      toast.success(`Switched to ${newChain.name}`);
    } catch (error: any) {
      // Chain not added to wallet
      if (error.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: newChain.name,
              nativeCurrency: {
                name: newChain.symbol,
                symbol: newChain.symbol,
                decimals: 18,
              },
              rpcUrls: [newChain.rpcUrl],
              blockExplorerUrls: [newChain.explorer],
            }],
          });
          onChainChange(chainId);
          toast.success(`Added and switched to ${newChain.name}`);
        } catch (addError) {
          toast.error('Failed to add network to wallet');
        }
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  const handleAggregateToggle = () => {
    const newValue = !isAggregateView;
    setIsAggregateView(newValue);
    onAggregateToggle?.(newValue);
    toast.success(newValue ? 'Showing all chains' : `Showing ${currentChain.name} only`);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a] min-w-[140px]"
          >
            <span className="mr-2">{currentChain.icon}</span>
            <span className="flex-1 text-left">{currentChain.name}</span>
            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] w-[280px]">
          <div className="px-2 py-1.5">
            <p className="text-xs text-gray-500 mb-2">Select Network</p>
          </div>

          {SUPPORTED_CHAINS.map((chain) => (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => handleChainSwitch(chain.id)}
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#2a2a2a]"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xl">{chain.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`${chain.color} font-medium`}>{chain.name}</span>
                    {chain.features.mevProtection && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"
                      >
                        Protected
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>{chain.blockTime}s blocks</span>
                    {chain.features.privateRelay && (
                      <>
                        <span>•</span>
                        <span>{chain.features.privateRelay}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {currentChain.id === chain.id && (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
            </DropdownMenuItem>
          ))}

          {showAggregateView && (
            <>
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem
                onClick={handleAggregateToggle}
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#2a2a2a]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌐</span>
                  <span className="text-white">All Chains (Aggregate)</span>
                </div>
                {isAggregateView && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator className="bg-[#2a2a2a]" />
          <DropdownMenuItem
            onClick={() => window.open(currentChain.explorer, '_blank')}
            className="flex items-center gap-2 py-2 cursor-pointer hover:bg-[#2a2a2a]"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">View on {currentChain.name} Explorer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!currentChain.features.mevProtection && (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Limited Protection
        </Badge>
      )}
    </div>
  );
}
