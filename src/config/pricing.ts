/**
 * Centralized Pricing Configuration
 *
 * All subscription tiers, fees, and pricing information.
 * Keep in sync with backend: src/backend/routes/auth.routes.ts
 *
 * Last Updated: December 2025
 */

// Subscription tier types
export type SubscriptionTier = 'free' | 'pro' | 'elite' | 'lifetime';

// Swap fee structure by tier (basis points)
export const SWAP_FEE_BPS: Record<SubscriptionTier, number> = {
  free: 50,      // 0.5%
  pro: 35,       // 0.35%
  elite: 20,     // 0.2%
  lifetime: 15,  // 0.15%
};

// Swap fee percentage by tier
export const SWAP_FEE_PERCENTAGE: Record<SubscriptionTier, number> = {
  free: 0.005,     // 0.5%
  pro: 0.0035,     // 0.35%
  elite: 0.002,    // 0.2%
  lifetime: 0.0015, // 0.15%
};

// Fee discount percentages vs free tier
export const FEE_DISCOUNT: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 30,
  elite: 60,
  lifetime: 70,
};

// Yield fee (taken from yield earnings)
export const YIELD_FEE_PERCENTAGE = 0.0075; // 0.75%
export const YIELD_FEE_BPS = 75;

// Subscription tier details
export interface SubscriptionTierInfo {
  id: SubscriptionTier;
  name: string;
  price: number;
  priceMonthly: number;
  priceYearly: number;
  isOneTime?: boolean;
  swapFee: string;
  swapFeeDiscount: number;
  features: string[];
  description: string;
  popular?: boolean;
  badge?: string;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierInfo> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    swapFee: '0.5%',
    swapFeeDiscount: 0,
    features: [
      'Basic wallet management',
      'Token swaps',
      'Transaction history',
      'Email support',
      'Basic security alerts',
    ],
    description: 'Perfect for getting started with crypto',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    priceMonthly: 19.99,
    priceYearly: 199.99,
    swapFee: '0.35%',
    swapFeeDiscount: 30,
    features: [
      'Everything in Free',
      'Priority support',
      'Advanced analytics',
      'Gas optimization',
      'Whale tracking',
      'Multi-wallet support',
      'Portfolio insights',
      'Price alerts',
      'Export transaction history',
    ],
    description: 'For active traders who want powerful tools',
    badge: 'Popular',
    popular: true,
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 49.99,
    priceMonthly: 49.99,
    priceYearly: 499.99,
    swapFee: '0.2%',
    swapFeeDiscount: 60,
    features: [
      'Everything in Pro',
      'MEV protection',
      'Honeypot detection',
      'Rug pull detection',
      'DeFi aggregation',
      'API access',
      'White glove support',
      'Smart Will advanced',
      'Tax reporting',
      'Custom trading strategies',
    ],
    description: 'Maximum protection and features for serious traders',
    badge: 'Best Value',
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    price: 499,
    priceMonthly: 499,
    priceYearly: 499,
    isOneTime: true,
    swapFee: '0.15%',
    swapFeeDiscount: 70,
    features: [
      'Everything in Elite - forever',
      'Lowest swap fees (0.15%)',
      'Early access to new features',
      'Founding member badge',
      'Priority support forever',
      'All future features included',
      'Lifetime updates',
      'No recurring payments',
    ],
    description: 'One-time payment, lifetime access to all features forever',
    badge: 'Lifetime',
  },
};

// Premium add-on features (one-time purchases)
export interface PremiumFeature {
  id: string;
  name: string;
  price: number; // in USD
  description: string;
  icon?: string;
}

