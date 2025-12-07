import { getAuthToken, clearAuthTokens } from './api-client';
import { WebSocketMessage, TransactionUpdate, PriceUpdate } from '../types/api.types';

// WebSocket configuration
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export type WebSocketEventHandler = (data: any) => void;
export type WebSocketStatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnecting = false;
    private eventHandlers = new Map<string, Set<WebSocketEventHandler>>();
    private statusHandlers = new Set<WebSocketStatusHandler>();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private heartbeatTimeout: NodeJS.Timeout | null = null;

    // Connect to WebSocket
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            if (this.isConnecting) {
                // If already connecting, wait for connection
                const checkConnection = () => {
                    if (this.ws?.readyState === WebSocket.OPEN) {
                        resolve();
                    } else if (this.ws?.readyState === WebSocket.CLOSED) {
                        reject(new Error('Connection failed'));
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };
                checkConnection();
                return;
            }

            this.isConnecting = true;
            this.notifyStatusHandlers('connecting');

            const token = getAuthToken();
            if (!token) {
                this.isConnecting = false;
                reject(new Error('No authentication token available'));
                return;
            }

            try {
                this.ws = new WebSocket(`${WS_BASE_URL}/ws?token=${token}`);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.notifyStatusHandlers('connected');
                    this.startHeartbeat();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: WebSocketMessage = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket disconnected:', event.code, event.reason);
                    this.isConnecting = false;
                    this.stopHeartbeat();
                    this.notifyStatusHandlers('disconnected');

                    // Attempt to reconnect if not a normal closure
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.attemptReconnect();
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnecting = false;
                    this.notifyStatusHandlers('error');
                    reject(error);
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    // Disconnect from WebSocket
    disconnect(): void {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    }

    // Subscribe to specific events
    subscribe(event: string, handler: WebSocketEventHandler): () => void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)!.add(handler);

        // Send subscription message to server
        this.send({ type: 'subscribe', event });

        // Return unsubscribe function
        return () => {
            const handlers = this.eventHandlers.get(event);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.eventHandlers.delete(event);
                    this.send({ type: 'unsubscribe', event });
                }
            }
        };
    }

    // Subscribe to status changes
    onStatusChange(handler: WebSocketStatusHandler): () => void {
        this.statusHandlers.add(handler);
        return () => {
            this.statusHandlers.delete(handler);
        };
    }

    // Send message to server
    send(message: any): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message:', message);
        }
    }

    // Handle incoming messages
    private handleMessage(message: WebSocketMessage): void {
        const handlers = this.eventHandlers.get(message.type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(message.data);
                } catch (error) {
                    console.error('Error in WebSocket event handler:', error);
                }
            });
        }

        // Handle special message types
        switch (message.type) {
            case 'pong':
                this.handlePong();
                break;
            case 'auth_required':
                this.handleAuthRequired();
                break;
            case 'auth_failed':
                this.handleAuthFailed();
                break;
        }
    }

    // Attempt to reconnect with exponential backoff
    private attemptReconnect(): void {
        if (this.isConnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }

    // Start heartbeat to keep connection alive
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'ping' });

            // Set timeout to detect if pong is received
            this.heartbeatTimeout = setTimeout(() => {
                console.warn('Heartbeat timeout, closing connection');
                this.ws?.close(1006, 'Heartbeat timeout');
            }, 5000);
        }, 30000); // Send ping every 30 seconds
    }

    // Stop heartbeat
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    // Handle pong response
    private handlePong(): void {
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    // Handle auth required message
    private handleAuthRequired(): void {
        const token = getAuthToken();
        if (token) {
            this.send({ type: 'auth', token });
        } else {
            console.error('Auth required but no token available');
            this.disconnect();
        }
    }

    // Handle auth failed message
    private handleAuthFailed(): void {
        console.error('WebSocket authentication failed');
        clearAuthTokens();
        window.location.href = '/login';
    }

    // Notify all status handlers
    private notifyStatusHandlers(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
        this.statusHandlers.forEach(handler => {
            try {
                handler(status);
            } catch (error) {
                console.error('Error in WebSocket status handler:', error);
            }
        });
    }

    // Get connection status
    get status(): 'connecting' | 'connected' | 'disconnected' | 'error' {
        if (this.isConnecting) return 'connecting';
        if (!this.ws) return 'disconnected';

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING:
            case WebSocket.CLOSED: return 'disconnected';
            default: return 'error';
        }
    }
}

// Create singleton instance
export const wsService = new WebSocketService();

// Convenience functions for common subscriptions
export const subscribeToTransactions = (handler: (tx: TransactionUpdate['data']) => void) => {
    return wsService.subscribe('transaction', handler);
};

export const subscribeToPriceUpdates = (handler: (price: PriceUpdate['data']) => void) => {
    return wsService.subscribe('price_update', handler);
};

export const subscribeToSecurityAlerts = (handler: (alert: any) => void) => {
    return wsService.subscribe('security_alert', handler);
};

export const subscribeToNotifications = (handler: (notification: any) => void) => {
    return wsService.subscribe('notification', handler);
};

export const subscribeToTradeExecuted = (handler: (trade: any) => void) => {
    return wsService.subscribe('trade_executed', handler);
};

// Initialize WebSocket connection
export const initializeWebSocket = async (): Promise<void> => {
    try {
        await wsService.connect();
    } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        throw error;
    }
};

export default wsService;
