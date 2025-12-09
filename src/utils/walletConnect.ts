/**
 * WalletConnect v2 Integration for dApp Connections
 * 
 * Real implementation using @reown/walletkit (formerly @walletconnect/web3wallet)
 * and qrcode for QR code generation.
 * 
 * Requires:
 * - VITE_WALLETCONNECT_PROJECT_ID environment variable from cloud.walletconnect.com
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '../services/logger.service';
import QRCode from 'qrcode';

// WalletConnect Project ID - Required for production
const WALLETCONNECT_PROJECT_ID = import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID || '';

// Wallet metadata for dApp connections
const WALLET_METADATA = {
  name: 'ParadexWallet',
  description: 'Secure Multi-Chain Crypto Wallet',
  url: 'https://paradexwallet.com',
  icons: ['https://paradexwallet.com/icon.png']
};

// Supported namespaces
const SUPPORTED_NAMESPACES = {
  eip155: {
    chains: ['eip155:1', 'eip155:137', 'eip155:56', 'eip155:42161', 'eip155:10', 'eip155:43114'],
    methods: [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v4',
      'wallet_switchEthereumChain',
      'wallet_addEthereumChain'
    ],
    events: ['chainChanged', 'accountsChanged']
  }
};

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
  namespaces?: Record<string, unknown>;
  expiry?: number;
}

export interface WalletConnectRequest {
  id: number;
  method: string;
  params: unknown[];
  topic: string;
}

export interface SessionProposal {
  id: number;
  params: {
    proposer: {
      metadata: {
        name: string;
        description: string;
        url: string;
        icons: string[];
      };
    };
    requiredNamespaces: Record<string, {
      chains: string[];
      methods: string[];
      events: string[];
    }>;
    optionalNamespaces?: Record<string, {
      chains: string[];
      methods: string[];
      events: string[];
    }>;
  };
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

type SessionUpdateCallback = (session: WalletConnectSession) => void;
type RequestHandler = (request: WalletConnectRequest) => Promise<unknown>;
type SessionProposalCallback = (proposal: SessionProposal) => void;
type SessionRequestCallback = (request: WalletConnectRequest) => void;

// WalletConnect Manager - Real Implementation using @reown/walletkit
export class WalletConnectManager {
  private walletKit: unknown = null;
  private readonly sessions: Map<string, WalletConnectSession> = new Map();
  private readonly requestHandlers: Map<WalletConnectMethod, RequestHandler> = new Map();
  private onSessionUpdate?: SessionUpdateCallback;
  private onSessionProposal?: SessionProposalCallback;
  private onSessionRequest?: SessionRequestCallback;
  private initialized = false;
  private currentAccount = '';
  private currentChainId = 1;

  /**
   * Initialize WalletConnect with @reown/walletkit
   */
  async init(account?: string, chainId?: number): Promise<void> {
    if (this.initialized) {
      logger.info('WalletConnect already initialized');
      return;
    }

    if (account) this.currentAccount = account;
    if (chainId) this.currentChainId = chainId;

    if (!WALLETCONNECT_PROJECT_ID) {
      logger.warn('WalletConnect: No project ID configured. Set VITE_WALLETCONNECT_PROJECT_ID.');
      this.loadSessions();
      return;
    }

    try {
      // Dynamic import to avoid build issues if package not installed
      const { WalletKit } = await import('@reown/walletkit');
      const { Core } = await import('@walletconnect/core');

      const core = new Core({
        projectId: WALLETCONNECT_PROJECT_ID
      });

      this.walletKit = await WalletKit.init({
        core,
        metadata: WALLET_METADATA
      });

      this.setupEventHandlers();
      this.loadPersistedSessions();
      
      this.initialized = true;
      logger.info('WalletConnect initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WalletConnect:', error);
      this.loadSessions();
    }
  }

  /**
   * Set up WalletKit event handlers
   */
  private setupEventHandlers(): void {
    if (!this.walletKit) return;

    const kit = this.walletKit as {
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };

    // Session proposal
    kit.on('session_proposal', async (...args: unknown[]) => {
      const proposal = args[0] as SessionProposal;
      logger.info('Session proposal received:', proposal.params.proposer.metadata.name);
      if (this.onSessionProposal) {
        this.onSessionProposal(proposal);
      }
    });

    // Session request
    kit.on('session_request', async (...args: unknown[]) => {
      const event = args[0] as { 
        id: number; 
        topic: string; 
        params: { request: { method: string; params: unknown[] } } 
      };
      
      const request: WalletConnectRequest = {
        id: event.id,
        topic: event.topic,
        method: event.params.request.method,
        params: event.params.request.params
      };

      logger.info('Session request received:', request.method);

      if (this.onSessionRequest) {
        this.onSessionRequest(request);
      }

      const handler = this.requestHandlers.get(request.method as WalletConnectMethod);
      if (handler) {
        try {
          const result = await handler(request);
          await this.respondToRequest(event.id, event.topic, result);
        } catch (error) {
          await this.rejectRequest(event.id, event.topic, (error as Error).message);
        }
      }
    });

    // Session delete
    kit.on('session_delete', (...args: unknown[]) => {
      const event = args[0] as { topic: string };
      logger.info('Session deleted:', event.topic);
      this.sessions.delete(event.topic);
      this.saveSessions();
    });
  }

  /**
   * Load persisted sessions from WalletKit
   */
  private loadPersistedSessions(): void {
    if (!this.walletKit) return;

    try {
      const kit = this.walletKit as {
        getActiveSessions: () => Record<string, {
          topic: string;
          peer: { metadata: { name: string; description: string; url: string; icons: string[] } };
          namespaces: Record<string, { accounts: string[] }>;
          expiry: number;
        }>;
      };

      const activeSessions = kit.getActiveSessions();
      
      for (const [topic, session] of Object.entries(activeSessions)) {
        const wcSession: WalletConnectSession = {
          topic,
          peerMeta: {
            name: session.peer.metadata.name,
            description: session.peer.metadata.description,
            url: session.peer.metadata.url,
            icons: session.peer.metadata.icons
          },
          connected: true,
          accounts: this.extractAccounts(session.namespaces),
          chainId: this.extractChainId(session.namespaces),
          connectedAt: Date.now(),
          namespaces: session.namespaces,
          expiry: session.expiry
        };
        
        this.sessions.set(topic, wcSession);
      }
      
      logger.info(`Loaded ${this.sessions.size} active WalletConnect sessions`);
    } catch (error) {
      logger.error('Failed to load persisted sessions:', error);
    }
  }

  private extractAccounts(namespaces: Record<string, { accounts?: string[] }>): string[] {
    const accounts: string[] = [];
    for (const ns of Object.values(namespaces)) {
      if (ns.accounts) {
        for (const account of ns.accounts) {
          const parts = account.split(':');
          if (parts.length >= 3) {
            accounts.push(parts[2]);
          }
        }
      }
    }
    return [...new Set(accounts)];
  }

  private extractChainId(namespaces: Record<string, { accounts?: string[] }>): number {
    for (const ns of Object.values(namespaces)) {
      if (ns.accounts && ns.accounts.length > 0) {
        const parts = ns.accounts[0].split(':');
        if (parts.length >= 2) {
          return Number.parseInt(parts[1], 10);
        }
      }
    }
    return 1;
  }

  /**
   * Connect via WalletConnect URI
   */
  async connect(uri: string): Promise<WalletConnectSession> {
    if (!this.walletKit) {
      throw new Error('WalletConnect not initialized. Set VITE_WALLETCONNECT_PROJECT_ID.');
    }

    if (!isValidWalletConnectURI(uri)) {
      throw new Error('Invalid WalletConnect URI format');
    }

    logger.info('Connecting to WalletConnect URI...');

    try {
      const kit = this.walletKit as {
        core: { pairing: { pair: (opts: { uri: string }) => Promise<{ topic: string }> } };
      };

      await kit.core.pairing.pair({ uri });
      
      return {
        topic: 'pending',
        peerMeta: {
          name: 'Connecting...',
          description: 'Waiting for dApp response',
          url: '',
          icons: []
        },
        connected: false,
        accounts: [],
        chainId: this.currentChainId,
        connectedAt: Date.now()
      };
    } catch (error) {
      logger.error('Failed to connect via WalletConnect:', error);
      throw error;
    }
  }

  /**
   * Approve a session proposal
   */
  async approveSession(proposal: SessionProposal, accounts: string[]): Promise<WalletConnectSession> {
    if (!this.walletKit) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      const kit = this.walletKit as {
        approveSession: (opts: {
          id: number;
          namespaces: Record<string, { accounts: string[]; methods: string[]; events: string[] }>;
        }) => Promise<{ topic: string; peer: { metadata: { name: string; description: string; url: string; icons: string[] } } }>;
      };

      const namespaces: Record<string, { accounts: string[]; methods: string[]; events: string[] }> = {};

      for (const [key, value] of Object.entries(proposal.params.requiredNamespaces)) {
        namespaces[key] = {
          accounts: value.chains.flatMap(chain => accounts.map(account => `${chain}:${account}`)),
          methods: value.methods,
          events: value.events
        };
      }

      if (proposal.params.optionalNamespaces) {
        for (const [key, value] of Object.entries(proposal.params.optionalNamespaces)) {
          if (!namespaces[key]) {
            namespaces[key] = {
              accounts: value.chains.flatMap(chain => accounts.map(account => `${chain}:${account}`)),
              methods: value.methods,
              events: value.events
            };
          }
        }
      }

      const session = await kit.approveSession({ id: proposal.id, namespaces });

      const wcSession: WalletConnectSession = {
        topic: session.topic,
        peerMeta: session.peer.metadata,
        connected: true,
        accounts,
        chainId: this.currentChainId,
        connectedAt: Date.now(),
        namespaces
      };

      this.sessions.set(session.topic, wcSession);
      this.saveSessions();

      if (this.onSessionUpdate) {
        this.onSessionUpdate(wcSession);
      }

      logger.info('Session approved:', session.peer.metadata.name);
      return wcSession;
    } catch (error) {
      logger.error('Failed to approve session:', error);
      throw error;
    }
  }

  /**
   * Reject a session proposal
   */
  async rejectSession(proposalId: number, reason?: string): Promise<void> {
    if (!this.walletKit) return;

    try {
      const kit = this.walletKit as {
        rejectSession: (opts: { id: number; reason: { code: number; message: string } }) => Promise<void>;
      };

      await kit.rejectSession({
        id: proposalId,
        reason: { code: 4001, message: reason || 'User rejected the session' }
      });

      logger.info('Session proposal rejected');
    } catch (error) {
      logger.error('Failed to reject session:', error);
    }
  }

  /**
   * Respond to a session request
   */
  async respondToRequest(requestId: number, topic: string, result: unknown): Promise<void> {
    if (!this.walletKit) return;

    try {
      const kit = this.walletKit as {
        respondSessionRequest: (opts: { topic: string; response: { id: number; jsonrpc: string; result: unknown } }) => Promise<void>;
      };

      await kit.respondSessionRequest({
        topic,
        response: { id: requestId, jsonrpc: '2.0', result }
      });

      logger.info('Request response sent:', { requestId, topic });
    } catch (error) {
      logger.error('Failed to respond to request:', error);
      throw error;
    }
  }

  /**
   * Reject a session request
   */
  async rejectRequest(requestId: number, topic: string, message: string): Promise<void> {
    if (!this.walletKit) return;

    try {
      const kit = this.walletKit as {
        respondSessionRequest: (opts: { 
          topic: string; 
          response: { id: number; jsonrpc: string; error: { code: number; message: string } } 
        }) => Promise<void>;
      };

      await kit.respondSessionRequest({
        topic,
        response: { id: requestId, jsonrpc: '2.0', error: { code: 4001, message } }
      });

      logger.info('Request rejected:', { requestId, message });
    } catch (error) {
      logger.error('Failed to reject request:', error);
    }
  }

  /**
   * Disconnect a session
   */
  async disconnect(topic: string): Promise<void> {
    const session = this.sessions.get(topic);
    if (!session) return;

    if (this.walletKit) {
      try {
        const kit = this.walletKit as {
          disconnectSession: (opts: { topic: string; reason: { code: number; message: string } }) => Promise<void>;
        };

        await kit.disconnectSession({
          topic,
          reason: { code: 6000, message: 'User disconnected' }
        });
      } catch (error) {
        logger.warn('Error disconnecting session via WalletKit:', error);
      }
    }

    this.sessions.delete(topic);
    this.saveSessions();
    logger.info('Disconnected from:', session.peerMeta.name);
  }

  /**
   * Update session with new account or chain
   */
  async updateSession(topic: string, accounts: string[], chainId: number): Promise<void> {
    if (!this.walletKit) return;

    const session = this.sessions.get(topic);
    if (!session) return;

    try {
      const kit = this.walletKit as {
        updateSession: (opts: { 
          topic: string; 
          namespaces: Record<string, { accounts: string[]; methods: string[]; events: string[] }> 
        }) => Promise<void>;
        emitSessionEvent: (opts: { topic: string; event: { name: string; data: unknown }; chainId: string }) => Promise<void>;
      };

      const namespaces: Record<string, { accounts: string[]; methods: string[]; events: string[] }> = {
        eip155: {
          accounts: [`eip155:${chainId}:${accounts[0]}`],
          methods: SUPPORTED_NAMESPACES.eip155.methods,
          events: SUPPORTED_NAMESPACES.eip155.events
        }
      };

      await kit.updateSession({ topic, namespaces });

      if (chainId !== session.chainId) {
        await kit.emitSessionEvent({
          topic,
          event: { name: 'chainChanged', data: chainId },
          chainId: `eip155:${chainId}`
        });
      }

      if (accounts[0] !== session.accounts[0]) {
        await kit.emitSessionEvent({
          topic,
          event: { name: 'accountsChanged', data: accounts },
          chainId: `eip155:${chainId}`
        });
      }

      session.accounts = accounts;
      session.chainId = chainId;
      this.sessions.set(topic, session);
      this.saveSessions();

      if (this.onSessionUpdate) {
        this.onSessionUpdate(session);
      }

      logger.info('Session updated:', { topic, accounts, chainId });
    } catch (error) {
      logger.error('Failed to update session:', error);
    }
  }

  getSessions(): WalletConnectSession[] {
    return Array.from(this.sessions.values());
  }

  getSession(topic: string): WalletConnectSession | undefined {
    return this.sessions.get(topic);
  }

  onRequest(method: WalletConnectMethod, handler: RequestHandler): void {
    this.requestHandlers.set(method, handler);
  }

  onProposal(callback: SessionProposalCallback): void {
    this.onSessionProposal = callback;
  }

  onRequestReceived(callback: SessionRequestCallback): void {
    this.onSessionRequest = callback;
  }

  subscribeToSessionUpdates(callback: SessionUpdateCallback): void {
    this.onSessionUpdate = callback;
  }

  setAccount(account: string): void {
    this.currentAccount = account;
  }

  setChainId(chainId: number): void {
    this.currentChainId = chainId;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private saveSessions(): void {
    const sessions = Array.from(this.sessions.values());
    try {
      localStorage.setItem('walletconnect_sessions', JSON.stringify(sessions));
    } catch (error) {
      logger.warn('Failed to save WalletConnect sessions:', error);
    }
  }

  private loadSessions(): void {
    try {
      const saved = localStorage.getItem('walletconnect_sessions');
      if (!saved) return;

      const sessions: WalletConnectSession[] = JSON.parse(saved);
      for (const session of sessions) {
        this.sessions.set(session.topic, session);
      }
      
      logger.info(`Loaded ${this.sessions.size} cached WalletConnect sessions`);
    } catch (error) {
      logger.error('Failed to load WalletConnect sessions:', error);
    }
  }
}

