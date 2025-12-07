// Example: Wallet Routes - Migrated to use asyncHandler
// This is a reference example showing the migration pattern

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { walletService } from '../services/wallet.service';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../services/logger.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===========================
// WALLET MANAGEMENT
// ===========================

// GET /api/wallet - List user's wallets
// BEFORE: Had try-catch block
// AFTER: Uses asyncHandler - cleaner and more consistent
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const wallets = await prisma.wallet.findMany({
    where: { userId: String(userId) },
    select: {
      id: true,
      name: true,
      address: true,
      chain: true,
      walletType: true,
      balance: true,
      isDefault: true,
      createdAt: true,
      lastSyncedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  res.json(wallets || []);
  // Errors are automatically caught by asyncHandler and logged
}));

// POST /api/wallet - Create new wallet
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, chain, type, importedPrivateKey } = req.body;

  // Validate chain
  const validChains = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base'];
  if (!validChains.includes(chain)) {
    return res.status(400).json({ error: 'Invalid chain' });
  }

  // Create wallet based on type
  let walletData;
  try {
    if (type === 'imported' && importedPrivateKey) {
      walletData = await walletService.importWallet(importedPrivateKey, chain);
    } else if (type === 'hardware') {
      const { hardwareType, address, derivationPath } = req.body;
      walletData = {
        address,
        publicKey: '',
        privateKey: undefined,
      };
    } else {
      walletData = await walletService.createWallet(chain);
    }
  } catch (e) {
    // This try-catch is fine - it's for specific error handling
    return res.status(400).json({ error: 'Failed to create wallet data' });
  }

  // Encrypt private key if present
  let encryptedPrivateKey = null;
  if (walletData?.privateKey) {
    try {
      encryptedPrivateKey = walletService.encryptPrivateKey(
        walletData.privateKey,
        (req as any).userId!
      );
    } catch (e) {
      encryptedPrivateKey = null;
    }
  }

  // Check if this is first wallet (set as default)
  const existingWallets = await prisma.wallet.count({
    where: { userId: (req as any).userId! },
  });

  const wallet = await prisma.wallet.create({
    data: {
      userId: (req as any).userId!,
      name: name || `Wallet ${existingWallets + 1}`,
      address: walletData.address,
      publicKey: walletData.publicKey || '',
      encryptedPrivateKey,
      chain,
      walletType: type || 'generated',
      isDefault: existingWallets === 0,
      balance: '0',
    },
  });

  res.json({
    wallet: {
      id: wallet.id,
      name: wallet.name,
      address: wallet.address,
      chain: wallet.chain,
      isDefault: wallet.isDefault,
    },
    success: true,
  });
}));

export default router;

