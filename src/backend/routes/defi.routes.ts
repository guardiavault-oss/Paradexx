// DeFi Routes - Swaps, Staking, Yield, MEV Protection

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireDegenXSubscription } from '../middleware/subscription.middleware';
import { OneInchService, dexAggregator, tokenPriceService } from '../services/defi.service';
import { transactionSimulator } from '../services/transaction-simulation.service';
import { gasOptimizer } from '../services/gas-optimization.service';
import { yieldVaultService } from '../services/yield-vault.service';
import { yieldAdaptersService, YieldStrategy } from '../services/yield-adapters.service';
import { enhancedMevProtection, mevDetection, MEV_PROTECTION_RPCS } from '../services/mev-protection.service';
import { mempoolMonitor } from '../services/mempool-monitor.service';
import { rpcProviderService } from '../services/rpc-provider.service';

// Pro tier middleware for MEV/Mempool features
const requireProTier = requireDegenXSubscription('basic');

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/defi/quote - Get swap quote
router.get('/quote', async (req: Request, res: Response) => {
  try {
    const { fromToken, toToken, amount, chainId, slippage } = req.query;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const quote = await dexAggregator.getBestRoute(
      parseInt(chainId as string) || 1,
      fromToken as string,
      toToken as string,
      amount as string
    );

    res.json(quote);
  } catch (error: any) {
    logger.error('Quote error:', error);
    res.status(500).json({ error: error.message || 'Failed to get quote' });
  }
});

// POST /api/defi/swap - Build swap transaction
router.post('/swap', async (req: Request, res: Response) => {
  try {
    const { fromToken, toToken, amount, fromAddress, chainId, slippage } = req.body;

    if (!fromToken || !toToken || !amount || !fromAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const oneInch = new OneInchService(chainId || 1);
    
    // Get quote first
    const quote = await oneInch.getQuote(fromToken, toToken, amount, slippage);
    
    // Calculate swap fee (percentage of output amount)
    // Free tier: 0.5% | Premium Pass: 0% (check user's premium status)
    const { checkPremiumPass } = await import('../services/premium-pass.service');
    const userPremiumPass = req.userId ? await checkPremiumPass(req.userId) : false;
    const SWAP_FEE_PERCENTAGE = userPremiumPass ? 0 : parseFloat(process.env.SWAP_FEE_PERCENTAGE || '0.005'); // 0.5% default, 0% for Premium Pass
    const outputAmount = BigInt(quote.toAmount);
    const feeAmount = (outputAmount * BigInt(Math.floor(SWAP_FEE_PERCENTAGE * 10000))) / BigInt(10000);
    const netOutputAmount = outputAmount - feeAmount;
    
    // Build swap transaction
    const swapTx = await oneInch.buildSwap(
      fromToken,
      toToken,
      amount,
      fromAddress,
      slippage,
      false
    );

    // Simulate transaction
    const simulation = await transactionSimulator.simulate({
      from: swapTx.from,
      to: swapTx.to,
      data: swapTx.data,
      value: swapTx.value,
      chainId,
    });

    // Get optimized gas
    const gas = await gasOptimizer.optimizeTransaction({
      to: swapTx.to,
      data: swapTx.data,
      value: swapTx.value,
    });

    res.json({
      quote: {
        ...quote,
        toAmount: netOutputAmount.toString(), // Net amount after fee
        originalToAmount: quote.toAmount, // Original amount before fee
        feeAmount: feeAmount.toString(),
        feePercentage: SWAP_FEE_PERCENTAGE * 100,
      },
      transaction: {
        ...swapTx,
        maxFeePerGas: gas.maxFeePerGas,
        maxPriorityFeePerGas: gas.maxPriorityFeePerGas,
        gasLimit: gas.gasLimit,
      },
      simulation,
    });
  } catch (error: any) {
    logger.error('Swap error:', error);
    res.status(500).json({ error: error.message || 'Failed to build swap' });
  }
});

// GET /api/defi/tokens - Get supported tokens
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const { chainId } = req.query;
    
    const oneInch = new OneInchService(parseInt(chainId as string) || 1);
    const tokens = await oneInch.getSupportedTokens();

    res.json(tokens);
  } catch (error: any) {
    logger.error('Tokens error:', error);
    res.status(500).json({ error: error.message || 'Failed to get tokens' });
  }
});

