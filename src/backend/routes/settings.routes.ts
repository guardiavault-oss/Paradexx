import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

router.use(authenticateToken);

async function getOrCreateSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId },
    });
  }

  return settings;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const [settings, user] = await Promise.all([
      getOrCreateSettings(req.userId!),
      prisma.user.findUnique({
        where: { id: req.userId! },
        select: {
          twoFactorEnabled: true,
          biometricEnabled: true,
          autoLockEnabled: true,
          autoLockTimeout: true,
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      settings: {
        notifications: {
          email: settings.emailNotifications,
          push: settings.pushNotifications,
          transactions: settings.transactionAlerts,
          priceAlerts: settings.priceAlerts,
          securityAlerts: settings.securityAlerts,
          marketing: settings.marketingEmails,
        },
        display: {
          theme: settings.theme,
          currency: settings.currency,
          language: settings.language,
          compactMode: settings.compactMode,
        },
        security: {
          twoFactorEnabled: user.twoFactorEnabled,
          biometricEnabled: user.biometricEnabled,
          autoLockEnabled: user.autoLockEnabled,
          autoLockTimeout: user.autoLockTimeout,
          transactionSigning: user.biometricEnabled ? 'biometric' : 'pin',
        },
        privacy: {
          shareAnalytics: settings.shareAnalytics,
          publicProfile: settings.publicProfile,
        },
        legal: {
          termsAccepted: !!settings.termsAcceptedAt,
          termsVersion: settings.termsAcceptedVersion,
          privacyAccepted: !!settings.privacyAcceptedAt,
          privacyVersion: settings.privacyAcceptedVersion,
          ageVerified: settings.ageVerified,
          jurisdiction: settings.jurisdiction,
        },
        account: {
          deletionScheduled: !!settings.deletionScheduledAt,
          deletionScheduledAt: settings.deletionScheduledAt,
        },
      }
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/notifications', async (req: Request, res: Response) => {
  try {
    const { email, push, transactions, priceAlerts, securityAlerts, marketing } = req.body;
    
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        emailNotifications: email ?? undefined,
        pushNotifications: push ?? undefined,
        transactionAlerts: transactions ?? undefined,
        priceAlerts: priceAlerts ?? undefined,
        securityAlerts: securityAlerts ?? undefined,
        marketingEmails: marketing ?? undefined,
      },
      create: {
        userId: req.userId!,
        emailNotifications: email ?? true,
        pushNotifications: push ?? true,
        transactionAlerts: transactions ?? true,
        priceAlerts: priceAlerts ?? true,
        securityAlerts: securityAlerts ?? true,
        marketingEmails: marketing ?? false,
      },
    });

    res.json({
      success: true,
      notifications: {
        email: settings.emailNotifications,
        push: settings.pushNotifications,
        transactions: settings.transactionAlerts,
        priceAlerts: settings.priceAlerts,
        securityAlerts: settings.securityAlerts,
        marketing: settings.marketingEmails,
      },
    });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

router.put('/display', async (req: Request, res: Response) => {
  try {
    const { theme, currency, language, compactMode } = req.body;
    
    const validThemes = ['light', 'dark', 'system'];
    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme. Use: light, dark, system' });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        theme: theme ?? undefined,
        currency: currency ?? undefined,
        language: language ?? undefined,
        compactMode: compactMode ?? undefined,
      },
      create: {
        userId: req.userId!,
        theme: theme ?? 'system',
        currency: currency ?? 'USD',
        language: language ?? 'en',
        compactMode: compactMode ?? false,
      },
    });

    res.json({
      success: true,
      display: {
        theme: settings.theme,
        currency: settings.currency,
        language: settings.language,
        compactMode: settings.compactMode,
      },
    });
  } catch (error) {
    logger.error('Update display settings error:', error);
    res.status(500).json({ error: 'Failed to update display settings' });
  }
});

