// Main Backend Server - Express.js with TypeScript

import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase, disconnectDatabase } from './config/database';
import { logger } from './services/logger.service';

// Load environment variables - check multiple possible locations
// Priority: backend/.env > root/.env.local > root/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

logger.info('[Server] NODE_ENV:', process.env.NODE_ENV);
logger.info('[Server] DEV_MODE:', process.env.NODE_ENV === 'development');

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import guardianRoutes from './routes/guardian.routes';
import beneficiaryRoutes from './routes/beneficiary.routes';
import defiRoutes from './routes/defi.routes';
import securityRoutes from './routes/security.routes';
import bridgeRoutes from './routes/bridge.routes';
import aiRoutes from './routes/ai.routes';
import degenxRoutes from './routes/degenx.routes';
import walletRoutes from './routes/wallet.routes';
import walletGuardRoutes from './routes/wallet-guard.routes';
import willRoutes from './routes/will.routes';
import inheritanceRoutes from './routes/inheritance.routes';
import recoveryRoutes from './routes/recovery.routes';
import web3Routes from './routes/web3.routes';
import contractsRoutes from './routes/contracts.routes';
import paymentsRoutes from './routes/payments.routes';
import guardianPortalRoutes from './routes/guardian-portal.routes';
import guardianPortalInternalRoutes from './routes/guardian-portal-internal.routes';
import sniperRoutes from './routes/sniper.routes';
import seedlessWalletRoutes from './routes/seedless-wallet.routes';
import mevGuardRoutes from './routes/mev-guard.routes';
import moonpayRoutes from './routes/moonpay.routes';
import onramperRoutes from './routes/onramper.routes';
import changenowRoutes from './routes/changenow.routes';
import profitRoutingRoutes from './routes/profit-routing.routes';
import accountRoutes from './routes/account.routes';
import settingsRoutes from './routes/settings.routes';
import notificationsRoutes from './routes/notifications.routes';
import biometricRoutes from './routes/biometric.routes';
import supportRoutes from './routes/support.routes';
import legalRoutes from './routes/legal.routes';
import fiatRoutes from './routes/fiat.routes';
import swapsRoutes from './routes/swaps.routes';
import crossChainRoutes from './routes/cross-chain.routes';
import nftRoutes from './routes/nft.routes';
import marketRoutes from './routes/market.routes';
import premiumRoutes from './routes/premium.routes';
import premiumPassRoutes from './routes/premium-pass.routes';
// New advanced trading and analytics routes
import smartGasRoutes from './routes/smart-gas.routes';
import whaleTrackerRoutes from './routes/whale-tracker.routes';
import tradingRoutes from './routes/trading.routes';
import portfolioRoutes from './routes/portfolio.routes';
import airdropRoutes from './routes/airdrop.routes';
import marketDataRoutes from './routes/market-data.routes';
import walletDataRoutes from './routes/wallet-data.routes';
import testRoutes from './routes/test.routes';

// Import services
import { initializeRealtimeService } from './services/websocket.service';
import { initializeQueues } from './services/queue.service';
import { startInheritanceJob } from './scripts/inheritance-inactivity-job';
import { unifiedMempoolService } from './services/unified-mempool.service';

// Import Stripe sync services
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripe/stripeClient';
import { WebhookHandlers } from './stripe/webhookHandlers';

// Create Express app and HTTP server
const app: Express = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware - relax CSP in production to serve frontend
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  } : false,
}));

// CORS configuration - allow Replit domains and localhost
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5000',
  ];

  // Add FRONTEND_URL if set
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  // Add Replit domains from env
  if (process.env.REPLIT_DOMAINS) {
    process.env.REPLIT_DOMAINS.split(',').forEach(domain => {
      origins.push(`https://${domain.trim()}`);
    });
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    origins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
  }

  return origins;
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));


// Stripe sync webhook route with UUID (for stripe-replit-sync)
app.post('/api/stripe/webhook/:uuid', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature' });
  }

  try {
    const sig = Array.isArray(signature) ? signature[0] : signature;

    if (!Buffer.isBuffer(req.body)) {
      logger.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
      return res.status(500).json({ error: 'Webhook processing error' });
    }

    const { uuid } = req.params;
    await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error:', error.message);
    res.status(400).json({ error: 'Webhook processing error' });
  }
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
    });
    next();
  });
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/guardian', guardianRoutes); // Alias for /api/guardian/* routes
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/defi', defiRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/bridge', bridgeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/degenx', degenxRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/wallet-guard', walletGuardRoutes);
// Smart Will routes
app.use('/api/will', willRoutes);
// Inheritance Vault routes
app.use('/api/inheritance', inheritanceRoutes);
// Public Recovery routes (no auth required)
app.use('/api/recovery', recoveryRoutes);
// Web3 routes (for frontend compatibility)
app.use('/api/web3', web3Routes);
// Contracts routes (vault/inheritance frontend compatibility)
app.use('/api/contracts', contractsRoutes);
// Payments routes (checkout frontend compatibility)
app.use('/api/payments', paymentsRoutes);
// Guardian Portal routes (public token-based access)
app.use('/api/guardian-portal', guardianPortalRoutes);
// Guardian Portal Internal routes (authenticated user endpoints)
app.use('/api/guardian-portal/internal', guardianPortalInternalRoutes);
// Sniper routes (trading bot functionality)
app.use('/api/sniper', sniperRoutes);
// MoonPay routes (fiat on-ramp)
app.use('/api/moonpay', moonpayRoutes);
// Onramper routes (aggregated fiat on-ramp - no business name required)
app.use('/api/onramper', onramperRoutes);
// ChangeNOW routes (no-KYC fiat exchange)
app.use('/api/changenow', changenowRoutes);
// Profit routing routes (all profits route to configured wallet)
app.use('/api/profit-routing', profitRoutingRoutes);
// Seedless wallet routes (guardian-based wallet without seed phrases)
app.use('/api/seedless-wallet', seedlessWalletRoutes);
// MEV Guard routes (MEV protection integrated with DegenX)
app.use('/api/mev-guard', mevGuardRoutes);

