// ============================================================================
// APEX SNIPER - API Server
// REST API and WebSocket server for dashboard communication
// ============================================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { ethers } from 'ethers';
import {
  APIResponse,
  PaginatedResponse,
  WSMessageType,
  SnipeConfig,
  SnipeType,
  DEX,
  ExecutionMethod,
  MemeHunterConfig,
  RecoveryFundConfig,
  SmartStopLossConfig,
  WhaleMirrorConfig,
  RugPullType
} from '../types';
import { config } from '../config';
import { logger, generateId, checksumAddress, formatEther } from '../utils';
import { sniperCore } from '../core/SniperCore';
import { executionEngine } from '../services/ExecutionEngine';
import { tokenAnalyzer } from '../services/TokenAnalyzer';
import { whaleTracker } from '../services/WhaleTracker';
import { mempoolMonitor } from '../services/MempoolMonitor';
import { memeHunter } from '../services/MemeHunter';
import { portfolioAnalytics } from '../services/PortfolioAnalytics';
import { marketRegimeDetector } from '../services/MarketRegimeDetector';
import { telegramService } from '../services/TelegramNotificationService';
import { arbitrageDetector } from '../services/ArbitrageDetector';
import { whaleIntelligence } from '../services/WhaleIntelligence';
import { degenRecoveryFund } from '../services/DegenRecoveryFund';
import { smartStopLossAI } from '../services/SmartStopLossAI';
import { whaleMirrorTrading } from '../services/WhaleMirrorTrading';

// ============================================================================
// API SERVER
// ============================================================================

