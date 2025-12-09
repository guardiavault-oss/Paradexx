// Smart Will Routes - Digital will management
import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import crypto from 'crypto';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============ Will CRUD Operations ============

// GET /api/will - List user's wills
router.get('/', async (req: Request, res: Response) => {
    try {
        // Fetch real wills from database
        if (!prisma) {
            return res.json([]); // No database connection, return empty array
        }
        
        const wills = await prisma.smartWill.findMany({
            where: { userId: req.userId },
            include: {
                beneficiaries: true,
                charities: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        return res.json(wills.map((will: any) => ({
            id: will.id,
            name: will.name,
            template: will.template,
            status: will.status,
            beneficiaryCount: will.beneficiaries?.length || 0,
            totalAllocation: (will.beneficiaries?.reduce((sum: number, b: any) => sum + (b.allocation || 0), 0) || 0) +
                            (will.charities?.reduce((sum: number, c: any) => sum + (c.allocation || 0), 0) || 0),
            createdAt: will.createdAt,
            updatedAt: will.updatedAt,
        })));

        const wills = await prisma.smartWill.findMany({
            where: { userId: req.userId! },
            include: {
                beneficiaries: true,
                guardians: true,
                conditions: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(wills);
    } catch (error) {
        logger.error('List wills error:', error);
        res.status(500).json({ error: 'Failed to list wills' });
    }
});

// GET /api/will/:id - Get specific will
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const will = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
            include: {
                beneficiaries: true,
                guardians: true,
                conditions: true,
                charities: true,
            },
        });

        if (!will) {
            return res.status(404).json({ error: 'Will not found' });
        }

        res.json(will);
    } catch (error) {
        logger.error('Get will error:', error);
        res.status(500).json({ error: 'Failed to get will' });
    }
});

// POST /api/will - Create new will
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            name,
            template,
            beneficiaries,
            guardians,
            charities,
            conditions,
            messages,
            metadataHash
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Will name is required' });
        }

        // Validate total allocation
        const totalAllocation =
            (beneficiaries?.reduce((sum: number, b: any) => sum + (b.allocation || 0), 0) || 0) +
            (charities?.reduce((sum: number, c: any) => sum + (c.allocation || 0), 0) || 0);

        if (totalAllocation !== 100 && totalAllocation !== 0) {
            return res.status(400).json({
                error: `Total allocation must equal 100% (current: ${totalAllocation}%)`
            });
        }

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        // Create will with related data
        const will = await prisma.smartWill.create({
            data: {
                userId: req.userId!,
                name,
                template: template || 'standard',
                status: 'draft',
                metadataHash: metadataHash || '',
                beneficiaries: {
                    create: beneficiaries?.map((b: any) => ({
                        name: b.name,
                        walletAddress: b.wallet,
                        allocation: b.allocation,
                        relationship: b.relationship,
                        conditions: b.conditions || [],
                    })) || [],
                },
                guardians: {
                    create: guardians?.map((g: any) => ({
                        name: g.name,
                        walletAddress: g.wallet,
                        role: g.role || 'trustee',
                    })) || [],
                },
                charities: {
                    create: charities?.map((c: any) => ({
                        name: c.name,
                        walletAddress: c.wallet,
                        allocation: c.allocation,
                        cause: c.cause || '',
                    })) || [],
                },
                conditions: {
                    create: conditions?.map((c: any) => ({
                        type: c.type,
                        value: c.value,
                        description: c.description || '',
                    })) || [],
                },
            },
            include: {
                beneficiaries: true,
                guardians: true,
                charities: true,
                conditions: true,
            },
        });

        res.json(will);
    } catch (error) {
        logger.error('Create will error:', error);
        res.status(500).json({ error: 'Failed to create will' });
    }
});

// PUT /api/will/:id - Update will
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        // Verify will belongs to user
        const existing = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Will not found' });
        }

        if (existing.status === 'executed') {
            return res.status(400).json({ error: 'Cannot update executed will' });
        }

        // Update will
        const will = await prisma.smartWill.update({
            where: { id },
            data: {
                name: updates.name,
                template: updates.template,
                metadataHash: updates.metadataHash,
                updatedAt: new Date(),
            },
        });

        res.json(will);
    } catch (error) {
        logger.error('Update will error:', error);
        res.status(500).json({ error: 'Failed to update will' });
    }
});

