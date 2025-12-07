// Token price service - Real-time pricing and portfolio tracking

export interface TokenPrice {
  symbol: string;
  address: string;
  price: number; // USD
  priceChange24h: number; // Percentage
  priceChange7d: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: number;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  logo?: string;
  price?: number;
  value?: number; // Balance * price
  priceChange24h?: number;
  isVerified: boolean;
  isScam: boolean;
  category?: 'native' | 'stablecoin' | 'defi' | 'nft' | 'meme';
}

export interface PortfolioSummary {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  topGainer: TokenBalance | null;
  topLoser: TokenBalance | null;
  lastUpdated: number;
}

// Mock token database (in production, use CoinGecko/CoinMarketCap API)
const KNOWN_TOKENS: Record<string, TokenPrice> = {
  'ETH': {
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000',
    price: 2245.67,
    priceChange24h: 3.24,
    priceChange7d: -1.45,
    marketCap: 270000000000,
    volume24h: 15000000000,
    lastUpdated: Date.now()
  },
  'USDC': {
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    price: 1.00,
    priceChange24h: 0.01,
    priceChange7d: 0.00,
    marketCap: 25000000000,
    volume24h: 5000000000,
    lastUpdated: Date.now()
  },
  'USDT': {
    symbol: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    price: 1.00,
    priceChange24h: 0.00,
    priceChange7d: 0.01,
    marketCap: 95000000000,
    volume24h: 50000000000,
    lastUpdated: Date.now()
  },
  'ARB': {
    symbol: 'ARB',
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    price: 0.89,
    priceChange24h: 5.67,
    priceChange7d: 12.34,
    marketCap: 2800000000,
    volume24h: 180000000,
    lastUpdated: Date.now()
  },
  'UNI': {
    symbol: 'UNI',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    price: 6.78,
    priceChange24h: -2.34,
    priceChange7d: 8.90,
    marketCap: 5100000000,
    volume24h: 120000000,
    lastUpdated: Date.now()
  }
};

// Scam token patterns (basic detection)
const SCAM_PATTERNS = [
  /claim/i,
  /airdrop/i,
  /reward/i,
  /visit.*to.*claim/i,
  /free.*eth/i,
  /bonus/i
];

// Get token price
export async function getTokenPrice(symbol: string): Promise<TokenPrice | null> {
  // In production: Call CoinGecko/CoinMarketCap API
  // const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`);
  
  // Mock implementation
  return KNOWN_TOKENS[symbol.toUpperCase()] || null;
}

// Get multiple token prices
export async function getTokenPrices(symbols: string[]): Promise<Record<string, TokenPrice>> {
  const prices: Record<string, TokenPrice> = {};
  
  for (const symbol of symbols) {
    const price = await getTokenPrice(symbol);
    if (price) {
      prices[symbol.toUpperCase()] = price;
    }
  }
  
  return prices;
}

// Calculate token value
export function calculateTokenValue(
  balance: string,
  decimals: number,
  price: number
): number {
  const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
  return balanceNum * price;
}

// Check if token is likely a scam
export function isLikelyScamToken(token: {
  name: string;
  symbol: string;
  balance?: string;
}): boolean {
  // Check name and symbol for scam patterns
  const nameAndSymbol = `${token.name} ${token.symbol}`.toLowerCase();
  
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(nameAndSymbol)) {
      return true;
    }
  }
  
  // Check for suspicious balance (often airdropped scam tokens)
  if (token.balance) {
    const balance = parseFloat(token.balance);
    if (balance > 1000000) { // Suspiciously large airdrop
      return true;
    }
  }
  
  return false;
}

// Get verified token list
export function isVerifiedToken(address: string): boolean {
  // In production: Check against verified token lists (Uniswap, 1inch, etc.)
  const verifiedAddresses = Object.values(KNOWN_TOKENS).map(t => t.address.toLowerCase());
  return verifiedAddresses.includes(address.toLowerCase());
}

// Categorize token
export function categorizeToken(symbol: string): TokenBalance['category'] {
  const upper = symbol.toUpperCase();
  
  if (['ETH', 'BTC', 'BNB', 'MATIC', 'AVAX'].includes(upper)) {
    return 'native';
  }
  
  if (['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX'].includes(upper)) {
    return 'stablecoin';
  }
  
  if (['UNI', 'AAVE', 'COMP', 'CRV', 'SNX'].includes(upper)) {
    return 'defi';
  }
  
  if (['DOGE', 'SHIB', 'PEPE', 'FLOKI'].includes(upper)) {
    return 'meme';
  }
  
  return undefined;
}

// Get token logo URL
export function getTokenLogoUrl(symbol: string, address?: string): string {
  // In production: Use token logo service (Trust Wallet assets, CoinGecko, etc.)
  // https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png
  
  // Fallback to generic icons
  const upper = symbol.toUpperCase();
  
  // Use emoji as fallback
  const emojiMap: Record<string, string> = {
    'ETH': '⟠',
    'BTC': '₿',
    'USDC': '💵',
    'USDT': '💵',
    'ARB': '🔷',
    'UNI': '🦄',
    'AAVE': '👻',
    'COMP': '🏦',
    'MATIC': '🟣',
    'BNB': '🟡'
  };
  
  return emojiMap[upper] || '🪙';
}