// Account management routes
app.use('/api/account', accountRoutes);
// User settings routes
app.use('/api/settings', settingsRoutes);
// Notifications routes
app.use('/api/notifications', notificationsRoutes);
// Biometric authentication routes
app.use('/api/biometric', biometricRoutes);
// Support and help routes
app.use('/api/support', supportRoutes);
// Legal documents routes
app.use('/api/legal', legalRoutes);
// Fiat on-ramp aggregation routes
app.use('/api/fiat', fiatRoutes);
// DEX aggregator swap routes
app.use('/api/swaps', swapsRoutes);
// Cross-chain bridge routes
app.use('/api/cross-chain', crossChainRoutes);
// NFT gallery routes
app.use('/api/nft', nftRoutes);
// Market data routes
app.use('/api/market', marketRoutes);
// Premium feature unlocks (one-time purchases)
app.use('/api/premium', premiumRoutes);
app.use('/api/premium-pass', premiumPassRoutes);
// Smart Gas optimization routes
app.use('/api/gas', smartGasRoutes);
// Whale tracking and smart money routes
app.use('/api/whales', whaleTrackerRoutes);
// Trading routes (limit orders, DCA, etc.)
app.use('/api/trading', tradingRoutes);
// Portfolio analytics routes
app.use('/api/portfolio', portfolioRoutes);
// Airdrop hunting routes
app.use('/api/airdrops', airdropRoutes);
// Real-time market data (CoinGecko, DefiLlama)
app.use('/api/market-data', marketDataRoutes);
// Wallet data routes (real blockchain data)
app.use('/api/wallet', walletDataRoutes);
// Test routes (no auth required for development testing)
app.use('/api/test', testRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));

  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler (API routes only in production)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler
// Note: Import logger at top of file: import { logger } from './services/logger.service';
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with context
  // logger.error('Unhandled route error', err, {
  //   method: req.method,
  //   path: req.path,
  //   query: req.query,
  //   userId: (req as any).userId,
  // });

  // For now, keep console.error until logger is imported
  logger.error('Error:', err);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(500).json({
    error: 'Internal Server Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialize Stripe schema and sync on startup
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.warn('⚠️  DATABASE_URL not set - Stripe sync disabled');
    return;
  }

  try {
    logger.info('Initializing Stripe schema...');
    await runMigrations({
      databaseUrl
    } as any);
    logger.info('✅ Stripe schema ready');

    const stripeSync = await getStripeSync();

    logger.info('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

    try {
      const result = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
        {
          enabled_events: ['*'],
          description: 'Managed webhook for Stripe sync',
        }
      );

      if (result && result.webhook) {
        logger.info(`✅ Webhook configured: ${result.webhook.url}`);
      } else {
        logger.info('✅ Webhook setup initiated (pending verification)');
      }
    } catch (webhookError: any) {
      logger.warn('⚠️  Webhook setup skipped:', webhookError.message || 'Unable to configure webhook');
    }

    logger.info('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => {
        logger.info('✅ Stripe data synced');
      })
      .catch((err: any) => {
        logger.error('Error syncing Stripe data:', err);
      });
  } catch (error) {
    logger.error('Failed to initialize Stripe:', error);
  }
}

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Initialize Stripe (after database)
    await initStripe();

    // Start HTTP server first (needed for WebSocket)
    httpServer.listen(PORT, () => {
      logger.info(`
🚀 Paradox Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔒 CORS enabled for: ${corsOptions.origin}
💾 Database connected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

    // Initialize WebSocket service (attach to HTTP server)
    try {
      initializeRealtimeService(httpServer);
      logger.info('✅ WebSocket server initialized');
    } catch (error) {
      logger.warn('⚠️  Realtime service not available:', error);
    }

    // Initialize unified mempool service
    try {
      await unifiedMempoolService.connect();
      logger.info('✅ Unified mempool service initialized');
    } catch (error) {
      logger.warn('⚠️  Unified mempool service not available:', error);
    }

    try {
      initializeQueues();
    } catch (error) {
      logger.warn('⚠️  Queue service not available:', error);
    }

    // Start inheritance vault inactivity monitor
    try {
      startInheritanceJob();
    } catch (error) {
      logger.warn('⚠️  Inheritance job not available:', error);
    }

    // Initialize Wallet Guard service
    try {
      const { walletGuardService } = await import('./services/wallet-guard.service');
      await walletGuardService.initialize();
      logger.info('✅ Wallet Guard service initialized');
    } catch (error) {
      logger.warn('⚠️  Wallet Guard service not available:', error);
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default app;