// GET /api/defi/liquidity-sources - Get DEXs
router.get('/liquidity-sources', async (req: Request, res: Response) => {
  try {
    const { chainId } = req.query;
    
    const oneInch = new OneInchService(parseInt(chainId as string) || 1);
    const sources = await oneInch.getLiquiditySources();

    res.json(sources);
  } catch (error: any) {
    logger.error('Liquidity sources error:', error);
    res.status(500).json({ error: error.message || 'Failed to get liquidity sources' });
  }
});

// POST /api/defi/approve - Get approval transaction
router.post('/approve', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, amount, chainId } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const oneInch = new OneInchService(chainId || 1);
    const approveTx = await oneInch.getApproveTransaction(tokenAddress, amount);

    res.json(approveTx);
  } catch (error: any) {
    logger.error('Approve error:', error);
    res.status(500).json({ error: error.message || 'Failed to get approve transaction' });
  }
});

// GET /api/defi/allowance - Check token allowance
router.get('/allowance', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, walletAddress, chainId } = req.query;

    if (!tokenAddress || !walletAddress) {
      return res.status(400).json({ error: 'Token and wallet addresses required' });
    }

    const oneInch = new OneInchService(parseInt(chainId as string) || 1);
    const allowance = await oneInch.checkAllowance(
      tokenAddress as string,
      walletAddress as string
    );

    res.json({ allowance });
  } catch (error: any) {
    logger.error('Allowance error:', error);
    res.status(500).json({ error: error.message || 'Failed to check allowance' });
  }
});

// GET /api/defi/price - Get token price
router.get('/price', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chainId } = req.query;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const price = await tokenPriceService.getPrice(
      tokenAddress as string,
      parseInt(chainId as string) || 1
    );

    res.json({ price });
  } catch (error: any) {
    logger.error('Price error:', error);
    res.status(500).json({ error: error.message || 'Failed to get price' });
  }
});

// POST /api/defi/prices - Get multiple token prices
router.post('/prices', async (req: Request, res: Response) => {
  try {
    const { tokens } = req.body;

    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'Tokens array required' });
    }

    const prices = await tokenPriceService.getPrices(tokens);

    res.json(prices);
  } catch (error: any) {
    logger.error('Prices error:', error);
    res.status(500).json({ error: error.message || 'Failed to get prices' });
  }
});

// GET /api/defi/compare - Compare routes from multiple aggregators
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { fromToken, toToken, amount, chainId } = req.query;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const routes = await dexAggregator.compareRoutes(
      parseInt(chainId as string) || 1,
      fromToken as string,
      toToken as string,
      amount as string
    );

    res.json(routes);
  } catch (error: any) {
    logger.error('Compare error:', error);
    res.status(500).json({ error: error.message || 'Failed to compare routes' });
  }
});

// ============================================================================
// YIELD VAULT ROUTES
// ============================================================================

// GET /api/defi/yield-vaults - Get user's yield vaults
router.get('/yield-vaults', async (req: Request, res: Response) => {
  try {
    const vaults = await yieldVaultService.getUserVaults(req.userId!);
    res.json(vaults);
  } catch (error: any) {
    logger.error('Get yield vaults error:', error);
    res.status(500).json({ error: error.message || 'Failed to get yield vaults' });
  }
});

// GET /api/defi/yield-vaults/:id - Get vault details
router.get('/yield-vaults/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vault = await yieldVaultService.getVault(id, req.userId!);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    res.json(vault);
  } catch (error: any) {
    logger.error('Get vault error:', error);
    res.status(500).json({ error: error.message || 'Failed to get vault' });
  }
});

