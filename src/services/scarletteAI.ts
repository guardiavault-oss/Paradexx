import axios from 'axios';
import { logger } from './logger.service';

// Get API URL from environment or use defaults
const getScarletteApiUrl = (): string => {
  // Check for explicit environment variable
  if (import.meta.env.VITE_SCARLETTE_API_URL) {
    return import.meta.env.VITE_SCARLETTE_API_URL;
  }

  // Development default
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  // Production: try to infer from current hostname
  // Replace port 3000/5000 with 8000, or use same hostname
  const hostname = window.location.hostname;
  if (hostname.includes('-5000.') || hostname.includes('-3000.')) {
    return `https://${hostname.replace('-5000.', '-8000.').replace('-3000.', '-8000.')}`;
  }

  // Fallback: use same protocol and hostname with port 8000
  return `${window.location.protocol}//${window.location.hostname}:8000`;
};

const SCARLETTE_API_URL = getScarletteApiUrl();

interface ChatRequest {
  message: string;
  user_id?: string;
  session_id?: string;
  context?: Record<string, any>;
  blockchain_focus?: string;
  execute_tasks?: boolean;
}

interface ChatResponse {
  response: string;
  session_id: string;
  confidence: number;
  sources: string[];
  suggestions: string[];
  blockchain_context: {
    focus: string;
    intent: string;
    knowledge_used: boolean;
  };
  task_executed: boolean;
  task_results?: Record<string, any>;
}

interface TemplateRecommendation {
  template_id: string;
  score: number;
  reason: string;
}

interface AllocationSuggestion {
  strategy: string;
  suggested_allocation: number[] | null;
  tips: string[];
  template_tips: string[];
}

interface ConditionSuggestion {
  condition: {
    type: string;
    description: string;
    parameters: string[];
    verification: string;
  };
  recommended: boolean;
  reason: string;
}

interface WillSuggestions {
  templates: TemplateRecommendation[];
  allocations: AllocationSuggestion;
  conditions: ConditionSuggestion[];
  securityTips: string[];
  aiInsights: string;
}

class ScarletteAIService {
  private sessionId: string | null = null;
  private apiUrl: string = SCARLETTE_API_URL;

