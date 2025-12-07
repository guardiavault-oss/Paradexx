// User Profile Routes
import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

// GET /api/user/profile - Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
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
        emailVerified: true,
        biometricEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format profile response
    const profile = {
      id: user.id,
      email: user.email!,
      name: user.displayName || user.username || '',
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      subscription_tier: 'free' as const,
      degenx_tier: null as string | null,
      guardianx_tier: null as string | null,
      biometric_enabled: user.biometricEnabled,
      created_at: user.createdAt.toISOString(),
    };

    res.json({ profile });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['displayName', 'username', 'avatar', 'bio'];

    // Filter only allowed fields
    const filteredUpdates: any = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: filteredUpdates,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        emailVerified: true,
        biometricEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const profile = {
      id: user.id,
      email: user.email!,
      name: user.displayName || user.username || '',
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      subscription_tier: 'free' as const,
      degenx_tier: null as string | null,
      guardianx_tier: null as string | null,
      biometric_enabled: user.biometricEnabled,
      created_at: user.createdAt.toISOString(),
    };

    res.json({ profile });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

