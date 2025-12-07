// Wallet Guard Service Routes
import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireDegenXElite } from '../middleware/subscription.middleware';
import {
  walletGuardService,
  SecurityLevel,
  ProtectionActionType,
  ThreatLevel
} from '../services/wallet-guard.service';

const router = Router();

// Dev mode flag
const DEV_MODE = process.env.NODE_ENV === 'development';

// Wallet Guard Service Base URL (for external service proxy)
const WALLET_GUARD_URL = process.env.WALLET_GUARD_URL || 'http://localhost:8044';
const USE_EXTERNAL_SERVICE = process.env.USE_EXTERNAL_WALLET_GUARD === 'true';

// Helper function to proxy requests to external Wallet Guard service
async function proxyToWalletGuard(
  req: any,
  res: any,
  endpoint: string,
  method: 'GET' | 'POST' = 'GET'
) {
  try {
    const url = `${WALLET_GUARD_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.WALLET_GUARD_API_KEY && {
          'X-API-Key': process.env.WALLET_GUARD_API_KEY,
        }),
      },
    };

    if (method === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    if (method === 'GET' && Object.keys(req.query).length > 0) {
      const queryString = new URLSearchParams(req.query as any).toString();
      const fullUrl = `${url}?${queryString}`;
      const response = await fetch(fullUrl, options);
      const data = await response.json();
      return res.json(data);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('Wallet Guard proxy error:', error);
    res.status(500).json({
      error: 'Failed to connect to Wallet Guard service',
      details: error.message,
    });
  }
}

// Health check
router.get('/health', async (req: Request, res: Response) => {
  if (USE_EXTERNAL_SERVICE) {
    return proxyToWalletGuard(req, res, '/health');
  }

  res.json({
    status: 'healthy',
    service: 'wallet-guard',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: {
      threatDetection: true,
      transactionSimulation: true,
      realTimeMonitoring: true,
      mpcSupport: true,
      hsmSupport: true,
    },
  });
});

// Start monitoring a wallet
router.post(
  '/monitor',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { wallet_address, network, alert_channels, protection_level } = req.body;

      if (!wallet_address || !network) {
        return res.status(400).json({
          error: 'wallet_address and network are required',
        });
      }

      // Use external service if configured
      if (USE_EXTERNAL_SERVICE) {
        return proxyToWalletGuard(
          req,
          res,
          `/api/v1/wallet-guard/monitor?wallet_address=${wallet_address}&network=${network}`,
          'POST'
        );
      }

      // Use internal service
      const walletInfo = await walletGuardService.startMonitoring({
        walletAddress: wallet_address,
        network,
        alertChannels: alert_channels || ['email'],
        protectionLevel: protection_level || SecurityLevel.MEDIUM,
        autoProtect: true,
        thresholds: {
          maxTransactionValue: '10',
          maxGasPrice: '100',
          suspiciousActivityScore: 70,
        },
      });

      res.json({
        success: true,
        message: `Started monitoring ${wallet_address} on ${network}`,
        wallet: walletInfo,
      });
    } catch (error: any) {
      logger.error('Monitor wallet error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get wallet status
router.get(
  '/status/:wallet_address',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { wallet_address } = req.params;
      const { network } = req.query;

      if (USE_EXTERNAL_SERVICE) {
        const endpoint = network
          ? `/api/v1/wallet-guard/status/${wallet_address}?network=${network}`
          : `/api/v1/wallet-guard/status/${wallet_address}`;
        return proxyToWalletGuard(req, res, endpoint);
      }

      const status = await walletGuardService.getWalletStatus(
        wallet_address,
        network as string | undefined
      );

      if (!status) {
        return res.status(404).json({ error: 'Wallet not found or not monitored' });
      }

      res.json(status);
    } catch (error: any) {
      logger.error('Get wallet status error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get recent threats
router.get(
  '/threats',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { hours, wallet_address, network, min_level } = req.query;

      if (USE_EXTERNAL_SERVICE) {
        let endpoint = `/api/v1/wallet-guard/threats?hours=${hours || 24}`;
        if (wallet_address) endpoint += `&wallet_address=${wallet_address}`;
        if (network) endpoint += `&network=${network}`;
        return proxyToWalletGuard(req, res, endpoint);
      }

      const threats = await walletGuardService.getRecentThreats({
        hours: hours ? parseInt(hours as string) : 24,
        walletAddress: wallet_address as string | undefined,
        network: network as string | undefined,
        minLevel: min_level as ThreatLevel | undefined,
      });

      res.json({
        threats,
        count: threats.length,
        timeframe: `${hours || 24} hours`,
      });
    } catch (error: any) {
      logger.error('Get threats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Apply protection action
router.post(
  '/protect',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { wallet_address, action_type, network, metadata } = req.body;

      if (!wallet_address || !action_type) {
        return res.status(400).json({
          error: 'wallet_address and action_type are required',
        });
      }

      if (USE_EXTERNAL_SERVICE) {
        const endpoint = `/api/v1/wallet-guard/protect?wallet_address=${wallet_address}&action_type=${action_type}`;
        return proxyToWalletGuard(req, res, endpoint, 'POST');
      }

      const action = await walletGuardService.applyProtection(
        wallet_address,
        action_type as ProtectionActionType,
        network || 'ethereum',
        metadata || {}
      );

      res.json({
        success: action.success,
        action,
      });
    } catch (error: any) {
      logger.error('Apply protection error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get analytics
router.get(
  '/analytics',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { wallet_address, network, timeframe } = req.query;

      if (USE_EXTERNAL_SERVICE) {
        let endpoint = '/api/v1/wallet-guard/analytics';
        const params = new URLSearchParams();
        if (wallet_address) params.append('wallet_address', wallet_address as string);
        if (network) params.append('network', network as string);
        if (timeframe) params.append('timeframe', timeframe as string);
        if (params.toString()) endpoint += `?${params.toString()}`;
        return proxyToWalletGuard(req, res, endpoint);
      }

      if (!wallet_address || !network) {
        return res.status(400).json({
          error: 'wallet_address and network are required',
        });
      }

      const analytics = await walletGuardService.getAnalytics(
        wallet_address as string,
        network as string,
        (timeframe as string) || '7d'
      );

      res.json(analytics);
    } catch (error: any) {
      logger.error('Get analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Stop monitoring a wallet
router.post(
  '/stop',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { wallet_address, network } = req.body;

      if (!wallet_address) {
        return res.status(400).json({
          error: 'wallet_address is required',
        });
      }

      if (USE_EXTERNAL_SERVICE) {
        const endpoint = `/api/v1/wallet-guard/stop?wallet_address=${wallet_address}${network ? `&network=${network}` : ''}`;
        return proxyToWalletGuard(req, res, endpoint, 'POST');
      }

      const stopped = await walletGuardService.stopMonitoring(
        wallet_address,
        network || 'ethereum'
      );

      res.json({
        success: stopped,
        message: stopped
          ? `Stopped monitoring ${wallet_address}`
          : 'Wallet was not being monitored',
      });
    } catch (error: any) {
      logger.error('Stop monitoring error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get monitored wallets for user
router.get(
  '/monitored',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (USE_EXTERNAL_SERVICE) {
        return proxyToWalletGuard(req, res, '/api/v1/wallet-guard/monitored');
      }

      const wallets = walletGuardService.getMonitoredWallets();

      res.json({
        wallets,
        count: wallets.length,
      });
    } catch (error: any) {
      logger.error('Get monitored wallets error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Simulate transaction
router.post(
  '/simulate',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { wallet_address, transaction, network } = req.body;

      if (!wallet_address || !transaction) {
        return res.status(400).json({
          error: 'wallet_address and transaction are required',
        });
      }

      const simulation = await walletGuardService.simulateTransaction(
        wallet_address,
        transaction,
        network || 'ethereum'
      );

      res.json(simulation);
    } catch (error: any) {
      logger.error('Simulate transaction error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Update security configuration
router.put(
  '/config/:wallet_address',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { wallet_address } = req.params;
      const { network, ...config } = req.body;

      const updated = await walletGuardService.updateSecurityConfig(
        wallet_address,
        network || 'ethereum',
        config
      );

      res.json({
        success: true,
        config: updated,
      });
    } catch (error: any) {
      logger.error('Update config error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get security configuration
router.get(
  '/config/:wallet_address',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { wallet_address } = req.params;
      const { network } = req.query;

      const config = walletGuardService.getSecurityConfig(
        wallet_address,
        (network as string) || 'ethereum'
      );

      if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      res.json(config);
    } catch (error: any) {
      logger.error('Get config error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get protection history
router.get(
  '/history',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { wallet_address } = req.query;

      const history = walletGuardService.getProtectionHistory(
        wallet_address as string | undefined
      );

      res.json({
        actions: history,
        count: history.length,
      });
    } catch (error: any) {
      logger.error('Get history error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

