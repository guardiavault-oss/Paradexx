// WalletConnect Integration - Connect to dApps
import { useState, useEffect } from 'react';
import { logger } from '../services/logger.service';

export interface WalletConnectSession {
  topic: string;
  peerMeta: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  connected: boolean;
  accounts: string[];
  chainId: number;
  connectedAt: number;
}

export interface WalletConnectRequest {
  id: number;
  method: string;
  params: any[];
  topic: string;
}

export type WalletConnectMethod = 
  | 'eth_sendTransaction'
  | 'eth_signTransaction'
  | 'eth_sign'
  | 'personal_sign'
  | 'eth_signTypedData'
  | 'eth_signTypedData_v4'
  | 'wallet_switchEthereumChain'
  | 'wallet_addEthereumChain';

// WalletConnect Manager
export class WalletConnectManager {
  private sessions: Map<string, WalletConnectSession> = new Map();
  private requestHandlers: Map<WalletConnectMethod, (request: WalletConnectRequest) => Promise<any>> = new Map();
  private onSessionUpdate?: (session: WalletConnectSession) => void;

  // Initialize WalletConnect
  async init() {
    // In production: Initialize WalletConnect client
    // import { WalletConnect } from '@walletconnect/client';
    // this.client = new WalletConnect({ bridge: 'https://bridge.walletconnect.org' });
    
    logger.info('WalletConnect initialized');
    
    // Load saved sessions
    this.loadSessions();
  }

  // Connect via URI (QR code)
  async connect(uri: string): Promise<WalletConnectSession> {
    // In production: Use WalletConnect client
    // await this.client.connect({ uri });
    
    logger.info('Connecting to:', uri);
    
    // Mock connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Parse URI to get dApp info
    const dAppInfo = this.parseWalletConnectURI(uri);
    
    const session: WalletConnectSession = {
      topic: `topic-${Date.now()}`,
      peerMeta: dAppInfo,
      connected: true,
      accounts: ['0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a'], // Current wallet address
      chainId: 1, // Ethereum mainnet
      connectedAt: Date.now()
    };
    
    this.sessions.set(session.topic, session);
    this.saveSessions();
    
    if (this.onSessionUpdate) {
      this.onSessionUpdate(session);
    }
    
    return session;
  }

  // Disconnect session
  async disconnect(topic: string): Promise<void> {
    const session = this.sessions.get(topic);
    if (!session) return;
    
    // In production: Call WalletConnect client.disconnect()
    
    this.sessions.delete(topic);
    this.saveSessions();
    
    logger.info('Disconnected from:', session.peerMeta.name);
  }

  // Get all active sessions
  getSessions(): WalletConnectSession[] {
    return Array.from(this.sessions.values());
  }

  // Get session by topic
  getSession(topic: string): WalletConnectSession | undefined {
    return this.sessions.get(topic);
  }

  // Register request handler
  onRequest(method: WalletConnectMethod, handler: (request: WalletConnectRequest) => Promise<any>) {
    this.requestHandlers.set(method, handler);
  }

  // Handle incoming request
  async handleRequest(request: WalletConnectRequest): Promise<any> {
    const handler = this.requestHandlers.get(request.method as WalletConnectMethod);
    
    if (!handler) {
      throw new Error(`No handler for method: ${request.method}`);
    }
    
    return await handler(request);
  }

  // Approve request
  async approveRequest(id: number, result: any): Promise<void> {
    // In production: Send response via WalletConnect
    logger.info('Request approved:', { id, result });
  }

  // Reject request
  async rejectRequest(id: number, error: string): Promise<void> {
    // In production: Send error via WalletConnect
    logger.info('Request rejected:', { id, error });
  }

  // Update session
  updateSession(topic: string, updates: Partial<WalletConnectSession>): void {
    const session = this.sessions.get(topic);
    if (!session) return;
    
    const updated = { ...session, ...updates };
    this.sessions.set(topic, updated);
    this.saveSessions();
    
    if (this.onSessionUpdate) {
      this.onSessionUpdate(updated);
    }
  }

