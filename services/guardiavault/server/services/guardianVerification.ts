/**
 * Guardian Verification Service
 * Handles email OTP and wallet signature verification for will guardians
 */

import crypto from "crypto";
import { ethers } from "ethers";
import { db } from "../db";
import { willGuardians } from "@shared/schema";
import { eq } from "../utils/drizzle-exports";
import { logInfo, logError } from "./logger";
import { sendEmail } from "./email";

/**
 * Generate OTP token for email verification
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP to guardian email
 */
export async function sendGuardianOTP(
  guardianId: string,
  email: string,
  willId: string
): Promise<void> {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP in database
    await db
      .update(willGuardians)
      .set({
        verificationToken: crypto.createHash("sha256").update(otp).digest("hex"),
        verificationExpiresAt: expiresAt,
      })
      .where(eq(willGuardians.id, guardianId));

    // Send email
    await sendEmail({
      to: email,
      subject: "Guardian Verification - GuardiaVault Will",
      template: "guardian-otp",
      data: {
        otp,
        willId,
        expiresIn: "15 minutes",
      },
    });

    logInfo("Guardian OTP sent", { guardianId, email, willId });
  } catch (error) {
    logError(error as Error, { context: "send_guardian_otp", guardianId });
    throw error;
  }
}

/**
 * Verify email OTP
 */
export async function verifyEmailOTP(
  guardianId: string,
  otp: string
): Promise<boolean> {
  try {
    const [guardian] = await db
      .select()
      .from(willGuardians)
      .where(eq(willGuardians.id, guardianId))
      .limit(1);

    if (!guardian) {
      return false;
    }

    if (!guardian.verificationToken || !guardian.verificationExpiresAt) {
      return false;
    }

    // Check expiration
    if (new Date() > guardian.verificationExpiresAt) {
      return false;
    }

    // Verify OTP hash
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== guardian.verificationToken) {
      return false;
    }

    // Mark as verified
    await db
      .update(willGuardians)
      .set({
        verified: true,
        verifiedAt: new Date(),
        verificationToken: null,
        verificationExpiresAt: null,
      })
      .where(eq(willGuardians.id, guardianId));

    logInfo("Guardian email verified", { guardianId });
    return true;
  } catch (error) {
    logError(error as Error, { context: "verify_email_otp", guardianId });
    return false;
  }
}

/**
 * Verify wallet signature
 */
export async function verifyWalletSignature(
  guardianId: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const [guardian] = await db
      .select()
      .from(willGuardians)
      .where(eq(willGuardians.id, guardianId))
      .limit(1);

    if (!guardian || guardian.guardianType !== "wallet") {
      return false;
    }

    const expectedAddress = guardian.walletAddress || guardian.identifier;
    if (!expectedAddress) {
      return false;
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      return false;
    }

    // Mark as verified
    await db
      .update(willGuardians)
      .set({
        verified: true,
        verifiedAt: new Date(),
        publicKey: recoveredAddress, // Store for future reference
      })
      .where(eq(willGuardians.id, guardianId));

    logInfo("Guardian wallet verified", { guardianId, address: recoveredAddress });
    return true;
  } catch (error) {
    logError(error as Error, { context: "verify_wallet_signature", guardianId });
    return false;
  }
}

/**
 * Generate verification message for wallet signature
 */
export function generateVerificationMessage(willId: string, guardianId: string): string {
  return `GuardiaVault Guardian Verification\n\nWill ID: ${willId}\nGuardian ID: ${guardianId}\n\nBy signing this message, you verify that you are the designated guardian for this will.`;
}