  constructor() {
    logger.info('Scarlette AI Service initialized', { apiUrl: this.apiUrl });
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  setSessionId(sessionId: string | null): void {
    this.sessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${SCARLETTE_API_URL}/health`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const isHealthy = response.data.status === 'healthy' || response.data.status === 'degraded';
      logger.info('Scarlette AI health check:', { status: response.data.status, isHealthy });
      return isHealthy;
    } catch (error) {
      logger.warn('Scarlette AI service not available:', error);
      return false;
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await axios.post<ChatResponse>(
        `${SCARLETTE_API_URL}/chat`,
        {
          message: request.message,
          user_id: request.user_id || 'anonymous',
          session_id: this.sessionId || request.session_id,
          context: request.context,
          blockchain_focus: request.blockchain_focus,
          execute_tasks: request.execute_tasks !== undefined ? request.execute_tasks : true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout for AI responses
        }
      );

      // Store session ID for future requests
      if (response.data.session_id) {
        this.sessionId = response.data.session_id;
      }

      logger.info('Scarlette AI chat response received', {
        sessionId: response.data.session_id,
        confidence: response.data.confidence,
        taskExecuted: response.data.task_executed,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Scarlette AI chat error:', error);

      // Return a fallback response if API is unavailable
      if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
        return {
          response: 'I apologize, but the Scarlette AI service is currently unavailable. Please try again later or check your connection.',
          session_id: this.sessionId || `fallback_${Date.now()}`,
          confidence: 0.0,
          sources: [],
          suggestions: ['Check your internet connection', 'Verify the service is running', 'Try again in a moment'],
          blockchain_context: {
            focus: request.blockchain_focus || 'general',
            intent: 'error',
            knowledge_used: false,
          },
          task_executed: false,
        };
      }

      throw error;
    }
  }

  async getWillSuggestions(params: {
    portfolioValue?: number;
    numBeneficiaries: number;
    hasMinors: boolean;
    hasCharity: boolean;
    hasBusiness: boolean;
    multiChain: boolean;
    templateId?: string;
    beneficiaryTypes?: string[];
  }): Promise<WillSuggestions> {
    const {
      portfolioValue,
      numBeneficiaries,
      hasMinors,
      hasCharity,
      hasBusiness,
      multiChain,
      templateId,
      beneficiaryTypes
    } = params;

    const prompt = `I'm creating a crypto inheritance will. Please provide suggestions for:
1. Best template type for my situation
2. Allocation strategy for ${numBeneficiaries} beneficiaries
3. Recommended conditions and release triggers
4. Security best practices

My situation:
- Portfolio value: ${portfolioValue ? `$${portfolioValue}` : 'Not specified'}
- Number of beneficiaries: ${numBeneficiaries}
- Has minor beneficiaries: ${hasMinors ? 'Yes' : 'No'}
- Including charity donations: ${hasCharity ? 'Yes' : 'No'}
- Has business assets: ${hasBusiness ? 'Yes' : 'No'}
- Multi-chain portfolio: ${multiChain ? 'Yes' : 'No'}
${templateId ? `- Selected template: ${templateId}` : ''}

Please provide specific, actionable recommendations.`;

    try {
      const response = await this.chat({
        message: prompt,
        context: {
          feature: 'smart_will_builder',
          params
        },
        blockchain_focus: 'ethereum'
      });

      const templates = this.parseTemplateRecommendations(response, hasMinors, hasCharity, hasBusiness, multiChain);
      const allocations = this.parseAllocationSuggestions(response, numBeneficiaries, templateId);
      const conditions = this.parseConditionSuggestions(response, templateId, hasMinors);
      const securityTips = this.parseSecurityTips(response);

      return {
        templates,
        allocations,
        conditions,
        securityTips,
        aiInsights: response.response
      };
    } catch (error) {
      logger.error('Failed to get AI suggestions:', error);
      return this.getFallbackSuggestions(params);
    }
  }

  private parseTemplateRecommendations(
    response: ChatResponse,
    hasMinors: boolean,
    hasCharity: boolean,
    hasBusiness: boolean,
    multiChain: boolean
  ): TemplateRecommendation[] {
    const recommendations: TemplateRecommendation[] = [];

    if (hasBusiness) {
      recommendations.push({
        template_id: 'business',
        score: 0.95,
        reason: 'Best suited for business asset succession planning'
      });
    }

    if (hasMinors) {
      recommendations.push({
        template_id: 'trust-fund',
        score: 0.90,
        reason: 'Trust fund structure provides protection for minor beneficiaries'
      });
    }

    if (hasCharity) {
      recommendations.push({
        template_id: 'charitable',
        score: 0.85,
        reason: 'Optimized for charitable giving with tax benefits'
      });
    }

    if (multiChain) {
      recommendations.push({
        template_id: 'multi-chain',
        score: 0.80,
        reason: 'Designed for cross-chain asset distribution'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        template_id: 'standard',
        score: 0.75,
        reason: 'Simple and effective for most inheritance scenarios'
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private parseAllocationSuggestions(
    response: ChatResponse,
    numBeneficiaries: number,
    templateId?: string
  ): AllocationSuggestion {
    if (numBeneficiaries === 1) {
      return {
        strategy: 'single_beneficiary',
        suggested_allocation: [100],
        tips: ['Single beneficiary will receive the entire inheritance'],
        template_tips: ['Consider adding a contingent beneficiary']
      };
    }

    if (numBeneficiaries === 2) {
      return {
        strategy: 'equal_split',
        suggested_allocation: [50, 50],
        tips: ['Equal distribution is the most common choice for two beneficiaries'],
        template_tips: ['You can adjust allocations based on individual circumstances']
      };
    }

    const equal = Math.floor(100 / numBeneficiaries);
    const remainder = 100 % numBeneficiaries;
    const allocations = Array(numBeneficiaries).fill(equal);
    allocations[0] += remainder;

    return {
      strategy: numBeneficiaries <= 4 ? 'equal_split' : 'tiered',
      suggested_allocation: numBeneficiaries <= 4 ? allocations : null,
      tips: numBeneficiaries <= 4
        ? ['Consider equal distribution for fairness', 'Adjust based on individual needs']
        : ['Consider tiered distribution', 'Primary beneficiaries: 60-70%', 'Secondary: 20-30%', 'Reserve 5-10% for contingencies'],
      template_tips: templateId
        ? [`Recommended for ${templateId} template`]
        : ['Select a template to see specific allocation tips']
    };
  }

  private parseConditionSuggestions(
    response: ChatResponse,
    templateId?: string,
    hasMinors?: boolean
  ): ConditionSuggestion[] {
    const conditions: ConditionSuggestion[] = [];

    if (hasMinors) {
      conditions.push({
        condition: {
          type: 'age_milestone',
          description: 'Release when beneficiary reaches specified age (18, 21, 25)',
          parameters: ['target_age'],
          verification: 'Oracle or guardian attestation'
        },
        recommended: true,
        reason: 'Protects assets until beneficiaries reach maturity'
      });
    }

    conditions.push({
      condition: {
        type: 'guardian_approval',
        description: 'Requires approval from designated guardians',
        parameters: ['guardian_addresses', 'threshold'],
        verification: 'Multi-signature'
      },
      recommended: true,
      reason: 'Adds security through multi-party verification'
    });

    conditions.push({
      condition: {
        type: 'time_based',
        description: 'Release after a specified waiting period',
        parameters: ['waiting_period'],
        verification: 'Block timestamp'
      },
      recommended: templateId === 'trust-fund',
      reason: 'Provides time for proper verification and processing'
    });

    if (templateId === 'trust-fund' || templateId === 'business') {
      conditions.push({
        condition: {
          type: 'vesting',
          description: 'Gradual release over time',
          parameters: ['cliff_period', 'vesting_duration'],
          verification: 'Smart contract'
        },
        recommended: true,
        reason: 'Ensures responsible distribution over time'
      });
    }

    return conditions;
  }

  private parseSecurityTips(response: ChatResponse): string[] {
    return [
      'Use a hardware wallet for signing will transactions',
      'Enable multi-signature requirements for major changes',
      'Set up regular check-in reminders to maintain will validity',
      'Store recovery information securely with trusted parties',
      'Review and update your will annually or after major life events'
    ];
  }

  private getFallbackSuggestions(params: {
    numBeneficiaries: number;
    hasMinors: boolean;
    hasCharity: boolean;
    hasBusiness: boolean;
    multiChain: boolean;
    templateId?: string;
  }): WillSuggestions {
    return {
      templates: this.parseTemplateRecommendations(
        {} as ChatResponse,
        params.hasMinors,
        params.hasCharity,
        params.hasBusiness,
        params.multiChain
      ),
      allocations: this.parseAllocationSuggestions(
        {} as ChatResponse,
        params.numBeneficiaries,
        params.templateId
      ),
      conditions: this.parseConditionSuggestions(
        {} as ChatResponse,
        params.templateId,
        params.hasMinors
      ),
      securityTips: this.parseSecurityTips({} as ChatResponse),
      aiInsights: 'AI-powered insights are available when the Scarlette AI service is running. The suggestions shown are based on common best practices for crypto inheritance planning.'
    };
  }

  async getTemplateInsights(templateId: string): Promise<{
    description: string;
    bestFor: string[];
    tips: string[];
    securityLevel: string;
  }> {
    try {
      const response = await this.chat({
        message: `Tell me about the ${templateId} will template for crypto inheritance. What is it best for and what are the key considerations?`,
        context: { feature: 'template_insights', templateId }
      });

      return {
        description: response.response,
        bestFor: response.suggestions.slice(0, 3),
        tips: response.suggestions.slice(3, 6),
        securityLevel: templateId === 'business' || templateId === 'trust-fund' ? 'high' : 'medium'
      };
    } catch {
      return {
        description: `The ${templateId} template provides a structured approach to crypto inheritance planning.`,
        bestFor: ['General estate planning', 'Simple asset distribution'],
        tips: ['Review regularly', 'Keep beneficiary information updated'],
        securityLevel: 'medium'
      };
    }
  }
}

export const scarletteAI = new ScarletteAIService();
export type { WillSuggestions, TemplateRecommendation, AllocationSuggestion, ConditionSuggestion };