// POST /api/defi/yield-vaults - Create yield vault
router.post('/yield-vaults', async (req: Request, res: Response) => {
  try {
    const { name, strategy } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Vault name required' });
    }
    
    const vault = await yieldVaultService.createVault(req.userId!, name, strategy || 'default');
    res.json(vault);
  } catch (error: any) {
    logger.error('Create vault error:', error);
    res.status(500).json({ error: error.message || 'Failed to create vault' });
  }
});

// POST /api/defi/yield-vaults/:id/deposit - Deposit into vault
router.post('/yield-vaults/:id/deposit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, tokenAddress } = req.body;
    
    if (!amount || !tokenAddress) {
      return res.status(400).json({ error: 'Amount and token address required' });
    }
    
    const result = await yieldVaultService.deposit(id, req.userId!, amount, tokenAddress);
    res.json(result);
  } catch (error: any) {
    logger.error('Deposit error:', error);
    res.status(500).json({ error: error.message || 'Failed to deposit' });
  }
});

// POST /api/defi/yield-vaults/:id/withdraw - Withdraw from vault
router.post('/yield-vaults/:id/withdraw', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount required' });
    }
    
    const netYield = await yieldVaultService.withdraw(id, req.userId!, amount);
    res.json({ netYield, amount });
  } catch (error: any) {
    logger.error('Withdraw error:', error);
    res.status(500).json({ error: error.message || 'Failed to withdraw' });
  }
});

// ============================================================================
// YIELD ADAPTERS ROUTES
// ============================================================================

// GET /api/defi/yield-adapters - Get all available yield adapters
router.get('/yield-adapters', async (req: Request, res: Response) => {
  try {
    const adapters = await yieldAdaptersService.getAllAdapters();
    res.json(adapters);
  } catch (error: any) {
    logger.error('Get adapters error:', error);
    res.status(500).json({ error: error.message || 'Failed to get adapters' });
  }
});

// GET /api/defi/yield-adapters/:strategy - Get adapter info
router.get('/yield-adapters/:strategy', async (req: Request, res: Response) => {
  try {
    const { strategy } = req.params;
    const adapterInfo = await yieldAdaptersService.getAdapterInfo(strategy as YieldStrategy);
    res.json(adapterInfo);
  } catch (error: any) {
    logger.error('Get adapter info error:', error);
    res.status(500).json({ error: error.message || 'Failed to get adapter info' });
  }
});

// ============================================================================
// MEV PROTECTION ROUTES (Pro Tier)
// ============================================================================

// GET /api/defi/mev/status - Get MEV protection status and mempool info
router.get('/mev/status', requireProTier, async (req: Request, res: Response) => {
  try {
    const assessment = enhancedMevProtection.getMempoolRiskAssessment();
    const rpcHealth = rpcProviderService.getHealthStatus();
    
    res.json({
      mevProtection: {
        available: true,
        rpcs: MEV_PROTECTION_RPCS,
        priority: ['flashbots_fast', 'eden_rocket', 'flashbots', 'eden'],
      },
      mempool: assessment,
      rpcProviders: rpcHealth,
    });
  } catch (error: any) {
    logger.error('MEV status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get MEV status' });
  }
});

// POST /api/defi/mev/analyze - Analyze transaction for MEV risk (Pro)
router.post('/mev/analyze', requireProTier, async (req: Request, res: Response) => {
  try {
    const { to, value, data, from } = req.body;
    
    if (!to || !value) {
      return res.status(400).json({ error: 'Missing required parameters (to, value)' });
    }

    // Get preflight analysis
    const analysis = await enhancedMevProtection.preflightAnalysis({
      to,
      value,
      data: data || '0x',
      from,
    });

    // Get detailed MEV risk
    const mevRisk = await mevDetection.analyzeMevRisk(
      from || '0x0000000000000000000000000000000000000000',
      to,
      data || '0x',
      value
    );

    res.json({
      ...analysis,
      detailedRisk: mevRisk,
    });
  } catch (error: any) {
    logger.error('MEV analyze error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze MEV risk' });
  }
});