router.put('/security', async (req: Request, res: Response) => {
  try {
    const { autoLockEnabled, autoLockTimeout, transactionSigning } = req.body;
    
    const updates: any = {};
    if (autoLockEnabled !== undefined) updates.autoLockEnabled = autoLockEnabled;
    if (autoLockTimeout !== undefined) {
      if (autoLockTimeout < 1 || autoLockTimeout > 60) {
        return res.status(400).json({ error: 'Auto-lock timeout must be between 1 and 60 minutes' });
      }
      updates.autoLockTimeout = autoLockTimeout;
    }

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: updates,
      select: {
        twoFactorEnabled: true,
        biometricEnabled: true,
        autoLockEnabled: true,
        autoLockTimeout: true,
      },
    });

    res.json({
      success: true,
      security: {
        twoFactorEnabled: user.twoFactorEnabled,
        biometricEnabled: user.biometricEnabled,
        autoLockEnabled: user.autoLockEnabled,
        autoLockTimeout: user.autoLockTimeout,
        transactionSigning: transactionSigning || (user.biometricEnabled ? 'biometric' : 'pin'),
      },
    });
  } catch (error) {
    logger.error('Update security settings error:', error);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

router.put('/privacy', async (req: Request, res: Response) => {
  try {
    const { shareAnalytics, publicProfile } = req.body;
    
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        shareAnalytics: shareAnalytics ?? undefined,
        publicProfile: publicProfile ?? undefined,
      },
      create: {
        userId: req.userId!,
        shareAnalytics: shareAnalytics ?? false,
        publicProfile: publicProfile ?? false,
      },
    });

    res.json({
      success: true,
      privacy: {
        shareAnalytics: settings.shareAnalytics,
        publicProfile: settings.publicProfile,
      },
    });
  } catch (error) {
    logger.error('Update privacy settings error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

router.post('/legal/accept', async (req: Request, res: Response) => {
  try {
    const { termsVersion, privacyVersion } = req.body;
    
    if (!termsVersion && !privacyVersion) {
      return res.status(400).json({ error: 'At least one of termsVersion or privacyVersion required' });
    }

    const now = new Date();
    const updateData: any = {};
    
    if (termsVersion) {
      updateData.termsAcceptedVersion = termsVersion;
      updateData.termsAcceptedAt = now;
    }
    if (privacyVersion) {
      updateData.privacyAcceptedVersion = privacyVersion;
      updateData.privacyAcceptedAt = now;
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: updateData,
      create: {
        userId: req.userId!,
        ...updateData,
      },
    });

    res.json({
      success: true,
      accepted: {
        termsOfService: settings.termsAcceptedVersion,
        termsAcceptedAt: settings.termsAcceptedAt,
        privacyPolicy: settings.privacyAcceptedVersion,
        privacyAcceptedAt: settings.privacyAcceptedAt,
      },
    });
  } catch (error) {
    logger.error('Accept legal error:', error);
    res.status(500).json({ error: 'Failed to accept legal terms' });
  }
});

router.post('/legal/verify-age', async (req: Request, res: Response) => {
  try {
    const { birthDate, confirmed } = req.body;
    
    if (!confirmed) {
      return res.status(400).json({ error: 'Age verification confirmation required' });
    }

    if (birthDate) {
      const birth = new Date(birthDate);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        return res.status(403).json({ error: 'You must be 18 or older to use this service' });
      }
    }

    const now = new Date();
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        ageVerified: true,
        ageVerifiedAt: now,
      },
      create: {
        userId: req.userId!,
        ageVerified: true,
        ageVerifiedAt: now,
      },
    });

    res.json({ 
      success: true, 
      verified: settings.ageVerified, 
      verifiedAt: settings.ageVerifiedAt,
    });
  } catch (error) {
    logger.error('Verify age error:', error);
    res.status(500).json({ error: 'Failed to verify age' });
  }
});

