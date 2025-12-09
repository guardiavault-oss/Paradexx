/**
 * PricingPage - Subscription and pricing display component
 *
 * Features:
 * - Subscription tier comparison
 * - Monthly/Annual toggle
 * - Fee savings calculator
 * - Premium feature add-ons
 * - Lifetime pass promotion
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles } from "../design-system";
import {
  Check,
  Crown,
  Zap,
  Shield,
  Star,
  Sparkles,
  Calculator,
  ChevronDown,
  ChevronUp,
  Gift,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import {
  SUBSCRIPTION_TIERS,
  PREMIUM_FEATURES,
  PREMIUM_BUNDLE,
  LIFETIME_PASS,
  SubscriptionTier,
  calculateFeeSavings,
  getYearlySavings,
} from "../config/pricing";

interface PricingPageProps {
  type?: "degen" | "regen";
  currentTier?: SubscriptionTier;
  onSelectPlan?: (tier: SubscriptionTier) => void;
  onSelectFeature?: (featureId: string) => void;
  onSelectBundle?: () => void;
  onSelectLifetime?: () => void;
  walletAddress?: string;
}

export function PricingPage({
  type = "degen",
  currentTier = "free",
  onSelectPlan,
  onSelectFeature,
  onSelectBundle,
  onSelectLifetime,
}: PricingPageProps) {
  const theme = getThemeStyles(type);
  const primaryColor = theme.primaryColor;
  const isDegen = type === "degen";

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [showCalculator, setShowCalculator] = useState(false);
  const [tradeVolume, setTradeVolume] = useState(10000);
  const [showAddons, setShowAddons] = useState(false);

  // Calculate potential savings based on trading volume
  const savingsCalculation = useMemo(() => {
    const tiers: SubscriptionTier[] = ['free', 'pro', 'elite', 'lifetime'];
    return tiers.map(tier => {
      const tierInfo = SUBSCRIPTION_TIERS[tier];
      const monthlySavings = calculateFeeSavings(tradeVolume, tier);
      const yearlySavings = monthlySavings * 12;
      const subscriptionCost = tier === 'lifetime'
        ? tierInfo.price
        : (billingPeriod === 'yearly' ? tierInfo.priceYearly : tierInfo.priceMonthly * 12);
      const netSavings = yearlySavings - subscriptionCost;

      return {
        tier,
        tierInfo,
        monthlySavings,
        yearlySavings,
        subscriptionCost,
        netSavings,
        worthIt: netSavings > 0,
      };
    });
  }, [tradeVolume, billingPeriod]);

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return DollarSign;
      case 'pro': return Zap;
      case 'elite': return Crown;
      case 'lifetime': return Infinity;
    }
  };

  const getTierGradient = (tier: SubscriptionTier) => {
    if (isDegen) {
      switch (tier) {
        case 'free': return 'from-gray-600 to-gray-800';
        case 'pro': return 'from-orange-500 to-red-600';
        case 'elite': return 'from-red-500 to-purple-600';
        case 'lifetime': return 'from-yellow-400 via-orange-500 to-red-600';
      }
    } else {
      switch (tier) {
        case 'free': return 'from-gray-500 to-gray-700';
        case 'pro': return 'from-blue-500 to-cyan-500';
        case 'elite': return 'from-blue-600 to-purple-600';
        case 'lifetime': return 'from-emerald-400 via-cyan-500 to-blue-600';
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Choose Your Plan
            </h1>
            <p className="text-[var(--text-muted)]">
              Unlock premium features and lower fees
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-6">
            <div className="bg-[var(--bg-elevated)] rounded-full p-1 flex gap-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? `bg-gradient-to-r ${isDegen ? 'from-red-500 to-orange-500' : 'from-blue-500 to-cyan-500'} text-white`
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "yearly"
                    ? `bg-gradient-to-r ${isDegen ? 'from-red-500 to-orange-500' : 'from-blue-500 to-cyan-500'} text-white`
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Yearly
                <span className="ml-1 text-xs text-green-400">Save 20%</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Subscription Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {(Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS.free][]).map(
            ([tierId, tier]) => {
              const Icon = getTierIcon(tierId);
              const isCurrentTier = tierId === currentTier;
              const isPopular = tier.popular;
              const isLifetime = tierId === 'lifetime';

              return (
                <motion.div
                  key={tierId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative rounded-2xl overflow-hidden ${
                    isPopular ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-base)]' : ''
                  }`}
                  style={{
                    ringColor: isPopular ? primaryColor : undefined,
                  }}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <div
                      className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl bg-gradient-to-r ${getTierGradient(tierId)} text-white`}
                    >
                      {tier.badge}
                    </div>
                  )}

                  <div className="bg-[var(--bg-elevated)] p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-6">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getTierGradient(tierId)} flex items-center justify-center mb-4`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        {tier.name}
                      </h3>

                      <div className="mt-2">
                        {isLifetime ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-[var(--text-primary)]">
                              ${tier.price}
                            </span>
                            <span className="text-[var(--text-muted)]">one-time</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-[var(--text-primary)]">
                              ${billingPeriod === 'yearly' && tier.priceYearly > 0
                                ? (tier.priceYearly / 12).toFixed(2)
                                : tier.priceMonthly.toFixed(2)}
                            </span>
                            {tier.priceMonthly > 0 && (
                              <span className="text-[var(--text-muted)]">/mo</span>
                            )}
                          </div>
                        )}

                        {billingPeriod === 'yearly' && getYearlySavings(tierId) > 0 && (
                          <p className="text-sm text-green-400 mt-1">
                            Save ${getYearlySavings(tierId).toFixed(0)}/year
                          </p>
                        )}
                      </div>

                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        {tier.description}
                      </p>
                    </div>

                    {/* Swap Fee */}
                    <div className="bg-[var(--bg-base)] rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-muted)]">Swap Fee</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {tier.swapFee}
                        </span>
                      </div>
                      {tier.swapFeeDiscount > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingDown className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400">
                            {tier.swapFeeDiscount}% lower than free tier
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 flex-grow">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-[var(--text-secondary)]">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => {
                        if (isLifetime && onSelectLifetime) {
                          onSelectLifetime();
                        } else if (onSelectPlan) {
                          onSelectPlan(tierId);
                        }
                      }}
                      disabled={isCurrentTier}
                      className={`mt-6 w-full py-3 rounded-xl font-medium transition-all ${
                        isCurrentTier
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : `bg-gradient-to-r ${getTierGradient(tierId)} text-white hover:opacity-90`
                      }`}
                    >
                      {isCurrentTier ? "Current Plan" : isLifetime ? "Get Lifetime Access" : "Upgrade"}
                    </button>
                  </div>
                </motion.div>
              );
            }
          )}
        </div>

        {/* Savings Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-elevated)] rounded-2xl p-6 mb-12"
        >
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                  isDegen ? 'from-orange-500 to-red-500' : 'from-blue-500 to-cyan-500'
                } flex items-center justify-center`}
              >
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-[var(--text-primary)]">
                  Fee Savings Calculator
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  See how much you could save
                </p>
              </div>
            </div>
            {showCalculator ? (
              <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
            )}
          </button>

          <AnimatePresence>
            {showCalculator && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-6 border-t border-white/10 mt-6">
                  <div className="mb-6">
                    <label htmlFor="trade-volume-slider" className="block text-sm text-[var(--text-muted)] mb-2">
                      Monthly Trading Volume (USD)
                    </label>
                    <input
                      id="trade-volume-slider"
                      type="range"
                      min="1000"
                      max="1000000"
                      step="1000"
                      value={tradeVolume}
                      onChange={(e) => setTradeVolume(Number(e.target.value))}
                      className="w-full"
                      aria-label="Monthly trading volume slider"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-[var(--text-muted)]">$1K</span>
                      <span className="text-lg font-bold text-[var(--text-primary)]">
                        ${tradeVolume.toLocaleString()}
                      </span>
                      <span className="text-sm text-[var(--text-muted)]">$1M</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {savingsCalculation.map(({ tier, tierInfo, yearlySavings, subscriptionCost, netSavings, worthIt }) => (
                      <div
                        key={tier}
                        className={`rounded-xl p-4 ${
                          worthIt
                            ? 'bg-green-500/10 border border-green-500/30'
                            : 'bg-[var(--bg-base)]'
                        }`}
                      >
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">
                          {tierInfo.name}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Fee savings/yr:</span>
                            <span className="text-green-400">${yearlySavings.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Plan cost/yr:</span>
                            <span className="text-red-400">-${subscriptionCost.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                            <span className="text-[var(--text-muted)]">Net savings:</span>
                            <span className={netSavings > 0 ? 'text-green-400 font-bold' : 'text-[var(--text-muted)]'}>
                              {netSavings > 0 ? `+$${netSavings.toFixed(0)}` : `-$${Math.abs(netSavings).toFixed(0)}`}
                            </span>
                          </div>
                        </div>
                        {worthIt && (
                          <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Worth it!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Lifetime Pass Promo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r ${
            isDegen
              ? 'from-yellow-500/20 via-orange-500/20 to-red-500/20'
              : 'from-emerald-500/20 via-cyan-500/20 to-blue-500/20'
          } rounded-2xl p-6 border ${
            isDegen ? 'border-orange-500/30' : 'border-cyan-500/30'
          } mb-12`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${
                  isDegen
                    ? 'from-yellow-400 via-orange-500 to-red-600'
                    : 'from-emerald-400 via-cyan-500 to-blue-600'
                } flex items-center justify-center`}
              >
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {LIFETIME_PASS.name}
                </h3>
                <p className="text-[var(--text-muted)]">
                  {LIFETIME_PASS.description}
                </p>
                <p className="text-sm text-green-400 mt-1">
                  {LIFETIME_PASS.savings}
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="text-3xl font-bold text-[var(--text-primary)]">
                ${LIFETIME_PASS.price}
              </div>
              <div className="text-sm text-[var(--text-muted)]">one-time payment</div>
              <button
                onClick={onSelectLifetime}
                className={`mt-3 px-6 py-2 rounded-xl font-medium bg-gradient-to-r ${
                  isDegen
                    ? 'from-yellow-400 via-orange-500 to-red-600'
                    : 'from-emerald-400 via-cyan-500 to-blue-600'
                } text-white hover:opacity-90 transition-all`}
              >
                Get Lifetime Access
              </button>
            </div>
          </div>
        </motion.div>

        {/* Premium Add-ons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setShowAddons(!showAddons)}
            className="w-full flex items-center justify-between bg-[var(--bg-elevated)] rounded-2xl p-6 mb-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                  isDegen ? 'from-purple-500 to-pink-500' : 'from-indigo-500 to-purple-500'
                } flex items-center justify-center`}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-[var(--text-primary)]">
                  Premium Add-ons
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Unlock powerful features à la carte
                </p>
              </div>
            </div>
            {showAddons ? (
              <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
            )}
          </button>

          <AnimatePresence>
            {showAddons && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {Object.entries(PREMIUM_FEATURES).map(([id, feature]) => (
                    <div
                      key={id}
                      className="bg-[var(--bg-elevated)] rounded-xl p-4"
                    >
                      <div className="text-2xl mb-2">{feature.icon}</div>
                      <h4 className="font-medium text-[var(--text-primary)]">
                        {feature.name}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1 mb-3">
                        {feature.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-primary)]">
                          ${feature.price}
                        </span>
                        <button
                          onClick={() => onSelectFeature?.(id)}
                          className="text-xs px-3 py-1 rounded-full bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bundle */}
                <div
                  className={`bg-gradient-to-r ${
                    isDegen
                      ? 'from-purple-500/20 to-pink-500/20'
                      : 'from-indigo-500/20 to-purple-500/20'
                  } rounded-xl p-6 border ${
                    isDegen ? 'border-purple-500/30' : 'border-indigo-500/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[var(--text-primary)]">
                          {PREMIUM_BUNDLE.name}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          {PREMIUM_BUNDLE.discount}% OFF
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">
                        {PREMIUM_BUNDLE.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-[var(--text-muted)] line-through">
                          ${PREMIUM_BUNDLE.originalPrice}
                        </div>
                        <div className="text-2xl font-bold text-[var(--text-primary)]">
                          ${PREMIUM_BUNDLE.price}
                        </div>
                      </div>
                      <button
                        onClick={onSelectBundle}
                        className={`px-6 py-2 rounded-xl font-medium bg-gradient-to-r ${
                          isDegen
                            ? 'from-purple-500 to-pink-500'
                            : 'from-indigo-500 to-purple-500'
                        } text-white hover:opacity-90 transition-all`}
                      >
                        Get Bundle
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* FAQ/Trust signals */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure payments via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Instant feature activation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
