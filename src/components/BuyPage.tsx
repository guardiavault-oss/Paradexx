/**
 * BuyPage - Enhanced On-ramp page with real-time provider comparison
 *
 * Features:
 * - Real-time rate comparison across providers
 * - Dynamic fee calculation
 * - Payment status tracking
 * - Provider availability checks
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
import {
  ChevronRight,
  Shield,
  Clock,
  CheckCircle,
  X,
  DollarSign,
  Euro,
  PoundSterling,
  RefreshCw,
  Star,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useBuyProviders } from "../hooks/useBuyProviders";

interface BuyPageProps {
  onBack?: () => void;
  type: "degen" | "regen";
  walletAddress?: string;
}

const cryptoOptions = [
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", color: "#627EEA" },
  { symbol: "BTC", name: "Bitcoin", icon: "₿", color: "#F7931A" },
  { symbol: "USDC", name: "USD Coin", icon: "$", color: "#2775CA" },
  { symbol: "USDT", name: "Tether", icon: "₮", color: "#26A17B" },
  { symbol: "MATIC", name: "Polygon", icon: "◈", color: "#8247E5" },
  { symbol: "ARB", name: "Arbitrum", icon: "A", color: "#28A0F0" },
  { symbol: "SOL", name: "Solana", icon: "◎", color: "#9945FF" },
];

const currencies = [
  { code: "USD", symbol: "$", icon: DollarSign },
  { code: "EUR", symbol: "€", icon: Euro },
  { code: "GBP", symbol: "£", icon: PoundSterling },
];

export function BuyPage({ onBack, type, walletAddress }: BuyPageProps) {
  // Use design system theme styles
  const theme = getThemeStyles(type);
  const primaryColor = theme.primaryColor;

  // Use enhanced buy providers hook
  const {
    providers,
    quotes,
    loading: providersLoading,
    quotesLoading,
    error: providerError,
    fetchQuotes,
    getBuyUrl,
    bestProvider,
    refreshProviders,
  } = useBuyProviders();

  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [amount, setAmount] = useState("100");
  const [showCryptoSelector, setShowCryptoSelector] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuoteTime, setLastQuoteTime] = useState<Date | null>(null);

  // Fetch quotes when amount or currency changes
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      const timer = setTimeout(() => {
        fetchQuotes(numAmount, selectedCurrency.code, selectedCrypto.symbol);
        setLastQuoteTime(new Date());
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [amount, selectedCurrency.code, selectedCrypto.symbol, fetchQuotes]);

  // Set error from provider error
  useEffect(() => {
    if (providerError) {
      setError(providerError);
    }
  }, [providerError]);

  const handleProviderSelect = async (providerId: string) => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < provider.minAmount) {
      setError(`Minimum amount is ${provider.minAmount} ${selectedCurrency.code}`);
      return;
    }

    if (numAmount > provider.maxAmount) {
      setError(`Maximum amount is ${provider.maxAmount} ${selectedCurrency.code}`);
      return;
    }

    setPurchaseLoading(true);
    setError(null);

    try {
      const url = await getBuyUrl(providerId, {
        walletAddress,
        fiatAmount: numAmount,
        fiatCurrency: selectedCurrency.code,
        cryptoCurrency: selectedCrypto.symbol,
      });

      if (url) {
        window.open(url, '_blank', 'width=500,height=700');
      } else {
        throw new Error('Failed to generate buy URL');
      }
    } catch (err: unknown) {
      console.error('Buy error:', err);
      setError((err as Error)?.message || 'Failed to open provider. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  // Get quote for a specific provider
  const getProviderQuote = (providerId: string) => {
    return quotes.find(q => q.providerId === providerId);
  };

  // Filter available providers
  const availableProviders = providers.filter(p => {
    const numAmount = parseFloat(amount) || 0;
    return (
      p.available &&
      p.supportedCurrencies.includes(selectedCurrency.code) &&
      p.supportedCrypto.includes(selectedCrypto.symbol) &&
      numAmount >= p.minAmount &&
      numAmount <= p.maxAmount
    );
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24 relative">
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
          >
            <div className="bg-red-900/90 border border-red-500/50 rounded-xl p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-red-100 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-300 hover:text-red-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Address Warning */}
      {!walletAddress && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-yellow-900/90 border border-yellow-500/50 rounded-xl p-4 backdrop-blur-xl">
            <p className="text-yellow-100 text-sm">
              ⚠️ Please connect your wallet to purchase crypto
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-white/5"
              >
                <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] rotate-180" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Buy Crypto
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Compare rates & buy instantly
              </p>
            </div>
          </div>

          <button
            onClick={refreshProviders}
            disabled={providersLoading}
            className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-white/5 hover:border-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-[var(--text-secondary)] ${providersLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Amount Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-elevated)] rounded-2xl p-4 mb-4 border border-white/5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--text-secondary)]">You Pay</span>
            {lastQuoteTime && (
              <span className="text-xs text-[var(--text-muted)]">
                Updated {lastQuoteTime.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCurrencySelector(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-white/10 hover:border-white/20 transition-colors"
            >
              {React.createElement(selectedCurrency.icon, { className: "w-4 h-4" })}
              <span className="font-medium">{selectedCurrency.code}</span>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-3xl font-bold text-[var(--text-primary)] outline-none text-right"
              placeholder="0.00"
            />
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mt-4">
            {quickAmounts.map((qa) => (
              <button
                key={qa}
                onClick={() => setAmount(qa.toString())}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  amount === qa.toString()
                    ? `bg-[${primaryColor}] text-white`
                    : 'bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-white/5'
                }`}
              >
                {selectedCurrency.symbol}{qa}
              </button>
            ))}
          </div>
        </motion.div>

        {/* You Receive Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--bg-elevated)] rounded-2xl p-4 mb-6 border border-white/5"
        >
          <span className="text-sm text-[var(--text-secondary)] mb-3 block">You Receive (Est.)</span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCryptoSelector(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-white/10 hover:border-white/20 transition-colors"
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: selectedCrypto.color + '20', color: selectedCrypto.color }}
              >
                {selectedCrypto.icon}
              </span>
              <span className="font-medium">{selectedCrypto.symbol}</span>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            <div className="flex-1 text-right">
              {quotesLoading ? (
                <div className="flex items-center justify-end gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                  <span className="text-lg text-[var(--text-muted)]">Fetching rates...</span>
                </div>
              ) : bestProvider?.estimatedReceive ? (
                <div>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">
                    {bestProvider.estimatedReceive.toFixed(6)}
                  </p>
                  <p className="text-xs text-green-400 flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Best rate via {bestProvider.name}
                  </p>
                </div>
              ) : (
                <span className="text-3xl font-bold text-[var(--text-muted)]">--</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Providers List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Select Provider
            </h2>
            {availableProviders.length > 0 && (
              <span className="text-sm text-[var(--text-muted)]">
                {availableProviders.length} available
              </span>
            )}
          </div>

          {providersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : availableProviders.length === 0 ? (
            <div className="bg-[var(--bg-elevated)] rounded-2xl p-8 text-center border border-white/5">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-[var(--text-secondary)] mb-2">No providers available</p>
              <p className="text-sm text-[var(--text-muted)]">
                Try adjusting the amount or selecting a different currency/crypto
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableProviders.map((provider, index) => {
                const quote = getProviderQuote(provider.id);
                const isBest = bestProvider?.id === provider.id;

                return (
                  <motion.button
                    key={provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleProviderSelect(provider.id)}
                    disabled={purchaseLoading || !walletAddress}
                    className={`w-full p-4 rounded-2xl border transition-all text-left ${
                      isBest
                        ? `bg-[${primaryColor}]/10 border-[${primaryColor}]/30`
                        : 'bg-[var(--bg-elevated)] border-white/5 hover:border-white/10'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Provider Logo */}
                      <div className="text-3xl">{provider.logo}</div>

                      {/* Provider Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[var(--text-primary)]">
                            {provider.name}
                          </h3>
                          {isBest && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Best Rate
                            </span>
                          )}
                          {provider.featured && !isBest && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-2">
                          {provider.description}
                        </p>

                        {/* Rate Info */}
                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Fee: {provider.fees}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {provider.speed}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {provider.rating}
                          </span>
                        </div>

                        {/* Payment Methods */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {provider.paymentMethods.slice(0, 3).map((method) => (
                            <span
                              key={method}
                              className="px-2 py-0.5 rounded text-xs bg-[var(--bg-base)] text-[var(--text-muted)]"
                            >
                              {method}
                            </span>
                          ))}
                          {provider.paymentMethods.length > 3 && (
                            <span className="px-2 py-0.5 rounded text-xs bg-[var(--bg-base)] text-[var(--text-muted)]">
                              +{provider.paymentMethods.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount & Arrow */}
                      <div className="text-right">
                        {quote ? (
                          <div>
                            <p className="text-lg font-bold text-[var(--text-primary)]">
                              {quote.cryptoAmount.toFixed(6)}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {selectedCrypto.symbol}
                            </p>
                          </div>
                        ) : quotesLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                        ) : (
                          <ArrowRight className="w-5 h-5 text-[var(--text-muted)]" />
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--text-muted)]"
        >
          <Shield className="w-4 h-4 text-green-500" />
          <span>Secure transactions • No hidden fees</span>
        </motion.div>
      </div>

      {/* Currency Selector Modal */}
      <AnimatePresence>
        {showCurrencySelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowCurrencySelector(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full bg-[var(--bg-elevated)] rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Select Currency
                </h3>
                <button
                  onClick={() => setShowCurrencySelector(false)}
                  className="p-2 rounded-full bg-[var(--bg-base)]"
                >
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>

              <div className="space-y-2">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      setSelectedCurrency(currency);
                      setShowCurrencySelector(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                      selectedCurrency.code === currency.code
                        ? `bg-[${primaryColor}]/10 border border-[${primaryColor}]/30`
                        : 'bg-[var(--bg-base)] hover:bg-white/5'
                    }`}
                  >
                    {React.createElement(currency.icon, { className: "w-6 h-6" })}
                    <span className="font-medium text-[var(--text-primary)]">{currency.code}</span>
                    {selectedCurrency.code === currency.code && (
                      <CheckCircle className="w-5 h-5 ml-auto text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crypto Selector Modal */}
      <AnimatePresence>
        {showCryptoSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowCryptoSelector(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full bg-[var(--bg-elevated)] rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Select Crypto
                </h3>
                <button
                  onClick={() => setShowCryptoSelector(false)}
                  className="p-2 rounded-full bg-[var(--bg-base)]"
                >
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>

              <div className="space-y-2">
                {cryptoOptions.map((crypto) => (
                  <button
                    key={crypto.symbol}
                    onClick={() => {
                      setSelectedCrypto(crypto);
                      setShowCryptoSelector(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                      selectedCrypto.symbol === crypto.symbol
                        ? `bg-[${primaryColor}]/10 border border-[${primaryColor}]/30`
                        : 'bg-[var(--bg-base)] hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: crypto.color + '20', color: crypto.color }}
                    >
                      {crypto.icon}
                    </span>
                    <div className="text-left">
                      <p className="font-medium text-[var(--text-primary)]">{crypto.symbol}</p>
                      <p className="text-sm text-[var(--text-muted)]">{crypto.name}</p>
                    </div>
                    {selectedCrypto.symbol === crypto.symbol && (
                      <CheckCircle className="w-5 h-5 ml-auto text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BuyPage;
