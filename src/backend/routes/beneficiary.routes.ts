// Beneficiary Routes - Inheritance beneficiaries
import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/beneficiaries - List user's beneficiaries
router.get('/', async (req: Request, res: Response) => {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { userId: req.userId! },
      select: {
        id: true,
        name: true,
        email: true,
        relationship: true,
        percentage: true,
        requiresDeathCertificate: true,
        manualVerification: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(beneficiaries);
  } catch (error) {
    logger.error('List beneficiaries error:', error);
    res.status(500).json({ error: 'Failed to list beneficiaries' });
  }
});

// POST /api/beneficiaries - Add beneficiary
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, relationship, percentage, requiresDeathCertificate, manualVerification } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    // Validate percentage
    const totalPercentage = await prisma.beneficiary.aggregate({
      where: { userId: req.userId! },
      _sum: { percentage: true },
    });

    const currentTotal = totalPercentage._sum.percentage || 0;
    const newTotal = currentTotal + (percentage || 100);

    if (newTotal > 100) {
      return res.status(400).json({ 
        error: `Total percentage would exceed 100% (current: ${currentTotal}%, adding: ${percentage || 100}%)` 
      });
    }

    // Check if email already exists
    const existing = await prisma.beneficiary.findFirst({
      where: {
        userId: req.userId!,
        email,
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Email already added as beneficiary' });
    }

    // Create beneficiary
    const beneficiary = await prisma.beneficiary.create({
      data: {
        userId: req.userId!,
        name,
        email,
        relationship,
        percentage: percentage || 100,
        requiresDeathCertificate: requiresDeathCertificate || false,
        manualVerification: manualVerification || false,
      },
    });

    res.json({
      id: beneficiary.id,
      name: beneficiary.name,
      email: beneficiary.email,
      percentage: beneficiary.percentage,
      relationship: beneficiary.relationship,
    });
  } catch (error) {
    logger.error('Add beneficiary error:', error);
    res.status(500).json({ error: 'Failed to add beneficiary' });
  }
});

// PUT /api/beneficiaries/:id - Update beneficiary
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify beneficiary belongs to user
    const beneficiary = await prisma.beneficiary.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!beneficiary) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }

    // If updating percentage, validate total
    if (updates.percentage !== undefined) {
      const totalPercentage = await prisma.beneficiary.aggregate({
        where: { 
          userId: req.userId!,
          id: { not: id },
        },
        _sum: { percentage: true },
      });

      const currentTotal = totalPercentage._sum.percentage || 0;
      const newTotal = currentTotal + updates.percentage;

      if (newTotal > 100) {
        return res.status(400).json({ 
          error: `Total percentage would exceed 100% (current: ${currentTotal}%, new: ${updates.percentage}%)` 
        });
      }
    }

    // Update beneficiary
    const updated = await prisma.beneficiary.update({
      where: { id },
      data: updates,
    });

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      percentage: updated.percentage,
      relationship: updated.relationship,
    });
  } catch (error) {
    logger.error('Update beneficiary error:', error);
    res.status(500).json({ error: 'Failed to update beneficiary' });
  }
});

// DELETE /api/beneficiaries/:id - Remove beneficiary
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify beneficiary belongs to user
    const beneficiary = await prisma.beneficiary.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!beneficiary) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }

    await prisma.beneficiary.delete({
      where: { id },
    });

    res.json({ message: 'Beneficiary removed successfully' });
  } catch (error) {
    logger.error('Delete beneficiary error:', error);
    res.status(500).json({ error: 'Failed to remove beneficiary' });
  }
});

export default router;

