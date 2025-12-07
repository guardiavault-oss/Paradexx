// Authentication Routes - Custom Email/Password with Verification (PRODUCTION)

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { verificationService } from '../services/verification.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Admin account - has access to all subscription tiers (configured via env vars)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@paradex.trade';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Log status
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  logger.info('✅ Admin account configured');
}

// Subscription tiers configuration
const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['basic_wallet', 'basic_transactions', 'email_support'],
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    features: ['basic_wallet', 'basic_transactions', 'email_support', 'priority_support', 'advanced_analytics', 'gas_optimization', 'whale_tracking', 'multi_wallet'],
  },
  elite: {
    name: 'Elite',
    price: 29.99,
    features: ['basic_wallet', 'basic_transactions', 'email_support', 'priority_support', 'advanced_analytics', 'gas_optimization', 'whale_tracking', 'multi_wallet', 'mev_protection', 'honeypot_detection', 'rug_detection', 'defi_aggregation', 'api_access', 'white_glove_support'],
  },
};

// Helper: Generate JWT tokens
function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// POST /api/auth/send-verification - Send email verification code
router.post('/send-verification', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already registered
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered. Please sign in.' });
    }

    // Send verification code
    const result = await verificationService.sendVerificationCode(normalizedEmail, name);

    if (!result.success) {
      return res.status(429).json({ error: result.error || 'Failed to send verification code' });
    }

    res.json({
      success: true,
      verificationToken: result.token,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    logger.error('Send verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// POST /api/auth/verify-code - Verify email code
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { verificationToken, code } = req.body;

    logger.info(`[AUTH] Verify code request - Token: ${verificationToken?.substring(0, 8)}..., Code: ${code}`);

    // Validate inputs
    if (!verificationToken || !code) {
      logger.warn('[AUTH] Missing verification token or code');
      return res.status(400).json({ error: 'Verification token and code are required' });
    }

    // Ensure code is a string and trim whitespace
    const normalizedCode = String(code).trim();

    // Validate code format
    if (!/^\d{6}$/.test(normalizedCode)) {
      logger.warn(`[AUTH] Invalid code format: ${normalizedCode}`);
      return res.status(400).json({ error: 'Verification code must be exactly 6 digits' });
    }

    // Verify the code
    const result = verificationService.verifyCode(String(verificationToken).trim(), normalizedCode);

    if (!result.success) {
      logger.warn(`[AUTH] Verification failed: ${result.error} (Token: ${verificationToken.substring(0, 8)}..., Code: ${normalizedCode})`);
      return res.status(400).json({ error: result.error || 'Verification failed' });
    }

    logger.info(`[AUTH] ✅ Email verified successfully: ${result.email}`);
    res.json({
      success: true,
      email: result.email,
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('[AUTH] Verify code error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/resend-verification - Resend verification code
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Send new verification code
    const result = await verificationService.sendVerificationCode(normalizedEmail, name);

    if (!result.success) {
      return res.status(429).json({ error: result.error || 'Please wait before requesting another code' });
    }

    res.json({
      success: true,
      verificationToken: result.token,
      message: 'New verification code sent',
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// POST /api/auth/register - Email/password registration (requires verified email)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username, verificationToken } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verify the email was verified (required for registration)
    if (verificationToken) {
      const verifiedEmail = verificationService.getVerifiedEmail(verificationToken);
      if (!verifiedEmail || verifiedEmail !== normalizedEmail) {
        return res.status(400).json({ error: 'Email not verified or verification expired' });
      }
      // Clean up the verification token
      verificationService.deleteToken(verificationToken);
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        emailVerified: new Date(),
      },
    });

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login - Email/password login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Normalize email
    const normalizedEmail = email?.toLowerCase().trim();

    // Check for admin account (works in all environments)
    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUserId = 'admin-user-001';
      const tokens = generateTokens(adminUserId);

      return res.json({
        user: {
          id: adminUserId,
          email: ADMIN_EMAIL,
          username: 'Admin',
          displayName: 'Paradox Admin',
          avatar: null,
          isAdmin: true,
        },
        profile: {
          id: adminUserId,
          email: ADMIN_EMAIL,
          name: 'Paradox Admin',
          username: 'Admin',
          avatar: null,
          subscription_tier: 'elite',
          all_features_unlocked: true,
          biometric_enabled: false,
          created_at: new Date().toISOString(),
        },
        ...tokens,
      });
    }

    // Production: use database for authentication
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify and decode the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };

    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(decoded.userId);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    res.json(tokens);
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
      id: user.id,
      email: user.email!,
      name: user.displayName || user.username || '',
      username: user.username,
      avatar: user.avatar,
      subscription_tier: 'free' as const,
      degenx_tier: null,
      guardianx_tier: null,
      biometric_enabled: false,
      created_at: user.createdAt.toISOString(),
    };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      profile,
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      // Delete session
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/notify-guardian - Send notification to guardian when added
router.post('/notify-guardian', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { guardianEmail, guardianName, ownerName, ownerEmail } = req.body;

    if (!guardianEmail || !guardianName) {
      return res.status(400).json({ error: 'Guardian email and name are required' });
    }

    // Send notification email
    const result = await verificationService.sendGuardianNotification({
      guardianEmail,
      guardianName,
      ownerName: ownerName || 'A Paradox user',
      ownerEmail: ownerEmail || 'a user',
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to send guardian notification' });
    }

    res.json({
      success: true,
      message: 'Guardian notification sent successfully',
    });
  } catch (error) {
    logger.error('Notify guardian error:', error);
    res.status(500).json({ error: 'Failed to notify guardian' });
  }
});

// GET /api/auth/subscription-tiers - Get available subscription tiers
router.get('/subscription-tiers', (req: Request, res: Response) => {
  res.json({
    tiers: SUBSCRIPTION_TIERS,
  });
});

// PUT /api/auth/me - Update user profile
router.put('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { username, displayName, bio } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        username,
        displayName,
        bio,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
      },
    });

    res.json(user);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ============================================
