import { useState, useEffect } from 'react';

export interface ConnectionStatus {
  isOnline: boolean;
  isConnected: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

/**
 * Hook to monitor API connection status
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    isConnected: navigator.onLine,
    reconnectAttempts: 0,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        isConnected: navigator.onLine,
        lastConnected: navigator.onLine ? new Date() : prev.lastConnected,
      }));
    };

    const handleConnectionChange = (event: CustomEvent) => {
      setStatus(prev => ({
        ...prev,
        isConnected: event.detail.connected,
        lastConnected: event.detail.connected ? new Date() : prev.lastConnected,
        reconnectAttempts: event.detail.connected ? 0 : prev.reconnectAttempts + 1,
      }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('api-connection-change', handleConnectionChange as EventListener);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('api-connection-change', handleConnectionChange as EventListener);
    };
  }, []);

  return status;
}

