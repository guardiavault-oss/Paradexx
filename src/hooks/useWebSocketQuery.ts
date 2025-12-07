import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface UseWebSocketQueryOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocketQuery(options: UseWebSocketQueryOptions = {}) {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
  } = options;

  const { session } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = () => {
    if (!session?.access_token) {
      const err = new Error('Not authenticated');
      setError(err);
      onError?.(err);
      return;
    }

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 
        import.meta.env.VITE_API_URL?.replace('http', 'ws') || 
        'ws://localhost:8000';
      
      const ws = new WebSocket(`${wsUrl}/ws?token=${session.access_token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle different message types and invalidate relevant queries
          switch (message.type) {
            case 'transaction_update':
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              break;
            case 'wallet_update':
              queryClient.invalidateQueries({ queryKey: ['wallet'] });
              break;
            case 'mev_update':
              queryClient.invalidateQueries({ queryKey: ['mev'] });
              break;
            case 'notification':
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              break;
            case 'bridge_update':
              queryClient.invalidateQueries({ queryKey: ['bridge'] });
              break;
            case 'threat_detected':
              queryClient.invalidateQueries({ queryKey: ['mev', 'mempool-threats'] });
              break;
            default:
              // Generic invalidation for unknown types
              queryClient.invalidateQueries();
          }
          
          onMessage?.(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        const err = new Error('WebSocket connection error');
        setError(err);
        onError?.(err);
      };

      ws.onclose = () => {
        setConnected(false);
        onDisconnect?.();
        
        // Attempt to reconnect
        if (
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          autoConnect
        ) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectAttemptsRef.current);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError(new Error('Failed to connect after multiple attempts'));
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  };

  const send = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket is not connected');
    }
  };

  useEffect(() => {
    if (autoConnect && session?.access_token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session?.access_token, autoConnect]);

  return {
    connected,
    error,
    connect,
    disconnect,
    send,
  };
}