// Google OAuth Routes
// ============================================

// GET /api/auth/oauth/google - Initiate Google OAuth flow
// Query params: mode=signup|login (default: login)
router.get('/oauth/google', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/oauth/google/callback`;
  const mode = req.query.mode || 'login'; // 'signup' allows new accounts, 'login' requires existing

  if (!clientId) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const scope = encodeURIComponent('openid email profile');
  const state = Buffer.from(JSON.stringify({
    timestamp: Date.now(),
    redirect: req.query.redirect || '/',
    mode: mode // Pass mode through OAuth flow
  })).toString('base64');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${scope}&` +
    `state=${state}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.redirect(authUrl);
});

// GET /api/auth/oauth/google/callback - Handle Google OAuth callback
router.get('/oauth/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error) {
      logger.error('Google OAuth error:', error);
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/oauth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      logger.error('Google token exchange failed:', errorData);
      return res.redirect(`${frontendUrl}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string; token_type: string; expires_in: number };

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return res.redirect(`${frontendUrl}/login?error=userinfo_failed`);
    }

    const googleUser = await userInfoResponse.json() as { id: string; email: string; name?: string; picture?: string };
    const { id: googleId, email, name, picture } = googleUser;

    if (!email) {
      return res.redirect(`${frontendUrl}/login?error=no_email`);
    }

    // Parse mode from state
    let mode = 'login';
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        mode = stateData.mode || 'login';
      }
    } catch {
      // State parsing failed, use default mode
    }

    // Find or create user based on mode
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      if (mode === 'login') {
        // Login mode - require existing account
        logger.warn(`Google OAuth login attempted for non-existent user: ${email}`);
        return res.redirect(`${frontendUrl}/?error=no_account&message=Please create an account first before linking Google`);
      }

      // Signup mode - create new account
      user = await prisma.user.create({
        data: {
          email,
          displayName: name || email.split('@')[0],
          avatar: picture,
          emailVerified: new Date(), // Google emails are verified
          oauthId: googleId,
          oauthProvider: 'google',
        } as any,
      });
      logger.info(`New user created via Google OAuth: ${email}`);
    } else if (!(user as any).oauthId) {
      // Link Google account to existing user
      user = await (prisma.user as any).update({
        where: { id: user.id },
        data: {
          oauthId: googleId,
          oauthProvider: 'google',
          emailVerified: new Date(),
          avatar: picture || user.avatar,
        },
      });
      logger.info(`Linked Google account to existing user: ${email}`);
    }

    // Generate JWT tokens (user is guaranteed to exist at this point)
    const tokens = generateTokens(user!.id);

    // Redirect to frontend with tokens (use root path, frontend handles tokens)
    const redirectUrl = `${frontendUrl}/?` +
      `access_token=${tokens.accessToken}&` +
      `refresh_token=${tokens.refreshToken}`;

    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=oauth_callback_failed`);
  }
});

export default router;
