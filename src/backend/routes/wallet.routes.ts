// Wallet Routes - Wallet management, transactions, balances

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { walletService } from '../services/wallet.service';
import { transactionService } from '../services/transaction.service';
import crypto from 'crypto';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===========================
// WALLET MANAGEMENT
// ===========================

// GET /api/wallet - List user's wallets
router.get('/', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    logger.error('List wallets error:', error);
    res.json([]);
  }
});

// POST /api/wallet - Create new wallet
router.post('/', async (req: Request, res: Response) => {
  try {
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
        // Import existing wallet
        walletData = await walletService.importWallet(importedPrivateKey, chain);
      } else if (type === 'hardware') {
        // Hardware wallet - store address only
        const { hardwareType, address, derivationPath } = req.body;
        walletData = {
          address,
          publicKey: '', // Hardware wallets don't expose private keys
          privateKey: undefined,
        };
      } else {
        // Generate new wallet
        walletData = await walletService.createWallet(chain);
      }
    } catch (e) {
      return res.status(400).json({ error: 'Failed to create wallet data' });
    }

    // Encrypt private key if present
    let encryptedPrivateKey = null;
    if (walletData?.privateKey) {
      try {
        encryptedPrivateKey = walletService.encryptPrivateKey(
          walletData.privateKey,
          req.userId!
        );
      } catch (e) {
        encryptedPrivateKey = null;
      }
    }

    // Check if this is first wallet (set as default)
    let existingWallets = 0;
    try {
      existingWallets = await prisma.wallet.count({
        where: { userId: req.userId! },
      });
    } catch (e) {
      existingWallets = 0;
    }

    try {
      const wallet = await prisma.wallet.create({
        data: {
          userId: req.userId!,
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

      // Return wallet (without private key)
      const mnemonicValue = (type === 'generated' && walletData && 'mnemonic' in walletData) ? (walletData as any).mnemonic : undefined;
      return res.json({
        id: wallet.id,
        name: wallet.name,
        address: wallet.address,
        chain: wallet.chain,
        type: wallet.walletType,
        isDefault: wallet.isDefault,
        mnemonic: mnemonicValue,
      });
    } catch (dbError: any) {
      // Fallback: return wallet data even if DB fails
      const mnemonicFallback = (type === 'generated' && walletData && 'mnemonic' in walletData) ? (walletData as any).mnemonic : undefined;
      return res.json({
        id: `wallet-${Date.now()}`,
        name: name || `Wallet ${existingWallets + 1}`,
        address: walletData.address,
        chain: chain,
        type: type || 'generated',
        isDefault: existingWallets === 0,
        mnemonic: mnemonicFallback,
        warning: 'Wallet data created but not persisted to database',
      });
    }
  } catch (error: any) {
    logger.error('Create wallet error:', error);
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

// GET /api/wallet/:address - Get wallet details
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: address.toLowerCase(),
        userId: req.userId!,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Fetch latest balance
    const balance = await walletService.getBalance(wallet.address, wallet.chain);

    // Update balance in DB
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balance.toString(),
        lastSyncedAt: new Date(),
      },
    });

    res.json({
      id: wallet.id,
      name: wallet.name,
      address: wallet.address,
      chain: wallet.chain,
      type: wallet.walletType,
      balance,
      isDefault: wallet.isDefault,
      lastSyncedAt: new Date(),
    });
  } catch (error) {
    logger.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
});

// PUT /api/wallet/:address - Update wallet
router.put('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { name, isDefault } = req.body;

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: address.toLowerCase(),
        userId: req.userId!,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.wallet.updateMany({
        where: {
          userId: req.userId!,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        name: name || wallet.name,
        isDefault: isDefault !== undefined ? isDefault : wallet.isDefault,
      },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      address: updated.address,
      isDefault: updated.isDefault,
    });
  } catch (error) {
    logger.error('Update wallet error:', error);
    res.status(500).json({ error: 'Failed to update wallet' });
  }
});

// DELETE /api/wallet/:address - Delete wallet
router.delete('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: address.toLowerCase(),
        userId: req.userId!,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Don't allow deleting the last wallet
    const walletsCount = await prisma.wallet.count({
      where: { userId: req.userId! },
    });

    if (walletsCount === 1) {
      return res.status(400).json({ error: 'Cannot delete your only wallet' });
    }

    // If deleting default wallet, set another as default
    if (wallet.isDefault) {
      const nextWallet = await prisma.wallet.findFirst({
        where: {
          userId: req.userId!,
          id: { not: wallet.id },
        },
      });

      if (nextWallet) {
        await prisma.wallet.update({
          where: { id: nextWallet.id },
          data: { isDefault: true },
        });
      }
    }

    await prisma.wallet.delete({
      where: { id: wallet.id },
    });

    res.json({ message: 'Wallet deleted' });
  } catch (error) {
    logger.error('Delete wallet error:', error);
    res.status(500).json({ error: 'Failed to delete wallet' });
  }
});

