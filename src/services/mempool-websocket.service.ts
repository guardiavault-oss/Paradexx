/**
 * Mempool WebSocket Service
 * Real-time mempool monitoring via WebSocket
 */

import { SERVICE_ENDPOINTS } from './config';

// Convert HTTP/HTTPS URL to WebSocket URL
const getWebSocketUrl = (httpUrl: string): string => {
    if (httpUrl.startsWith('https://')) {
        return httpUrl.replace('https://', 'wss://');
    }
    return httpUrl.replace('http://', 'ws://');
};

const MEMPOOL_WS_BASE = getWebSocketUrl(SERVICE_ENDPOINTS.MEMPOOL_API);

export type MempoolWebSocketEventHandler = (data: unknown) => void;
export type MempoolWebSocketStatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

class MempoolWebSocketService {
    private wsTransactions: WebSocket | null = null;
    private wsAlerts: WebSocket | null = null;
    private wsDashboard: WebSocket | null = null;
    
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    
    private transactionHandlers = new Set<MempoolWebSocketEventHandler>();
    private alertHandlers = new Set<MempoolWebSocketEventHandler>();
    private dashboardHandlers = new Set<MempoolWebSocketEventHandler>();
    private statusHandlers = new Set<MempoolWebSocketStatusHandler>();

