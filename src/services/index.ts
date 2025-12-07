/**
 * Centralized service exports
 * Provides unified access to all API services
 */

// Enhanced API Client (recommended for new code)
export { api as enhancedApi, enhancedApiClient, type RequestOptions, type HealthStatus } from './enhanced-api-client';

// Legacy API Client (for backward compatibility)
export { apiClient, setAuthTokens, clearAuthTokens, getAuthToken } from './api-client';

// Service Layer (type-safe service methods)
export { apiServices, default as services } from './api-service-layer';

// WebSocket Service
export { wsService, initializeWebSocket, subscribeToTransactions, subscribeToPriceUpdates } from './websocket.service';

// Mempool WebSocket Service
export { mempoolWsService, subscribeToMempoolTransactions, subscribeToMempoolAlerts, subscribeToMempoolDashboard } from './mempool-websocket.service';

// Individual Services
export { authService } from './api-service-layer';
export { walletService } from './api-service-layer';
export { tradingService } from './api-service-layer';
export { mevService } from './api-service-layer';
export { mempoolService } from './api-service-layer';
export { bridgeService } from './api-service-layer';
export { walletGuardService } from './api-service-layer';
export { notificationService } from './api-service-layer';
export { securityService } from './api-service-layer';
export { settingsService } from './api-service-layer';
export { marketDataService } from './api-service-layer';
export { healthService } from './api-service-layer';

// Configuration
export { SERVICE_ENDPOINTS, API_ROUTES, SUPPORTED_CHAINS, COMMON_TOKENS, FEATURE_FLAGS } from './config';

// Types
export type { BaseResponse, ApiResponse, AuthTokens } from '../types/api.types';
