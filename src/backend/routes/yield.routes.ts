/**
 * Yield & Staking Routes - Integration with deployed adapter contracts
 * 
 * Deployed Contracts:
 * - LIDO_ADAPTER: 0xC30F4DE8666c79757116517361dFE6764A6Dc128
 * - AAVE_ADAPTER: 0xcc27a22d92a8B03D822974CDeD6BB74c63Ac0ae1
 * - YIELD_VAULT: 0x86bE7Bf7Ef3Af62BB7e56a324a11fdBA7f3AfbBb
 * - YIELD_OPTIMIZER: 0x026C7cC2dbf634e05c650e95E30df0be97Df8767
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { yieldAdaptersService, YieldStrategy } from '../services/yield-adapters.service';
import { yieldVaultService } from '../services/yield-vault.service';
import { logger } from '../services/logger.service';

const router = Router();

// Contract addresses (from environment or defaults)
const CONTRACTS = {
    LIDO_ADAPTER: process.env.LIDO_ADAPTER_ADDRESS || '0xC30F4DE8666c79757116517361dFE6764A6Dc128',
    AAVE_ADAPTER: process.env.AAVE_ADAPTER_ADDRESS || '0xcc27a22d92a8B03D822974CDeD6BB74c63Ac0ae1',
    YIELD_VAULT: process.env.YIELD_VAULT_ADDRESS || '0x86bE7Bf7Ef3Af62BB7e56a324a11fdBA7f3AfbBb',
    YIELD_OPTIMIZER: process.env.YIELD_OPTIMIZER_ADDRESS || '0x026C7cC2dbf634e05c650e95E30df0be97Df8767',
};

/**
 * GET /api/yield/strategies
 * Get all available yield strategies with APY
 */
router.get('/strategies', async (req: Request, res: Response) => {
    try {
        const adapters = await yieldAdaptersService.getAllAdapters();

        res.json({
            strategies: adapters.map(adapter => ({
                id: adapter.strategy,
                name: adapter.name,
                address: adapter.address,
                apy: adapter.apy,
                totalAssets: adapter.totalAssets,
                risk: adapter.strategy === YieldStrategy.LIDO ? 'low' : 'medium',
                description: getStrategyDescription(adapter.strategy),
            })),
            contracts: CONTRACTS,
        });
    } catch (error: any) {
        logger.error('[Yield] Error fetching strategies:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/yield/strategy/:strategy
 * Get details for a specific strategy
 */
router.get('/strategy/:strategy', async (req: Request, res: Response) => {
    try {
        const { strategy } = req.params;

        if (!Object.values(YieldStrategy).includes(strategy as YieldStrategy)) {
            return res.status(400).json({ error: 'Invalid strategy' });
        }

        const info = await yieldAdaptersService.getAdapterInfo(strategy as YieldStrategy);

        res.json({
            strategy: info,
            description: getStrategyDescription(strategy as YieldStrategy),
        });
    } catch (error: any) {
        logger.error('[Yield] Error fetching strategy:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/yield/vaults
 * Get user's yield vaults
 */
router.get('/vaults', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const vaults = await yieldVaultService.getUserVaults(userId);

        res.json({ vaults });
    } catch (error: any) {
        logger.error('[Yield] Error fetching vaults:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/yield/vaults
 * Create a new yield vault
 */
router.post('/vaults', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name, strategy } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Vault name is required' });
        }

        const vault = await yieldVaultService.createVault(userId, name, strategy || 'default');

        res.json({ vault });
    } catch (error: any) {
        logger.error('[Yield] Error creating vault:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/yield/deposit
 * Deposit into yield strategy
 */
router.post('/deposit', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { vaultId, amount, tokenAddress } = req.body;

        if (!vaultId || !amount || !tokenAddress) {
            return res.status(400).json({
                error: 'Missing required fields: vaultId, amount, tokenAddress'
            });
        }

        const deposit = await yieldVaultService.deposit(vaultId, userId, amount, tokenAddress);

        res.json({
            success: true,
            deposit,
            message: 'Deposit initiated. Transaction pending.',
        });
    } catch (error: any) {
        logger.error('[Yield] Error depositing:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/yield/withdraw
 * Withdraw from yield strategy
 */
router.post('/withdraw', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { vaultId, amount } = req.body;

        if (!vaultId || !amount) {
            return res.status(400).json({
                error: 'Missing required fields: vaultId, amount'
            });
        }

        const netYield = await yieldVaultService.withdraw(vaultId, userId, amount);

        res.json({
            success: true,
            withdrawn: amount,
            netYield,
            message: 'Withdrawal initiated. Transaction pending.',
        });
    } catch (error: any) {
        logger.error('[Yield] Error withdrawing:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/yield/balance/:strategy/:address
 * Get user balance in a yield strategy
 */
router.get('/balance/:strategy/:address', async (req: Request, res: Response) => {
    try {
        const { strategy, address } = req.params;

        if (!Object.values(YieldStrategy).includes(strategy as YieldStrategy)) {
            return res.status(400).json({ error: 'Invalid strategy' });
        }

        const balance = await yieldAdaptersService.getBalance(strategy as YieldStrategy, address);

        res.json({ strategy, address, balance });
    } catch (error: any) {
        logger.error('[Yield] Error fetching balance:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/yield/apy/:vaultId
 * Get current APY for a vault
 */
router.get('/apy/:vaultId', async (req: Request, res: Response) => {
    try {
        const { vaultId } = req.params;
        const apy = await yieldVaultService.getVaultAPY(vaultId);

        res.json({ vaultId, apy });
    } catch (error: any) {
        logger.error('[Yield] Error fetching APY:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/yield/contracts
 * Get deployed contract addresses
 */
router.get('/contracts', (req: Request, res: Response) => {
    res.json({ contracts: CONTRACTS });
});

// Helper function for strategy descriptions
function getStrategyDescription(strategy: YieldStrategy): string {
    const descriptions: Record<YieldStrategy, string> = {
        [YieldStrategy.LIDO]: 'Stake ETH to receive stETH and earn staking rewards. Low risk, liquid staking.',
        [YieldStrategy.AAVE]: 'Lend assets on Aave to earn interest. Medium risk, variable APY.',
        [YieldStrategy.COMPOUND]: 'Supply assets to Compound for lending yield.',
        [YieldStrategy.DEFAULT]: 'Default balanced yield strategy across multiple protocols.',
    };

    return descriptions[strategy] || 'Yield generating strategy';
}

export default router;
