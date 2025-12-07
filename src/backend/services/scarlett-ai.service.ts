// Scarlett AI Service Integration
// This service integrates with the Python Scarlette AI integration module
// Falls back to OpenAI if Scarlett Python backend is unavailable
import axios from 'axios';
import { logger } from '../services/logger.service';

// Configuration - read lazily after dotenv loads
function getConfig() {
  const scarlettUrl = process.env.SCARLETT_API_URL || process.env.PYTHON_API_URL || 'http://localhost:8044';
  const scarlettKey = process.env.SCARLETT_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';

  return { scarlettUrl, scarlettKey, openaiKey };
}

// Log configuration status on first use
let configLogged = false;
function logConfigStatus() {
  if (configLogged) return;
  configLogged = true;

  const config = getConfig();

  if (config.openaiKey) {
    logger.info('[ScarlettAI] ✅ OpenAI API key configured (fallback ready)');
  } else {
    logger.warn('[ScarlettAI] ⚠️ No OpenAI API key - AI features limited');
  }

  logger.info(`[ScarlettAI] Python backend URL: ${config.scarlettUrl}`);
}

export interface ScarlettMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ScarlettChatRequest {
  message: string;
  conversation_history?: ScarlettMessage[];
  blockchain_focus?: string;
  context?: {
    wallet_address?: string;
    chain_id?: number;
    transaction_hash?: string;
  };
}

export interface ScarlettChatResponse {
  response: string;
  intent?: {
    type: string;
    confidence: number;
  };
  knowledge_used?: string[];
  blockchain_context?: string;
}

export interface ScarlettAnalysisRequest {
  transaction_hash: string;
  chain_id: number;
  wallet_address?: string;
}

export interface ScarlettAnalysisResponse {
  analysis: string;
  risk_level: 'low' | 'medium' | 'high';
  recommendations: string[];
  insights: string[];
}

class ScarlettAIService {
  private get apiUrl(): string {
    return getConfig().scarlettUrl;
  }

  private get apiKey(): string {
    return getConfig().scarlettKey;
  }

  constructor() {
    // Log config on first instantiation
    logConfigStatus();
  }

  // Chat with Scarlett AI
  async chat(request: ScarlettChatRequest): Promise<ScarlettChatResponse> {
    try {
      // Call Python API endpoint (app/api/ai_endpoints.py)
      const response = await axios.post(
        `${this.apiUrl}/api/ai/chat`,
        {
          message: request.message,
          conversation_history: request.conversation_history || [],
          blockchain_focus: request.blockchain_focus,
          context: request.context,
          user_id: (request.context as any)?.user_id || 'anonymous',
          session_id: (request.context as any)?.session_id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
          timeout: 30000, // 30 second timeout
        }
      );

      // Transform Python API response to match expected format
      const data = response.data;
      return {
        response: data.message || data.response || '',
        intent: {
          type: 'general',
          confidence: 0.9,
        },
        knowledge_used: data.knowledge_used || [],
        blockchain_context: data.blockchain_context || {},
      };
    } catch (error: any) {
      logger.error('Scarlett AI chat error:', error.message);

      // Fallback to OpenAI if Scarlett is unavailable
      if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
        return this.fallbackToOpenAI(request);
      }

      throw new Error(`Scarlett AI error: ${error.message}`);
    }
  }

  // Analyze transaction with Scarlett AI
  async analyzeTransaction(request: ScarlettAnalysisRequest): Promise<ScarlettAnalysisResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/analyze-transaction`,
        {
          transaction_hash: request.transaction_hash,
          chain_id: request.chain_id,
          wallet_address: request.wallet_address,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Scarlett AI analysis error:', error.message);

      // Fallback response
      return {
        analysis: 'Unable to analyze transaction at this time. Please try again later.',
        risk_level: 'medium',
        recommendations: ['Review transaction details manually', 'Check contract on block explorer'],
        insights: [],
      };
    }
  }

  // Get DeFi recommendations
  async getDeFiRecommendations(params: {
    risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
    portfolio_value: number;
    experience: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/defi-recommendations`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Scarlett AI DeFi recommendations error:', error.message);
      return [];
    }
  }

  // Explain concept
  async explainConcept(
    concept: string,
    complexity: 'simple' | 'intermediate' | 'advanced' = 'simple'
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/explain`,
        {
          concept,
          complexity,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
          timeout: 30000,
        }
      );

      return response.data.explanation;
    } catch (error: any) {
      logger.error('Scarlett AI explain error:', error.message);
      return `I'm having trouble explaining "${concept}" right now. Please try again later.`;
    }
  }

  // Fallback to OpenAI if Scarlett is unavailable
  private async fallbackToOpenAI(request: ScarlettChatRequest): Promise<ScarlettChatResponse> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('Neither Scarlett AI nor OpenAI API key available');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are Scarlett, an AI assistant specialized in cryptocurrency and blockchain technology. Help users with wallet management, transaction analysis, and DeFi questions.',
            },
            ...(request.conversation_history || []),
            {
              role: 'user',
              content: request.message,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          timeout: 30000,
        }
      );

      return {
        response: response.data.choices[0].message.content,
        intent: {
          type: 'general',
          confidence: 0.8,
        },
      };
    } catch (error: any) {
      throw new Error(`OpenAI fallback error: ${error.message}`);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/ai/health`, {
        timeout: 5000,
      });
      return response.status === 200 && response.data?.status === 'healthy';
    } catch {
      return false;
    }
  }

  // Execute AI task
  async executeTask(taskName: string, parameters: Record<string, any> = {}, userId: string = 'anonymous'): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/ai/task`,
        {
          task_name: taskName,
          parameters,
          user_id: userId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Scarlett AI task execution error:', error.message);
      throw new Error(`Task execution failed: ${error.message}`);
    }
  }
}

export const scarlettAI = new ScarlettAIService();

