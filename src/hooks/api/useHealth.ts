import { useQuery } from '@tanstack/react-query';

export const healthKeys = {
  all: ['health'] as const,
  main: () => [...healthKeys.all, 'main'] as const,
  mev: () => [...healthKeys.all, 'mev'] as const,
  bridge: () => [...healthKeys.all, 'bridge'] as const,
  ai: () => [...healthKeys.all, 'ai'] as const,
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useHealthCheck() {
  return useQuery({
    queryKey: healthKeys.main(),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  });
}

export function useMevHealthCheck() {
  return useQuery({
    queryKey: healthKeys.mev(),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) throw new Error('MEV health check failed');
      return response.json();
    },
    refetchInterval: 30000,
    retry: 3,
  });
}

export function useAIHealthCheck() {
  return useQuery({
    queryKey: healthKeys.ai(),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/ai/health`);
      if (!response.ok) throw new Error('AI health check failed');
      return response.json();
    },
    refetchInterval: 60000,
    retry: 3,
  });
}

