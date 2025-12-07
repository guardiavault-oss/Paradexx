import { useState, useCallback, useRef } from 'react';
import { scarletteAI, WillSuggestions, TemplateRecommendation, AllocationSuggestion, ConditionSuggestion } from '../services/scarletteAI';

interface UseScarletteWillAIOptions {
  onError?: (error: Error) => void;
}

interface UseScarletteWillAIReturn {
  suggestions: WillSuggestions | null;
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
  getSuggestions: (params: {
    numBeneficiaries: number;
    hasMinors: boolean;
    hasCharity: boolean;
    hasBusiness: boolean;
    multiChain: boolean;
    templateId?: string;
    portfolioValue?: number;
  }) => Promise<WillSuggestions>;
  getTemplateInsights: (templateId: string) => Promise<{
    description: string;
    bestFor: string[];
    tips: string[];
    securityLevel: string;
  }>;
  checkAvailability: () => Promise<boolean>;
  clearSuggestions: () => void;
}

export function useScarletteWillAI(options: UseScarletteWillAIOptions = {}): UseScarletteWillAIReturn {
  const [suggestions, setSuggestions] = useState<WillSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const cacheRef = useRef<Map<string, WillSuggestions>>(new Map());

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const available = await scarletteAI.checkHealth();
      setIsAvailable(available);
      return available;
    } catch {
      setIsAvailable(false);
      return false;
    }
  }, []);

  const getSuggestions = useCallback(async (params: {
    numBeneficiaries: number;
    hasMinors: boolean;
    hasCharity: boolean;
    hasBusiness: boolean;
    multiChain: boolean;
    templateId?: string;
    portfolioValue?: number;
  }): Promise<WillSuggestions> => {
    const cacheKey = JSON.stringify(params);
    
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setSuggestions(cached);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await scarletteAI.getWillSuggestions(params);
      cacheRef.current.set(cacheKey, result);
      setSuggestions(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI suggestions';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
      
      const fallback = await scarletteAI.getWillSuggestions(params);
      setSuggestions(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const getTemplateInsights = useCallback(async (templateId: string) => {
    try {
      return await scarletteAI.getTemplateInsights(templateId);
    } catch (err) {
      return {
        description: `The ${templateId} template provides structured inheritance planning.`,
        bestFor: ['General estate planning'],
        tips: ['Review regularly'],
        securityLevel: 'medium'
      };
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions(null);
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    isAvailable,
    getSuggestions,
    getTemplateInsights,
    checkAvailability,
    clearSuggestions
  };
}

export type { WillSuggestions, TemplateRecommendation, AllocationSuggestion, ConditionSuggestion };
