import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// ============================================================================
// TYPES
// ============================================================================

interface SystemStatus {
  running: boolean;
  autoSnipe: boolean;
  mempoolConnected: boolean;
  pendingSnipes: number;
  openPositions: number;
  trackedWallets: number;
}

interface Stats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  winRate: number;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  avgLatencyMs: number;
  fastestSnipeMs: number;
}

interface Position {
  id: string;
  token: string;
  tokenInfo: { symbol: string; name: string };
  currentBalance: string;
  currentValueUSD: number;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
  entryTimestamp: number;
  entryPrice: number;
  currentPrice: number;
}

interface WhaleTx {
  id: string;
  walletAddress: string;
  type: 'BUY' | 'SELL';
  tokenInfo: { symbol: string; name: string };
  valueUSD: number;
  timestamp: number;
}

interface Alert {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: number;
}

interface Wallet {
  id: string;
  name: string;
  address: string;
  ethBalance: string;
}

interface TokenAnalysis {
  token: string;
  score: number;
  riskLevel: string;
  flags: Array<{ type: string; severity: string; message: string }>;
  honeypotTest: {
    isHoneypot: boolean;
    buyTax: number;
    sellTax: number;
  };
  contractAnalysis: {
    verified: boolean;
    hasBlacklist: boolean;
    hasPauseFunction: boolean;
    hasMintFunction: boolean;
  };
  liquidityAnalysis: {
    totalLiquidityUSD: number;
    isLocked: boolean;
  };
}

// ============================================================================
// STORE
// ============================================================================

interface AppState {
  // Connection
  socket: Socket | null;
  connected: boolean;
  
  // System
  status: SystemStatus;
  stats: Stats;
  
  // Data
  positions: Position[];
  whaleTransactions: WhaleTx[];
  alerts: Alert[];
  wallets: Wallet[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  fetchInitialData: () => Promise<void>;
  toggleSystem: () => Promise<void>;
  
  // Trading
  buyToken: (token: string, amount: string, walletId: string, options?: any) => Promise<any>;
  sellToken: (token: string, amount: string, walletId: string, options?: any) => Promise<any>;
  analyzeToken: (token: string) => Promise<TokenAnalysis>;
  
  // Setters
  setStatus: (status: SystemStatus) => void;
  setStats: (stats: Stats) => void;
  setPositions: (positions: Position[]) => void;
  addAlert: (alert: Alert) => void;
  clearError: () => void;
}

const API_BASE = '/api';

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  socket: null,
  connected: false,
  
  status: {
    running: false,
    autoSnipe: false,
    mempoolConnected: false,
    pendingSnipes: 0,
    openPositions: 0,
    trackedWallets: 0,
  },
  
  stats: {
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    winRate: 0,
    totalPnL: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    avgLatencyMs: 0,
    fastestSnipeMs: 0,
  },
  
  positions: [],
  whaleTransactions: [],
  alerts: [],
  wallets: [],
  
  isLoading: false,
  error: null,
  
  // Connection
  connect: () => {
    // Use environment variable or fallback to origin-based URL for production
    const wsUrl = import.meta.env.VITE_WS_URL || 
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
    const socket = io(wsUrl);
    
    socket.on('connect', () => {
      console.log('Connected to server');
      set({ connected: true });
      socket.emit('subscribe', ['all']);
    });
    
    socket.on('disconnect', () => {
      set({ connected: false });
    });
    
    socket.on('state', (data) => {
      if (data.status) set({ status: data.status });
      if (data.stats) set({ stats: data.stats });
      if (data.positions) set({ positions: data.positions });
    });
    
    socket.on('message', (data) => {
      const { type, payload } = data;
      
      switch (type) {
        case 'STATS_UPDATE':
          set({ stats: payload });
          break;
        case 'POSITION_OPENED':
        case 'POSITION_UPDATED':
          set((state) => {
            const idx = state.positions.findIndex(p => p.id === payload.id);
            if (idx >= 0) {
              const updated = [...state.positions];
              updated[idx] = payload;
              return { positions: updated };
            }
            return { positions: [payload, ...state.positions] };
          });
          break;
        case 'POSITION_CLOSED':
          set((state) => ({
            positions: state.positions.filter(p => p.id !== payload.id)
          }));
          break;
        case 'WHALE_ALERT':
          set((state) => ({
            whaleTransactions: [payload, ...state.whaleTransactions].slice(0, 50)
          }));
          break;
        case 'ALERT':
          get().addAlert(payload);
          break;
      }
    });
    
    set({ socket });
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, connected: false });
    }
  },
  
  // Data Fetching
  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const [statusRes, statsRes, positionsRes, walletsRes] = await Promise.all([
        fetch(`${API_BASE}/status`),
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/positions/open`),
        fetch(`${API_BASE}/wallets`),
      ]);
      
      const statusData = await statusRes.json();
      const statsData = await statsRes.json();
      const positionsData = await positionsRes.json();
      const walletsData = await walletsRes.json();
      
      set({
        status: statusData.success ? statusData.data : get().status,
        stats: statsData.success ? statsData.data : get().stats,
        positions: positionsData.success ? positionsData.data : [],
        wallets: walletsData.success ? walletsData.data : [],
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        isLoading: false 
      });
    }
  },
  
  toggleSystem: async () => {
    const { status } = get();
    const endpoint = status.running ? `${API_BASE}/stop` : `${API_BASE}/start`;
    
    try {
      await fetch(endpoint, { method: 'POST' });
      set((state) => ({
        status: { ...state.status, running: !state.status.running }
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  
  // Trading
  buyToken: async (token, amount, walletId, options = {}) => {
    const res = await fetch(`${API_BASE}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        amount,
        walletId,
        slippage: options.slippage || 10,
        safetyCheck: options.safetyCheck !== false,
        ...options,
      }),
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },
  
  sellToken: async (token, amount, walletId, options = {}) => {
    const res = await fetch(`${API_BASE}/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        amount,
        walletId,
        slippage: options.slippage || 15,
        isPercent: options.isPercent || false,
        ...options,
      }),
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },
  
  analyzeToken: async (token) => {
    const res = await fetch(`${API_BASE}/analyze/${token}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },
  
  // Setters
  setStatus: (status) => set({ status }),
  setStats: (stats) => set({ stats }),
  setPositions: (positions) => set({ positions }),
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 100)
  })),
  
  clearError: () => set({ error: null }),
}));
