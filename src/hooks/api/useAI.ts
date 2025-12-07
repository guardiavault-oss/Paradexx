import { useQuery, useMutation } from '@tanstack/react-query';
import {
  aiChat,
  analyzeTransaction,
  getDeFiRecommendations,
  explainConcept,
  type ChatMessage,
} from '../../utils/api-client';
import { useAuth } from '../../contexts/AuthContext';

export const aiKeys = {
  all: ['ai'] as const,
  chat: (message: string) => [...aiKeys.all, 'chat', message] as const,
};

export function useAIChat() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: ({ message, conversationHistory }: { message: string; conversationHistory?: ChatMessage[] }) =>
      aiChat(message, conversationHistory || [], session?.access_token || ''),
  });
}

export function useAnalyzeTransaction() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (transaction: {
      from: string;
      to: string;
      value: string;
      data?: string;
      chain: string;
    }) => analyzeTransaction(transaction, session?.access_token || ''),
  });
}

export function useDeFiRecommendations() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: (params: {
      riskTolerance: 'conservative' | 'moderate' | 'aggressive';
      portfolioValue: number;
      experience: 'beginner' | 'intermediate' | 'advanced';
      interests?: string[];
    }) => getDeFiRecommendations(params, session?.access_token || ''),
  });
}

export function useExplainConcept() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: ({ concept, complexity }: { concept: string; complexity?: 'simple' | 'intermediate' | 'advanced' }) =>
      explainConcept(concept, complexity || 'simple', session?.access_token || ''),
  });
}

