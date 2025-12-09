// ============================================================================
// APEX SNIPER - Services Index
// ============================================================================

// Core Services
export { mempoolMonitor, MempoolMonitor } from './MempoolMonitor';
export { tokenAnalyzer, TokenSafetyAnalyzer } from './TokenAnalyzer';
export { flashbotsProvider, flashbotsExecutor, FlashbotsProvider, FlashbotsExecutor } from './FlashbotsProvider';
export { executionEngine, ExecutionEngine } from './ExecutionEngine';
export { whaleTracker, WhaleTracker } from './WhaleTracker';

// Enhanced Services for Real Launches
export { multiRpcProvider, MultiRpcProvider } from './MultiRpcProvider';
export { block0Sniper, Block0Sniper } from './Block0Sniper';
export { gasOptimizer, GasOptimizer } from './GasOptimizer';
export { deployerTracker, DeployerTracker } from './DeployerTracker';

// Meme Hunter Services
export { SocialScanner, createSocialScanner } from './SocialScanner';
export { OnChainScanner, createOnChainScanner } from './OnChainScanner';
export { AIScoringEngine, createScoringEngine } from './AIScoringEngine';
export { MemeHunterEngine, memeHunter, createMemeHunter } from './MemeHunter';

// Degen Services
export { DegenRecoveryFund, degenRecoveryFund, createDegenRecoveryFund } from './DegenRecoveryFund';
export { SmartStopLossAI, smartStopLossAI, createSmartStopLossAI } from './SmartStopLossAI';
export { WhaleMirrorTrading, whaleMirrorTrading, createWhaleMirrorTrading } from './WhaleMirrorTrading';

// Advanced Intelligence Services
export { ArbitrageDetector, arbitrageDetector } from './ArbitrageDetector';
export { MarketRegimeDetector, marketRegimeDetector } from './MarketRegimeDetector';
export { PortfolioAnalyticsService, portfolioAnalytics } from './PortfolioAnalytics';
export { WhaleIntelligenceService, whaleIntelligence } from './WhaleIntelligence';
export { TelegramNotificationService, telegramService } from './TelegramNotificationService';