export const PREMIUM_FEATURES: Record<string, PremiumFeature> = {
  sniper_bot: {
    id: 'sniper_bot',
    name: 'Sniper Bot Access',
    price: 49,
    description: 'Automated token launch sniping with customizable settings',
    icon: '🎯',
  },
  whale_alerts: {
    id: 'whale_alerts',
    name: 'Whale Alerts Pro',
    price: 29,
    description: 'Real-time whale movement notifications across all chains',
    icon: '🐋',
  },
  private_node: {
    id: 'private_node',
    name: 'Private Node Execution',
    price: 99,
    description: 'Privacy-focused transaction routing via private mempool',
    icon: '🔒',
  },
  mev_plus: {
    id: 'mev_plus',
    name: 'MEV Protection Plus',
    price: 39,
    description: 'Enhanced MEV protection with Flashbots integration',
    icon: '🛡️',
  },
  inheritance: {
    id: 'inheritance',
    name: 'Inheritance Protocol',
    price: 149,
    description: 'Crypto inheritance and vault protection with Smart Will',
    icon: '📜',
  },
  multisig: {
    id: 'multisig',
    name: 'Multi-Sig Templates',
    price: 79,
    description: 'Pre-built multi-signature vault templates',
    icon: '🔐',
  },
  death_verify: {
    id: 'death_verify',
    name: 'Manual Death Verification',
    price: 199,
    description: 'Human-verified death certificate processing service',
    icon: '✓',
  },
  exit_strat: {
    id: 'exit_strat',
    name: 'Algorithmic Exit Strategies',
    price: 69,
    description: 'Automated profit-taking and stop-loss execution',
    icon: '📈',
  },
};

// Complete bundle pricing
export const PREMIUM_BUNDLE = {
  id: 'complete_bundle',
  name: 'Complete Bundle',
  price: 349, // 40% off individual prices
  originalPrice: Object.values(PREMIUM_FEATURES).reduce((sum, f) => sum + f.price, 0),
  discount: 40,
  description: 'All 8 premium features - lifetime access',
  features: Object.keys(PREMIUM_FEATURES),
};

// Lifetime pass details
export const LIFETIME_PASS = {
  id: 'lifetime_pass',
  name: 'Lifetime Pass',
  price: 499,
  description: 'One-time payment for lifetime access to everything',
  includes: [
    'All 8 premium features unlocked forever',
    'Elite subscription tier for life (normally $49.99/mo)',
    'Lowest swap fees (0.15% - 70% discount)',
    'Early access to new features',
    'Founding member badge',
    'Priority support forever',
    'All future features included',
  ],
  savings: 'Save $600+/year vs Elite subscription + bundle',
};

// Helper functions
export function getSwapFee(tier: SubscriptionTier): number {
  return SWAP_FEE_PERCENTAGE[tier];
}

export function getSwapFeeBps(tier: SubscriptionTier): number {
  return SWAP_FEE_BPS[tier];
}

export function getSwapFeeFormatted(tier: SubscriptionTier): string {
  return `${(SWAP_FEE_PERCENTAGE[tier] * 100).toFixed(2)}%`;
}

export function calculateSwapFee(amount: number, tier: SubscriptionTier): number {
  return amount * SWAP_FEE_PERCENTAGE[tier];
}

export function calculateFeeSavings(amount: number, tier: SubscriptionTier): number {
  const freeFee = amount * SWAP_FEE_PERCENTAGE.free;
  const tierFee = amount * SWAP_FEE_PERCENTAGE[tier];
  return freeFee - tierFee;
}

export function getTierInfo(tier: SubscriptionTier): SubscriptionTierInfo {
  return SUBSCRIPTION_TIERS[tier];
}

export function formatPrice(price: number, isMonthly = true): string {
  if (price === 0) return 'Free';
  if (price >= 100 && !isMonthly) return `$${price}`;
  return `$${price.toFixed(2)}${isMonthly && price > 0 ? '/mo' : ''}`;
}

export function getYearlySavings(tier: SubscriptionTier): number {
  const tierInfo = SUBSCRIPTION_TIERS[tier];
  if (tier === 'free' || tier === 'lifetime') return 0;
  return (tierInfo.priceMonthly * 12) - tierInfo.priceYearly;
}

export default {
  SUBSCRIPTION_TIERS,
  PREMIUM_FEATURES,
  PREMIUM_BUNDLE,
  LIFETIME_PASS,
  SWAP_FEE_BPS,
  SWAP_FEE_PERCENTAGE,
  YIELD_FEE_PERCENTAGE,
  getSwapFee,
  getSwapFeeBps,
  getSwapFeeFormatted,
  calculateSwapFee,
  calculateFeeSavings,
  getTierInfo,
  formatPrice,
  getYearlySavings,
};