// Calculate portfolio summary
export function calculatePortfolioSummary(
  tokens: TokenBalance[]
): PortfolioSummary {
  let totalValue = 0;
  let totalChange24h = 0;
  let topGainer: TokenBalance | null = null;
  let topLoser: TokenBalance | null = null;
  
  for (const token of tokens) {
    if (token.value) {
      totalValue += token.value;
      
      if (token.priceChange24h && token.value) {
        const change = (token.value * token.priceChange24h) / 100;
        totalChange24h += change;
        
        // Track top gainer/loser
        if (!topGainer || (token.priceChange24h > (topGainer.priceChange24h || 0))) {
          topGainer = token;
        }
        if (!topLoser || (token.priceChange24h < (topLoser.priceChange24h || 0))) {
          topLoser = token;
        }
      }
    }
  }
  
  const totalChangePercent24h = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;
  
  return {
    totalValue,
    totalChange24h,
    totalChangePercent24h,
    topGainer,
    topLoser,
    lastUpdated: Date.now()
  };
}

// Format price for display
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(6)}`;
  }
}

// Format price change
export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

// Get price change color
export function getPriceChangeColor(change: number): string {
  if (change > 0) return '#00C853'; // Green
  if (change < 0) return '#FF4D4D'; // Red
  return '#888888'; // Gray
}

// Sort tokens by value
export function sortTokensByValue(tokens: TokenBalance[]): TokenBalance[] {
  return [...tokens].sort((a, b) => (b.value || 0) - (a.value || 0));
}

// Filter dust tokens (< $1)
export function filterDustTokens(tokens: TokenBalance[], threshold: number = 1): {
  valuable: TokenBalance[];
  dust: TokenBalance[];
} {
  const valuable = tokens.filter(t => (t.value || 0) >= threshold);
  const dust = tokens.filter(t => (t.value || 0) < threshold);
  
  return { valuable, dust };
}

// Get 24h change emoji
export function getPriceChangeEmoji(change: number): string {
  if (change > 10) return '🚀';
  if (change > 5) return '📈';
  if (change > 0) return '⬆️';
  if (change === 0) return '➡️';
  if (change > -5) return '⬇️';
  if (change > -10) return '📉';
  return '💥';
}

// Price alert system
export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice?: number;
  createdAt: number;
  triggered?: boolean;
  triggeredAt?: number;
}

export function checkPriceAlerts(
  alerts: PriceAlert[],
  prices: Record<string, TokenPrice>
): PriceAlert[] {
  const triggered: PriceAlert[] = [];
  
  for (const alert of alerts) {
    if (alert.triggered) continue;
    
    const price = prices[alert.symbol];
    if (!price) continue;
    
    const shouldTrigger = alert.condition === 'above'
      ? price.price >= alert.targetPrice
      : price.price <= alert.targetPrice;
    
    if (shouldTrigger) {
      triggered.push({
        ...alert,
        currentPrice: price.price,
        triggered: true,
        triggeredAt: Date.now()
      });
    }
  }
  
  return triggered;
}

// Real-time price updates (WebSocket simulation)
export class PriceUpdateService {
  private listeners: ((prices: Record<string, TokenPrice>) => void)[] = [];
  private interval: NodeJS.Timeout | null = null;
  private symbols: string[] = [];
  
  constructor(symbols: string[]) {
    this.symbols = symbols;
  }
  
  start(updateInterval: number = 10000) {
    if (this.interval) return;
    
    this.interval = setInterval(async () => {
      const prices = await getTokenPrices(this.symbols);
      this.notifyListeners(prices);
    }, updateInterval);
    
    // Initial update
    this.update();
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  async update() {
    const prices = await getTokenPrices(this.symbols);
    this.notifyListeners(prices);
  }
  
  subscribe(listener: (prices: Record<string, TokenPrice>) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  private notifyListeners(prices: Record<string, TokenPrice>) {
    this.listeners.forEach(listener => listener(prices));
  }
  
  addSymbol(symbol: string) {
    if (!this.symbols.includes(symbol)) {
      this.symbols.push(symbol);
    }
  }
  
  removeSymbol(symbol: string) {
    this.symbols = this.symbols.filter(s => s !== symbol);
  }
}

// React hook for token prices
import { useState, useEffect } from 'react';

export function useTokenPrices(symbols: string[], autoUpdate: boolean = true) {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  useEffect(() => {
    if (symbols.length === 0) return;
    
    let service: PriceUpdateService | null = null;
    
    if (autoUpdate) {
      service = new PriceUpdateService(symbols);
      
      const unsubscribe = service.subscribe((newPrices) => {
        setPrices(newPrices);
        setLastUpdated(Date.now());
        setLoading(false);
      });
      
      service.start();
      
      return () => {
        service?.stop();
        unsubscribe();
      };
    } else {
      // One-time fetch
      getTokenPrices(symbols)
        .then(newPrices => {
          setPrices(newPrices);
          setLastUpdated(Date.now());
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [symbols.join(','), autoUpdate]);
  
  const refetch = async () => {
    setLoading(true);
    try {
      const newPrices = await getTokenPrices(symbols);
      setPrices(newPrices);
      setLastUpdated(Date.now());
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  return { prices, loading, error, lastUpdated, refetch };
}
