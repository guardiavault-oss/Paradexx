/**
 * WebSocket Manager with comprehensive edge case handling
 * - Exponential backoff reconnection
 * - Heartbeat/ping-pong for stale connection detection
 * - Event deduplication
 * - Connection state management
 * - Token refresh on expiry
 * - Missed event backfill
 */

export type ConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'disconnected' 
  | 'error'
  | 'stale';

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  enableBackfill?: boolean;
  onMessage?: (data: any) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onReconnect?: () => void;
  getAuthToken?: () => Promise<string | null>;
}

export interface WebSocketStats {
  messagesReceived: number;
  messagesSent: number;
  reconnectAttempts: number;
  lastHeartbeat: Date | null;
  connectionTime: Date | null;
  duplicatesDropped: number;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private lastHeartbeatReceived: Date | null = null;
  private messageBuffer: Set<string> = new Set(); // For deduplication
  private stats: WebSocketStats = {
    messagesReceived: 0,
    messagesSent: 0,
    reconnectAttempts: 0,
    lastHeartbeat: null,
    connectionTime: null,
    duplicatesDropped: 0,
  };
  private eventBuffer: any[] = []; // Buffer events during disconnect
  private lastEventId: string | null = null; // For backfill requests

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000, // 30 seconds
      heartbeatTimeout: 10000, // 10 seconds
      enableBackfill: true,
      onMessage: () => {},
      onStatusChange: () => {},
      onReconnect: () => {},
      getAuthToken: async () => null,
      ...config,
    };
  }

  /**
   * Connect to WebSocket with authentication
   */
  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    this.updateStatus('connecting');

    try {
      // Get auth token if available
      const token = await this.config.getAuthToken();
      const url = token 
        ? `${this.config.url}?token=${token}`
        : this.config.url;

      this.ws = new WebSocket(url, this.config.protocols);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.clearTimeouts();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateStatus('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Send message through WebSocket
   */
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);
      this.ws.send(message);
      this.stats.messagesSent++;
      return true;
    }
    
    console.warn('WebSocket not connected, cannot send message');
    return false;
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get connection statistics
   */
  getStats(): WebSocketStats {
    return { ...this.stats };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.status === 'connected';
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.updateStatus('connected');
      this.reconnectAttempts = 0;
      this.stats.connectionTime = new Date();
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Request backfill if we have a last event ID and backfill is enabled
      if (this.config.enableBackfill && this.lastEventId) {
        this.requestBackfill(this.lastEventId);
      }
      
      // Notify reconnection
      if (this.stats.reconnectAttempts > 0) {
        this.config.onReconnect();
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('error');
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.clearTimeouts();

      // Normal closure
      if (event.code === 1000) {
        this.updateStatus('disconnected');
        return;
      }

      // Abnormal closure - attempt reconnect
      this.handleReconnect();
    };
  }

  /**
   * Handle incoming message with deduplication
   */
  private handleMessage(data: any) {
    this.stats.messagesReceived++;

    // Handle heartbeat response
    if (data.type === 'pong' || data.type === 'heartbeat') {
      this.lastHeartbeatReceived = new Date();
      this.stats.lastHeartbeat = new Date();
      
      // Reset heartbeat timeout
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = null;
      }
      
      // If connection was stale, restore to connected
      if (this.status === 'stale') {
        this.updateStatus('connected');
      }
      
      return;
    }

    // Deduplication using event ID
    if (data.id) {
      const eventKey = `${data.id}_${data.timestamp}`;
      
      if (this.messageBuffer.has(eventKey)) {
        this.stats.duplicatesDropped++;
        console.log('Duplicate event dropped:', eventKey);
        return;
      }
      
      this.messageBuffer.add(eventKey);
      this.lastEventId = data.id;
      
      // Limit buffer size to prevent memory leak
      if (this.messageBuffer.size > 1000) {
        const firstItem = this.messageBuffer.values().next().value;
        this.messageBuffer.delete(firstItem);
      }
    }

    // Handle backfill response
    if (data.type === 'backfill') {
      console.log('Received backfill data:', data.events?.length || 0, 'events');
      if (data.events && Array.isArray(data.events)) {
        data.events.forEach((event: any) => this.config.onMessage(event));
      }
      return;
    }

    // Pass message to handler
    this.config.onMessage(data);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send ping
        this.send({ type: 'ping', timestamp: Date.now() });
        
        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - connection may be stale');
          this.updateStatus('stale');
          
          // If still no response after another interval, reconnect
          setTimeout(() => {
            if (this.status === 'stale') {
              console.error('Connection unresponsive, forcing reconnect');
              this.ws?.close();
            }
          }, this.config.heartbeatTimeout);
        }, this.config.heartbeatTimeout);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateStatus('error');
      return;
    }

    this.updateStatus('reconnecting');
    this.reconnectAttempts++;
    this.stats.reconnectAttempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s...
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      60000 // Cap at 60 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(async () => {
      // Check if token needs refresh before reconnecting
      try {
        const token = await this.config.getAuthToken();
        if (token) {
          console.log('Token refreshed before reconnection');
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }

      this.connect();
    }, delay);
  }

  /**
   * Request backfill of missed events
   */
  private requestBackfill(lastEventId: string) {
    console.log('Requesting backfill from event:', lastEventId);
    this.send({
      type: 'backfill_request',
      last_event_id: lastEventId,
      timestamp: Date.now(),
    });
  }

  /**
   * Update connection status
   */
  private updateStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.config.onStatusChange(status);
    }
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }
}

/**
 * React Hook for WebSocket management
 */
export function useWebSocket(config: WebSocketConfig) {
  const managerRef = { current: null as WebSocketManager | null };
  
  if (!managerRef.current) {
    managerRef.current = new WebSocketManager(config);
  }

  return managerRef.current;
}
