// WebSocket hook for real-time Scarlette AI chat
import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '../services/logger.service';
import { useAuth } from '../contexts/AuthContext';

export interface ScarletteMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId?: string;
}

export interface UseScarletteWebSocketOptions {
  sessionId?: string;
  onMessage?: (message: ScarletteMessage) => void;
  onError?: (error: Error) => void;
}

export function useScarletteWebSocket(options: UseScarletteWebSocketOptions = {}) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ScarletteMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
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
      // Connect to Scarlette WebSocket endpoint
      // Get API URL from environment or use default
      const getApiUrl = (): string => {
        if (import.meta.env.VITE_SCARLETTE_API_URL) {
          return import.meta.env.VITE_SCARLETTE_API_URL;
        }
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:8000';
        }
        return `${window.location.protocol}//${window.location.hostname}:8000`;
      };

      const apiUrl = getApiUrl();
      const wsUrl = apiUrl.replace('http', 'ws').replace('https', 'wss');
      // Correct WebSocket endpoint is /ws (not /api/scarlette/ws)
      const ws = new WebSocket(`${wsUrl}/ws`);
      
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        logger.info('Scarlette WebSocket connected');
        
        // Send ping to verify connection (Scarlette API expects 'ping' type)
        ws.send(JSON.stringify({
          type: 'ping',
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'chat_response') {
            const message: ScarletteMessage = {
              id: `msg_${Date.now()}_${Math.random()}`,
              role: 'assistant',
              content: data.response || data.message || '',
              timestamp: new Date(),
              sessionId: data.session_id || options.sessionId,
            };
            
            setMessages((prev) => [...prev, message]);
            options.onMessage?.(message);
          } else if (data.type === 'error') {
            const error = new Error(data.message || 'WebSocket error');
            setError(error);
            options.onError?.(error);
          }
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
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 1000 * reconnectAttempts.current); // Exponential backoff
        } else {
          setError(new Error('Failed to connect after multiple attempts'));
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create WebSocket');
      setError(error);
      options.onError?.(error);
    }
  }, [session?.access_token, options.sessionId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const sendMessage = useCallback((message: string, context?: Record<string, any>) => {
    if (!wsRef.current || !isConnected) {
      throw new Error('WebSocket not connected');
    }

    const userMessage: ScarletteMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      sessionId: options.sessionId,
    };

    setMessages((prev) => [...prev, userMessage]);

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      message,
      user_id: session?.user?.id || 'anonymous',
      session_id: options.sessionId,
      context: {
        ...context,
      },
      blockchain_focus: context?.blockchain_focus || 'ethereum',
      execute_tasks: true,
    }));
  }, [isConnected, options.sessionId, session?.user?.id]);

  useEffect(() => {
    if (session?.access_token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session?.access_token, connect, disconnect]);

  return {
    messages,
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect,
    clearMessages: () => setMessages([]),
  };
}

