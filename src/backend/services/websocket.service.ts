// WebSocket Service - Real-time updates

import { Server as HTTPServer } from 'http';
import { logger } from '../services/logger.service';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

export interface WebSocketClient {
  id: string;
  userId: string;
  ws: WebSocket;
  subscriptions: Set<string>;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export class RealtimeService {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient>;
  private userClients: Map<string, Set<string>>; // userId -> clientIds

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.clients = new Map();
    this.userClients = new Map();

    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    logger.info('✅ WebSocket server started on /ws');
  }

  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = this.generateClientId();

    // Parse token from query string
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    // Verify JWT token
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      ws.close(1008, 'Invalid token');
      return;
    }

    // Create client
    const client: WebSocketClient = {
      id: clientId,
      userId,
      ws,
      subscriptions: new Set(),
    };

    // Store client
    this.clients.set(clientId, client);

    // Track user clients
    if (!this.userClients.has(userId)) {
      this.userClients.set(userId, new Set());
    }
    this.userClients.get(userId)!.add(clientId);

    logger.info(`WebSocket client connected: ${clientId} (user: ${userId})`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      data: { clientId, userId },
      timestamp: Date.now(),
    });

    // Handle messages
    ws.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    // Handle close
    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
    });
  }

  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, message.channel);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(clientId, message.channel);
          break;

        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            data: {},
            timestamp: Date.now(),
          });
          break;

        case 'ai_chat':
          await this.handleAIChat(clientId, message);
          break;

        case 'init':
          // Session initialization
          if (message.sessionId) {
            this.sendToClient(clientId, {
              type: 'session_initialized',
              data: { sessionId: message.sessionId },
              timestamp: Date.now(),
            });
          }
          break;

        case 'subscribe_mempool':
          await this.handleMempoolSubscription(clientId, message);
          break;

        case 'unsubscribe_mempool':
          this.handleUnsubscribe(clientId, 'mempool');
          break;

        default:
          logger.info(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message:', error);
    }
  }

  private async handleMempoolSubscription(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.add('mempool');

    // Start sending mempool updates
    const { unifiedMempoolService } = await import('./unified-mempool.service');

    // Send initial stats
    try {
      const stats = await unifiedMempoolService.getUnifiedStats();
      this.sendToClient(clientId, {
        type: 'mempool_stats_update',
        data: stats,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Failed to get initial mempool stats:', error);
    }

    // Set up periodic updates (every 10 seconds)
    const updateInterval = setInterval(async () => {
      if (!client.subscriptions.has('mempool')) {
        clearInterval(updateInterval);
        return;
      }

      try {
        const stats = await unifiedMempoolService.getUnifiedStats();
        this.sendToClient(clientId, {
          type: 'mempool_stats_update',
          data: stats,
          timestamp: Date.now(),
        });

        // Send recent threats if any
        const threats = await unifiedMempoolService.getThreats({ limit: 5 });
        if (threats.length > 0) {
          threats.forEach(threat => {
            this.sendToClient(clientId, {
              type: threat.type === 'sandwich' ? 'sandwich_detected' : 'mempool_threat',
              data: threat,
              timestamp: Date.now(),
            });
          });
        }
      } catch (error) {
        // Silently fail - service may be offline
      }
    }, 10000);

    this.sendToClient(clientId, {
      type: 'subscribed',
      data: { channel: 'mempool' },
      timestamp: Date.now(),
    });
  }

  private async handleAIChat(clientId: string, message: any): Promise<void> {
    try {
      const { scarlettAI } = await import('./scarlett-ai.service');

      const response = await scarlettAI.chat({
        message: message.message || message.content,
        conversation_history: message.conversation_history || [],
        blockchain_focus: message.blockchain_focus,
        context: {
          ...message.context,
          user_id: this.clients.get(clientId)?.userId || 'anonymous',
          session_id: message.sessionId,
        },
      });

      this.sendToClient(clientId, {
        type: 'ai_chat_response',
        data: {
          message: response.response,
          sessionId: (response as any).conversationId || message.sessionId,
          intent: response.intent,
          knowledge_used: response.knowledge_used,
          blockchain_context: response.blockchain_context,
        },
        timestamp: Date.now(),
      });
    } catch (error: any) {
      logger.error('AI chat error:', error);
      this.sendToClient(clientId, {
        type: 'ai_chat_error',
        data: {
          error: error.message || 'Failed to process chat message',
        },
        timestamp: Date.now(),
      });
    }
  }

  private handleSubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.add(channel);
    logger.info(`Client ${clientId} subscribed to ${channel}`);

    this.sendToClient(clientId, {
      type: 'subscribed',
      data: { channel },
      timestamp: Date.now(),
    });
  }

  private handleUnsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.delete(channel);
    logger.info(`Client ${clientId} unsubscribed from ${channel}`);

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      data: { channel },
      timestamp: Date.now(),
    });
  }

  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from user clients
    const userClientSet = this.userClients.get(client.userId);
    if (userClientSet) {
      userClientSet.delete(clientId);
      if (userClientSet.size === 0) {
        this.userClients.delete(client.userId);
      }
    }

    // Remove client
    this.clients.delete(clientId);

    logger.info(`WebSocket client disconnected: ${clientId}`);
  }

  // Send message to specific client
  sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error(`Error sending message to client ${clientId}:`, error);
    }
  }

  // Send message to user (all their clients)
  sendToUser(userId: string, message: WebSocketMessage): void {
    const clientIds = this.userClients.get(userId);
    if (!clientIds) return;

    for (const clientId of clientIds) {
      this.sendToClient(clientId, message);
    }
  }

  // Broadcast to channel
  broadcastToChannel(channel: string, message: WebSocketMessage): void {
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(channel)) {
        this.sendToClient(client.id, message);
      }
    }
  }

  // Broadcast to all clients
  broadcast(message: WebSocketMessage): void {
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, message);
    }
  }

  // Get client count
  getClientCount(): number {
    return this.clients.size;
  }

  // Get user client count
  getUserClientCount(userId: string): number {
    return this.userClients.get(userId)?.size || 0;
  }

  // Generate unique client ID
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Shutdown
  async shutdown(): Promise<void> {
    for (const client of this.clients.values()) {
      client.ws.close();
    }

    this.clients.clear();
    this.userClients.clear();

    await new Promise<void>((resolve) => {
      this.wss.close(() => resolve());
    });

    logger.info('WebSocket server shut down');
  }
}