export class APIServer {
  private app: Express;
  private server: HTTPServer;
  private io: SocketIOServer;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupEventForwarding();
  }

  // ==========================================================================
  // MIDDLEWARE
  // ==========================================================================

  private setupMiddleware(): void {
    this.app.use(helmet({
      contentSecurityPolicy: false
    }));
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });

    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('API Error:', err);
      res.status(500).json(this.errorResponse(err.message));
    });
  }

  // ==========================================================================
  // ROUTES
  // ==========================================================================

  private setupRoutes(): void {
    const router = express.Router();

    // Health check
    router.get('/health', (req, res) => {
      res.json(this.successResponse({ status: 'healthy' }));
    });

    // ========== SYSTEM ==========
    router.get('/status', (req, res) => {
      res.json(this.successResponse(sniperCore.getStatus()));
    });

    router.get('/stats', (req, res) => {
      res.json(this.successResponse(sniperCore.getStats()));
    });

    router.post('/start', async (req, res) => {
      try {
        await sniperCore.start();
        res.json(this.successResponse({ message: 'System started' }));
      } catch (error) {
        res.status(500).json(this.errorResponse((error as Error).message));
      }
    });

    router.post('/stop', async (req, res) => {
      try {
        await sniperCore.stop();
        res.json(this.successResponse({ message: 'System stopped' }));
      } catch (error) {
        res.status(500).json(this.errorResponse((error as Error).message));
      }
    });

    router.post('/auto-snipe/enable', (req, res) => {
      sniperCore.enableAutoSnipe();
      res.json(this.successResponse({ autoSnipe: true }));
    });

    router.post('/auto-snipe/disable', (req, res) => {
      sniperCore.disableAutoSnipe();
      res.json(this.successResponse({ autoSnipe: false }));
    });

    // ========== WALLETS ==========
    router.get('/wallets', (req, res) => {
      res.json(this.successResponse(executionEngine.getWallets()));
    });

    router.post('/wallets', async (req, res) => {
      try {
        const { id, name, privateKey } = req.body;
        const address = await executionEngine.addWallet(
          id || generateId(),
          name,
          privateKey
        );
        res.json(this.successResponse({ id, name, address }));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    // ========== SNIPE CONFIGS ==========
    router.get('/configs', (req, res) => {
      res.json(this.successResponse(sniperCore.getAllSnipeConfigs()));
    });

    router.get('/configs/:id', (req, res) => {
      const config = sniperCore.getSnipeConfig(req.params.id);
      if (!config) {
        return res.status(404).json(this.errorResponse('Config not found'));
      }
      res.json(this.successResponse(config));
    });

    router.post('/configs', (req, res) => {
      try {
        const config = sniperCore.addSnipeConfig(req.body);
        res.json(this.successResponse(config));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.put('/configs/:id', (req, res) => {
      const config = sniperCore.updateSnipeConfig(req.params.id, req.body);
      if (!config) {
        return res.status(404).json(this.errorResponse('Config not found'));
      }
      res.json(this.successResponse(config));
    });

    router.delete('/configs/:id', (req, res) => {
      const deleted = sniperCore.removeSnipeConfig(req.params.id);
      res.json(this.successResponse({ deleted }));
    });

    // ========== TRADING ==========
    router.post('/buy', async (req, res) => {
      try {
        const { token, amount, walletId, slippage, dex, method, safetyCheck } = req.body;
        
        const order = await sniperCore.manualSnipe(
          token,
          amount,
          walletId,
          { slippage, dex, method, safetyCheck }
        );
        
        res.json(this.successResponse(order));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.post('/sell', async (req, res) => {
      try {
        const { token, amount, walletId, slippage, isPercent } = req.body;
        
        const result = await sniperCore.manualSell(
          token,
          amount,
          walletId,
          { slippage, isPercent }
        );
        
        res.json(this.successResponse(result));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    // ========== ORDERS ==========
    router.get('/orders', (req, res) => {
      const orders = executionEngine.getOrders();
      res.json(this.successResponse(orders));
    });

    router.get('/orders/pending', (req, res) => {
      const orders = executionEngine.getPendingOrders();
      res.json(this.successResponse(orders));
    });

    router.get('/orders/:id', (req, res) => {
      const order = executionEngine.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json(this.errorResponse('Order not found'));
      }
      res.json(this.successResponse(order));
    });

    // ========== POSITIONS ==========
    router.get('/positions', (req, res) => {
      const positions = executionEngine.getPositions();
      res.json(this.successResponse(positions));
    });

    router.get('/positions/open', (req, res) => {
      const positions = executionEngine.getOpenPositions();
      res.json(this.successResponse(positions));
    });

    router.get('/positions/:id', (req, res) => {
      const position = executionEngine.getPosition(req.params.id);
      if (!position) {
        return res.status(404).json(this.errorResponse('Position not found'));
      }
      res.json(this.successResponse(position));
    });

    // ========== TOKEN ANALYSIS ==========
    router.get('/analyze/:token', async (req, res) => {
      try {
        const analysis = await tokenAnalyzer.analyzeToken(req.params.token);
        res.json(this.successResponse(analysis));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/analyze/:token/quick', async (req, res) => {
      try {
        const result = await tokenAnalyzer.quickSafetyCheck(req.params.token);
        res.json(this.successResponse(result));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    // ========== WHALE TRACKING ==========
    router.get('/whales', (req, res) => {
      res.json(this.successResponse(whaleTracker.getAllTrackedWallets()));
    });

    router.post('/whales', async (req, res) => {
      try {
        const { address, label, ...options } = req.body;
        const wallet = await whaleTracker.addTrackedWallet(address, label, options);
        res.json(this.successResponse(wallet));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/whales/:address', (req, res) => {
      const wallet = whaleTracker.getTrackedWallet(req.params.address);
      if (!wallet) {
        return res.status(404).json(this.errorResponse('Wallet not found'));
      }
      res.json(this.successResponse(wallet));
    });

    router.put('/whales/:address', (req, res) => {
      const wallet = whaleTracker.updateTrackedWallet(req.params.address, req.body);
      if (!wallet) {
        return res.status(404).json(this.errorResponse('Wallet not found'));
      }
      res.json(this.successResponse(wallet));
    });

    router.delete('/whales/:address', (req, res) => {
      const deleted = whaleTracker.removeTrackedWallet(req.params.address);
      res.json(this.successResponse({ deleted }));
    });

    router.get('/whales/transactions/recent', (req, res) => {
      const transactions = whaleTracker.getRecentTransactions();
      res.json(this.successResponse(transactions));
    });

    // ========== PENDING SNIPES ==========
    router.get('/pending-snipes', (req, res) => {
      res.json(this.successResponse(sniperCore.getPendingSnipes()));
    });

    router.post('/pending-snipes/:pair/approve', (req, res) => {
      sniperCore.approvePendingSnipe(req.params.pair);
      res.json(this.successResponse({ approved: true }));
    });

    router.post('/pending-snipes/:pair/reject', (req, res) => {
      sniperCore.rejectPendingSnipe(req.params.pair);
      res.json(this.successResponse({ rejected: true }));
    });

    // ========== MEMPOOL ==========
    router.get('/mempool/stats', (req, res) => {
      res.json(this.successResponse(mempoolMonitor.getStats()));
    });

    // ========== MEME HUNTER ==========
    router.get('/meme-hunter/status', (req, res) => {
      res.json(this.successResponse({
        active: memeHunter.isActive(),
        config: memeHunter.getConfig(),
        stats: memeHunter.getStats()
      }));
    });

    router.post('/meme-hunter/start', async (req, res) => {
      try {
        await memeHunter.start();
        res.json(this.successResponse({ message: 'Meme Hunter started' }));
      } catch (error) {
        res.status(500).json(this.errorResponse((error as Error).message));
      }
    });

    router.post('/meme-hunter/stop', async (req, res) => {
      try {
        await memeHunter.stop();
        res.json(this.successResponse({ message: 'Meme Hunter stopped' }));
      } catch (error) {
        res.status(500).json(this.errorResponse((error as Error).message));
      }
    });

    router.put('/meme-hunter/config', (req, res) => {
      try {
        memeHunter.updateConfig(req.body as Partial<MemeHunterConfig>);
        res.json(this.successResponse(memeHunter.getConfig()));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/meme-hunter/tokens', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 50;
      res.json(this.successResponse(memeHunter.getDiscoveredTokens().slice(0, limit)));
    });

    router.get('/meme-hunter/tokens/trending', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 10;
      res.json(this.successResponse(memeHunter.getTrendingTokens(limit)));
    });

    router.get('/meme-hunter/tokens/:address', (req, res) => {
      const token = memeHunter.getToken(req.params.address);
      if (!token) {
        return res.status(404).json(this.errorResponse('Token not found'));
      }
      res.json(this.successResponse(token));
    });

    router.post('/meme-hunter/tokens/:address/analyze', async (req, res) => {
      try {
        const token = await memeHunter.analyzeToken(req.params.address);
        if (!token) {
          return res.status(404).json(this.errorResponse('Failed to analyze token'));
        }
        res.json(this.successResponse(token));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.post('/meme-hunter/tokens/:address/blacklist', (req, res) => {
      memeHunter.blacklistToken(req.params.address);
      res.json(this.successResponse({ blacklisted: true }));
    });

    router.get('/meme-hunter/alerts', (req, res) => {
      res.json(this.successResponse(memeHunter.getActiveAlerts()));
    });

    router.get('/meme-hunter/alerts/history', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 100;
      res.json(this.successResponse(memeHunter.getAlertHistory(limit)));
    });

    router.get('/meme-hunter/stats', (req, res) => {
      res.json(this.successResponse(memeHunter.getStats()));
    });

    router.get('/meme-hunter/smart-wallets', (req, res) => {
      res.json(this.successResponse(memeHunter.getSmartWallets()));
    });

    router.post('/meme-hunter/smart-wallets', (req, res) => {
      try {
        const { address, label, winRate, avgROI, totalTrades, avgHoldTime, tags } = req.body;
        memeHunter.addSmartWallet({
          address,
          label,
          winRate: winRate || 0,
          avgROI: avgROI || 0,
          totalTrades: totalTrades || 0,
          avgHoldTime: avgHoldTime || 0,
          lastActive: Date.now(),
          tags: tags || []
        });
        res.json(this.successResponse({ added: true }));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/meme-hunter/mentions', (req, res) => {
      const tokenAddress = req.query.token as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const mentions = memeHunter.getRecentMentions(tokenAddress);
      res.json(this.successResponse(mentions.slice(0, limit)));
    });

    router.post('/meme-hunter/deployers/:address/blacklist', (req, res) => {
      memeHunter.blacklistDeployer(req.params.address);
      res.json(this.successResponse({ blacklisted: true }));
    });

    // ========== PORTFOLIO ANALYTICS ==========
    router.get('/portfolio/metrics', (req, res) => {
      const metrics = portfolioAnalytics.getMetrics();
      if (!metrics) {
        return res.json(this.successResponse({ message: 'Metrics not yet calculated' }));
      }
      res.json(this.successResponse(metrics));
    });

    router.get('/portfolio/equity-curve', (req, res) => {
      const curve = portfolioAnalytics.getEquityCurve();
      res.json(this.successResponse(curve));
    });

    router.get('/portfolio/daily-returns', (req, res) => {
      const returns = portfolioAnalytics.getDailyReturns();
      res.json(this.successResponse(returns));
    });

    router.get('/portfolio/config', (req, res) => {
      res.json(this.successResponse(portfolioAnalytics.getConfig()));
    });

    router.put('/portfolio/config', (req, res) => {
      try {
        portfolioAnalytics.updateConfig(req.body);
        res.json(this.successResponse(portfolioAnalytics.getConfig()));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/degen/recovery-fund/contributors', (req, res) => {
      res.json(this.successResponse(degenRecoveryFund.getAllContributors()));
    });

    router.get('/degen/recovery-fund/contributors/:address', (req, res) => {
      const contributor = degenRecoveryFund.getContributor(req.params.address);
      if (!contributor) {
        return res.status(404).json(this.errorResponse('Contributor not found'));
      }
      res.json(this.successResponse(contributor));
    });

    router.post('/degen/recovery-fund/claims', async (req, res) => {
      try {
        const {
          claimantAddress,
          tokenAddress,
          rugPullType,
          amountLostWei,
          entryTxHash,
          rugTxHash,
          proofDocuments
        } = req.body;
        
        const claim = await degenRecoveryFund.submitClaim(
          claimantAddress,
          tokenAddress,
          rugPullType as RugPullType,
          BigInt(amountLostWei),
          entryTxHash,
          rugTxHash,
          proofDocuments
        );
        
        if (!claim) {
          return res.status(400).json(this.errorResponse('Claim submission failed'));
        }
        res.json(this.successResponse(claim));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/degen/recovery-fund/claims/pending', (req, res) => {
      res.json(this.successResponse(degenRecoveryFund.getPendingClaims()));
    });

    router.get('/degen/recovery-fund/claims/history', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 100;
      res.json(this.successResponse(degenRecoveryFund.getClaimHistory(limit)));
    });

    router.get('/degen/recovery-fund/claims/:id', (req, res) => {
      const claim = degenRecoveryFund.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json(this.errorResponse('Claim not found'));
      }
      res.json(this.successResponse(claim));
    });

    router.post('/degen/recovery-fund/claims/:id/vote', async (req, res) => {
      try {
        const { voterAddress, approve } = req.body;
        const success = await degenRecoveryFund.voteOnClaim(
          req.params.id,
          voterAddress,
          approve
        );
        res.json(this.successResponse({ voted: success }));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/degen/recovery-fund/stats', (req, res) => {
      res.json(this.successResponse(degenRecoveryFund.getStats()));
    });

    // ========== SMART STOP-LOSS AI ==========
    router.get('/degen/smart-stoploss/status', (req, res) => {
      res.json(this.successResponse({
        active: smartStopLossAI.isActive(),
        config: smartStopLossAI.getConfig(),
        modelState: smartStopLossAI.getModelState(),
        stats: smartStopLossAI.getStats()
      }));
    });

    router.post('/degen/smart-stoploss/start', async (req, res) => {
      try {
        await smartStopLossAI.start();
        res.json(this.successResponse({ message: 'Smart Stop-Loss AI started' }));
      } catch (error) {
        res.status(500).json(this.errorResponse((error as Error).message));
      }
    });

    router.post('/degen/smart-stoploss/stop', async (req, res) => {
      try {
        await smartStopLossAI.stop();
        res.json(this.successResponse({ message: 'Smart Stop-Loss AI stopped' }));
      } catch (error) {
        res.status(500).json(this.errorResponse((error as Error).message));
      }
    });

    router.put('/degen/smart-stoploss/config', (req, res) => {
      try {
        smartStopLossAI.updateConfig(req.body as Partial<SmartStopLossConfig>);
        res.json(this.successResponse(smartStopLossAI.getConfig()));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.post('/degen/smart-stoploss/monitor', (req, res) => {
      try {
        const { tokenAddress, positionId, entryPrice } = req.body;
        smartStopLossAI.addTokenToMonitor(tokenAddress, positionId, entryPrice);
        res.json(this.successResponse({ monitoring: true }));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.delete('/degen/smart-stoploss/monitor/:token', (req, res) => {
      smartStopLossAI.removeTokenFromMonitor(req.params.token);
      res.json(this.successResponse({ removed: true }));
    });

    router.get('/degen/smart-stoploss/signals', (req, res) => {
      res.json(this.successResponse(smartStopLossAI.getActiveSignals()));
    });

    router.get('/degen/smart-stoploss/signals/history', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 100;
      res.json(this.successResponse(smartStopLossAI.getSignalHistory(limit)));
    });

    router.get('/degen/smart-stoploss/signals/:id', (req, res) => {
      const signal = smartStopLossAI.getSignal(req.params.id);
      if (!signal) {
        return res.status(404).json(this.errorResponse('Signal not found'));
      }
      res.json(this.successResponse(signal));
    });

    router.post('/degen/smart-stoploss/analyze/:token', async (req, res) => {
      try {
        const signal = await smartStopLossAI.analyzeNow(req.params.token);
        res.json(this.successResponse(signal));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/degen/smart-stoploss/monitored', (req, res) => {
      res.json(this.successResponse(smartStopLossAI.getMonitoredTokens()));
    });

    router.get('/degen/smart-stoploss/model', (req, res) => {
      res.json(this.successResponse(smartStopLossAI.getModelState()));
    });

    router.get('/degen/smart-stoploss/stats', (req, res) => {
      res.json(this.successResponse(smartStopLossAI.getStats()));
    });

    // ========== WHALE MIRROR TRADING ==========
    router.get('/degen/whale-mirror/status', (req, res) => {
      res.json(this.successResponse({
        active: whaleMirrorTrading.isActive(),
        config: whaleMirrorTrading.getConfig(),
        stats: whaleMirrorTrading.getStats()
      }));
    });

    router.post('/degen/whale-mirror/start', async (req, res) => {
      try {
        await whaleMirrorTrading.start();
        res.json(this.successResponse({ message: 'Whale Mirror Trading started' }));
      } catch (error) {
        res.status(500).json(this.errorResponse((error as Error).message));
      }
    });

    router.post('/degen/whale-mirror/stop', async (req, res) => {
      try {
        await whaleMirrorTrading.stop();
        res.json(this.successResponse({ message: 'Whale Mirror Trading stopped' }));
      } catch (error) {
        res.status(500).json(this.errorResponse((error as Error).message));
      }
    });

    router.put('/degen/whale-mirror/config', (req, res) => {
      try {
        whaleMirrorTrading.updateConfig(req.body as Partial<WhaleMirrorConfig>);
        res.json(this.successResponse(whaleMirrorTrading.getConfig()));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/degen/whale-mirror/wallets', (req, res) => {
      res.json(this.successResponse(whaleMirrorTrading.getTopWallets()));
    });

    router.get('/degen/whale-mirror/wallets/leaderboard', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 10;
      res.json(this.successResponse(whaleMirrorTrading.getLeaderboard(limit)));
    });

    router.get('/degen/whale-mirror/wallets/hot', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 10;
      res.json(this.successResponse(whaleMirrorTrading.getHotWallets(limit)));
    });

    router.get('/degen/whale-mirror/wallets/:address', (req, res) => {
      const wallet = whaleMirrorTrading.getWallet(req.params.address);
      if (!wallet) {
        return res.status(404).json(this.errorResponse('Wallet not found'));
      }
      res.json(this.successResponse(wallet));
    });

    router.post('/degen/whale-mirror/wallets', async (req, res) => {
      try {
        const { address, ...options } = req.body;
        const wallet = await whaleMirrorTrading.addWallet(address, options);
        if (!wallet) {
          return res.status(400).json(this.errorResponse('Wallet does not meet criteria'));
        }
        res.json(this.successResponse(wallet));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.delete('/degen/whale-mirror/wallets/:address', (req, res) => {
      const removed = whaleMirrorTrading.removeWallet(req.params.address);
      res.json(this.successResponse({ removed }));
    });

    router.get('/degen/whale-mirror/trades/active', (req, res) => {
      res.json(this.successResponse(whaleMirrorTrading.getActiveMirrors()));
    });

    router.get('/degen/whale-mirror/trades/history', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 100;
      res.json(this.successResponse(whaleMirrorTrading.getMirrorHistory(limit)));
    });

    router.get('/degen/whale-mirror/trades/wallet/:address', (req, res) => {
      res.json(this.successResponse(
        whaleMirrorTrading.getMirrorsByWallet(req.params.address)
      ));
    });

    router.put('/degen/whale-mirror/trades/:id/pnl', (req, res) => {
      try {
        const { pnl, pnlPercent } = req.body;
        whaleMirrorTrading.updateMirrorPnL(req.params.id, pnl, pnlPercent);
        res.json(this.successResponse({ updated: true }));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/degen/whale-mirror/stats', (req, res) => {
      res.json(this.successResponse(whaleMirrorTrading.getStats()));
    });

    // ========== ARBITRAGE ==========
    router.get('/arbitrage/opportunities', (req, res) => {
      res.json(this.successResponse(arbitrageDetector.getActiveOpportunities()));
    });

    router.get('/arbitrage/opportunities/:id', (req, res) => {
      const opportunity = arbitrageDetector.getOpportunity(req.params.id);
      if (!opportunity) {
        return res.status(404).json(this.errorResponse('Opportunity not found'));
      }
      res.json(this.successResponse(opportunity));
    });

    router.get('/arbitrage/prices/:token', async (req, res) => {
      try {
        const prices = await arbitrageDetector.refreshTokenPrices(req.params.token);
        res.json(this.successResponse(prices));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.post('/arbitrage/monitor/:token', (req, res) => {
      arbitrageDetector.addMonitoredToken(req.params.token);
      res.json(this.successResponse({ token: req.params.token, monitoring: true }));
    });

    router.delete('/arbitrage/monitor/:token', (req, res) => {
      arbitrageDetector.removeMonitoredToken(req.params.token);
      res.json(this.successResponse({ token: req.params.token, monitoring: false }));
    });

    router.get('/arbitrage/stats', (req, res) => {
      res.json(this.successResponse(arbitrageDetector.getStats()));
    });

    router.get('/arbitrage/config', (req, res) => {
      res.json(this.successResponse(arbitrageDetector.getConfig()));
    });

    router.put('/arbitrage/config', (req, res) => {
      arbitrageDetector.updateConfig(req.body);
      res.json(this.successResponse(arbitrageDetector.getConfig()));
    });

    // ========== MARKET REGIME ==========
    router.get('/market-regime', (req, res) => {
      res.json(this.successResponse(marketRegimeDetector.getLastAnalysis()));
    });

    router.get('/market-regime/current', (req, res) => {
      res.json(this.successResponse({
        regime: marketRegimeDetector.getCurrentRegime(),
        recommendation: marketRegimeDetector.getRecommendation()
      }));
    });

    router.post('/market-regime/analyze', (req, res) => {
      const analysis = marketRegimeDetector.forceAnalysis();
      res.json(this.successResponse(analysis));
    });

    // ========== PORTFOLIO ANALYTICS ==========
    router.get('/portfolio/metrics', (req, res) => {
      res.json(this.successResponse(portfolioAnalytics.getMetrics()));
    });

    router.get('/portfolio/equity-curve', (req, res) => {
      res.json(this.successResponse(portfolioAnalytics.getEquityCurve()));
    });

    router.get('/portfolio/returns', (req, res) => {
      res.json(this.successResponse(portfolioAnalytics.getDailyReturns()));
    });

    router.get('/portfolio/circuit-breaker', (req, res) => {
      res.json(this.successResponse({
        active: portfolioAnalytics.isCircuitBreakerActive()
      }));
    });

    router.post('/portfolio/circuit-breaker/reset', (req, res) => {
      portfolioAnalytics.resetCircuitBreaker();
      res.json(this.successResponse({ reset: true }));
    });

    router.get('/portfolio/config', (req, res) => {
      res.json(this.successResponse(portfolioAnalytics.getConfig()));
    });

    router.put('/portfolio/config', (req, res) => {
      portfolioAnalytics.updateConfig(req.body);
      res.json(this.successResponse(portfolioAnalytics.getConfig()));
    });

    router.post('/portfolio/position-size', (req, res) => {
      const { winProbability, avgWinMultiple, avgLossMultiple, portfolioValue } = req.body;
      const size = portfolioAnalytics.calculateOptimalPositionSize(
        winProbability,
        avgWinMultiple,
        avgLossMultiple,
        portfolioValue
      );
      res.json(this.successResponse({ optimalSize: size }));
    });

    router.post('/portfolio/can-open-position', (req, res) => {
      const { sizeETH, token } = req.body;
      const result = portfolioAnalytics.canOpenPosition(sizeETH, token);
      res.json(this.successResponse(result));
    });

    // ========== WHALE INTELLIGENCE ==========
    router.get('/whale-intelligence/profiles', (req, res) => {
      res.json(this.successResponse(whaleIntelligence.getAllProfiles()));
    });

    router.get('/whale-intelligence/profiles/:address', async (req, res) => {
      try {
        const profile = await whaleIntelligence.analyzeWallet(req.params.address);
        res.json(this.successResponse(profile));
      } catch (error) {
        res.status(400).json(this.errorResponse((error as Error).message));
      }
    });

    router.get('/whale-intelligence/top-performers', (req, res) => {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      res.json(this.successResponse(whaleIntelligence.getTopPerformers(limit)));
    });

    router.get('/whale-intelligence/clusters', (req, res) => {
      res.json(this.successResponse(whaleIntelligence.getClusters()));
    });

    router.get('/whale-intelligence/clusters/:id', (req, res) => {
      const cluster = whaleIntelligence.getCluster(req.params.id);
      if (!cluster) {
        return res.status(404).json(this.errorResponse('Cluster not found'));
      }
      res.json(this.successResponse(cluster));
    });

    router.post('/whale-intelligence/clusters', (req, res) => {
      const { wallets, type, name } = req.body;
      const cluster = whaleIntelligence.discoverCluster(wallets, type, name);
      res.json(this.successResponse(cluster));
    });

    router.get('/whale-intelligence/transactions', (req, res) => {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      res.json(this.successResponse(whaleIntelligence.getRecentTransactions(limit)));
    });

    router.put('/whale-intelligence/profiles/:address/label', (req, res) => {
      const { label } = req.body;
      whaleIntelligence.setWalletLabel(req.params.address, label);
      res.json(this.successResponse({ updated: true }));
    });

    router.put('/whale-intelligence/profiles/:address/type', (req, res) => {
      const { type } = req.body;
      whaleIntelligence.setWalletType(req.params.address, type);
      res.json(this.successResponse({ updated: true }));
    });

    router.post('/whale-intelligence/profiles/:address/verify', (req, res) => {
      whaleIntelligence.verifyWallet(req.params.address);
      res.json(this.successResponse({ verified: true }));
    });

    // Mount router
    this.app.use('/api', router);
  }

  // ==========================================================================
  // WEBSOCKET
  // ==========================================================================

  private setupWebSocket(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      // Send initial state
      socket.emit('state', {
        status: sniperCore.getStatus(),
        stats: sniperCore.getStats(),
        positions: executionEngine.getOpenPositions(),
        pendingSnipes: sniperCore.getPendingSnipes()
      });

      // Handle subscriptions
      socket.on('subscribe', (channels: string[]) => {
        channels.forEach(channel => {
          socket.join(channel);
          logger.debug(`Client ${socket.id} subscribed to ${channel}`);
        });
      });

      socket.on('unsubscribe', (channels: string[]) => {
        channels.forEach(channel => {
          socket.leave(channel);
        });
      });

      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });
  }

  // ==========================================================================
  // EVENT FORWARDING
  // ==========================================================================

  private setupEventForwarding(): void {
    // Forward sniper core events
    sniperCore.on('snipe:detected', (event) => {
      this.broadcast('snipes', WSMessageType.NEW_PAIR, event);
    });

    sniperCore.on('snipe:success', (order) => {
      this.broadcast('orders', WSMessageType.ORDER_CONFIRMED, order);
    });

    sniperCore.on('snipe:failed', (order, error) => {
      this.broadcast('orders', WSMessageType.ORDER_FAILED, { order, error });
    });

    sniperCore.on('alert', (event) => {
      this.broadcast('alerts', 'ALERT', event);
    });

    sniperCore.on('stats:updated', (stats) => {
      this.broadcast('stats', 'STATS_UPDATE', stats);
    });

    // Forward execution events
    executionEngine.on('order:created', (order) => {
      this.broadcast('orders', WSMessageType.ORDER_CREATED, order);
    });

    executionEngine.on('order:submitted', (order) => {
      this.broadcast('orders', WSMessageType.ORDER_SUBMITTED, order);
    });

    executionEngine.on('position:opened', (position) => {
      this.broadcast('positions', WSMessageType.POSITION_OPENED, position);
    });

    executionEngine.on('position:updated', (position) => {
      this.broadcast('positions', WSMessageType.POSITION_UPDATED, position);
    });

    executionEngine.on('position:closed', (position) => {
      this.broadcast('positions', WSMessageType.POSITION_CLOSED, position);
    });

    // Forward whale events
    whaleTracker.on('whale:buy', (tx) => {
      this.broadcast('whales', WSMessageType.WHALE_ALERT, { action: 'BUY', ...tx });
    });

    whaleTracker.on('whale:sell', (tx) => {
      this.broadcast('whales', WSMessageType.WHALE_ALERT, { action: 'SELL', ...tx });
    });

    // Forward mempool events
    mempoolMonitor.on('event:pairCreated', (event) => {
      this.broadcast('mempool', WSMessageType.NEW_PAIR, event);
    });

    mempoolMonitor.on('pending:addLiquidity', (tx) => {
      this.broadcast('mempool', WSMessageType.LIQUIDITY_ADDED, tx);
    });

    // Forward Meme Hunter events
    memeHunter.on('token:discovered', (token) => {
      this.broadcast('meme-hunter', WSMessageType.MEME_TOKEN_DISCOVERED, token);
    });

    memeHunter.on('token:updated', (token) => {
      this.broadcast('meme-hunter', WSMessageType.MEME_SCORE_UPDATED, token);
    });

    memeHunter.on('alert:created', (alert) => {
      this.broadcast('meme-hunter', WSMessageType.MEME_ALERT, alert);
      // Also broadcast to alerts channel
      this.broadcast('alerts', WSMessageType.MEME_ALERT, alert);
    });

    memeHunter.on('autoBuy:triggered', (alert, orderId) => {
      this.broadcast('meme-hunter', 'MEME_AUTO_BUY', { alert, orderId });
    });

    memeHunter.on('stats:updated', (stats) => {
      this.broadcast('meme-hunter', 'MEME_STATS_UPDATE', stats);
    });

    // Forward Degen Recovery Fund events
    degenRecoveryFund.on('contribution:received', (contributor, amount) => {
      this.broadcast('degen', 'RECOVERY_CONTRIBUTION', { contributor, amount: amount.toString() });
    });

    degenRecoveryFund.on('claim:submitted', (claim) => {
      this.broadcast('degen', 'RECOVERY_CLAIM_SUBMITTED', claim);
    });

    degenRecoveryFund.on('claim:approved', (claim) => {
      this.broadcast('degen', 'RECOVERY_CLAIM_APPROVED', claim);
      this.broadcast('alerts', 'RECOVERY_CLAIM_APPROVED', claim);
    });

    degenRecoveryFund.on('claim:rejected', (claim, reason) => {
      this.broadcast('degen', 'RECOVERY_CLAIM_REJECTED', { claim, reason });
    });

    degenRecoveryFund.on('claim:paid', (claim) => {
      this.broadcast('degen', 'RECOVERY_CLAIM_PAID', claim);
      this.broadcast('alerts', 'RECOVERY_CLAIM_PAID', claim);
    });

    degenRecoveryFund.on('pool:updated', (pool) => {
      this.broadcast('degen', 'RECOVERY_POOL_UPDATE', pool);
    });

    degenRecoveryFund.on('stats:updated', (stats) => {
      this.broadcast('degen', 'RECOVERY_STATS_UPDATE', stats);
    });

    // Forward Smart Stop-Loss AI events
    smartStopLossAI.on('signal:detected', (signal) => {
      this.broadcast('degen', 'STOPLOSS_SIGNAL', signal);
      this.broadcast('alerts', 'STOPLOSS_SIGNAL', signal);
    });

    smartStopLossAI.on('exit:triggered', (signal, orderId) => {
      this.broadcast('degen', 'STOPLOSS_EXIT', { signal, orderId });
      this.broadcast('alerts', 'STOPLOSS_EXIT', { signal, orderId });
    });

    smartStopLossAI.on('exit:failed', (signal, error) => {
      this.broadcast('degen', 'STOPLOSS_EXIT_FAILED', { signal, error });
    });

    smartStopLossAI.on('model:updated', (state) => {
      this.broadcast('degen', 'STOPLOSS_MODEL_UPDATE', state);
    });

    smartStopLossAI.on('stats:updated', (stats) => {
      this.broadcast('degen', 'STOPLOSS_STATS_UPDATE', stats);
    });

    // Forward Whale Mirror Trading events
    whaleMirrorTrading.on('wallet:added', (wallet) => {
      this.broadcast('degen', 'MIRROR_WALLET_ADDED', wallet);
    });

    whaleMirrorTrading.on('wallet:removed', (address) => {
      this.broadcast('degen', 'MIRROR_WALLET_REMOVED', { address });
    });

    whaleMirrorTrading.on('trade:detected', (trade) => {
      this.broadcast('degen', 'MIRROR_TRADE_DETECTED', trade);
      this.broadcast('alerts', 'MIRROR_TRADE_DETECTED', trade);
    });

    whaleMirrorTrading.on('trade:executing', (trade) => {
      this.broadcast('degen', 'MIRROR_TRADE_EXECUTING', trade);
    });

    whaleMirrorTrading.on('trade:completed', (trade) => {
      this.broadcast('degen', 'MIRROR_TRADE_COMPLETED', trade);
      this.broadcast('alerts', 'MIRROR_TRADE_COMPLETED', trade);
    });

    whaleMirrorTrading.on('trade:failed', (trade, error) => {
      this.broadcast('degen', 'MIRROR_TRADE_FAILED', { trade, error });
    });

    whaleMirrorTrading.on('trade:skipped', (trade, reason) => {
      this.broadcast('degen', 'MIRROR_TRADE_SKIPPED', { trade, reason });
    });

    whaleMirrorTrading.on('stats:updated', (stats) => {
      this.broadcast('degen', 'MIRROR_STATS_UPDATE', stats);
    });
  }

  private broadcast(channel: string, type: string, payload: any): void {
    this.io.to(channel).emit('message', {
      type,
      payload,
      timestamp: Date.now()
    });
    
    // Also broadcast to 'all' channel
    this.io.to('all').emit('message', {
      type,
      payload,
      timestamp: Date.now()
    });
  }

  // ==========================================================================
  // RESPONSE HELPERS
  // ==========================================================================

  private successResponse<T>(data: T): APIResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now()
    };
  }

  private errorResponse(error: string): APIResponse<null> {
    return {
      success: false,
      error,
      timestamp: Date.now()
    };
  }

  // ==========================================================================
  // SERVER CONTROL
  // ==========================================================================

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.info(`API server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close();
      this.server.close(() => {
        logger.info('API server stopped');
        resolve();
      });
    });
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const apiServer = new APIServer();