    /**
     * Connect to transactions stream
     */
    connectTransactions(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.wsTransactions?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            try {
                this.wsTransactions = new WebSocket(`${MEMPOOL_WS_BASE}/api/v1/stream/transactions`);

                this.wsTransactions.onopen = () => {
                    console.log('Mempool transactions WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.notifyStatusHandlers('connected');
                    resolve();
                };

                this.wsTransactions.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.type === 'transactions') {
                            this.transactionHandlers.forEach(handler => {
                                try {
                                    handler(message.data);
                                } catch (error) {
                                    console.error('Error in transaction handler:', error);
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Failed to parse mempool transaction message:', error);
                    }
                };

                this.wsTransactions.onclose = (event) => {
                    console.log('Mempool transactions WebSocket disconnected:', event.code);
                    this.notifyStatusHandlers('disconnected');
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.attemptReconnect('transactions');
                    }
                };

                this.wsTransactions.onerror = (error) => {
                    console.error('Mempool transactions WebSocket error:', error);
                    this.notifyStatusHandlers('error');
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Connect to alerts stream
     */
    connectAlerts(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.wsAlerts?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            try {
                this.wsAlerts = new WebSocket(`${MEMPOOL_WS_BASE}/api/v1/stream/alerts`);

                this.wsAlerts.onopen = () => {
                    console.log('Mempool alerts WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.notifyStatusHandlers('connected');
                    resolve();
                };

                this.wsAlerts.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.type === 'alerts') {
                            this.alertHandlers.forEach(handler => {
                                try {
                                    handler(message.data);
                                } catch (error) {
                                    console.error('Error in alert handler:', error);
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Failed to parse mempool alert message:', error);
                    }
                };

                this.wsAlerts.onclose = (event) => {
                    console.log('Mempool alerts WebSocket disconnected:', event.code);
                    this.notifyStatusHandlers('disconnected');
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.attemptReconnect('alerts');
                    }
                };

                this.wsAlerts.onerror = (error) => {
                    console.error('Mempool alerts WebSocket error:', error);
                    this.notifyStatusHandlers('error');
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Connect to dashboard stream
     */
    connectDashboard(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.wsDashboard?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            try {
                this.wsDashboard = new WebSocket(`${MEMPOOL_WS_BASE}/api/v1/stream/dashboard`);

                this.wsDashboard.onopen = () => {
                    console.log('Mempool dashboard WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.notifyStatusHandlers('connected');
                    resolve();
                };

                this.wsDashboard.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.type === 'dashboard') {
                            this.dashboardHandlers.forEach(handler => {
                                try {
                                    handler(message.data);
                                } catch (error) {
                                    console.error('Error in dashboard handler:', error);
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Failed to parse mempool dashboard message:', error);
                    }
                };

                this.wsDashboard.onclose = (event) => {
                    console.log('Mempool dashboard WebSocket disconnected:', event.code);
                    this.notifyStatusHandlers('disconnected');
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.attemptReconnect('dashboard');
                    }
                };

                this.wsDashboard.onerror = (error) => {
                    console.error('Mempool dashboard WebSocket error:', error);
                    this.notifyStatusHandlers('error');
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Subscribe to transaction updates
     */
    subscribeToTransactions(handler: MempoolWebSocketEventHandler): () => void {
        this.transactionHandlers.add(handler);
        if (this.wsTransactions?.readyState !== WebSocket.OPEN) {
            this.connectTransactions().catch(console.error);
        }
        return () => {
            this.transactionHandlers.delete(handler);
        };
    }

    /**
     * Subscribe to alerts
     */
    subscribeToAlerts(handler: MempoolWebSocketEventHandler): () => void {
        this.alertHandlers.add(handler);
        if (this.wsAlerts?.readyState !== WebSocket.OPEN) {
            this.connectAlerts().catch(console.error);
        }
        return () => {
            this.alertHandlers.delete(handler);
        };
    }

    /**
     * Subscribe to dashboard updates
     */
    subscribeToDashboard(handler: MempoolWebSocketEventHandler): () => void {
        this.dashboardHandlers.add(handler);
        if (this.wsDashboard?.readyState !== WebSocket.OPEN) {
            this.connectDashboard().catch(console.error);
        }
        return () => {
            this.dashboardHandlers.delete(handler);
        };
    }

    /**
     * Subscribe to status changes
     */
    onStatusChange(handler: MempoolWebSocketStatusHandler): () => void {
        this.statusHandlers.add(handler);
        return () => {
            this.statusHandlers.delete(handler);
        };
    }

    /**
     * Disconnect all connections
     */
    disconnect(): void {
        if (this.wsTransactions) {
            this.wsTransactions.close(1000, 'Client disconnect');
            this.wsTransactions = null;
        }
        if (this.wsAlerts) {
            this.wsAlerts.close(1000, 'Client disconnect');
            this.wsAlerts = null;
        }
        if (this.wsDashboard) {
            this.wsDashboard.close(1000, 'Client disconnect');
            this.wsDashboard = null;
        }
        this.reconnectAttempts = this.maxReconnectAttempts;
    }

    /**
     * Attempt to reconnect
     */
    private attemptReconnect(type: 'transactions' | 'alerts' | 'dashboard'): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Attempting to reconnect ${type} in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            switch (type) {
                case 'transactions':
                    this.connectTransactions().catch(console.error);
                    break;
                case 'alerts':
                    this.connectAlerts().catch(console.error);
                    break;
                case 'dashboard':
                    this.connectDashboard().catch(console.error);
                    break;
            }
        }, delay);
    }

    /**
     * Notify all status handlers
     */
    private notifyStatusHandlers(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
        this.statusHandlers.forEach(handler => {
            try {
                handler(status);
            } catch (error) {
                console.error('Error in status handler:', error);
            }
        });
    }

    /**
     * Get connection status
     */
    get status(): 'connecting' | 'connected' | 'disconnected' | 'error' {
        const transactionsStatus = this.wsTransactions?.readyState;
        const alertsStatus = this.wsAlerts?.readyState;
        const dashboardStatus = this.wsDashboard?.readyState;

        if (transactionsStatus === WebSocket.CONNECTING || alertsStatus === WebSocket.CONNECTING || dashboardStatus === WebSocket.CONNECTING) {
            return 'connecting';
        }
        if (transactionsStatus === WebSocket.OPEN || alertsStatus === WebSocket.OPEN || dashboardStatus === WebSocket.OPEN) {
            return 'connected';
        }
        return 'disconnected';
    }
}

// Create singleton instance
export const mempoolWsService = new MempoolWebSocketService();

// Convenience functions
export const subscribeToMempoolTransactions = (handler: (data: unknown) => void) => {
    return mempoolWsService.subscribeToTransactions(handler);
};

export const subscribeToMempoolAlerts = (handler: (data: unknown) => void) => {
    return mempoolWsService.subscribeToAlerts(handler);
};

export const subscribeToMempoolDashboard = (handler: (data: unknown) => void) => {
    return mempoolWsService.subscribeToDashboard(handler);
};

export default mempoolWsService;