  // Subscribe to session updates
  subscribeToSessionUpdates(callback: (session: WalletConnectSession) => void) {
    this.onSessionUpdate = callback;
  }

  // Parse WalletConnect URI
  private parseWalletConnectURI(uri: string): WalletConnectSession['peerMeta'] {
    // In production: Parse actual WalletConnect URI
    // Example: wc:topic@version?bridge=url&key=key
    
    // Mock parser
    return {
      name: 'Example dApp',
      description: 'A decentralized application',
      url: 'https://example.com',
      icons: ['https://example.com/icon.png']
    };
  }

  // Save sessions to localStorage
  private saveSessions(): void {
    const sessions = Array.from(this.sessions.values());
    localStorage.setItem('walletconnect_sessions', JSON.stringify(sessions));
  }

  // Load sessions from localStorage
  private loadSessions(): void {
    const saved = localStorage.getItem('walletconnect_sessions');
    if (!saved) return;
    
    try {
      const sessions: WalletConnectSession[] = JSON.parse(saved);
      sessions.forEach(session => {
        this.sessions.set(session.topic, session);
      });
    } catch (err) {
      logger.error('Failed to load WalletConnect sessions:', err);
    }
  }
}

// Singleton instance
export const walletConnect = new WalletConnectManager();

// Generate WalletConnect QR code data
export function generateWalletConnectQR(uri: string): string {
  // In production: Use QR code library
  // import QRCode from 'qrcode';
  // const qrDataUrl = await QRCode.toDataURL(uri);
  
  // Mock QR code (base64 SVG)
  const svg = `<svg width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" fill="black" font-size="12">WalletConnect QR</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Validate WalletConnect URI
export function isValidWalletConnectURI(uri: string): boolean {
  return uri.startsWith('wc:') && uri.includes('@');
}

// Get supported chains
export function getSupportedChains(): number[] {
  return [
    1,     // Ethereum Mainnet
    137,   // Polygon
    56,    // BSC
    42161, // Arbitrum
    10,    // Optimism
    43114  // Avalanche
  ];
}

// Format request for display
export function formatRequestMethod(method: string): string {
  const labels: Record<string, string> = {
    'eth_sendTransaction': 'Send Transaction',
    'eth_signTransaction': 'Sign Transaction',
    'eth_sign': 'Sign Message',
    'personal_sign': 'Sign Message',
    'eth_signTypedData': 'Sign Typed Data',
    'eth_signTypedData_v4': 'Sign Typed Data',
    'wallet_switchEthereumChain': 'Switch Network',
    'wallet_addEthereumChain': 'Add Network'
  };
  
  return labels[method] || method;
}

// Estimate risk level of request
export function estimateRequestRisk(method: WalletConnectMethod, params: any[]): 'low' | 'medium' | 'high' {
  switch (method) {
    case 'eth_sendTransaction':
    case 'eth_signTransaction':
      return 'high'; // Sending funds
    
    case 'eth_sign':
      return 'high'; // Can sign anything
    
    case 'personal_sign':
    case 'eth_signTypedData':
    case 'eth_signTypedData_v4':
      return 'medium'; // Signing data
    
    case 'wallet_switchEthereumChain':
    case 'wallet_addEthereumChain':
      return 'low'; // Network changes
    
    default:
      return 'medium';
  }
}

export function useWalletConnect() {
  const [sessions, setSessions] = useState<WalletConnectSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize WalletConnect
    walletConnect.init();
    
    // Subscribe to session updates
    walletConnect.subscribeToSessionUpdates((session) => {
      setSessions(walletConnect.getSessions());
    });
    
    // Load initial sessions
    setSessions(walletConnect.getSessions());
  }, []);

  const connect = async (uri: string) => {
    setLoading(true);
    try {
      const session = await walletConnect.connect(uri);
      setSessions(walletConnect.getSessions());
      return session;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async (topic: string) => {
    await walletConnect.disconnect(topic);
    setSessions(walletConnect.getSessions());
  };

  return {
    sessions,
    loading,
    connect,
    disconnect
  };
}