router.post('/legal/set-jurisdiction', async (req: Request, res: Response) => {
  try {
    const { country, state } = req.body;
    
    if (!country) {
      return res.status(400).json({ error: 'Country is required' });
    }

    const restrictedCountries = ['KP', 'IR', 'CU', 'SY'];
    if (restrictedCountries.includes(country)) {
      return res.status(403).json({ error: 'Service not available in your jurisdiction' });
    }

    const now = new Date();
    const jurisdiction = state ? `${country}-${state}` : country;
    
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        jurisdiction,
        jurisdictionSetAt: now,
      },
      create: {
        userId: req.userId!,
        jurisdiction,
        jurisdictionSetAt: now,
      },
    });

    res.json({
      success: true,
      jurisdiction: settings.jurisdiction,
      setAt: settings.jurisdictionSetAt,
    });
  } catch (error) {
    logger.error('Set jurisdiction error:', error);
    res.status(500).json({ error: 'Failed to set jurisdiction' });
  }
});

router.get('/export-data', async (req: Request, res: Response) => {
  try {
    const [user, settings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          wallets: {
            select: {
              id: true,
              name: true,
              address: true,
              chain: true,
              createdAt: true,
            },
          },
          transactions: {
            take: 1000,
            orderBy: { timestamp: 'desc' },
          },
          beneficiaries: true,
          guardians: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              createdAt: true,
            },
          },
          priceAlerts: true,
          addressBook: true,
        },
      }),
      prisma.userSettings.findUnique({
        where: { userId: req.userId! },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      settings: settings ? {
        notifications: {
          email: settings.emailNotifications,
          push: settings.pushNotifications,
        },
        display: {
          theme: settings.theme,
          currency: settings.currency,
          language: settings.language,
        },
        privacy: {
          shareAnalytics: settings.shareAnalytics,
          publicProfile: settings.publicProfile,
        },
      } : null,
      wallets: user.wallets,
      transactions: user.transactions,
      beneficiaries: user.beneficiaries,
      guardians: user.guardians,
      priceAlerts: user.priceAlerts,
      addressBook: user.addressBook,
    };

    res.json({ data: exportData });
  } catch (error) {
    logger.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

router.post('/account/delete', async (req: Request, res: Response) => {
  try {
    const { confirmEmail, reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { email: true },
    });

    if (!user || user.email !== confirmEmail) {
      return res.status(400).json({ error: 'Email confirmation does not match' });
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        deletionScheduledAt: deletionDate,
        deletionReason: reason || null,
      },
      create: {
        userId: req.userId!,
        deletionScheduledAt: deletionDate,
        deletionReason: reason || null,
      },
    });

    res.json({
      success: true,
      message: 'Account scheduled for deletion',
      scheduledDeletionDate: deletionDate.toISOString(),
      cancellationDeadline: deletionDate.toISOString(),
    });
  } catch (error) {
    logger.error('Schedule account deletion error:', error);
    res.status(500).json({ error: 'Failed to schedule account deletion' });
  }
});

router.post('/account/delete/cancel', async (req: Request, res: Response) => {
  try {
    await prisma.userSettings.update({
      where: { userId: req.userId! },
      data: {
        deletionScheduledAt: null,
        deletionReason: null,
      },
    });

    res.json({
      success: true,
      message: 'Account deletion cancelled',
    });
  } catch (error) {
    logger.error('Cancel account deletion error:', error);
    res.status(500).json({ error: 'Failed to cancel account deletion' });
  }
});

router.get('/app-version', async (_req: Request, res: Response) => {
  try {
    res.json({
      version: process.env.APP_VERSION || '2.0.0',
      buildNumber: process.env.BUILD_NUMBER || '1',
      releaseDate: '2024-01-01',
      minimumVersion: '1.0.0',
      updateRequired: false,
      changelog: [
        'Enhanced security features',
        'Improved performance',
        'Bug fixes and stability improvements',
      ],
    });
  } catch (error) {
    logger.error('Get app version error:', error);
    res.status(500).json({ error: 'Failed to get app version' });
  }
});

export default router;
