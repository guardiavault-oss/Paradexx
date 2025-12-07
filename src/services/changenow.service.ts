/**
 * ChangeNOW Service - Buy Crypto with Fiat
 * Frontend service for buying cryptocurrency without KYC
 */

import { apiClient, ApiResponse } from './api-client';

// ============================================================
// TYPES
// ============================================================

export interface ChangeNOWCurrency {
    ticker: string;
    name: string;
    image?: string;
    hasExternalId: boolean;
    isFiat: boolean;
    featured: boolean;
    isStable: boolean;
    supportsFixedRate: boolean;
}

export interface ChangeNOWQuote {
    id: string;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    rate: number;
    minerFee: number;
    networkFee: number;
    estimatedTime: string;
    validUntil?: string;
}

export interface ChangeNOWTransaction {
    id: string;
    status: 'waiting' | 'confirming' | 'exchanging' | 'sending' | 'finished' | 'failed' | 'refunded';
    payinAddress: string;
    payoutAddress: string;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    expectedReceiveAmount?: number;
    createdAt: string;
    updatedAt?: string;
}

export interface BuyCryptoParams {
    fiatCurrency: string;
    cryptoCurrency: string;
    fiatAmount: number;
    walletAddress: string;
    extraId?: string; // Memo/tag for coins that require it
}

// ============================================================
// POPULAR FIAT & CRYPTO OPTIONS
// ============================================================

export const POPULAR_FIAT = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

export const POPULAR_CRYPTO = [
    { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    { code: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { code: 'USDC', name: 'USD Coin', icon: '$' },
    { code: 'USDT', name: 'Tether', icon: '₮' },
    { code: 'BNB', name: 'BNB', icon: 'B' },
    { code: 'MATIC', name: 'Polygon', icon: 'M' },
    { code: 'SOL', name: 'Solana', icon: 'S' },
    { code: 'AVAX', name: 'Avalanche', icon: 'A' },
];

// ============================================================
// CHANGENOW SERVICE
// ============================================================

class ChangeNOWService {
    private readonly baseUrl = '/api/changenow';

    /**
     * Check if ChangeNOW is configured
     */
    async getStatus(): Promise<{ configured: boolean; provider: string; message: string }> {
        try {
            const response = await apiClient.get<ApiResponse<{ configured: boolean; provider: string; message: string }>>(
                `${this.baseUrl}/status`
            );
            return response.data.data || { configured: false, provider: 'ChangeNOW', message: 'Service unavailable' };
        } catch (error) {
            return { configured: false, provider: 'ChangeNOW', message: 'Failed to check status' };
        }
    }

    /**
     * Get available currencies
     */
    async getCurrencies(): Promise<string[]> {
        try {
            const response = await apiClient.get<ApiResponse<{ currencies: string[] }>>(
                `${this.baseUrl}/currencies`
            );
            return response.data.data?.currencies || POPULAR_CRYPTO.map(c => c.code);
        } catch (error) {
            console.error('Error fetching currencies:', error);
            return POPULAR_CRYPTO.map(c => c.code);
        }
    }

    /**
     * Get quote for fiat to crypto exchange
     */
    async getQuote(params: {
        from: string;
        to: string;
        amount: number;
        address?: string;
    }): Promise<ChangeNOWQuote | null> {
        try {
            const response = await apiClient.post<ApiResponse<{ quote: ChangeNOWQuote }>>(
                `${this.baseUrl}/quote`,
                params
            );
            return response.data.data?.quote || null;
        } catch (error: any) {
            console.error('Error getting quote:', error);
            return null;
        }
    }

    /**
     * Create exchange/purchase transaction
     */
    async createExchange(params: {
        from: string;
        to: string;
        amount: number;
        address: string;
        extraId?: string;
    }): Promise<ChangeNOWTransaction | null> {
        try {
            const response = await apiClient.post<ApiResponse<{ transaction: ChangeNOWTransaction }>>(
                `${this.baseUrl}/exchange`,
                params
            );
            return response.data.data?.transaction || null;
        } catch (error: any) {
            console.error('Error creating exchange:', error);
            throw new Error(error.response?.data?.error || 'Failed to create exchange');
        }
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(id: string): Promise<ChangeNOWTransaction | null> {
        try {
            const response = await apiClient.get<ApiResponse<{ transaction: ChangeNOWTransaction }>>(
                `${this.baseUrl}/transaction/${id}`
            );
            return response.data.data?.transaction || null;
        } catch (error) {
            console.error('Error getting transaction status:', error);
            return null;
        }
    }

    /**
     * Buy crypto helper - combines quote and exchange
     */
    async buyCrypto(params: BuyCryptoParams): Promise<{
        quote: ChangeNOWQuote | null;
        transaction: ChangeNOWTransaction | null;
        error?: string;
    }> {
        try {
            // First get a quote
            const quote = await this.getQuote({
                from: params.fiatCurrency,
                to: params.cryptoCurrency,
                amount: params.fiatAmount,
                address: params.walletAddress,
            });

            if (!quote) {
                return {
                    quote: null,
                    transaction: null,
                    error: 'Unable to get quote. This pair may not be available.',
                };
            }

            // Create the exchange
            const transaction = await this.createExchange({
                from: params.fiatCurrency,
                to: params.cryptoCurrency,
                amount: params.fiatAmount,
                address: params.walletAddress,
                extraId: params.extraId,
            });

            return {
                quote,
                transaction,
            };
        } catch (error: any) {
            return {
                quote: null,
                transaction: null,
                error: error.message || 'Failed to process purchase',
            };
        }
    }

    /**
     * Get estimated receive amount
     */
    async getEstimate(from: string, to: string, amount: number): Promise<{
        estimatedAmount: number;
        rate: number;
    } | null> {
        const quote = await this.getQuote({ from, to, amount });
        if (!quote) return null;

        return {
            estimatedAmount: quote.toAmount,
            rate: quote.rate,
        };
    }

    /**
     * Format amount for display
     */
    formatAmount(amount: number, currency: string): string {
        const fiat = POPULAR_FIAT.find(f => f.code === currency);
        if (fiat) {
            return `${fiat.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        const crypto = POPULAR_CRYPTO.find(c => c.code === currency);
        if (crypto) {
            return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} ${currency}`;
        }

        return `${amount} ${currency}`;
    }

    /**
     * Get transaction status label
     */
    getStatusLabel(status: ChangeNOWTransaction['status']): {
        label: string;
        color: string;
        description: string;
    } {
        const statusMap: Record<ChangeNOWTransaction['status'], { label: string; color: string; description: string }> = {
            waiting: {
                label: 'Waiting for Payment',
                color: 'yellow',
                description: 'Send the specified amount to the provided address',
            },
            confirming: {
                label: 'Confirming',
                color: 'blue',
                description: 'Payment received, waiting for blockchain confirmations',
            },
            exchanging: {
                label: 'Exchanging',
                color: 'blue',
                description: 'Processing your exchange',
            },
            sending: {
                label: 'Sending',
                color: 'blue',
                description: 'Sending crypto to your wallet',
            },
            finished: {
                label: 'Completed',
                color: 'green',
                description: 'Exchange completed successfully',
            },
            failed: {
                label: 'Failed',
                color: 'red',
                description: 'Exchange failed. Contact support for help.',
            },
            refunded: {
                label: 'Refunded',
                color: 'orange',
                description: 'Exchange was refunded',
            },
        };

        return statusMap[status] || { label: status, color: 'gray', description: '' };
    }
}

// Export singleton
export const changeNOWService = new ChangeNOWService();
export default changeNOWService;