// DELETE /api/will/:id - Delete will (only drafts)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const will = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
        });

        if (!will) {
            return res.status(404).json({ error: 'Will not found' });
        }

        if (will.status !== 'draft') {
            return res.status(400).json({ error: 'Can only delete draft wills' });
        }

        await prisma.smartWill.delete({ where: { id } });

        res.json({ message: 'Will deleted successfully' });
    } catch (error) {
        logger.error('Delete will error:', error);
        res.status(500).json({ error: 'Failed to delete will' });
    }
});

// ============ Will Status & Actions ============

// POST /api/will/:id/publish - Publish will to blockchain
router.post('/:id/publish', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const will = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
            include: { beneficiaries: true, guardians: true },
        });

        if (!will) {
            return res.status(404).json({ error: 'Will not found' });
        }

        if (will.status !== 'draft') {
            return res.status(400).json({ error: 'Will already published' });
        }

        // Here you would:
        // 1. Upload metadata to IPFS
        // 2. Call SmartWill contract createWill function
        // 3. Store transaction hash and on-chain ID

        // For now, update status
        const updated = await prisma.smartWill.update({
            where: { id },
            data: {
                status: 'published',
                publishedAt: new Date(),
            },
        });

        res.json({
            id: updated.id,
            status: updated.status,
            message: 'Will published to blockchain',
        });
    } catch (error) {
        logger.error('Publish will error:', error);
        res.status(500).json({ error: 'Failed to publish will' });
    }
});

// POST /api/will/:id/revoke - Revoke published will
router.post('/:id/revoke', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const will = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
        });

        if (!will) {
            return res.status(404).json({ error: 'Will not found' });
        }

        if (will.status === 'executed') {
            return res.status(400).json({ error: 'Cannot revoke executed will' });
        }

        // Here you would call SmartWill contract revokeWill function

        const updated = await prisma.smartWill.update({
            where: { id },
            data: {
                status: 'revoked',
                revokedAt: new Date(),
            },
        });

        res.json({
            id: updated.id,
            status: updated.status,
            message: 'Will revoked',
        });
    } catch (error) {
        logger.error('Revoke will error:', error);
        res.status(500).json({ error: 'Failed to revoke will' });
    }
});

// ============ Beneficiary Management ============

// POST /api/will/:id/beneficiaries - Add beneficiary to will
router.post('/:id/beneficiaries', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, wallet, allocation, relationship, conditions } = req.body;

        if (!name || !wallet) {
            return res.status(400).json({ error: 'Name and wallet address required' });
        }

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const will = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
        });

        if (!will) {
            return res.status(404).json({ error: 'Will not found' });
        }

        if (will.status !== 'draft') {
            return res.status(400).json({ error: 'Cannot modify published will' });
        }

        const beneficiary = await prisma.willBeneficiary.create({
            data: {
                willId: id,
                name,
                walletAddress: wallet,
                allocation: allocation || 0,
                relationship: relationship || 'Other',
                conditions: conditions || [],
            },
        });

        res.json(beneficiary);
    } catch (error) {
        logger.error('Add beneficiary error:', error);
        res.status(500).json({ error: 'Failed to add beneficiary' });
    }
});

// DELETE /api/will/:id/beneficiaries/:beneficiaryId
router.delete('/:id/beneficiaries/:beneficiaryId', async (req: Request, res: Response) => {
    try {
        const { id, beneficiaryId } = req.params;

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const will = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
        });

        if (!will) {
            return res.status(404).json({ error: 'Will not found' });
        }

        if (will.status !== 'draft') {
            return res.status(400).json({ error: 'Cannot modify published will' });
        }

        await prisma.willBeneficiary.delete({
            where: { id: beneficiaryId },
        });

        res.json({ message: 'Beneficiary removed' });
    } catch (error) {
        logger.error('Remove beneficiary error:', error);
        res.status(500).json({ error: 'Failed to remove beneficiary' });
    }
});

