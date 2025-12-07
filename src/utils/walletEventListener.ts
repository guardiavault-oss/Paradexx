// Wallet event listener - Detects account/network changes
// CRITICAL: Prevents users from signing with wrong account/network

export type WalletEventHandler = (data: any) => void;

interface WalletEventListeners {
  accountsChanged: WalletEventHandler[];
  chainChanged: WalletEventHandler[];
  disconnect: WalletEventHandler[];
  connect: WalletEventHandler[];
}

class WalletEventManager {
  private listeners: WalletEventListeners = {
    accountsChanged: [],
    chainChanged: [],
    disconnect: [],
    connect: []
  };
  
  private isListening = false;

  // Initialize event listeners
  public init() {
    if (this.isListening || typeof window === 'undefined') return;
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    // Account changed
    ethereum.on('accountsChanged', (accounts: string[]) => {
      logger.info('Account changed:', accounts);
      this.trigger('accountsChanged', accounts);
    });

    // Network/Chain changed
    ethereum.on('chainChanged', (chainId: string) => {
      logger.info('Chain changed:', chainId);
      this.trigger('chainChanged', chainId);
      // MetaMask recommends reloading the page on chain change
      // but we'll handle it gracefully
    });

    // Disconnected
    ethereum.on('disconnect', (error: any) => {
      logger.info('Wallet disconnected:', error);
      this.trigger('disconnect', error);
    });

    // Connected
    ethereum.on('connect', (connectInfo: any) => {
      logger.info('Wallet connected:', connectInfo);
      this.trigger('connect', connectInfo);
    });

    this.isListening = true;
  }

  // Add event listener
  public on(event: keyof WalletEventListeners, handler: WalletEventHandler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  // Remove event listener
  public off(event: keyof WalletEventListeners, handler: WalletEventHandler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  }

  // Trigger event
  private trigger(event: keyof WalletEventListeners, data: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(handler => handler(data));
  }

  // Cleanup
  public destroy() {
    if (typeof window === 'undefined') return;
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    ethereum.removeAllListeners('accountsChanged');
    ethereum.removeAllListeners('chainChanged');
    ethereum.removeAllListeners('disconnect');
    ethereum.removeAllListeners('connect');

    this.listeners = {
      accountsChanged: [],
      chainChanged: [],
      disconnect: [],
      connect: []
    };
    
    this.isListening = false;
  }
}

// Singleton instance
export const walletEvents = new WalletEventManager();

// React hook for wallet events
import { useEffect } from 'react';
import { logger } from '../services/logger.service';

export function useWalletEvents(handlers: Partial<{
  onAccountsChanged: (accounts: string[]) => void;
  onChainChanged: (chainId: string) => void;
  onDisconnect: (error: any) => void;
  onConnect: (connectInfo: any) => void;
}>) {
  useEffect(() => {
    walletEvents.init();

    if (handlers.onAccountsChanged) {
      walletEvents.on('accountsChanged', handlers.onAccountsChanged);
    }
    if (handlers.onChainChanged) {
      walletEvents.on('chainChanged', handlers.onChainChanged);
    }
    if (handlers.onDisconnect) {
      walletEvents.on('disconnect', handlers.onDisconnect);
    }
    if (handlers.onConnect) {
      walletEvents.on('connect', handlers.onConnect);
    }

    return () => {
      if (handlers.onAccountsChanged) {
        walletEvents.off('accountsChanged', handlers.onAccountsChanged);
      }
      if (handlers.onChainChanged) {
        walletEvents.off('chainChanged', handlers.onChainChanged);
      }
      if (handlers.onDisconnect) {
        walletEvents.off('disconnect', handlers.onDisconnect);
      }
      if (handlers.onConnect) {
        walletEvents.off('connect', handlers.onConnect);
      }
    };
  }, []);
}

// Network mismatch detection
export interface NetworkConfig {
  chainId: string;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  },
  '0x89': {
    chainId: '0x89',
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  },
  '0xa4b1': {
    chainId: '0xa4b1',
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  },
  '0xa': {
    chainId: '0xa',
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  },
  '0x38': {
    chainId: '0x38',
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
  }
};

export async function getCurrentChainId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  const ethereum = (window as any).ethereum;
  if (!ethereum) return null;

  try {
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    return chainId;
  } catch {
    return null;
  }
}

export async function switchNetwork(chainId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  const ethereum = (window as any).ethereum;
  if (!ethereum) return false;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        const network = SUPPORTED_NETWORKS[chainId];
        if (!network) return false;

        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: network.chainId,
            chainName: network.name,
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorer],
            nativeCurrency: network.nativeCurrency
          }],
        });
        return true;
      } catch (addError) {
        logger.error('Failed to add network:', addError);
        return false;
      }
    }
    logger.error('Failed to switch network:', switchError);
    return false;
  }
}

export function isNetworkSupported(chainId: string): boolean {
  return chainId in SUPPORTED_NETWORKS;
}

export function getNetworkName(chainId: string): string {
  return SUPPORTED_NETWORKS[chainId]?.name || 'Unknown Network';
}
