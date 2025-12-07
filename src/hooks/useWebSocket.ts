// Generic WebSocket hook for real-time updates
import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '../services/logger.service';
import { useAuth } from '../contexts/AuthContext';

export interface UseWebSocketOptions {
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { session } = useAuth();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!session?.access_token) {
      setError(new Error('Not authenticated'));
      return;
    }

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:3001';
      const ws = new WebSocket(`${wsUrl}/ws?token=${session.access_token}`);
      
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        options.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          options.onMessage?.(data);
        } catch (err) {
          logger.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        const error = new Error('WebSocket connection error');
        setError(error);
        options.onError?.(error);
      };

      ws.onclose = () => {
        setConnected(false);
        options.onDisconnect?.();
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts && options.autoConnect !== false) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 1000 * reconnectAttempts.current);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError(new Error('Failed to connect after multiple attempts'));
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create WebSocket');
      setError(error);
      options.onError?.(error);
    }
  }, [session?.access_token, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (!wsRef.current || !connected) {
      logger.warn('WebSocket not connected, message not sent:', message);
      return;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
    } catch (err) {
      logger.error('Error sending WebSocket message:', err);
      setError(err instanceof Error ? err : new Error('Failed to send message'));
    }
  }, [connected]);

  useEffect(() => {
    if (session?.access_token && (options.autoConnect !== false)) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session?.access_token, connect, disconnect, options.autoConnect]);

  return {
    connected,
    error,
    sendMessage,
    connect,
    disconnect,
  };
}

