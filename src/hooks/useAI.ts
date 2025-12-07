// React hooks for AI API integration
import { useState, useCallback } from 'react';
import { logger } from '../services/logger.service';
import {
  aiChat,
  analyzeTransaction,
  getDeFiRecommendations,
  explainConcept,
  ChatMessage,
  ChatResponse,
  TransactionAnalysis,
  DeFiRecommendation,
  ApiError,
} from '../utils/api-client';
import { useAuth } from '../contexts/AuthContext';
import { useScarletteWebSocket } from './useScarletteWebSocket';

export function useAIChat(options?: { sessionId?: string; useWebSocket?: boolean }) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(options?.sessionId);

  // Use WebSocket if enabled
  const { 
    messages: wsMessages, 
    isConnected: wsConnected,
    sendMessage: wsSendMessage,
    error: wsError,
    clearMessages: wsClearMessages,
  } = useScarletteWebSocket({
    sessionId,
    onMessage: (msg) => {
      setMessages((prev) => [...prev, {
        role: msg.role,
        content: msg.content,
      }]);
    },
    onError: (err) => {
      setError({ error: err.message });
    },
  });

  // Create session if needed
  const createSession = useCallback(async () => {
    if (!session?.access_token) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/ai/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch (err) {
      logger.error('Failed to create session:', err);
    }
  }, [session?.access_token]);

  const sendMessage = useCallback(async (message: string) => {
    if (!session?.access_token) {
      setError({ error: 'Not authenticated' });
      return;
    }

    // Create session if needed
    if (!sessionId) {
      const newSessionId = await createSession();
      if (!newSessionId) {
        setError({ error: 'Failed to create session' });
        return;
      }
    }

    setLoading(true);
    setError(null);

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Use WebSocket if enabled and connected
      if (options?.useWebSocket && wsConnected) {
        wsSendMessage(message);
        setLoading(false);
        return;
      }

      // Fallback to HTTP
      const response = await aiChat(message, messages, session.access_token);
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      return response;
    } catch (err: any) {
      setError(err);
      logger.error('Error in AI chat:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, messages, sessionId, options?.useWebSocket, wsConnected, wsSendMessage, createSession]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    if (options?.useWebSocket) {
      wsClearMessages();
    }
  }, [options?.useWebSocket, wsClearMessages]);

  return {
    messages: options?.useWebSocket && wsConnected ? wsMessages.map(m => ({ role: m.role, content: m.content })) : messages,
    loading,
    error: wsError ? { error: wsError.message } : error,
    sendMessage,
    clearChat,
    sessionId,
    isConnected: options?.useWebSocket ? wsConnected : true,
  };
}

// Import WebSocket hook
import { useScarletteWebSocket } from './useScarletteWebSocket';

export function useTransactionAnalysis() {
  const { session } = useAuth();
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const analyze = useCallback(async (transaction: {
    from: string;
    to: string;
    value: string;
    data?: string;
    chain: string;
  }) => {
    if (!session?.access_token) {
      setError({ error: 'Not authenticated' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeTransaction(transaction, session.access_token);
      setAnalysis(result);
      return result;
    } catch (err: any) {
      setError(err);
      logger.error('Error analyzing transaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  return {
    analysis,
    loading,
    error,
    analyze,
  };
}

export function useDeFiRecommendations() {
  const { session } = useAuth();
  const [recommendations, setRecommendations] = useState<DeFiRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRecommendations = useCallback(async (params: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    portfolioValue: number;
    experience: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
  }) => {
    if (!session?.access_token) {
      setError({ error: 'Not authenticated' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getDeFiRecommendations(params, session.access_token);
      setRecommendations(data);
      return data;
    } catch (err: any) {
      setError(err);
      logger.error('Error fetching DeFi recommendations:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
  };
}

export function useConceptExplainer() {
  const { session } = useAuth();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const explain = useCallback(async (
    concept: string,
    complexity: 'simple' | 'intermediate' | 'advanced' = 'simple'
  ) => {
    if (!session?.access_token) {
      setError({ error: 'Not authenticated' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await explainConcept(concept, complexity, session.access_token);
      setExplanation(result);
      return result;
    } catch (err: any) {
      setError(err);
      logger.error('Error explaining concept:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  return {
    explanation,
    loading,
    error,
    explain,
  };
}