// WebSocket event types
export const WebSocketEvents = {
  // Price updates
  PRICE_UPDATE: 'price_update',
  GAS_UPDATE: 'gas_update',

  // Transaction events
  TX_PENDING: 'tx_pending',
  TX_CONFIRMED: 'tx_confirmed',
  TX_FAILED: 'tx_failed',

  // Token events
  TOKEN_LAUNCH: 'token_launch',
  WHALE_ALERT: 'whale_alert',
  RUG_DETECTED: 'rug_detected',

  // Balance updates
  BALANCE_UPDATE: 'balance_update',

  // Notifications
  NOTIFICATION: 'notification',

  // Guardian events
  GUARDIAN_REQUEST: 'guardian_request',
  RECOVERY_UPDATE: 'recovery_update',

  // Mempool events
  MEMPOOL_TX: 'mempool_tx',
  MEMPOOL_THREAT: 'mempool_threat',
  MEMPOOL_STATS_UPDATE: 'mempool_stats_update',
  SANDWICH_DETECTED: 'sandwich_detected',
  FRONTRUN_DETECTED: 'frontrun_detected',
};

// Channel names
export const WebSocketChannels = {
  // Global
  GLOBAL: 'global',

  // User-specific
  user: (userId: string) => `user:${userId}`,

  // Token-specific
  token: (address: string) => `token:${address.toLowerCase()}`,

  // Wallet-specific
  wallet: (address: string) => `wallet:${address.toLowerCase()}`,

  // Price feed
  prices: (chainId: number) => `prices:${chainId}`,

  // Gas prices
  gas: (chainId: number) => `gas:${chainId}`,

  // Whale alerts
  whales: 'whales',

  // Token launches
  launches: 'launches',
};

// Singleton will be initialized in server.ts
export let realtimeService: RealtimeService | null = null;
let initAttempted = false;

export function initializeRealtimeService(server: HTTPServer | null): void {
  if (initAttempted) return;
  initAttempted = true;

  if (!server) {
    logger.info('ℹ️  WebSocket server skipped - no HTTP server provided (optional)');
    return;
  }

  try {
    realtimeService = new RealtimeService(server);
  } catch (error: any) {
    logger.warn('⚠️  WebSocket server not available:', error.message || 'Configuration error');
    // WebSocket is optional - continue without it
  }
}