// POST /api/defi/mev/send-protected - Send transaction with MEV protection (Pro)
router.post('/mev/send-protected', requireProTier, async (req: Request, res: Response) => {
  try {
    const { signedTransaction, mode } = req.body;
    
    if (!signedTransaction) {
      return res.status(400).json({ error: 'Signed transaction required' });
    }

    const result = await enhancedMevProtection.sendProtectedTransactionPro(
      signedTransaction,
      mode || 'fast'
    );

    res.json(result);
  } catch (error: any) {
    logger.error('MEV send error:', error);
    res.status(500).json({ error: error.message || 'Failed to send protected transaction' });
  }
});

// GET /api/defi/mev/tx-status/:txHash - Check Flashbots transaction status
router.get('/mev/tx-status/:txHash', requireProTier, async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;
    
    const status = await enhancedMevProtection.checkFlashbotsStatus(txHash);
    res.json(status);
  } catch (error: any) {
    logger.error('TX status error:', error);
    res.status(500).json({ error: error.message || 'Failed to check transaction status' });
  }
});

// ============================================================================
// MEMPOOL MONITORING ROUTES (Pro Tier)
// ============================================================================

// GET /api/defi/mempool/stats - Get mempool statistics (Pro)
router.get('/mempool/stats', requireProTier, async (req: Request, res: Response) => {
  try {
    const stats = mempoolMonitor.getStats();
    const isActive = mempoolMonitor.isActive();
    
    res.json({
      isConnected: isActive,
      stats,
      proFeature: true,
    });
  } catch (error: any) {
    logger.error('Mempool stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get mempool stats' });
  }
});

// GET /api/defi/mempool/attacks - Get recent sandwich attacks detected (Pro)
router.get('/mempool/attacks', requireProTier, async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const attacks = mempoolMonitor.getRecentSandwichAttacks(
      parseInt(limit as string) || 10
    );
    
    res.json({
      attacks,
      proFeature: true,
    });
  } catch (error: any) {
    logger.error('Mempool attacks error:', error);
    res.status(500).json({ error: error.message || 'Failed to get attack history' });
  }
});

// GET /api/defi/mempool/pending/:address - Get pending transactions for address (Pro)
router.get('/mempool/pending/:address', requireProTier, async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const pending = mempoolMonitor.getPendingForAddress(address);
    
    res.json({
      address,
      pendingTransactions: pending,
      proFeature: true,
    });
  } catch (error: any) {
    logger.error('Pending transactions error:', error);
    res.status(500).json({ error: error.message || 'Failed to get pending transactions' });
  }
});

// POST /api/defi/mempool/connect - Connect to mempool monitoring service (Pro)
router.post('/mempool/connect', requireProTier, async (req: Request, res: Response) => {
  try {
    const connected = await mempoolMonitor.connect();
    
    res.json({
      connected,
      message: connected 
        ? 'Connected to mempool monitoring service' 
        : 'Mempool service not configured',
    });
  } catch (error: any) {
    logger.error('Mempool connect error:', error);
    res.status(500).json({ error: error.message || 'Failed to connect to mempool service' });
  }
});

// ============================================================================
// RPC PROVIDER ROUTES
// ============================================================================

// GET /api/defi/rpc/chains - Get supported chains and RPC status
router.get('/rpc/chains', async (req: Request, res: Response) => {
  try {
    const chains = rpcProviderService.getSupportedChains();
    const health = rpcProviderService.getHealthStatus();
    
    res.json({
      chains: chains.map(c => ({
        chainId: c.chainId,
        name: c.name,
        nativeCurrency: c.nativeCurrency,
        blockExplorer: c.blockExplorer,
      })),
      health,
    });
  } catch (error: any) {
    logger.error('RPC chains error:', error);
    res.status(500).json({ error: error.message || 'Failed to get chain info' });
  }
});

// GET /api/defi/rpc/health - Get RPC provider health status
router.get('/rpc/health', async (req: Request, res: Response) => {
  try {
    const health = rpcProviderService.getHealthStatus();
    res.json(health);
  } catch (error: any) {
    logger.error('RPC health error:', error);
    res.status(500).json({ error: error.message || 'Failed to get RPC health' });
  }
});

export default router;
