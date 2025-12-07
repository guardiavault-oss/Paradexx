import { logger } from '../services/logger.service';
/**
 * ChangeNOW Service - Fiat to Crypto Exchange
 * No mandatory KYC, minimal business requirements
 */

interface ChangeNOWQuoteParams {
  from: string;              // Currency code (USD, EUR, BTC, ETH)
  to: string;                // Currency code
  amount: number;            // Amount in 'from' currency
  address?: string;          // Recipient address
  extraId?: string;          // Tag/Memo for coins that require it
}

interface ChangeNOWQuote {
  id: string;
  rate: number;
  amount: number;
  estimatedAmount: number;
  minerFee: number;
  userFee: number;
}

interface ChangeNOWTransaction {
  id: string;
  status: 'waiting' | 'confirming' | 'exchanging' | 'sending' | 'finished' | 'failed' | 'refunded';
  payinAddress: string;
  payoutAddress: string;
  fromCurrency: string;
  toCurrency: string;
  amountFrom: number;
  amountTo: number;
}

const CHANGENOW_API_BASE = 'https://api.changenow.io/v2';
const API_KEY = process.env.CHANGENOW_API_KEY;

export class ChangeNOWService {
  private static instance: ChangeNOWService;

  private constructor() {}

  static getInstance(): ChangeNOWService {
    if (!ChangeNOWService.instance) {
      ChangeNOWService.instance = new ChangeNOWService();
    }
    return ChangeNOWService.instance;
  }

  isConfigured(): boolean {
    return !!API_KEY;
  }

  /**
   * Get available currencies
   */
  async getAvailableCurrencies(): Promise<string[]> {
    try {
      const response = await fetch(`${CHANGENOW_API_BASE}/currencies`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch currencies');
      const data = await response.json() as string[];
      return data || ['BTC', 'ETH', 'USDC', 'DAI', 'USDT'];
    } catch (error) {
      logger.error('[ChangeNOW] Error fetching currencies:', error);
      return ['BTC', 'ETH', 'USDC', 'DAI', 'USDT'];
    }
  }

  /**
   * Get exchange rate and details
   */
  async getQuote(params: ChangeNOWQuoteParams): Promise<ChangeNOWQuote | null> {
    try {
      const queryParams = new URLSearchParams({
        from: params.from,
        to: params.to,
        amount: params.amount.toString(),
        ...(params.address && { address: params.address }),
      });

      const response = await fetch(
        `${CHANGENOW_API_BASE}/exchange-range/${params.from}_${params.to}?${queryParams}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) throw new Error('Failed to get quote');

      const data = await response.json() as any;

      return {
        id: data.id || '',
        rate: data.rate || 0,
        amount: params.amount,
        estimatedAmount: data.estimatedAmount || 0,
        minerFee: data.minerFee || 0,
        userFee: data.userFee || 0,
      };
    } catch (error) {
      logger.error('[ChangeNOW] Error getting quote:', error);
      return null;
    }
  }

  /**
   * Create exchange transaction
   */
  async createExchange(params: {
    from: string;
    to: string;
    amount: number;
    address: string;
    extraId?: string;
  }): Promise<ChangeNOWTransaction | null> {
    try {
      const payload = {
        from: params.from,
        to: params.to,
        amount: params.amount,
        address: params.address,
        ...(params.extraId && { extraId: params.extraId }),
      };

      const response = await fetch(`${CHANGENOW_API_BASE}/exchange`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create exchange');

      const data = await response.json() as any;

      return {
        id: data.id,
        status: data.status || 'waiting',
        payinAddress: data.payinAddress,
        payoutAddress: data.payoutAddress,
        fromCurrency: params.from,
        toCurrency: params.to,
        amountFrom: params.amount,
        amountTo: data.amountTo || 0,
      };
    } catch (error) {
      logger.error('[ChangeNOW] Error creating exchange:', error);
      return null;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(id: string): Promise<ChangeNOWTransaction | null> {
    try {
      const response = await fetch(`${CHANGENOW_API_BASE}/exchange/${id}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to get transaction status');

      const data = await response.json() as any;

      return {
        id: data.id,
        status: data.status,
        payinAddress: data.payinAddress,
        payoutAddress: data.payoutAddress,
        fromCurrency: data.fromCurrency,
        toCurrency: data.toCurrency,
        amountFrom: data.amountFrom,
        amountTo: data.amountTo,
      };
    } catch (error) {
      logger.error('[ChangeNOW] Error getting transaction status:', error);
      return null;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      provider: 'ChangeNOW',
      message: this.isConfigured()
        ? 'ChangeNOW exchange ready'
        : 'ChangeNOW API key not configured. Set CHANGENOW_API_KEY to enable exchanges.',
      capabilities: [
        'multi-currency-support',
        'no-kyc-required',
        'instant-quotes',
        'real-time-rates',
      ],
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (API_KEY) {
      headers['x-changenow-api-key'] = API_KEY;
    }

    return headers;
  }
}

export default ChangeNOWService.getInstance();
