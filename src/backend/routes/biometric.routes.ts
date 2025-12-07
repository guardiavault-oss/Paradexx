import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import {
  verifyAuthenticationResponse,
  generateAuthenticationOptions,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';

const router = Router();

const RP_NAME = 'Paradox Wallet';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}`;

const challengeStore = new Map<string, { challenge: string; expiresAt: number }>();

router.use(authenticateToken);

router.get('/status', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        biometricEnabled: true,
        biometricPublicKey: true,
        biometricCredentialId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      enabled: user.biometricEnabled,
      registered: !!user.biometricPublicKey && !!user.biometricCredentialId,
      type: user.biometricPublicKey ? 'webauthn' : null,
    });
  } catch (error) {
    logger.error('Get biometric status error:', error);
    res.status(500).json({ error: 'Failed to get biometric status' });
  }
});

router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { publicKey, credential, deviceInfo } = req.body;

    if (!publicKey || !credential?.id) {
      return res.status(400).json({ error: 'Public key and credential ID required' });
    }

    const existingCredential = await prisma.user.findFirst({
      where: {
        biometricCredentialId: credential.id,
        id: { not: req.userId! },
      },
    });

    if (existingCredential) {
      return res.status(400).json({ error: 'This credential is already registered to another account' });
    }

    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        biometricEnabled: true,
        biometricPublicKey: publicKey,
        biometricCredentialId: credential.id,
        biometricCounter: 0,
      },
    });

    res.json({
      success: true,
      message: 'Biometric authentication enabled',
      credentialId: credential.id,
    });
  } catch (error) {
    logger.error('Setup biometric error:', error);
    res.status(500).json({ error: 'Failed to setup biometric' });
  }
});

router.post('/challenge', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        biometricEnabled: true,
        biometricCredentialId: true,
      },
    });

    if (!user?.biometricEnabled || !user?.biometricCredentialId) {
      return res.status(400).json({ error: 'Biometric not enabled for this user' });
    }

    const credentialIdBuffer = Buffer.from(user.biometricCredentialId, 'base64url');

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: [{
        id: user.biometricCredentialId,
        transports: ['internal', 'hybrid'] as AuthenticatorTransportFuture[],
      }],
      userVerification: 'required',
    });

    challengeStore.set(req.userId!, {
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    res.json({
      options,
      timeout: 5 * 60 * 1000,
    });
  } catch (error) {
    logger.error('Generate challenge error:', error);
    res.status(500).json({ error: 'Failed to generate authentication challenge' });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Credential required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        biometricEnabled: true,
        biometricPublicKey: true,
        biometricCredentialId: true,
        biometricCounter: true,
      },
    });

    if (!user?.biometricEnabled || !user?.biometricPublicKey || !user?.biometricCredentialId) {
      return res.status(400).json({ error: 'Biometric not enabled' });
    }

    const storedChallenge = challengeStore.get(req.userId!);
    if (!storedChallenge) {
      return res.status(400).json({ error: 'No authentication challenge found. Request a new challenge first.' });
    }

    if (storedChallenge.expiresAt < Date.now()) {
      challengeStore.delete(req.userId!);
      return res.status(400).json({ error: 'Challenge expired. Request a new challenge.' });
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: user.biometricCredentialId,
          publicKey: Buffer.from(user.biometricPublicKey, 'base64'),
          counter: user.biometricCounter || 0,
        },
      });

      challengeStore.delete(req.userId!);

      if (verification.verified) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            biometricCounter: verification.authenticationInfo.newCounter,
          },
        });

        res.json({
          success: true,
          verified: true,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(401).json({
          success: false,
          verified: false,
          error: 'Verification failed',
        });
      }
    } catch (verifyError: any) {
      logger.error('WebAuthn verification error:', verifyError);
      challengeStore.delete(req.userId!);

      return res.status(401).json({
        success: false,
        verified: false,
        error: 'WebAuthn verification failed: ' + verifyError.message,
      });
    }
  } catch (error) {
    logger.error('Verify biometric error:', error);
    res.status(500).json({ error: 'Failed to verify biometric' });
  }
});

router.post('/consent', async (req: Request, res: Response) => {
  try {
    const { consent, biometricType } = req.body;

    if (consent !== true) {
      return res.status(400).json({ error: 'Consent must be true' });
    }

    res.json({
      success: true,
      consentGiven: true,
      consentedAt: new Date().toISOString(),
      biometricType: biometricType || 'device',
    });
  } catch (error) {
    logger.error('Set biometric consent error:', error);
    res.status(500).json({ error: 'Failed to set consent' });
  }
});

router.post('/transaction/authorize', async (req: Request, res: Response) => {
  try {
    const { transactionId, credential, transactionDetails } = req.body;

    if (!transactionId || !credential) {
      return res.status(400).json({ error: 'Transaction ID and credential required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        biometricEnabled: true,
        biometricPublicKey: true,
        biometricCredentialId: true,
        biometricCounter: true,
      },
    });

    if (!user?.biometricEnabled || !user?.biometricPublicKey || !user?.biometricCredentialId) {
      return res.status(400).json({ error: 'Biometric not enabled' });
    }

    const storedChallenge = challengeStore.get(req.userId!);
    if (!storedChallenge) {
      return res.status(400).json({ error: 'No challenge found. Request a challenge first.' });
    }

    if (storedChallenge.expiresAt < Date.now()) {
      challengeStore.delete(req.userId!);
      return res.status(400).json({ error: 'Challenge expired.' });
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: user.biometricCredentialId,
          publicKey: Buffer.from(user.biometricPublicKey, 'base64'),
          counter: user.biometricCounter || 0,
        },
      });

      challengeStore.delete(req.userId!);

      if (verification.verified) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            biometricCounter: verification.authenticationInfo.newCounter,
          },
        });

        const crypto = await import('crypto');
        const authorizationToken = crypto.randomBytes(32).toString('hex');

        res.json({
          success: true,
          authorized: true,
          authorizationToken,
          transactionId,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });
      } else {
        res.status(401).json({
          success: false,
          authorized: false,
          error: 'Verification failed',
        });
      }
    } catch (verifyError: any) {
      logger.error('Transaction authorization verification error:', verifyError);
      challengeStore.delete(req.userId!);

      return res.status(401).json({
        success: false,
        authorized: false,
        error: 'WebAuthn verification failed',
      });
    }
  } catch (error) {
    logger.error('Authorize transaction error:', error);
    res.status(500).json({ error: 'Failed to authorize transaction' });
  }
});

router.delete('/disable', async (req: Request, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        biometricEnabled: false,
        biometricPublicKey: null,
        biometricCredentialId: null,
        biometricCounter: 0,
      },
    });

    challengeStore.delete(req.userId!);

    res.json({
      success: true,
      message: 'Biometric authentication disabled',
    });
  } catch (error) {
    logger.error('Disable biometric error:', error);
    res.status(500).json({ error: 'Failed to disable biometric' });
  }
});

export default router;
