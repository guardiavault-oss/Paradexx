/**
 * useWebSocketPrices - Hook for real-time price updates via WebSocket
 * Connects to backend WebSocket for live price feeds
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// @ts-ignore - Vite env types
const WS_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) || 'ws://localhost:3001';

export interface PriceUpdate {
    symbol: string;
    price: number;
    change24h: number;
    timestamp: number;
}

export interface WebSocketMessage {
    type: 'price' | 'transaction' | 'balance' | 'error' | 'connected';
    data: any;
}

export function useWebSocketPrices(symbols: string[] = ['ETH', 'BTC', 'USDC']) {
    const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const queryClient = useQueryClient();

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(`${WS_URL}/ws/prices`);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
                console.log('[WebSocket] Connected to price feed');

                // Subscribe to symbols
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    symbols,
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);

                    switch (message.type) {
                        case 'price':
                            const update = message.data as PriceUpdate;
                            setPrices(prev => ({
                                ...prev,
                                [update.symbol]: update,
                            }));

                            // Invalidate related queries to trigger refetch
                            queryClient.invalidateQueries({
                                queryKey: ['prices'],
                                refetchType: 'none', // Don't auto-refetch, just mark stale
                            });
                            break;

                        case 'balance':
                            // Balance update - invalidate token queries
                            queryClient.invalidateQueries({ queryKey: ['tokens'] });
                            break;

                        case 'transaction':
                            // Transaction update - invalidate transaction queries
                            queryClient.invalidateQueries({ queryKey: ['transactions'] });
                            break;

                        case 'connected':
                            console.log('[WebSocket] Confirmed connected');
                            break;

                        case 'error':
                            setError(message.data?.message || 'WebSocket error');
                            break;
                    }
                } catch (err) {
                    console.error('[WebSocket] Message parse error:', err);
                }
            };

            ws.onerror = (event) => {
                console.error('[WebSocket] Error:', event);
                setError('WebSocket connection error');
            };

            ws.onclose = (event) => {
                setIsConnected(false);
                console.log('[WebSocket] Disconnected:', event.code, event.reason);

                // Attempt reconnection after 5 seconds
                if (!reconnectTimeoutRef.current) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectTimeoutRef.current = null;
                        connect();
                    }, 5000);
                }
            };
        } catch (err) {
            console.error('[WebSocket] Connection error:', err);
            setError('Failed to connect to WebSocket');
        }
    }, [symbols, queryClient]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const subscribe = useCallback((newSymbols: string[]) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'subscribe',
                symbols: newSymbols,
            }));
        }
    }, []);

    const unsubscribe = useCallback((symbolsToRemove: string[]) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'unsubscribe',
                symbols: symbolsToRemove,
            }));
        }
    }, []);

    // Connect on mount
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    // Re-subscribe when symbols change
    useEffect(() => {
        if (isConnected) {
            subscribe(symbols);
        }
    }, [symbols, isConnected, subscribe]);

    return {
        prices,
        isConnected,
        error,
        subscribe,
        unsubscribe,
        reconnect: connect,
    };
}

// Hook for subscribing to wallet-specific updates
export function useWalletWebSocket(walletAddress: string | undefined) {
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!walletAddress) return;

        try {
            const ws = new WebSocket(`${WS_URL}/ws/wallet/${walletAddress}`);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[WalletWS] Connected for', walletAddress);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    setLastUpdate(new Date());

                    switch (message.type) {
                        case 'balance_update':
                            queryClient.invalidateQueries({ queryKey: ['tokens', walletAddress] });
                            queryClient.invalidateQueries({ queryKey: ['dashboard', walletAddress] });
                            break;

                        case 'transaction_pending':
                        case 'transaction_confirmed':
                        case 'transaction_failed':
                            queryClient.invalidateQueries({ queryKey: ['transactions', walletAddress] });
                            queryClient.invalidateQueries({ queryKey: ['dashboard', walletAddress] });
                            break;

                        case 'swap_completed':
                            queryClient.invalidateQueries({ queryKey: ['tokens', walletAddress] });
                            queryClient.invalidateQueries({ queryKey: ['transactions', walletAddress] });
                            break;
                    }
                } catch (err) {
                    console.error('[WalletWS] Message error:', err);
                }
            };

            ws.onclose = () => {
                console.log('[WalletWS] Disconnected');
            };

            return () => {
                ws.close();
            };
        } catch (err) {
            console.error('[WalletWS] Connection error:', err);
        }
    }, [walletAddress, queryClient]);

    return { lastUpdate };
}

export default useWebSocketPrices;