// ===========================
// BALANCE & TOKENS
// ===========================

// GET /api/wallet/:address/balance - Get wallet balance
router.get('/:address/balance', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: address.toLowerCase(),
        userId: req.userId!,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const balance = await walletService.getBalance(wallet.address, wallet.chain);
    const balanceUSD = await walletService.getBalanceUSD(balance, wallet.chain);

    res.json({
      balance,
      balanceUSD,
      chain: wallet.chain,
      address: wallet.address,
    });
  } catch (error) {
    logger.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// GET /api/wallet/:address/tokens - Get ERC20 tokens
router.get('/:address/tokens', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: address.toLowerCase(),
        userId: req.userId!,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const tokens = await walletService.getTokens(wallet.address, wallet.chain);

    res.json(tokens);
  } catch (error) {
    logger.error('Get tokens error:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

// ===========================
// TRANSACTIONS
// ===========================

// GET /api/wallet/:address/transactions - Get transaction history
router.get('/:address/transactions', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: address.toLowerCase(),
        userId: req.userId!,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Fetch from database
    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    // Also fetch latest from blockchain
    const blockchainTxs = await walletService.getTransactions(
      wallet.address,
      wallet.chain
    );

    // Merge and deduplicate
    const allTxs = [...transactions, ...blockchainTxs];
    const uniqueTxs = Array.from(
      new Map(allTxs.map((tx) => [tx.hash, tx])).values()
    );

    res.json(uniqueTxs.slice(0, Number(limit)));
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// POST /api/wallet/:address/send - Send transaction
router.post('/:address/send', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { to, amount, token, gasLimit, maxFeePerGas, maxPriorityFeePerGas } = req.body;

    if (!to || !amount) {
      return res.status(400).json({ error: 'Recipient and amount required' });
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: address.toLowerCase(),
        userId: req.userId!,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Decrypt private key
    const privateKey = walletService.decryptPrivateKey(
      wallet.encryptedPrivateKey!,
      req.userId!
    );

    // Send transaction
    const txHash = await transactionService.sendTransaction({
      from: wallet.address,
      to,
      amount,
      token,
      privateKey,
      chain: wallet.chain,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    // Store in database
    await prisma.transaction.create({
      data: {
        userId: req.userId!,
        walletId: wallet.id,
        hash: txHash,
        type: 'send',
        from: wallet.address,
        to,
        value: amount,
        tokenAddress: token,
        status: 'pending',
        chain: wallet.chain,
      },
    });

    res.json({
      hash: txHash,
      status: 'pending',
      message: 'Transaction sent',
    });
  } catch (error: any) {
    logger.error('Send transaction error:', error);
    res.status(500).json({ error: error.message || 'Failed to send transaction' });
  }
});

// POST /api/wallet/:address/swap - Swap tokens
router.post('/:address/swap', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { fromToken, toToken, amount, slippage } = req.body;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Tokens and amount required' });
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: address.toLowerCase(),
        userId: req.userId!,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Get best swap route
    const quote = await transactionService.getSwapQuote({
      fromToken,
      toToken,
      amount,
      chain: wallet.chain,
    });

    // Execute swap
    const privateKey = walletService.decryptPrivateKey(
      wallet.encryptedPrivateKey!,
      req.userId!
    );

    const txHash = await transactionService.executeSwap({
      wallet: wallet.address,
      privateKey,
      quote,
      slippage: slippage || 1, // 1% default
    });

    // Store in database
    await prisma.transaction.create({
      data: {
        userId: req.userId!,
        walletId: wallet.id,
        hash: txHash,
        type: 'swap',
        from: wallet.address,
        to: quote.router,
        value: amount,
        tokenAddress: fromToken,
        swapFromToken: fromToken,
        swapToToken: toToken,
        swapFromAmount: amount,
        swapToAmount: quote.expectedOutput,
        status: 'pending',
        chain: wallet.chain,
      },
    });

    res.json({
      hash: txHash,
      expectedOutput: quote.expectedOutput,
      status: 'pending',
    });
  } catch (error: any) {
    logger.error('Swap error:', error);
    res.status(500).json({ error: error.message || 'Swap failed' });
  }
});

// GET /api/wallet/:address/export - Export private key (requires biometric)
router.get('/:address/export', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { biometricToken } = req.query;

    // Verify biometric authentication
    if (!biometricToken) {
      return res.status(403).json({ error: 'Biometric authentication required' });
    }

    // TODO: Verify biometric token

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: address.toLowerCase(),
        userId: req.userId!,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (!wallet.encryptedPrivateKey) {
      return res.status(400).json({ error: 'Hardware wallet - no private key' });
    }

    // Decrypt private key
    const privateKey = walletService.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      req.userId!
    );

    res.json({
      address: wallet.address,
      privateKey,
      warning: 'Never share your private key with anyone!',
    });
  } catch (error) {
    logger.error('Export wallet error:', error);
    res.status(500).json({ error: 'Failed to export wallet' });
  }
});

export default router;
