import { logger } from '../services/logger.service';
/**
 * Onramper Service - Fiat to Crypto On-Ramp
 * 
 * Onramper is an aggregator that finds the best rates across multiple providers
 * No business name required - minimal KYC
 */

interface OnramperQuoteParams {
  fiatCurrency: string;      // USD, EUR, GBP, etc
  cryptoCurrency: string;    // ETH, BTC, USDC, etc
  amount: number;            // Amount in fiat
  address: string;           // Wallet address
  email?: string;
}

interface OnramperQuote {
  provider: string;
  rate: number;
  fee: number;
  total: number;
  timeEstimate: string;
}

interface OnramperTransaction {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  from: string;
  to: string;
  amount: number;
  timestamp: number;
}

const ONRAMPER_API_BASE = 'https://api.onramper.com/v3';
const ONRAMPER_API_KEY = process.env.ONRAMPER_API_KEY;
const PARTNER_ID = process.env.ONRAMPER_PARTNER_ID || 'paradex-wallet';

export class OnramperService {
  private static instance: OnramperService;

  private constructor() { }

  static getInstance(): OnramperService {
    if (!OnramperService.instance) {
      OnramperService.instance = new OnramperService();
    }
    return OnramperService.instance;
  }

  /**
   * Check if Onramper is configured
   */
  isConfigured(): boolean {
    return !!ONRAMPER_API_KEY;
  }

  /**
   * Get available fiat currencies
   */
  async getFiatCurrencies(): Promise<string[]> {
    try {
      const response = await fetch(`${ONRAMPER_API_BASE}/fiat-currencies`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch fiat currencies');
      const data = await response.json() as { currencies?: string[] };
      return data.currencies || ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
    } catch (error) {
      logger.error('[Onramper] Error fetching fiat currencies:', error);
      return ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
    }
  }

  /**
   * Get available crypto currencies
   */
  async getCryptoCurrencies(): Promise<string[]> {
    try {
      const response = await fetch(`${ONRAMPER_API_BASE}/crypto-currencies`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch crypto currencies');
      const data = await response.json() as { currencies?: string[] };
      return data.currencies || ['ETH', 'BTC', 'USDC', 'DAI', 'USDT'];
    } catch (error) {
      logger.error('[Onramper] Error fetching crypto currencies:', error);
      return ['ETH', 'BTC', 'USDC', 'DAI', 'USDT'];
    }
  }

  /**
   * Get quote for fiat to crypto conversion
   */
  async getQuote(params: OnramperQuoteParams): Promise<OnramperQuote | null> {
    try {
      const queryParams = new URLSearchParams({
        fiatCurrency: params.fiatCurrency,
        cryptoCurrency: params.cryptoCurrency,
        fiatAmount: params.amount.toString(),
        address: params.address,
        partnerId: PARTNER_ID,
      });

      const response = await fetch(`${ONRAMPER_API_BASE}/quotes?${queryParams}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to get quote');

      const data = await response.json() as any;

      if (!data.quotes || data.quotes.length === 0) {
        return null;
      }

      // Return best quote (aggregated)
      const bestQuote = data.quotes[0];
      return {
        provider: bestQuote.provider,
        rate: bestQuote.rate,
        fee: bestQuote.fee,
        total: bestQuote.receiveAmount,
        timeEstimate: bestQuote.timeEstimate || '5-15 minutes',
      };
    } catch (error) {
      logger.error('[Onramper] Error getting quote:', error);
      return null;
    }
  }

  /**
   * Get widget URL for embedding
   */
  getWidgetUrl(params: {
    fiatCurrency?: string;
    cryptoCurrency?: string;
    address: string;
    email?: string;
    theme?: 'light' | 'dark';
  }): string {
    const widgetParams = new URLSearchParams({
      apiKey: ONRAMPER_API_KEY || '',
      partnerId: PARTNER_ID,
      walletAddress: params.address,
      ...(params.fiatCurrency && { defaultFiat: params.fiatCurrency }),
      ...(params.cryptoCurrency && { defaultCrypto: params.cryptoCurrency }),
      ...(params.email && { email: params.email }),
      ...(params.theme && { color: params.theme === 'dark' ? '000000' : 'ffffff' }),
    });

    return `https://widget.onramper.com/?${widgetParams}`;
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<OnramperTransaction | null> {
    try {
      const response = await fetch(`${ONRAMPER_API_BASE}/transaction/${transactionId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to get transaction status');

      const data = await response.json() as any;

      return {
        id: data.id,
        status: data.status,
        from: data.from,
        to: data.to,
        amount: data.amount,
        timestamp: data.timestamp,
      };
    } catch (error) {
      logger.error('[Onramper] Error getting transaction status:', error);
      return null;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      provider: 'Onramper',
      message: this.isConfigured()
        ? 'Onramper on-ramp ready'
        : 'Onramper API key not configured. Set ONRAMPER_API_KEY to enable fiat purchases.',
      capabilities: [
        'multi-currency-fiat',
        'multi-currency-crypto',
        'rate-aggregation',
        'instant-quotes',
        'no-kyc-for-integration',
      ],
    };
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (ONRAMPER_API_KEY) {
      headers['Authorization'] = `Bearer ${ONRAMPER_API_KEY}`;
    }

    return headers;
  }
}

export default OnramperService.getInstance();
