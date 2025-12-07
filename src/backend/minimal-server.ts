// @ts-nocheck
// Minimal Development Server - Just for wallet creation testing

import express from 'express';
import { logger } from '../services/logger.service';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for development
const users = new Map();
const verificationCodes = new Map();
const guardians = new Map();

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// POST /api/auth/send-verification-code
app.post('/api/auth/send-verification-code', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        verificationCodes.set(email, { code, expiresAt });

        logger.info(`🔢 Development verification code for ${email}: ${code}`);

        res.json({
            message: 'Verification code sent',
            developmentCode: code, // Only for development
            expiresAt
        });
    } catch (error) {
        logger.error('Send verification code error:', error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});

// POST /api/auth/verify-email-code
app.post('/api/auth/verify-email-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }

        const storedData = verificationCodes.get(email);

        if (!storedData) {
            return res.status(400).json({ error: 'No verification code found' });
        }

        if (storedData.code !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (new Date() > storedData.expiresAt) {
            verificationCodes.delete(email);
            return res.status(400).json({ error: 'Verification code expired' });
        }

        // Code is valid, mark email as verified
        verificationCodes.delete(email);

        res.json({
            message: 'Email verified successfully',
            verified: true
        });
    } catch (error) {
        logger.error('Verify email code error:', error);
        res.status(500).json({ error: 'Failed to verify email code' });
    }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }

        // Check if user already exists
        if (users.has(email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: `user_${Date.now()}`,
            email,
            username,
            password: hashedPassword,
            isEmailVerified: true,
            createdAt: new Date().toISOString()
        };

        users.set(email, user);

        // Generate JWT tokens
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            },
            accessToken,
            refreshToken
        });
    } catch (error) {
        logger.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = users.get(email);

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT tokens
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            },
            accessToken,
            refreshToken
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// POST /api/guardians/invite - Send guardian invitations
app.post('/api/guardians/invite', async (req, res) => {
    try {
        const { userId, guardianEmails } = req.body;

        if (!userId || !guardianEmails || !Array.isArray(guardianEmails)) {
            return res.status(400).json({ error: 'User ID and guardian emails array are required' });
        }

        const invitations = guardianEmails.map(email => ({
            id: `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            guardianEmail: email,
            status: 'pending',
            createdAt: new Date().toISOString(),
            invitationCode: Math.random().toString(36).substr(2, 8).toUpperCase()
        }));

        // Store invitations (in development, just log them)
        logger.info(`📧 Guardian invitations created:`, invitations);

        res.json({
            message: 'Guardian invitations sent successfully',
            invitations,
            developmentNote: 'In production, emails would be sent to guardians'
        });
    } catch (error) {
        logger.error('Guardian invite error:', error);
        res.status(500).json({ error: 'Failed to send guardian invitations' });
    }
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', async (req, res) => {
    try {
        // For development, return a mock user
        const mockUser = {
            id: 'dev-user-123',
            email: 'guardefi@gmail.com',
            username: 'dev_user',
            isEmailVerified: true,
            createdAt: new Date().toISOString()
        };

        res.json(mockUser);
    } catch (error) {
        logger.error('Get user info error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// POST /api/auth/refresh - Refresh access token
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        // For development, just return a new access token
        const accessToken = jwt.sign(
            { userId: 'dev-user-123', email: 'guardefi@gmail.com' },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '15m' }
        );

        res.json({
            accessToken,
            refreshToken // Return same refresh token for development
        });
    } catch (error) {
        logger.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Minimal development server running on http://localhost:${PORT}`);
    logger.info(`🔧 Health check: http://localhost:${PORT}/health`);
    logger.info(`📧 Development mode: Verification codes will be shown in console`);
});
