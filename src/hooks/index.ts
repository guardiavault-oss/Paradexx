/**
 * Hooks Index - Export all data fetching hooks
 */

// New real data fetching hooks
export { useDashboardData } from './useDashboardData';
export { useTokens, type TokenBalance } from './useTokens';
export { useTransactions, type Transaction } from './useTransactions';
export { useSwap, type SwapToken, type SwapQuote, type SwapResult } from './useSwap';
export {
    useMarketData,
    useTokenPrices,
    useTrendingTokens,
    useMarketStats,
    useTokenChart,
    type TokenPrice,
    type TrendingToken,
    type MarketStats,
} from './useMarketData';

// WebSocket hooks for real-time updates
export {
    useWebSocketPrices,
    useWalletWebSocket,
    type PriceUpdate,
} from './useWebSocketPrices';

// Re-export API hooks
export * from './api';
