/**
 * Guardian Invite Token Service
 * Generates and validates JWT-based invite tokens for guardian portal access
 */

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getRequiredEnv, getEnvWithDefault } from "../config/validateEnv";

// CRITICAL: Use JWT_SECRET if set, otherwise use SESSION_SECRET (both are validated)
// NO FALLBACK VALUES - will crash if neither is set
const JWT_SECRET = process.env.JWT_SECRET || getRequiredEnv("SESSION_SECRET");
const INVITE_TOKEN_EXPIRY_DAYS = 30; // 30 days expiry

export interface InviteTokenPayload {
  vaultId: string;
  partyId: string;
  email: string;
  role: "guardian" | "beneficiary";
  type: "guardian_portal" | "acceptance";
}

/**
 * Generate a JWT invite token for guardian portal access
 */
export function generateInviteToken(payload: InviteTokenPayload): string {
  const expiresIn = `${INVITE_TOKEN_EXPIRY_DAYS}d`;
  
  const token = jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    {
      expiresIn,
    }
  );

  return token;
}

/**
 * Verify and decode an invite token
 */
export function verifyInviteToken(token: string): InviteTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as InviteTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique invite link for a guardian
 */
export function generateInviteLink(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  return `${base}/guardian-portal?token=${token}`;
}

/**
 * Generate OTP for guardian acceptance (6-digit code)
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash email for smart contract storage (keccak256)
 */
export function hashEmail(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

