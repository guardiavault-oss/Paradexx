import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { walletService } from '../services/wallet.service';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        oauthProvider: true,
        emailVerified: true,
        twoFactorEnabled: true,
        biometricEnabled: true,
        autoLockEnabled: true,
        autoLockTimeout: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            wallets: true,
            sessions: true,
            guardians: true,
            beneficiaries: true,
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      account: {
        ...user,
        walletCount: user._count.wallets,
        sessionCount: user._count.sessions,
        guardianCount: user._count.guardians,
        beneficiaryCount: user._count.beneficiaries,
      }
    });
  } catch (error) {
    logger.error('Get account error:', error);
    res.status(500).json({ error: 'Failed to get account info' });
  }
});

router.get('/wallets', async (req: Request, res: Response) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.userId!, isHidden: false },
      select: {
        id: true,
        name: true,
        address: true,
        chain: true,
        walletType: true,
        hardwareType: true,
        balance: true,
        isDefault: true,
        lastSyncedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ wallets });
  } catch (error) {
    logger.error('Get wallets error:', error);
    res.status(500).json({ error: 'Failed to get wallets' });
  }
});

router.post('/wallets', async (req: Request, res: Response) => {
  try {
    const { name, chain, type, importedPrivateKey } = req.body;

    const validChains = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base'];
    if (!validChains.includes(chain)) {
      return res.status(400).json({ error: 'Invalid chain' });
    }

    let walletData;
    if (type === 'imported' && importedPrivateKey) {
      walletData = await walletService.importWallet(importedPrivateKey, chain);
    } else if (type === 'hardware') {
      const { hardwareType, address } = req.body;
      if (!address) {
        return res.status(400).json({ error: 'Hardware wallet address required' });
      }
      walletData = { address, publicKey: '', privateKey: undefined };
    } else {
      walletData = await walletService.createWallet(chain);
    }

    const existingCount = await prisma.wallet.count({ where: { userId: req.userId! } });
    
    let encryptedPrivateKey = null;
    if (walletData.privateKey) {
      encryptedPrivateKey = walletService.encryptPrivateKey(walletData.privateKey, req.userId!);
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId: req.userId!,
        name: name || `Wallet ${existingCount + 1}`,
        address: walletData.address,
        publicKey: walletData.publicKey || '',
        encryptedPrivateKey,
        chain,
        walletType: type || 'generated',
        hardwareType: type === 'hardware' ? req.body.hardwareType : null,
        isDefault: existingCount === 0,
        balance: '0',
      },
    });

    const mnemonicValue = (type !== 'hardware' && type !== 'imported' && walletData && 'mnemonic' in walletData) 
      ? (walletData as any).mnemonic 
      : undefined;

    res.json({
      wallet: {
        id: wallet.id,
        name: wallet.name,
        address: wallet.address,
        chain: wallet.chain,
        type: wallet.walletType,
        isDefault: wallet.isDefault,
      },
      mnemonic: mnemonicValue,
      warning: mnemonicValue ? 'Save this recovery phrase securely. It will not be shown again.' : undefined,
    });
  } catch (error: any) {
    logger.error('Create wallet error:', error);
    res.status(500).json({ error: error.message || 'Failed to create wallet' });
  }
});

router.put('/wallets/:walletId/rename', async (req: Request, res: Response) => {
  try {
    const { walletId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId: req.userId! },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const updated = await prisma.wallet.update({
      where: { id: walletId },
      data: { name },
    });

    res.json({ wallet: { id: updated.id, name: updated.name } });
  } catch (error) {
    logger.error('Rename wallet error:', error);
    res.status(500).json({ error: 'Failed to rename wallet' });
  }
});

router.post('/wallets/:walletId/archive', async (req: Request, res: Response) => {
  try {
    const { walletId } = req.params;

    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId: req.userId! },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    await prisma.wallet.update({
      where: { id: walletId },
      data: { isHidden: true },
    });

    if (wallet.isDefault) {
      const nextWallet = await prisma.wallet.findFirst({
        where: { userId: req.userId!, id: { not: walletId }, isHidden: false },
      });
      if (nextWallet) {
        await prisma.wallet.update({
          where: { id: nextWallet.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({ success: true, message: 'Wallet archived' });
  } catch (error) {
    logger.error('Archive wallet error:', error);
    res.status(500).json({ error: 'Failed to archive wallet' });
  }
});

router.get('/devices', async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId! },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const devices = sessions.map(session => ({
      id: session.id,
      name: parseUserAgent(session.userAgent || ''),
      ipAddress: session.ipAddress,
      lastActive: session.createdAt,
      trusted: true,
      current: false,
    }));

    res.json({ devices });
  } catch (error) {
    logger.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

router.post('/devices', async (req: Request, res: Response) => {
  try {
    const { deviceInfo, pushToken } = req.body;
    res.json({ 
      success: true, 
      deviceId: `device-${Date.now()}`,
      message: 'Device registered',
    });
  } catch (error) {
    logger.error('Register device error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

router.post('/devices/:deviceId/trust', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    res.json({ success: true, message: 'Device trusted' });
  } catch (error) {
    logger.error('Trust device error:', error);
    res.status(500).json({ error: 'Failed to trust device' });
  }
});

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { 
        userId: req.userId!,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ 
      sessions: sessions.map(s => ({
        id: s.id,
        device: parseUserAgent(s.userAgent || ''),
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      }))
    });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: req.userId! },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.session.delete({ where: { id: sessionId } });

    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    logger.error('Revoke session error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

router.post('/sessions/revoke-all', async (req: Request, res: Response) => {
  try {
    const currentToken = req.headers.authorization?.replace('Bearer ', '');

    await prisma.session.deleteMany({
      where: {
        userId: req.userId!,
        token: { not: currentToken },
      },
    });

    res.json({ success: true, message: 'All other sessions revoked' });
  } catch (error) {
    logger.error('Revoke all sessions error:', error);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

function parseUserAgent(ua: string): string {
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android Device';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown Device';
}

export default router;
