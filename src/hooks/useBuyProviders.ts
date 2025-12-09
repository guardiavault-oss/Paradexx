/**
 * useBuyProviders Hook - Real-time on-ramp provider data
 *
 * Features:
 * - Real-time fee comparison across providers
 * - Dynamic rate fetching
 * - Payment status tracking
 * - Provider availability checks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../config/api';

export interface Provider {
  id: string;
  name: string;
  logo: string;
  description: string;
  fees: string;
  feePercent: number;
  speed: string;
  paymentMethods: string[];
  minAmount: number;
  maxAmount: number;
  featured?: boolean;
  rating: number;
  available: boolean;
  supportedCurrencies: string[];
  supportedCrypto: string[];
  estimatedReceive?: number;
  totalCost?: number;
  bestRate?: boolean;
}

export interface Quote {
  providerId: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  exchangeRate: number;
  fees: number;
  totalCost: number;
  estimatedTime: string;
  expiresAt: number;
}

export interface Transaction {
  id: string;
  providerId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
  txHash?: string;
  errorMessage?: string;
}

interface UseBuyProvidersReturn {
  providers: Provider[];
  quotes: Quote[];
  activeTransaction: Transaction | null;
  transactions: Transaction[];
  loading: boolean;
  quotesLoading: boolean;
  error: string | null;
  fetchQuotes: (fiatAmount: number, fiatCurrency: string, cryptoCurrency: string) => Promise<void>;
  getBuyUrl: (providerId: string, params: BuyUrlParams) => Promise<string | null>;
  trackTransaction: (transactionId: string) => void;
  refreshProviders: () => Promise<void>;
  bestProvider: Provider | null;
}

interface BuyUrlParams {
  walletAddress: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoCurrency: string;
}

// Default providers with realistic data
const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: "moonpay",
    name: "MoonPay",
    logo: "🌙",
    description: "Fast & easy crypto purchases with cards",
    fees: "1.5% - 4.5%",
    feePercent: 3.25,
    speed: "Instant",
    paymentMethods: ["Credit Card", "Debit Card", "Apple Pay", "Google Pay", "Bank Transfer"],
    minAmount: 20,
    maxAmount: 50000,
    featured: true,
    rating: 4.8,
    available: true,
    supportedCurrencies: ["USD", "EUR", "GBP", "CAD", "AUD"],
    supportedCrypto: ["ETH", "BTC", "USDC", "USDT", "MATIC", "ARB"],
  },
  {
    id: "transak",
    name: "Transak",
    logo: "⚡",
    description: "170+ countries, competitive fees",
    fees: "0.99% - 5.5%",
    feePercent: 2.99,
    speed: "Instant - 1 hour",
    paymentMethods: ["Credit Card", "Debit Card", "Bank Transfer", "UPI", "PIX"],
    minAmount: 15,
    maxAmount: 28000,
    featured: true,
    rating: 4.7,
    available: true,
    supportedCurrencies: ["USD", "EUR", "GBP", "INR", "BRL"],
    supportedCrypto: ["ETH", "BTC", "USDC", "USDT", "MATIC", "SOL"],
  },
  {
    id: "ramp",
    name: "Ramp Network",
    logo: "🚀",
    description: "European focus, lowest bank transfer fees",
    fees: "0.49% - 2.99%",
    feePercent: 1.49,
    speed: "Instant - 3 days",
    paymentMethods: ["Bank Transfer", "Card", "Apple Pay"],
    minAmount: 5,
    maxAmount: 10000,
    rating: 4.6,
    available: true,
    supportedCurrencies: ["USD", "EUR", "GBP", "PLN"],
    supportedCrypto: ["ETH", "USDC", "DAI", "MATIC"],
  },
  {
    id: "banxa",
    name: "Banxa",
    logo: "💎",
    description: "Australian provider, instant card payments",
    fees: "1.0% - 3.0%",
    feePercent: 2.0,
    speed: "Instant - 1 hour",
    paymentMethods: ["Credit Card", "Debit Card", "Bank Transfer", "POLi"],
    minAmount: 30,
    maxAmount: 15000,
    rating: 4.5,
    available: true,
    supportedCurrencies: ["USD", "EUR", "GBP", "AUD", "NZD"],
    supportedCrypto: ["ETH", "BTC", "USDC", "USDT", "SOL"],
  },
  {
    id: "wyre",
    name: "Wyre",
    logo: "🔷",
    description: "US-focused, ACH bank transfers",
    fees: "0.75% - 2.9%",
    feePercent: 1.5,
    speed: "1-5 business days",
    paymentMethods: ["ACH Bank Transfer", "Debit Card"],
    minAmount: 25,
    maxAmount: 5000,
    rating: 4.4,
    available: true,
    supportedCurrencies: ["USD"],
    supportedCrypto: ["ETH", "BTC", "USDC", "DAI"],
  },
];

export function useBuyProviders(): UseBuyProvidersReturn {
  const [providers, setProviders] = useState<Provider[]>(DEFAULT_PROVIDERS);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers availability and rates
  const refreshProviders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/fiat/providers`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.providers) {
          // Merge API data with defaults
          const apiProviders = data.data.providers;
          const merged = DEFAULT_PROVIDERS.map(dp => {
            const apiProvider = apiProviders.find((ap: any) => ap.id === dp.id);
            return apiProvider ? { ...dp, ...apiProvider } : dp;
          });
          setProviders(merged);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch providers, using defaults:', err);
      // Keep using defaults
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch quotes from all providers
  const fetchQuotes = useCallback(async (
    fiatAmount: number,
    fiatCurrency: string,
    cryptoCurrency: string
  ) => {
    if (!fiatAmount || fiatAmount <= 0) return;

    setQuotesLoading(true);
    setError(null);

    try {
      // Try to fetch real quotes from API
      const response = await fetch(`${API_URL}/api/fiat/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiatAmount, fiatCurrency, cryptoCurrency }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.quotes) {
          setQuotes(data.data.quotes);

          // Update providers with quote data
          setProviders(prev => prev.map(p => {
            const quote = data.data.quotes.find((q: Quote) => q.providerId === p.id);
            if (quote) {
              return {
                ...p,
                estimatedReceive: quote.cryptoAmount,
                totalCost: quote.totalCost,
              };
            }
            return p;
          }));
          return;
        }
      }

      // Fallback: Generate mock quotes based on provider fee percentages
      const mockCryptoPrice = cryptoCurrency === 'BTC' ? 42000 :
                            cryptoCurrency === 'ETH' ? 2350 :
                            cryptoCurrency === 'SOL' ? 95 : 1; // stablecoins

      const mockQuotes: Quote[] = providers
        .filter(p => p.available &&
                    p.supportedCurrencies.includes(fiatCurrency) &&
                    p.supportedCrypto.includes(cryptoCurrency) &&
                    fiatAmount >= p.minAmount &&
                    fiatAmount <= p.maxAmount)
        .map(p => {
          const fees = fiatAmount * (p.feePercent / 100);
          const netAmount = fiatAmount - fees;
          const cryptoAmount = netAmount / mockCryptoPrice;

          return {
            providerId: p.id,
            fiatAmount,
            fiatCurrency,
            cryptoAmount,
            cryptoCurrency,
            exchangeRate: mockCryptoPrice,
            fees,
            totalCost: fiatAmount,
            estimatedTime: p.speed,
            expiresAt: Date.now() + 60000, // 1 minute
          };
        })
        .sort((a, b) => b.cryptoAmount - a.cryptoAmount); // Best rate first

      setQuotes(mockQuotes);

      // Mark best rate
      const bestQuote = mockQuotes[0];
      setProviders(prev => prev.map((p, i) => {
        const quote = mockQuotes.find(q => q.providerId === p.id);
        return {
          ...p,
          estimatedReceive: quote?.cryptoAmount,
          totalCost: quote?.totalCost,
          bestRate: quote?.providerId === bestQuote?.providerId,
        };
      }));

    } catch (err: any) {
      console.error('Failed to fetch quotes:', err);
      setError('Failed to fetch quotes. Please try again.');
    } finally {
      setQuotesLoading(false);
    }
  }, [providers]);

  // Get buy URL for a specific provider
  const getBuyUrl = useCallback(async (
    providerId: string,
    params: BuyUrlParams
  ): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/api/fiat/buy-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          ...params,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.url) {
          return data.data.url;
        }
      }

      // Fallback: construct widget URLs directly
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return null;

      // These are example widget URLs - real implementation would use actual API keys
      const baseUrls: Record<string, string> = {
        moonpay: `https://buy.moonpay.com?apiKey=pk_live_example`,
        transak: `https://global.transak.com?apiKey=example`,
        ramp: `https://buy.ramp.network?hostApiKey=example`,
        banxa: `https://checkout.banxa.com?publishableKey=example`,
        wyre: `https://pay.sendwyre.com?accountId=example`,
      };

      const baseUrl = baseUrls[providerId];
      if (!baseUrl) return null;

      const url = new URL(baseUrl);
      url.searchParams.set('walletAddress', params.walletAddress);
      url.searchParams.set('defaultFiatAmount', params.fiatAmount.toString());
      url.searchParams.set('fiatCurrency', params.fiatCurrency);
      url.searchParams.set('cryptoCurrency', params.cryptoCurrency);

      return url.toString();

    } catch (err) {
      console.error('Failed to get buy URL:', err);
      return null;
    }
  }, [providers]);

  // Track transaction status via polling
  const trackTransaction = useCallback((transactionId: string) => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/fiat/transaction/${transactionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const tx: Transaction = {
              ...data.data,
              createdAt: new Date(data.data.createdAt),
              updatedAt: new Date(data.data.updatedAt),
            };

            setActiveTransaction(tx);
            setTransactions(prev => {
              const existing = prev.findIndex(t => t.id === tx.id);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = tx;
                return updated;
              }
              return [tx, ...prev];
            });

            // Continue polling if still processing
            if (tx.status === 'pending' || tx.status === 'processing') {
              setTimeout(pollStatus, 5000);
            }
          }
        }
      } catch (err) {
        console.error('Failed to track transaction:', err);
      }
    };

    pollStatus();
  }, []);

  // Find best provider based on quotes
  const bestProvider = useMemo(() => {
    if (quotes.length === 0) return null;
    const bestQuote = quotes.reduce((best, q) =>
      q.cryptoAmount > best.cryptoAmount ? q : best
    );
    return providers.find(p => p.id === bestQuote.providerId) || null;
  }, [quotes, providers]);

  // Initial load
  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/fiat/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.transactions) {
            setTransactions(data.data.transactions.map((t: any) => ({
              ...t,
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    };

    fetchTransactions();
  }, []);

  return {
    providers,
    quotes,
    activeTransaction,
    transactions,
    loading,
    quotesLoading,
    error,
    fetchQuotes,
    getBuyUrl,
    trackTransaction,
    refreshProviders,
    bestProvider,
  };
}

export default useBuyProviders;
