import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { inheritanceService } from '../services/inheritance.service';

const router = Router();

router.use(authenticateToken);

router.get('/config', async (req: Request, res: Response) => {
  try {
    res.json({
      tierPrices: inheritanceService.getTierPrices(),
      tierLimits: inheritanceService.getTierLimits(),
      inactivityOptions: inheritanceService.getInactivityOptions(),
    });
  } catch (error) {
    logger.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const vault = await inheritanceService.getVault(req.userId!);
    
    if (!vault) {
      return res.json({ vault: null });
    }

    res.json({ vault });
  } catch (error) {
    logger.error('Get vault error:', error);
    res.status(500).json({ error: 'Failed to get inheritance vault' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, tier, inactivityDays, walletAddresses, distributionMethod, requiresGuardianApproval } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Vault name is required' });
    }

    const vault = await inheritanceService.createVault({
      userId: req.userId!,
      name,
      description,
      tier,
      inactivityDays,
      walletAddresses,
      distributionMethod,
      requiresGuardianApproval,
    });

    res.status(201).json({ vault });
  } catch (error: any) {
    logger.error('Create vault error:', error);
    res.status(400).json({ error: error.message || 'Failed to create inheritance vault' });
  }
});

router.put('/:vaultId', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const updates = req.body;

    const vault = await inheritanceService.updateVault(vaultId, req.userId!, updates);

    res.json({ vault });
  } catch (error: any) {
    logger.error('Update vault error:', error);
    res.status(400).json({ error: error.message || 'Failed to update vault' });
  }
});

router.post('/:vaultId/upgrade', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const { tier } = req.body;

    if (!['essential', 'premium'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be essential or premium' });
    }

    const vault = await inheritanceService.upgradeTier(vaultId, req.userId!, tier);

    res.json({ vault, message: `Upgraded to ${tier} tier successfully` });
  } catch (error: any) {
    logger.error('Upgrade tier error:', error);
    res.status(400).json({ error: error.message || 'Failed to upgrade tier' });
  }
});

router.post('/:vaultId/check-in', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;

    const result = await inheritanceService.checkIn(vaultId, req.userId!);

    res.json({ success: true, lastActivityAt: result.lastActivityAt });
  } catch (error: any) {
    logger.error('Check-in error:', error);
    res.status(400).json({ error: error.message || 'Failed to check in' });
  }
});

router.post('/:vaultId/cancel', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;

    const result = await inheritanceService.cancelVault(vaultId, req.userId!);

    res.json({ success: true, message: 'Vault cancelled successfully' });
  } catch (error: any) {
    logger.error('Cancel vault error:', error);
    res.status(400).json({ error: error.message || 'Failed to cancel vault' });
  }
});

router.post('/:vaultId/cancel-trigger', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;

    const result = await inheritanceService.cancelTrigger(vaultId, req.userId!);

    res.json({ success: true, message: 'Trigger cancelled. Vault is active again.' });
  } catch (error: any) {
    logger.error('Cancel trigger error:', error);
    res.status(400).json({ error: error.message || 'Failed to cancel trigger' });
  }
});

router.get('/:vaultId/beneficiaries', async (req: Request, res: Response) => {
  try {
    const vault = await inheritanceService.getVault(req.userId!);
    
    if (!vault || vault.id !== req.params.vaultId) {
      return res.status(404).json({ error: 'Vault not found' });
    }

    res.json({ beneficiaries: vault.beneficiaries });
  } catch (error) {
    logger.error('Get beneficiaries error:', error);
    res.status(500).json({ error: 'Failed to get beneficiaries' });
  }
});

router.post('/:vaultId/beneficiaries', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const { name, email, walletAddress, relationship, percentage } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (percentage === undefined || percentage <= 0 || percentage > 100) {
      return res.status(400).json({ error: 'Percentage must be between 1 and 100' });
    }

    const beneficiary = await inheritanceService.addBeneficiary(
      { vaultId, name, email, walletAddress, relationship, percentage },
      req.userId!
    );

    res.status(201).json({ beneficiary });
  } catch (error: any) {
    logger.error('Add beneficiary error:', error);
    res.status(400).json({ error: error.message || 'Failed to add beneficiary' });
  }
});

router.put('/:vaultId/beneficiaries/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    const updates = req.body;

    const beneficiary = await inheritanceService.updateBeneficiary(beneficiaryId, req.userId!, updates);

    res.json({ beneficiary });
  } catch (error: any) {
    logger.error('Update beneficiary error:', error);
    res.status(400).json({ error: error.message || 'Failed to update beneficiary' });
  }
});

router.delete('/:vaultId/beneficiaries/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;

    await inheritanceService.removeBeneficiary(beneficiaryId, req.userId!);

    res.json({ success: true, message: 'Beneficiary removed successfully' });
  } catch (error: any) {
    logger.error('Remove beneficiary error:', error);
    res.status(400).json({ error: error.message || 'Failed to remove beneficiary' });
  }
});

router.post('/verify-beneficiary', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const beneficiary = await inheritanceService.verifyBeneficiary(token);

    res.json({ success: true, beneficiary, message: 'Beneficiary verified successfully' });
  } catch (error: any) {
    logger.error('Verify beneficiary error:', error);
    res.status(400).json({ error: error.message || 'Failed to verify beneficiary' });
  }
});

router.post('/admin/process-inactivity', async (req: Request, res: Response) => {
  try {
    await inheritanceService.processInactivityCheck();
    res.json({ success: true, message: 'Inactivity check completed' });
  } catch (error: any) {
    logger.error('Process inactivity error:', error);
    res.status(500).json({ error: error.message || 'Failed to process inactivity check' });
  }
});

export default router;
