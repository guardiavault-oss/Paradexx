import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { inheritanceService } from '../services/inheritance.service';
import { prisma } from '../config/database';

const router = Router();

router.use(authenticateToken);

const CONTRACT_ADDRESSES: Record<string, { factory: string; registry: string; chainId: number }> = {
  ethereum: {
    factory: process.env.VAULT_FACTORY_ETH || '0x0000000000000000000000000000000000000000',
    registry: process.env.VAULT_REGISTRY_ETH || '0x0000000000000000000000000000000000000000',
    chainId: 1,
  },
  polygon: {
    factory: process.env.VAULT_FACTORY_POLYGON || '0x0000000000000000000000000000000000000000',
    registry: process.env.VAULT_REGISTRY_POLYGON || '0x0000000000000000000000000000000000000000',
    chainId: 137,
  },
  arbitrum: {
    factory: process.env.VAULT_FACTORY_ARB || '0x0000000000000000000000000000000000000000',
    registry: process.env.VAULT_REGISTRY_ARB || '0x0000000000000000000000000000000000000000',
    chainId: 42161,
  },
  base: {
    factory: process.env.VAULT_FACTORY_BASE || '0x0000000000000000000000000000000000000000',
    registry: process.env.VAULT_REGISTRY_BASE || '0x0000000000000000000000000000000000000000',
    chainId: 8453,
  },
};

router.post('/create-vault', async (req: Request, res: Response) => {
  try {
    const { name, description, guardians, threshold, timelockPeriod, network, walletAddresses } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Vault name is required' });
    }

    const inactivityDays = timelockPeriod ? Math.floor(timelockPeriod / (24 * 60 * 60)) : 30;

    const vault = await inheritanceService.createVault({
      userId: req.userId!,
      name,
      description,
      tier: 'essential',
      inactivityDays,
      walletAddresses: walletAddresses || [],
      distributionMethod: 'automatic',
      requiresGuardianApproval: threshold ? threshold > 1 : true,
    });

    const contractAddresses = CONTRACT_ADDRESSES[network] || CONTRACT_ADDRESSES.ethereum;

    res.json({
      vault: {
        id: vault.id,
        name: vault.name,
        status: vault.status,
        network: network || 'ethereum',
      },
      contract: {
        to: contractAddresses.factory,
        chainId: contractAddresses.chainId,
      },
    });
  } catch (error: any) {
    logger.error('Create vault error:', error);
    res.status(500).json({ error: error.message || 'Failed to create vault' });
  }
});

router.post('/my-vaults', async (req: Request, res: Response) => {
  try {
    const { network } = req.body;

    const vault = await inheritanceService.getVault(req.userId!);

    if (!vault) {
      return res.json({ vaults: [] });
    }

    const guardians = await prisma.guardian.findMany({
      where: { userId: req.userId!, status: 'accepted' },
      select: { id: true, email: true, name: true },
    });

    const beneficiaries = vault.beneficiaries || [];

    const vaults = [{
      id: vault.id,
      address: vault.id,
      name: vault.name,
      owner: req.userId,
      guardians: guardians.map(g => ({ id: g.id, email: g.email, name: g.name })),
      beneficiaries: beneficiaries.map((b: any) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        percentage: b.percentage,
      })),
      threshold: vault.requiresGuardianApproval ? 2 : 1,
      timelockPeriod: ((vault as any).inactivityThresholdDays || vault.inactivityDays || 30) * 24 * 60 * 60,
      status: vault.status,
      tier: vault.tier,
      lastActivityAt: vault.lastActivityAt?.toISOString(),
      network: network || 'ethereum',
    }];

    res.json({ vaults });
  } catch (error: any) {
    logger.error('Get vaults error:', error);
    res.status(500).json({ error: error.message || 'Failed to get vaults' });
  }
});

router.post('/vault-info', async (req: Request, res: Response) => {
  try {
    const { vaultAddress, network } = req.body;

    if (!vaultAddress) {
      return res.status(400).json({ error: 'Vault address is required' });
    }

    const vault = await inheritanceService.getVault(req.userId!);

    if (!vault || vault.id !== vaultAddress) {
      return res.status(404).json({ error: 'Vault not found' });
    }

    const guardians = await prisma.guardian.findMany({
      where: { userId: req.userId!, status: 'accepted' },
      select: { id: true, email: true, name: true },
    });

    const beneficiaries = vault.beneficiaries || [];

    res.json({
      id: vault.id,
      address: vault.id,
      name: vault.name,
      description: vault.description,
      owner: req.userId,
      guardians: guardians.map(g => ({ id: g.id, email: g.email, name: g.name })),
      beneficiaries: beneficiaries.map((b: any) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        percentage: b.percentage,
        walletAddress: b.walletAddress,
      })),
      threshold: vault.requiresGuardianApproval ? 2 : 1,
      timelockPeriod: ((vault as any).inactivityThresholdDays || vault.inactivityDays || 30) * 24 * 60 * 60,
      status: vault.status,
      tier: vault.tier,
      lastActivityAt: vault.lastActivityAt?.toISOString(),
      network: network || 'ethereum',
    });
  } catch (error: any) {
    logger.error('Get vault info error:', error);
    res.status(500).json({ error: error.message || 'Failed to get vault info' });
  }
});

router.get('/addresses/:network', async (req: Request, res: Response) => {
  try {
    const { network } = req.params;

    const addresses = CONTRACT_ADDRESSES[network] || CONTRACT_ADDRESSES.ethereum;

    res.json({ addresses });
  } catch (error: any) {
    logger.error('Get addresses error:', error);
    res.status(500).json({ error: error.message || 'Failed to get contract addresses' });
  }
});

export default router;
