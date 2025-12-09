import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Wallet, 
  Copy, 
  CheckCircle, 
  ExternalLink,
  AlertTriangle,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  ensName: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: 'metamask' | 'coinbase' | 'walletconnect' | 'ledger' | null;
}

interface WalletConnectionProps {
  wallet: WalletState;
  onConnect: (provider: string) => Promise<void>;
  onDisconnect: () => void;
  onSwitchNetwork: (chainId: number) => Promise<void>;
  requiredChainId?: number;
  showBalance?: boolean;
}

const walletProviders = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Most popular Ethereum wallet',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'User-friendly mobile wallet',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect any mobile wallet',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    icon: '🔐',
    description: 'Hardware wallet (most secure)',
  },
];

const networks = {
  1: { name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io' },
  137: { name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
  56: { name: 'BSC', symbol: 'BNB', explorer: 'https://bscscan.com' },
  42161: { name: 'Arbitrum', symbol: 'ETH', explorer: 'https://arbiscan.io' },
  10: { name: 'Optimism', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io' },
  43114: { name: 'Avalanche', symbol: 'AVAX', explorer: 'https://snowtrace.io' },
};

export function WalletConnection({
  wallet,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  requiredChainId,
  showBalance = true,
}: WalletConnectionProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const currentNetwork = wallet.chainId ? networks[wallet.chainId as keyof typeof networks] : null;
  const requiredNetwork = requiredChainId ? networks[requiredChainId as keyof typeof networks] : null;
  const isWrongNetwork = requiredChainId && wallet.chainId !== requiredChainId;

  const handleCopyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleConnect = async (providerId: string) => {
    try {
      await onConnect(providerId);
      setShowConnectDialog(false);
      toast.success(`Connected to ${providerId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const handleSwitchNetwork = async () => {
    if (!requiredChainId) return;
    
    try {
      await onSwitchNetwork(requiredChainId);
      toast.success(`Switched to ${requiredNetwork?.name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch network');
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 100) return num.toFixed(3);
    return num.toFixed(2);
  };

  if (!wallet.isConnected) {
    return (
      <>
        <Button
          onClick={() => setShowConnectDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>

        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
            <DialogHeader>
              <DialogTitle className="text-white">Connect Wallet</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {walletProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleConnect(provider.id)}
                  disabled={wallet.isConnecting}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-3xl">{provider.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="text-white">{provider.name}</div>
                    <div className="text-xs text-gray-500">{provider.description}</div>
                  </div>
                  {wallet.isConnecting && (
                    <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                  )}
                </button>
              ))}
            </div>

            <Alert className="bg-yellow-500/10 border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200 text-sm">
                Never share your private keys or seed phrase. MEVGUARD will never ask for them.
              </AlertDescription>
            </Alert>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Wrong Network Warning */}
      {isWrongNetwork && (
        <Button
          onClick={handleSwitchNetwork}
          variant="outline"
          className="bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Switch to {requiredNetwork?.name}
        </Button>
      )}

      {/* Wallet Info */}
      <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2">
        {/* Network Badge */}
        {currentNetwork && (
          <Badge 
            variant="outline" 
            className={`${
              isWrongNetwork 
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {currentNetwork.name}
          </Badge>
        )}

        {/* Balance */}
        {showBalance && wallet.balance && currentNetwork && (
          <div className="hidden md:flex items-center gap-1 text-sm text-gray-400 border-l border-[#2a2a2a] pl-2">
            <span className="text-white font-mono">
              {formatBalance(wallet.balance)}
            </span>
            <span>{currentNetwork.symbol}</span>
          </div>
        )}

        {/* Address */}
        <button
          onClick={handleCopyAddress}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors border-l border-[#2a2a2a] pl-2"
          title="Click to copy address"
        >
          {wallet.ensName || (
            <span className="font-mono">{formatAddress(wallet.address!)}</span>
          )}
          {copiedAddress ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Explorer Link */}
        {currentNetwork && (
          <a
            href={`${currentNetwork.explorer}/address/${wallet.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
            title="View on block explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Disconnect */}
        <button
          onClick={onDisconnect}
          className="text-gray-400 hover:text-red-400 transition-colors border-l border-[#2a2a2a] pl-2"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for wallet management (demo implementation)
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    ensName: null,
    isConnected: false,
    isConnecting: false,
    provider: null,
  });

  const handleConnect = async (provider: string) => {
    setWallet(prev => ({ ...prev, isConnecting: true }));
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setWallet({
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      chainId: 1,
      balance: '2.4567',
      ensName: null,
      isConnected: true,
      isConnecting: false,
      provider: provider as any,
    });
  };

  const handleDisconnect = () => {
    setWallet({
      address: null,
      chainId: null,
      balance: null,
      ensName: null,
      isConnected: false,
      isConnecting: false,
      provider: null,
    });
    toast.success('Wallet disconnected');
  };

  const handleSwitchNetwork = async (chainId: number) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setWallet(prev => ({ ...prev, chainId }));
  };

  // Listen for account/network changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          setWallet(prev => ({ ...prev, address: accounts[0] }));
          toast.info('Account changed');
        }
      });

      ethereum.on('chainChanged', (chainId: string) => {
        setWallet(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
        toast.info('Network changed');
      });

      return () => {
        ethereum.removeAllListeners('accountsChanged');
        ethereum.removeAllListeners('chainChanged');
      };
    }
  }, []);

  return {
    wallet,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchNetwork: handleSwitchNetwork,
  };
}