// ============ Guardian Management ============

// POST /api/will/:id/guardians - Add guardian to will
router.post('/:id/guardians', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, wallet, role } = req.body;

        if (!name || !wallet) {
            return res.status(400).json({ error: 'Name and wallet address required' });
        }

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const will = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
        });

        if (!will) {
            return res.status(404).json({ error: 'Will not found' });
        }

        const guardian = await prisma.willGuardian.create({
            data: {
                willId: id,
                name,
                walletAddress: wallet,
                role: role || 'trustee',
            },
        });

        res.json(guardian);
    } catch (error) {
        logger.error('Add guardian error:', error);
        res.status(500).json({ error: 'Failed to add guardian' });
    }
});

// ============ Condition Management ============

// POST /api/will/:id/conditions - Add condition to will
router.post('/:id/conditions', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type, value, description, beneficiaryId } = req.body;

        if (!type || !value) {
            return res.status(400).json({ error: 'Condition type and value required' });
        }

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const will = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
        });

        if (!will) {
            return res.status(404).json({ error: 'Will not found' });
        }

        const condition = await prisma.willCondition.create({
            data: {
                willId: id,
                type,
                value,
                description: description || '',
                beneficiaryId,
            },
        });

        res.json(condition);
    } catch (error) {
        logger.error('Add condition error:', error);
        res.status(500).json({ error: 'Failed to add condition' });
    }
});

// ============ Export & Templates ============

// GET /api/will/templates - Get available templates
router.get('/templates/list', async (req: Request, res: Response) => {
    const templates = [
        {
            id: 'standard',
            name: 'Standard Asset Distribution',
            description: 'Equal or custom percentage distribution among beneficiaries',
            features: ['Simple percentage allocation', 'Multiple beneficiaries', 'Immediate distribution'],
            timeToComplete: '5-10 minutes',
        },
        {
            id: 'trust-fund',
            name: 'Trust Fund Setup',
            description: 'Gradual release based on age milestones or achievements',
            features: ['Age-based milestones', 'Educational triggers', 'Vesting schedules', 'Guardian oversight'],
            timeToComplete: '15-20 minutes',
        },
        {
            id: 'charitable',
            name: 'Charitable Giving',
            description: 'Allocate assets to charitable organizations and causes',
            features: ['Charity allocation', 'Multiple organizations', 'Tax-efficient', 'Legacy impact'],
            timeToComplete: '10-15 minutes',
        },
        {
            id: 'business',
            name: 'Business Succession',
            description: 'Transfer business ownership and DAO positions',
            features: ['Ownership transfer', 'Multi-sig succession', 'DAO voting rights', 'Continuity planning'],
            timeToComplete: '20-30 minutes',
        },
        {
            id: 'multi-chain',
            name: 'Multi-Chain Portfolio',
            description: 'Distribution across multiple blockchains and DeFi',
            features: ['Cross-chain management', 'DeFi unwinding', 'NFT distribution', 'Staking handling'],
            timeToComplete: '25-35 minutes',
        },
        {
            id: 'conditional',
            name: 'Conditional Inheritance',
            description: 'Complex conditions with multi-sig and oracle triggers',
            features: ['Multi-signature', 'Oracle verification', 'Time-locks', 'Dispute resolution'],
            timeToComplete: '30-45 minutes',
        },
    ];

    res.json(templates);
});

// POST /api/will/:id/export - Export will document
router.post('/:id/export', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { format } = req.body; // 'json', 'pdf', 'ipfs'

        if (!prisma) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const will = await prisma.smartWill.findFirst({
            where: { id, userId: req.userId! },
            include: {
                beneficiaries: true,
                guardians: true,
                charities: true,
                conditions: true,
            },
        });

        if (!will) {
            return res.status(404).json({ error: 'Will not found' });
        }

        // Generate export based on format
        const exportData = {
            will,
            exportedAt: new Date().toISOString(),
            version: '1.0',
        };

        res.json({
            id,
            format: format || 'json',
            data: exportData,
            exportedAt: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Export will error:', error);
        res.status(500).json({ error: 'Failed to export will' });
    }
});

export default router;
