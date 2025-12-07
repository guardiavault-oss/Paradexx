/**
 * Token Icons Routes - Fetch token logos/icons
 */

import { Router, Request, Response } from 'express';
import tokenIconsService from '../services/token-icons.service';

const router = Router();

/**
 * GET /api/tokens/icon/:symbol
 * Get token icon by symbol
 */
router.get('/icon/:symbol', async (req: Request, res: Response) => {
    try {
        const { symbol } = req.params;
        const icon = await tokenIconsService.getTokenIcon(1, symbol);
        res.json({ symbol, icon });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/tokens/icon/:chainId/:address
 * Get token icon by chain ID and address
 */
router.get('/icon/:chainId/:address', async (req: Request, res: Response) => {
    try {
        const { chainId, address } = req.params;
        const icon = await tokenIconsService.getTokenIcon(parseInt(chainId), address);
        res.json({ chainId: parseInt(chainId), address, icon });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/tokens/icons
 * Get multiple token icons at once
 */
router.post('/icons', async (req: Request, res: Response) => {
    try {
        const { tokens } = req.body;

        if (!tokens || !Array.isArray(tokens)) {
            return res.status(400).json({ error: 'tokens array is required' });
        }

        const icons: Record<string, string> = {};

        await Promise.all(
            tokens.map(async (token: { chainId: number; address: string }) => {
                const key = `${token.chainId}:${token.address.toLowerCase()}`;
                icons[key] = await tokenIconsService.getTokenIcon(token.chainId, token.address);
            })
        );

        res.json({ icons });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/tokens/native/:chainId
 * Get native token icon for a chain
 */
router.get('/native/:chainId', (req: Request, res: Response) => {
    try {
        const { chainId } = req.params;
        const icon = tokenIconsService.getNativeTokenIcon(parseInt(chainId));
        res.json({ chainId: parseInt(chainId), icon });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
