import { useState, useCallback, useEffect } from 'react';
import { scarletteAI, WillSuggestions } from '../services/scarletteAI';
import { logger } from '../services/logger.service';

interface SuggestionParams {
  numBeneficiaries: number;
  hasMinors: boolean;
  hasCharity: boolean;
  hasBusiness: boolean;
  multiChain: boolean;
  templateId?: string;
  portfolioValue?: number;
  beneficiaryTypes?: string[];
}

export function useScarletteWillAI() {
  const [suggestions, setSuggestions] = useState<WillSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const checkAvailability = useCallback(async () => {
    try {
      const available = await scarletteAI.checkHealth();
      setIsAvailable(available);
      return available;
    } catch (error) {
      logger.error('Failed to check Scarlette AI availability:', error);
      setIsAvailable(false);
      return false;
    }
  }, []);

  // Check availability on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const getSuggestions = useCallback(async (params: SuggestionParams) => {
    setLoading(true);
    try {
      const result = await scarletteAI.getWillSuggestions({
        portfolioValue: params.portfolioValue,
        numBeneficiaries: params.numBeneficiaries,
        hasMinors: params.hasMinors,
        hasCharity: params.hasCharity,
        hasBusiness: params.hasBusiness,
        multiChain: params.multiChain,
        templateId: params.templateId,
        beneficiaryTypes: params.beneficiaryTypes,
      });

      setSuggestions(result);
      setLoading(false);
      return result;
    } catch (error) {
      logger.error('Failed to get AI suggestions:', error);
      setLoading(false);
      // Return fallback suggestions
      const fallback: WillSuggestions = {
        templates: [],
        allocations: {
          strategy: 'equal_split',
          suggested_allocation: params.numBeneficiaries === 1 
            ? [100] 
            : Array(params.numBeneficiaries).fill(Math.floor(100 / params.numBeneficiaries)),
          tips: ['AI suggestions unavailable. Using default recommendations.'],
          template_tips: [],
        },
        conditions: [],
        securityTips: [
          'Use multi-signature wallets for high-value assets',
          'Consider adding guardian oversight for minor beneficiaries',
          'Enable 2FA on all notification channels',
          'Review and update your will annually',
        ],
        aiInsights: 'AI-powered insights are temporarily unavailable. Please ensure the Scarlette AI service is running.',
      };
      setSuggestions(fallback);
      return fallback;
    }
  }, []);

  return {
    suggestions,
    loading,
    isAvailable,
    getSuggestions,
    checkAvailability,
  };
}
