import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { emailService } from '../services/email.service';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);

router.post('/invite', async (req: Request, res: Response) => {
    try {
        const { guardianEmail, guardianName, guardianPhone } = req.body;

        if (!guardianEmail) {
            return res.status(400).json({ error: 'Guardian email is required' });
        }

        const existing = await prisma.guardian.findFirst({
            where: {
                userId: req.userId!,
                email: guardianEmail.toLowerCase(),
            },
        });

        if (existing) {
            return res.status(409).json({ error: 'This person is already a guardian' });
        }

        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const guardian = await (prisma.guardian as any).create({
            data: {
                userId: req.userId!,
                email: guardianEmail.toLowerCase(),
                name: guardianName,
                phone: guardianPhone,
                status: 'pending',
                inviteToken,
                inviteExpiresAt,
            } as any,
        });

        const user = await prisma.user.findUnique({
            where: { id: req.userId! },
            select: { displayName: true, email: true },
        });

        const portalUrl = `${process.env.FRONTEND_URL}/guardian-portal?token=${inviteToken}`;

        try {
            await (emailService as any).sendGuardianInvitation({
                to: guardianEmail,
                guardianName: guardianName || guardianEmail,
                inviterName: user?.displayName || user?.email || 'Someone',
                ownerName: user?.displayName || user?.email || 'Someone',
                inviteLink: portalUrl,
                threshold: 2,
                totalGuardians: 3,
                portalUrl,
            });
        } catch (emailError) {
            logger.error('Failed to send guardian invitation email:', emailError);
        }

        res.json({
            success: true,
            guardianId: guardian.id,
            portalUrl,
        });
    } catch (error: any) {
        logger.error('Invite guardian error:', error);
        res.status(500).json({ error: error.message || 'Failed to invite guardian' });
    }
});

router.get('/guardians', async (req: Request, res: Response) => {
    try {
        const dbGuardians = await prisma.guardian.findMany({
            where: { userId: req.userId! },
            orderBy: { createdAt: 'desc' },
        });

        const guardians = dbGuardians.map(g => ({
            id: g.id,
            name: g.name || g.email,
            email: g.email,
            phone: (g as any).phone,
            status: g.status === 'accepted' ? 'active' : g.status,
            lastCheckIn: g.lastVerifiedAt?.toISOString(),
            createdAt: g.createdAt.toISOString(),
        }));

        res.json({ guardians });
    } catch (error: any) {
        logger.error('Get guardians error:', error);
        res.status(500).json({ error: error.message || 'Failed to get guardians' });
    }
});

router.post('/check-in', async (req: Request, res: Response) => {
    try {
        const vault = await prisma.inheritanceVault.findFirst({
            where: { userId: req.userId! },
        });

        if (vault) {
            await prisma.inheritanceVault.update({
                where: { id: vault.id },
                data: { lastActivityAt: new Date() },
            });
        }

        await (prisma.user as any).update({
            where: { id: req.userId! },
            data: { lastActivityAt: new Date() } as any,
        });

        const nextCheckInDays = (vault as any)?.inactivityThresholdDays || vault?.inactivityDays || 30;
        const nextCheckIn = new Date(Date.now() + nextCheckInDays * 24 * 60 * 60 * 1000);

        res.json({
            success: true,
            nextCheckIn: nextCheckIn.toISOString(),
        });
    } catch (error: any) {
        logger.error('Check-in error:', error);
        res.status(500).json({ error: error.message || 'Failed to check in' });
    }
});

router.put('/timelock', async (req: Request, res: Response) => {
    try {
        const { timelockDays } = req.body;

        if (!timelockDays || timelockDays < 1 || timelockDays > 365) {
            return res.status(400).json({ error: 'Timelock days must be between 1 and 365' });
        }

        const vault = await prisma.inheritanceVault.findFirst({
            where: { userId: req.userId! },
        });

        if (vault) {
            await (prisma.inheritanceVault as any).update({
                where: { id: vault.id },
                data: { inactivityThresholdDays: timelockDays } as any,
            });
        } else {
            let setup = await (prisma as any).guardianSetup?.findFirst?.({
                where: { userId: req.userId! },
            });

            if (setup) {
                await (prisma as any).guardianSetup?.update?.({
                    where: { id: setup.id },
                    data: { timelockDays },
                });
            } else if ((prisma as any).guardianSetup?.create) {
                await (prisma as any).guardianSetup.create({
                    data: {
                        userId: req.userId!,
                        timelockDays,
                        threshold: 2,
                        totalGuardians: 3,
                    },
                });
            }
        }

        res.json({ success: true });
    } catch (error: any) {
        logger.error('Update timelock error:', error);
        res.status(500).json({ error: error.message || 'Failed to update timelock' });
    }
});

