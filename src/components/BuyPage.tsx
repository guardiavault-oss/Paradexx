/**
 * BuyPage - On-ramp page for purchasing crypto via Moonpay, Transak, etc.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
import {
  CreditCard,
  Building2,
  Smartphone,
  Globe,
  ChevronRight,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  X,
  DollarSign,
  Euro,
  PoundSterling,
} from "lucide-react";

interface BuyPageProps {
  onBack?: () => void;
  type: "degen" | "regen";
}

interface Provider {
  id: string;
  name: string;
  logo: string;
  description: string;
  fees: string;
  speed: string;
  paymentMethods: string[];
  minAmount: number;
  maxAmount: number;
  featured?: boolean;
  rating: number;
}

const providers: Provider[] = [
  {
    id: "moonpay",
    name: "MoonPay",
    logo: "🌙",
    description: "Fast & easy crypto purchases with cards",
    fees: "1.5% - 4.5%",
    speed: "Instant",
    paymentMethods: ["Credit Card", "Debit Card", "Apple Pay", "Google Pay", "Bank Transfer"],
    minAmount: 20,
    maxAmount: 50000,
    featured: true,
    rating: 4.8,
  },
  {
    id: "transak",
    name: "Transak",
    logo: "⚡",
    description: "170+ countries, lowest fees",
    fees: "0.99% - 5.5%",
    speed: "Instant - 1 hour",
    paymentMethods: ["Credit Card", "Debit Card", "Bank Transfer", "UPI", "PIX"],
    minAmount: 15,
    maxAmount: 28000,
    featured: true,
    rating: 4.7,
  },
  {
    id: "ramp",
    name: "Ramp",
    logo: "🚀",
    description: "European focus, bank transfers",
    fees: "0.49% - 2.99%",
    speed: "Instant - 3 days",
    paymentMethods: ["Bank Transfer", "Card", "Apple Pay"],
    minAmount: 5,
    maxAmount: 10000,
    rating: 4.6,
  },
];

const cryptoOptions = [
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", color: "#627EEA" },
  { symbol: "BTC", name: "Bitcoin", icon: "₿", color: "#F7931A" },
  { symbol: "USDC", name: "USD Coin", icon: "$", color: "#2775CA" },
  { symbol: "USDT", name: "Tether", icon: "₮", color: "#26A17B" },
  { symbol: "MATIC", name: "Polygon", icon: "◈", color: "#8247E5" },
  { symbol: "ARB", name: "Arbitrum", icon: "A", color: "#28A0F0" },
];

const currencies = [
  { code: "USD", symbol: "$", icon: DollarSign },
  { code: "EUR", symbol: "€", icon: Euro },
  { code: "GBP", symbol: "£", icon: PoundSterling },
];

interface BuyPageProps {
  onBack?: () => void;
  type: "degen" | "regen";
  walletAddress?: string;
}

export function BuyPage({ onBack, type, walletAddress }: BuyPageProps) {
  // Use design system theme styles
  const theme = getThemeStyles(type);
  const primaryColor = theme.primaryColor;

  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [amount, setAmount] = useState("100");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showCryptoSelector, setShowCryptoSelector] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedCrypto = parseFloat(amount) / 2500;

  const handleProviderSelect = async (provider: Provider) => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) < provider.minAmount) {
      setError(`Minimum amount is ${provider.minAmount} ${selectedCurrency.code}`);
      return;
    }

    if (parseFloat(amount) > provider.maxAmount) {
      setError(`Maximum amount is ${provider.maxAmount} ${selectedCurrency.code}`);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedProvider(provider);

    try {
      const { apiServices } = await import('@/services');
      const response = await apiServices.fiat.getBuyUrl({
        provider: provider.id,
        walletAddress,
        cryptoCurrency: selectedCrypto.symbol,
        fiatCurrency: selectedCurrency.code,
        fiatAmount: parseFloat(amount),
      });

      if (response.success && response.data?.url) {
        // Open provider widget in new window
        window.open(response.data.url, '_blank', 'width=500,height=700');
      } else {
        throw new Error(response.message || 'Failed to generate buy URL');
      }
    } catch (err: any) {
      console.error('Buy error:', err);
      setError(err.message || 'Failed to open provider. Please try again.');
      setSelectedProvider(null);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24 relative">
      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-900/90 border border-red-500/50 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-red-100 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={onBack} className="p-2 hover:bg-[var(--bg-hover)] rounded-[var(--radius-lg)]">
                <X className="w-5 h-5 text-[var(--text-primary)]" />
              </button>
            )}
            <div>
              <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text-primary)]">Buy Crypto</h1>
              <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">Purchase crypto instantly with card or bank</p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: `${primaryColor}20` }}
          >
            <Shield className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-xs font-medium" style={{ color: primaryColor }}>Secure</span>
          </div>
        </div>

        {/* Amount Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6"
          style={{
            background: "var(--bg-hover)",
            backdropFilter: "blur(var(--blur-xl))",
            border: `1px solid ${primaryColor}20`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[var(--text-sm)] text-[var(--text-tertiary)]">You pay</span>
            <button
              onClick={() => setShowCurrencySelector(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-active)] rounded-[var(--radius-lg)] hover:bg-[var(--bg-hover)] transition-all duration-[var(--duration-normal)]"
            >
              <selectedCurrency.icon className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-[var(--text-sm)] text-[var(--text-primary)] font-medium">{selectedCurrency.code}</span>
              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-[var(--text-4xl)] text-[var(--text-tertiary)]">{selectedCurrency.symbol}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-[var(--text-4xl)] font-bold text-[var(--text-primary)] outline-none"
              placeholder="0"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all`}
                style={{
                  background: amount === quickAmount.toString() ? `var(--bg-active)` : "var(--bg-base)",
                  color: amount === quickAmount.toString() ? "var(--text-primary)" : "var(--text-tertiary)",
                  border: amount === quickAmount.toString() ? `1px solid var(--border-primary)` : "1px solid var(--border-neutral)",
                }}
              >
                {selectedCurrency.symbol}{quickAmount}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Crypto Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 mb-6"
          style={{
            background: "var(--bg-hover)",
            backdropFilter: "blur(var(--blur-xl))",
            border: `1px solid ${primaryColor}20`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[var(--text-sm)] text-[var(--text-tertiary)]">You receive (estimated)</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-[var(--text-primary)]"
                style={{ backgroundColor: selectedCrypto.color }}
              >
                {selectedCrypto.icon}
              </div>
              <div>
                <div className="text-[var(--text-2xl)] font-bold text-[var(--text-primary)]">
                  ~{estimatedCrypto.toFixed(6)} {selectedCrypto.symbol}
                </div>
                <div className="text-[var(--text-sm)] text-[var(--text-tertiary)]">{selectedCrypto.name}</div>
              </div>
            </div>
            <button
              onClick={() => setShowCryptoSelector(true)}
              className="p-3 bg-[var(--bg-active)] rounded-[var(--radius-xl)] hover:bg-[var(--bg-hover)] transition-all duration-[var(--duration-normal)]"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/60" />
            </button>
          </div>
        </motion.div>

        {/* Provider Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Select Provider</h2>
          <div className="space-y-3">
            {providers.map((provider, index) => (
              <motion.button
                key={provider.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => handleProviderSelect(provider)}
                disabled={loading || !walletAddress}
                className={`w-full rounded-[var(--radius-2xl)] p-4 text-left transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-hover)] ${
                  loading || !walletAddress ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(20px)",
                  border: provider.featured ? `1px solid var(--border-primary)` : "1px solid var(--border-neutral)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--bg-active)] rounded-[var(--radius-xl)] flex items-center justify-center text-2xl">
                    {provider.logo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[var(--text-primary)]">{provider.name}</span>
                      {provider.featured && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: `${primaryColor}20`, color: primaryColor }}
                        >
                          POPULAR
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-primary)]/60 ml-auto">⭐ {provider.rating}</span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)]/60 mb-2">{provider.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-primary)]/40">
                        <Clock className="w-3 h-3" />
                        <span>{provider.speed}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-primary)]/40">
                        <CreditCard className="w-3 h-3" />
                        <span>{provider.fees}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-primary)]/60 flex-shrink-0 mt-2" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-white/5 rounded-xl p-4 text-center backdrop-blur-xl">
            <Zap className="w-6 h-6 mx-auto mb-2" style={{ color: primaryColor }} />
            <div className="text-xs text-[var(--text-primary)]/60">Instant</div>
            <div className="text-sm font-medium text-[var(--text-primary)]">Delivery</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center backdrop-blur-xl">
            <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xs text-[var(--text-primary)]/60">Secure</div>
            <div className="text-sm font-medium text-[var(--text-primary)]">Payments</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center backdrop-blur-xl">
            <Globe className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-xs text-[var(--text-primary)]/60">170+</div>
            <div className="text-sm font-medium text-[var(--text-primary)]">Countries</div>
          </div>
        </motion.div>
      </div>

      {/* Crypto Selector Modal */}
      <AnimatePresence>
        {showCryptoSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--bg-base)]/80 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowCryptoSelector(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="w-full max-w-lg bg-[var(--bg-base)] rounded-t-3xl p-6"
              style={{ border: `1px solid ${primaryColor}40` }}
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Select Cryptocurrency</h3>
              <div className="space-y-2">
                {cryptoOptions.map((crypto) => (
                  <button
                    key={crypto.symbol}
                    onClick={() => {
                      setSelectedCrypto(crypto);
                      setShowCryptoSelector(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors`}
                    style={{
                      background: selectedCrypto.symbol === crypto.symbol ? `${primaryColor}20` : "rgba(255, 255, 255, 0.05)",
                      border: selectedCrypto.symbol === crypto.symbol ? `1px solid ${primaryColor}` : "1px solid transparent",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-[var(--text-primary)]"
                      style={{ backgroundColor: crypto.color }}
                    >
                      {crypto.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-[var(--text-primary)]">{crypto.symbol}</div>
                      <div className="text-[var(--text-sm)] text-[var(--text-tertiary)]">{crypto.name}</div>
                    </div>
                    {selectedCrypto.symbol === crypto.symbol && (
                      <CheckCircle className="w-5 h-5 ml-auto" style={{ color: primaryColor }} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Currency Selector Modal */}
      <AnimatePresence>
        {showCurrencySelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--bg-base)]/80 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowCurrencySelector(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[var(--bg-base)] rounded-t-3xl p-6"
              style={{ border: `1px solid ${primaryColor}40` }}
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Select Currency</h3>
              <div className="space-y-2">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      setSelectedCurrency(currency);
                      setShowCurrencySelector(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors`}
                    style={{
                      background: selectedCurrency.code === currency.code ? `${primaryColor}20` : "rgba(255, 255, 255, 0.05)",
                      border: selectedCurrency.code === currency.code ? `1px solid ${primaryColor}` : "1px solid transparent",
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <currency.icon className="w-5 h-5 text-[var(--text-primary)]" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-[var(--text-primary)]">{currency.code}</div>
                      <div className="text-[var(--text-sm)] text-[var(--text-tertiary)]">{currency.symbol}</div>
                    </div>
                    {selectedCurrency.code === currency.code && (
                      <CheckCircle className="w-5 h-5 ml-auto" style={{ color: primaryColor }} />
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
