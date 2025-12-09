/**
 * Email Verification Routes
 * Handles email verification for account creation
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { users, subscriptions } from "@shared/schema";
import { eq } from "./utils/drizzle-exports";
import { withTransaction } from "./utils/db";
import { logInfo, logError } from "./services/logger";
import { sendEmail } from "./services/email";

// Extend global interface for verification codes
declare global {
    var emailVerificationCodes: Map<string, {
        email: string;
        code: string;
        userData: {
            email: string;
            password: string;
            stripeSessionId?: string;
            plan?: string;
            months?: number;
        };
        expires: Date;
    }> | undefined;
}

/**
 * Register email verification routes
 */
export function registerEmailVerificationRoutes(app: Express) {
    // POST /api/auth/register
    app.post("/api/auth/register", async (req: Request, res: Response) => {
        try {
            const { email, password, stripeSessionId, plan, months } = req.body;

            // Validate email
            const emailSchema = z.string().email();
            const normalizedEmail = emailSchema.parse(email).toLowerCase().trim();

            // Check if user already exists
            const existingUser = await storage.getUserByEmail(normalizedEmail);
            if (existingUser) {
                return res.status(400).json({ message: "Email already registered" });
            }

            // Generate 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15);

            // Store verification data
            if (!global.emailVerificationCodes) {
                global.emailVerificationCodes = new Map();
            }

            global.emailVerificationCodes.set(normalizedEmail, {
                email: normalizedEmail,
                code: verificationCode,
                userData: {
                    email: normalizedEmail,
                    password,
                    stripeSessionId,
                    plan,
                    months,
                },
                expires: expiresAt,
            });

            // Send verification email
            try {
                await sendEmail(
                    normalizedEmail,
                    "Verify Your GuardiaVault Account",
                    `Welcome to GuardiaVault!

To complete your account creation, please use the verification code below:

${verificationCode}

This code will expire in 15 minutes.

If you didn't create an account, please ignore this email.

Best regards,
GuardiaVault Security Team`,
                    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to GuardiaVault!</h2>
            <p>To complete your account creation, please use the verification code below:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
              ${verificationCode}
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <p>Best regards,<br>GuardiaVault Security Team</p>
          </div>`
                );
            } catch (emailError) {
                logError("Failed to send verification email", emailError);
                return res.status(500).json({ message: "Failed to send verification email. Please try again." });
            }

            logInfo("Registration verification email sent", {
                context: "register",
                email: normalizedEmail,
            });

            res.json({
                message: "Verification code sent to your email. Please check your inbox and complete registration.",
                email: normalizedEmail,
                expiresIn: 15 * 60,
            });
        } catch (error: any) {
            logError(error, {
                context: "register",
                email: req.body?.email,
            });
            res.status(500).json({ message: error.message || "Registration failed" });
        }
    });

    // POST /api/auth/verify-email
    app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
        try {
            const { email, code } = req.body;
            const normalizedEmail = email.toLowerCase().trim();

            // Check if verification code exists
            if (!global.emailVerificationCodes || !global.emailVerificationCodes.has(normalizedEmail)) {
                return res.status(400).json({ message: "No verification request found. Please start registration again." });
            }

            const verificationData = global.emailVerificationCodes.get(normalizedEmail);
            if (!verificationData) {
                return res.status(400).json({ message: "No verification request found. Please start registration again." });
            }

            // Check if code expired
            if (new Date() > verificationData.expires) {
                global.emailVerificationCodes.delete(normalizedEmail);
                return res.status(400).json({ message: "Verification code has expired. Please start registration again." });
            }

            // Verify code
            if (code !== verificationData.code) {
                return res.status(400).json({ message: "Invalid verification code. Please try again." });
            }

            // Code is valid - create the user account
            const userData = verificationData.userData;

            // Check again if user already exists (race condition protection)
            const existingUser = await storage.getUserByEmail(normalizedEmail);
            if (existingUser) {
                global.emailVerificationCodes.delete(normalizedEmail);
                return res.status(400).json({ message: "Email already registered" });
            }

            // Hash password
            const bcrypt = await import("bcrypt");
            const hashedPassword = await bcrypt.default.hash(userData.password.trim(), 10);

            // Create user account
            let user: any;
            let subscriptionCreated = false;

            if (db && subscriptions) {
                const now = new Date();

                const result = await withTransaction(async (tx) => {
                    // Create user
                    const [userRow] = await tx.insert(users).values({
                        email: normalizedEmail,
                        password: hashedPassword,
                        createdAt: now,
                        lastLoginAt: null,
                    }).returning();

                    // Create subscription if payment session provided
                    if (userData.stripeSessionId) {
                        const monthsToAdd = userData.months || 6;
                        const periodEnd = new Date();
                        periodEnd.setMonth(periodEnd.getMonth() + monthsToAdd);

                        await tx.insert(subscriptions).values({
                            id: crypto.randomUUID(),
                            userId: userRow.id,
                            plan: userData.plan || "Pro",
                            status: "active",
                            currentPeriodStart: now,
                            currentPeriodEnd: periodEnd,
                            cancelAtPeriodEnd: false,
                            stripeSubscriptionId: userData.stripeSessionId,
                            stripeCustomerId: `cust_${crypto.randomUUID()}`,
                            createdAt: now,
                            updatedAt: now,
                        });
                        subscriptionCreated = true;
                    }

                    return userRow;
                });

                user = result;
            } else {
                // Fallback to storage
                user = await storage.createUser({
                    email: normalizedEmail,
                    password: hashedPassword,
                });
            }

            // Clean up verification data
            global.emailVerificationCodes.delete(normalizedEmail);

            // Set session
            req.session!.userId = user.id;

            logInfo("User account created successfully", {
                context: "verify_email",
                userId: user.id,
                email: normalizedEmail,
                hasSubscription: subscriptionCreated,
            });

            // Return user without password
            const { password: _, ...userWithoutPassword } = user;
            res.json({
                success: true,
                message: "Account created successfully!",
                user: userWithoutPassword
            });
        } catch (error: any) {
            logError(error, {
                context: "verify_email",
                email: req.body?.email,
            });
            res.status(500).json({ message: error.message || "Failed to create account" });
        }
    });
}