router.post('/beneficiaries', async (req: Request, res: Response) => {
    try {
        const { name, email, walletAddress, allocation, relationship } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        let vault = await prisma.inheritanceVault.findFirst({
            where: { userId: req.userId! },
        });

        if (!vault) {
            vault = await (prisma.inheritanceVault as any).create({
                data: {
                    userId: req.userId!,
                    name: 'My Inheritance Vault',
                    status: 'active',
                    tier: 'free',
                    inactivityDays: 30,
                    lastActivityAt: new Date(),
                } as any,
            });
        }

        const beneficiary = await (prisma.beneficiary as any).create({
            data: {
                inheritanceVault: { connect: { id: vault.id } },
                name,
                email: email.toLowerCase(),
                walletAddress,
                percentage: allocation || 0,
                relationship,
                status: 'pending',
            } as any,
        });

        res.json({
            success: true,
            beneficiaryId: beneficiary.id,
        });
    } catch (error: any) {
        logger.error('Add beneficiary error:', error);
        res.status(500).json({ error: error.message || 'Failed to add beneficiary' });
    }
});

router.put('/beneficiaries/:beneficiaryId', async (req: Request, res: Response) => {
    try {
        const { beneficiaryId } = req.params;
        const updates = req.body;

        const beneficiary = await (prisma.beneficiary as any).findUnique({
            where: { id: beneficiaryId },
            include: { inheritanceVault: true },
        });

        if (!beneficiary || (beneficiary as any).inheritanceVault?.userId !== req.userId) {
            return res.status(404).json({ error: 'Beneficiary not found' });
        }

        const updateData: any = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.email) updateData.email = updates.email.toLowerCase();
        if (updates.walletAddress) updateData.walletAddress = updates.walletAddress;
        if (updates.allocation !== undefined) updateData.percentage = updates.allocation;
        if (updates.relationship) updateData.relationship = updates.relationship;

        await prisma.beneficiary.update({
            where: { id: beneficiaryId },
            data: updateData,
        });

        res.json({ success: true });
    } catch (error: any) {
        logger.error('Update beneficiary error:', error);
        res.status(500).json({ error: error.message || 'Failed to update beneficiary' });
    }
});

router.delete('/beneficiaries/:beneficiaryId', async (req: Request, res: Response) => {
    try {
        const { beneficiaryId } = req.params;

        const beneficiary = await (prisma.beneficiary as any).findUnique({
            where: { id: beneficiaryId },
            include: { inheritanceVault: true },
        });

        if (!beneficiary || (beneficiary as any).inheritanceVault?.userId !== req.userId) {
            return res.status(404).json({ error: 'Beneficiary not found' });
        }

        await prisma.beneficiary.delete({
            where: { id: beneficiaryId },
        });

        res.json({ success: true });
    } catch (error: any) {
        logger.error('Delete beneficiary error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete beneficiary' });
    }
});

router.get('/config', async (req: Request, res: Response) => {
    try {
        const vault = await prisma.inheritanceVault.findFirst({
            where: { userId: req.userId! },
            include: { beneficiaries: true },
        });

        const guardians = await prisma.guardian.findMany({
            where: { userId: req.userId! },
        });

        const setup = await (prisma as any).guardianSetup?.findFirst?.({
            where: { userId: req.userId! },
        }) || null;

        const formattedGuardians = guardians.map(g => ({
            id: g.id,
            name: g.name || g.email,
            email: g.email,
            status: g.status === 'accepted' ? 'active' : g.status,
            lastCheckIn: g.lastVerifiedAt?.toISOString(),
            createdAt: g.createdAt.toISOString(),
        }));

        const formattedBeneficiaries = vault?.beneficiaries.map(b => ({
            id: b.id,
            name: b.name,
            email: b.email,
            walletAddress: b.walletAddress,
            allocation: b.percentage,
            relationship: b.relationship,
            status: b.status,
        })) || [];

        res.json({
            timelockDays: (vault as any)?.inactivityThresholdDays || vault?.inactivityDays || (setup as any)?.timelockDays || 30,
            lastCheckIn: vault?.lastActivityAt?.toISOString() || new Date().toISOString(),
            guardians: formattedGuardians,
            beneficiaries: formattedBeneficiaries,
            status: vault?.status || 'pending',
        });
    } catch (error: any) {
        logger.error('Get config error:', error);
        res.status(500).json({ error: error.message || 'Failed to get configuration' });
    }
});

export default router;