// Singleton instance
export const walletConnect = new WalletConnectManager();

/**
 * Generate WalletConnect QR code data URL using qrcode library
 */
export async function generateWalletConnectQR(uri: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(uri, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    return dataUrl;
  } catch (error) {
    logger.error('Failed to generate QR code:', error);
    return generateFallbackQR(uri);
  }
}

/**
 * Generate QR code as canvas element
 */
export async function generateWalletConnectQRCanvas(
  uri: string, 
  canvas: HTMLCanvasElement
): Promise<void> {
  await QRCode.toCanvas(canvas, uri, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });
}

/**
 * Fallback QR code SVG when qrcode library fails
 */
function generateFallbackQR(uri: string): string {
  const hash = uri.length > 10 ? uri.substring(3, 11) : 'pending';
  const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="300" fill="white"/>
    <rect x="30" y="30" width="240" height="240" fill="#f0f0f0" rx="12"/>
    <text x="150" y="130" text-anchor="middle" fill="#333" font-size="16" font-family="monospace">WalletConnect</text>
    <text x="150" y="160" text-anchor="middle" fill="#666" font-size="12" font-family="monospace">${hash}</text>
    <text x="150" y="200" text-anchor="middle" fill="#999" font-size="11">Scan with wallet app</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Validate WalletConnect URI format (v2)
 */
export function isValidWalletConnectURI(uri: string): boolean {
  if (!uri.startsWith('wc:')) return false;
  if (!uri.includes('@2')) return false;
  if (!uri.includes('relay-protocol=')) return false;
  if (!uri.includes('symKey=')) return false;
  return true;
}

/**
 * Parse WalletConnect URI to extract components
 */
export function parseWalletConnectURI(uri: string): {
  topic: string;
  version: number;
  relayProtocol: string;
  symKey: string;
} | null {
  try {
    const regex = /^wc:([^@]+)@(\d+)\?(.+)$/;
    const match = regex.exec(uri);
    if (!match) return null;

    const [, topic, version, queryString] = match;
    const params = new URLSearchParams(queryString);

    return {
      topic,
      version: Number.parseInt(version, 10),
      relayProtocol: params.get('relay-protocol') || 'irn',
      symKey: params.get('symKey') || ''
    };
  } catch {
    return null;
  }
}

/**
 * Get supported chains with metadata
 */
export function getSupportedChains(): Array<{ id: number; name: string; symbol: string }> {
  return [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 56, name: 'BNB Chain', symbol: 'BNB' },
    { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
    { id: 10, name: 'Optimism', symbol: 'ETH' },
    { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
    { id: 8453, name: 'Base', symbol: 'ETH' },
    { id: 324, name: 'zkSync Era', symbol: 'ETH' }
  ];
}

/**
 * Get chain name by ID
 */
export function getChainName(chainId: number): string {
  const chains = getSupportedChains();
  const chain = chains.find(c => c.id === chainId);
  return chain?.name || `Chain ${chainId}`;
}

/**
 * Format request method for display
 */
export function formatRequestMethod(method: string): string {
  const labels: Record<string, string> = {
    'eth_sendTransaction': 'Send Transaction',
    'eth_signTransaction': 'Sign Transaction',
    'eth_sign': 'Sign Message',
    'personal_sign': 'Personal Sign',
    'eth_signTypedData': 'Sign Typed Data',
    'eth_signTypedData_v4': 'Sign Typed Data (v4)',
    'wallet_switchEthereumChain': 'Switch Network',
    'wallet_addEthereumChain': 'Add Network'
  };
  
  return labels[method] || method;
}

/**
 * Estimate risk level of request
 */
export function estimateRequestRisk(
  method: WalletConnectMethod, 
  _params: unknown[]
): 'low' | 'medium' | 'high' {
  switch (method) {
    case 'eth_sendTransaction':
    case 'eth_signTransaction':
      return 'high';
    
    case 'eth_sign':
      return 'high';
    
    case 'personal_sign':
    case 'eth_signTypedData':
    case 'eth_signTypedData_v4':
      return 'medium';
    
    case 'wallet_switchEthereumChain':
    case 'wallet_addEthereumChain':
      return 'low';
    
    default:
      return 'medium';
  }
}

/**
 * React hook for WalletConnect integration
 */
export function useWalletConnect(account?: string, chainId?: number) {
  const [sessions, setSessions] = useState<WalletConnectSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<SessionProposal | null>(null);
  const [pendingRequest, setPendingRequest] = useState<WalletConnectRequest | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initWC = async () => {
      await walletConnect.init(account, chainId);
      setInitialized(walletConnect.isInitialized());
      setSessions(walletConnect.getSessions());
    };

    initWC();

    walletConnect.subscribeToSessionUpdates(() => {
      setSessions(walletConnect.getSessions());
    });

    walletConnect.onProposal((proposal) => {
      setPendingProposal(proposal);
    });

    walletConnect.onRequestReceived((request) => {
      setPendingRequest(request);
    });
  }, [account, chainId]);

  useEffect(() => {
    if (account) walletConnect.setAccount(account);
    if (chainId) walletConnect.setChainId(chainId);
  }, [account, chainId]);

  const connect = useCallback(async (uri: string) => {
    setLoading(true);
    try {
      const session = await walletConnect.connect(uri);
      setSessions(walletConnect.getSessions());
      return session;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveProposal = useCallback(async (accounts: string[]) => {
    if (!pendingProposal) return null;
    
    setLoading(true);
    try {
      const session = await walletConnect.approveSession(pendingProposal, accounts);
      setPendingProposal(null);
      setSessions(walletConnect.getSessions());
      return session;
    } finally {
      setLoading(false);
    }
  }, [pendingProposal]);

  const rejectProposal = useCallback(async (reason?: string) => {
    if (!pendingProposal) return;
    
    await walletConnect.rejectSession(pendingProposal.id, reason);
    setPendingProposal(null);
  }, [pendingProposal]);

  const approveRequest = useCallback(async (result: unknown) => {
    if (!pendingRequest) return;
    
    await walletConnect.respondToRequest(
      pendingRequest.id, 
      pendingRequest.topic, 
      result
    );
    setPendingRequest(null);
  }, [pendingRequest]);

  const rejectRequestAction = useCallback(async (message: string) => {
    if (!pendingRequest) return;
    
    await walletConnect.rejectRequest(
      pendingRequest.id, 
      pendingRequest.topic, 
      message
    );
    setPendingRequest(null);
  }, [pendingRequest]);

  const disconnect = useCallback(async (topic: string) => {
    await walletConnect.disconnect(topic);
    setSessions(walletConnect.getSessions());
  }, []);

  const updateSessionChain = useCallback(async (topic: string, accounts: string[], newChainId: number) => {
    await walletConnect.updateSession(topic, accounts, newChainId);
    setSessions(walletConnect.getSessions());
  }, []);

  return {
    sessions,
    loading,
    initialized,
    pendingProposal,
    pendingRequest,
    connect,
    disconnect,
    approveProposal,
    rejectProposal,
    approveRequest,
    rejectRequest: rejectRequestAction,
    updateSessionChain,
    generateQR: generateWalletConnectQR
  };
}