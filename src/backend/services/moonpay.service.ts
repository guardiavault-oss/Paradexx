// MoonPay Service - Fiat on-ramp integration

import axios from 'axios';
import { logger } from '../services/logger.service';
import crypto from 'crypto';

const MOONPAY_API = 'https://api.moonpay.com';
const MOONPAY_API_KEY = process.env.MOONPAY_API_KEY;
const MOONPAY_SECRET_KEY = process.env.MOONPAY_SECRET_KEY;

export interface MoonPayCurrency {
  id: string;
  code: string;
  name: string;
  type: 'crypto' | 'fiat';
  minBuyAmount: number;
  maxBuyAmount: number;
  addressRegex?: string;
  supportsAddressTag: boolean;
  supportsTestMode: boolean;
  isSuspended: boolean;
}

export interface MoonPayQuote {
  baseCurrency: string;
  quoteCurrency: string;
  baseCurrencyAmount: number;
  quoteCurrencyAmount: number;
  feeAmount: number;
  extraFeeAmount: number;
  networkFeeAmount: number;
  totalAmount: number;
  signature?: string;
}

export interface MoonPayTransaction {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  currency: string;
  baseCurrency: string;
  quoteCurrencyAmount: number;
  feeAmount: number;
  extraFeeAmount: number;
  networkFeeAmount: number;
  cryptoTransactionId?: string;
  walletAddress: string;
}

export class MoonPayService {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = MOONPAY_API_KEY!;
    this.secretKey = MOONPAY_SECRET_KEY!;
    this.baseUrl = MOONPAY_API;
  }

  // Get supported cryptocurrencies
  async getSupportedCurrencies(): Promise<MoonPayCurrency[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/v3/currencies`, {
        params: {
          apiKey: this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('MoonPay currencies error:', error);
      throw new Error('Failed to get supported currencies');
    }
  }

  // Get supported fiat currencies
  async getSupportedFiatCurrencies(): Promise<MoonPayCurrency[]> {
    try {
      const currencies = await this.getSupportedCurrencies();
      return currencies.filter((c) => c.type === 'fiat');
    } catch (error) {
      logger.error('MoonPay fiat currencies error:', error);
      throw new Error('Failed to get fiat currencies');
    }
  }

  // Get buy quote
  async getBuyQuote(
    cryptoCurrency: string,
    fiatCurrency: string,
    fiatAmount: number
  ): Promise<MoonPayQuote> {
    try {
      const response = await axios.get(`${this.baseUrl}/v3/currencies/${cryptoCurrency}/buy_quote`, {
        params: {
          apiKey: this.apiKey,
          baseCurrencyCode: fiatCurrency,
          baseCurrencyAmount: fiatAmount,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('MoonPay quote error:', error.response?.data || error.message);
      throw new Error('Failed to get buy quote');
    }
  }

  // Check if MoonPay is configured
  isConfigured(): boolean {
    return !!(this.apiKey && this.secretKey);
  }

  // Generate widget URL for buy flow
  generateBuyUrl(params: {
    walletAddress: string;
    currencyCode: string;
    baseCurrencyCode?: string;
    baseCurrencyAmount?: number;
    email?: string;
    colorCode?: string;
    showWalletAddressForm?: boolean;
    externalTransactionId?: string;
  }): string {
    const { walletAddress, currencyCode, ...rest } = params;
    const queryParams = new URLSearchParams({
      apiKey: this.apiKey,
      walletAddress,
      currencyCode,
      ...(rest.baseCurrencyCode && { baseCurrencyCode: rest.baseCurrencyCode }),
      ...(rest.baseCurrencyAmount && { baseCurrencyAmount: String(rest.baseCurrencyAmount) }),
      ...(rest.email && { email: rest.email }),
      ...(rest.colorCode && { colorCode: rest.colorCode }),
      ...(rest.externalTransactionId && { externalTransactionId: rest.externalTransactionId }),
    } as Record<string, string>);

    // Generate signature for security
    const signature = this.generateSignature(queryParams.toString());
    queryParams.append('signature', signature);

    return `${this.baseUrl}?${queryParams.toString()}`;
  }

  // Generate sell widget URL
  generateSellUrl(params: {
    walletAddress: string;
    currencyCode: string;
    baseCurrencyCode?: string;
    email?: string;
    externalTransactionId?: string;
  }): string {
    const { walletAddress, currencyCode, ...rest } = params;
    const queryParams = new URLSearchParams({
      apiKey: this.apiKey,
      walletAddress,
      currencyCode,
      ...(rest.baseCurrencyCode && { baseCurrencyCode: rest.baseCurrencyCode }),
      ...(rest.email && { email: rest.email }),
      ...(rest.externalTransactionId && { externalTransactionId: rest.externalTransactionId }),
    } as Record<string, string>);

    const signature = this.generateSignature(queryParams.toString());
    queryParams.append('signature', signature);

    return `https://sell.moonpay.com?${queryParams.toString()}`;
  }

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<MoonPayTransaction> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/transactions/${transactionId}`,
        {
          params: {
            apiKey: this.apiKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('MoonPay transaction error:', error);
      throw new Error('Failed to get transaction');
    }
  }

  // Get user transactions
  async getUserTransactions(externalCustomerId: string): Promise<MoonPayTransaction[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/transactions`, {
        params: {
          apiKey: this.apiKey,
          externalCustomerId,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('MoonPay user transactions error:', error);
      throw new Error('Failed to get user transactions');
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(signature: string, body: string): boolean {
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    return signature === expectedSignature;
  }

  // Generate URL signature (for widget)
  private generateSignature(queryString: string): string {
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(queryString);
    return hmac.digest('base64');
  }

  // Get currency limits
  async getCurrencyLimits(
    cryptoCurrency: string,
    baseCurrency: string = 'usd'
  ): Promise<{ minAmount: number; maxAmount: number }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/currencies/${cryptoCurrency}/limits`,
        {
          params: {
            apiKey: this.apiKey,
            baseCurrencyCode: baseCurrency,
          },
        }
      );

      return {
        minAmount: response.data.baseCurrency.minAmount,
        maxAmount: response.data.baseCurrency.maxAmount,
      };
    } catch (error) {
      logger.error('MoonPay limits error:', error);
      throw new Error('Failed to get currency limits');
    }
  }

  // Check if IP is allowed (for compliance)
  async checkIpAddress(ipAddress: string): Promise<{ isAllowed: boolean; alpha3?: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/ip_address`, {
        params: {
          apiKey: this.apiKey,
          ipAddress,
        },
      });

      return {
        isAllowed: response.data.isBuyAllowed,
        alpha3: response.data.alpha3,
      };
    } catch (error) {
      logger.error('MoonPay IP check error:', error);
      return { isAllowed: false };
    }
  }
}

// Webhook handler
export interface MoonPayWebhook {
  type: string;
  data: any;
}

export function handleMoonPayWebhook(
  payload: MoonPayWebhook,
  signature: string
): void {
  const moonpay = new MoonPayService();

  // Verify signature
  const isValid = moonpay.verifyWebhookSignature(
    signature,
    JSON.stringify(payload)
  );

  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  // Handle different webhook types
  switch (payload.type) {
    case 'transaction_created':
      logger.info('Transaction created:', payload.data);
      break;

    case 'transaction_updated':
      logger.info('Transaction updated:', payload.data);
      // Update database with transaction status
      break;

    case 'transaction_completed':
      logger.info('Transaction completed:', payload.data);
      // Notify user of successful purchase
      break;

    case 'transaction_failed':
      logger.info('Transaction failed:', payload.data);
      // Notify user of failed transaction
      break;

    default:
      logger.info('Unknown webhook type:', payload.type);
  }
}

// Export instance
export const moonpay = new MoonPayService();
