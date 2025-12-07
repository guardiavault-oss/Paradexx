/**
 * WebAuthn (FIDO2) Service
 * Handles biometric authentication using passkeys
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import type {
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server/script/deps";
import { storage } from "../storage";
import { logInfo, logError } from "./logger";

const rpName = "GuardiaVault";
const rpID = process.env.WEBAUTHN_RP_ID || new URL(process.env.ORIGIN || "http://localhost:5000").hostname;
const origin = process.env.ORIGIN || "http://localhost:5000";

export interface WebAuthnRegistrationStartResult {
  options: PublicKeyCredentialCreationOptionsJSON;
  challenge: string;
}

export interface WebAuthnRegistrationCompleteResult {
  success: boolean;
  credentialId?: string;
  error?: string;
}

export interface WebAuthnAuthenticationStartResult {
  options: PublicKeyCredentialRequestOptionsJSON;
  challenge: string;
}

export interface WebAuthnAuthenticationCompleteResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export class WebAuthnService {
  /**
   * Start WebAuthn registration
   */
  async startRegistration(
    userId: string,
    userName: string,
    userDisplayName: string
  ): Promise<WebAuthnRegistrationStartResult> {
    try {
      // Get existing credentials for the user
      const existingCredentials = await storage.getWebAuthnCredentials(userId);

      const opts: GenerateRegistrationOptionsOpts = {
        rpName,
        rpID,
        userID: userId,
        userName: userName || `user-${userId.slice(0, 8)}`,
        userDisplayName: userDisplayName || userName || "GuardiaVault User",
        timeout: 60000,
        attestationType: "none",
        excludeCredentials: existingCredentials.map((cred) => ({
          id: cred.credentialId,
          type: "public-key",
          transports: [] as AuthenticatorTransportFuture[],
        })),
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Prefer platform authenticators (Face ID, Touch ID, Windows Hello)
          userVerification: "required",
          requireResidentKey: false,
        },
        supportedAlgorithmIDs: [-7, -257], // ES256, RS256
      };

      const options = await generateRegistrationOptions(opts);

      logInfo("WebAuthn registration started", { userId, challenge: options.challenge });

      return {
        options,
        challenge: options.challenge,
      };
    } catch (error: any) {
      logError("WebAuthn registration start error", error);
      throw new Error(`Failed to start WebAuthn registration: ${error.message}`);
    }
  }

  /**
   * Complete WebAuthn registration
   */
  async completeRegistration(
    userId: string,
    attestationResponse: any,
    expectedChallenge: string,
    deviceName?: string
  ): Promise<WebAuthnRegistrationCompleteResult> {
    try {
      // Get user by ID
      const user = await storage.getUser(userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Get existing credentials to check for duplicates
      const existingCredentials = await storage.getWebAuthnCredentials(userId);

      const opts: VerifyRegistrationResponseOpts = {
        response: attestationResponse,
        expectedChallenge: expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      };

      const verification = await verifyRegistrationResponse(opts);

      if (!verification.verified || !verification.registrationInfo) {
        return { success: false, error: "Registration verification failed" };
      }

      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      // Check if credential already exists
      const credentialIdBase64 = Buffer.from(credentialID).toString("base64url");
      const existing = existingCredentials.find((c) => c.credentialId === credentialIdBase64);
      if (existing) {
        return { success: false, error: "Credential already registered" };
      }

      // Determine device type
      let deviceType = "singleDevice";
      if (attestationResponse.response?.transports?.includes("usb") || 
          attestationResponse.response?.transports?.includes("nfc")) {
        deviceType = "hardware";
      } else if (attestationResponse.response?.transports?.includes("hybrid")) {
        deviceType = "multiDevice";
      }

      // Store credential
      await storage.createWebAuthnCredential({
        userId,
        credentialId: credentialIdBase64,
        publicKey: JSON.stringify({
          id: credentialIdBase64,
          publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
          counter,
        }),
        counter: Number(counter),
        deviceType,
        deviceName: deviceName || "Unknown Device",
      });

      logInfo("WebAuthn registration completed", { userId, credentialId: credentialIdBase64 });

      return {
        success: true,
        credentialId: credentialIdBase64,
      };
    } catch (error: any) {
      logError("WebAuthn registration completion error", error);
      return { success: false, error: error.message || "Registration failed" };
    }
  }

  /**
   * Start WebAuthn authentication
   */
  async startAuthentication(userId: string): Promise<WebAuthnAuthenticationStartResult> {
    try {
      // Get user's credentials
      const credentials = await storage.getWebAuthnCredentials(userId);

      if (credentials.length === 0) {
        throw new Error("No WebAuthn credentials found for user");
      }

      const opts: GenerateAuthenticationOptionsOpts = {
        rpID,
        timeout: 60000,
        allowCredentials: credentials.map((cred) => ({
          id: cred.credentialId,
          type: "public-key",
          transports: [] as AuthenticatorTransportFuture[],
        })),
        userVerification: "required",
      };

      const options = await generateAuthenticationOptions(opts);

      logInfo("WebAuthn authentication started", { userId, challenge: options.challenge });

      return {
        options,
        challenge: options.challenge,
      };
    } catch (error: any) {
      logError("WebAuthn authentication start error", error);
      throw new Error(`Failed to start WebAuthn authentication: ${error.message}`);
    }
  }

  /**
   * Complete WebAuthn authentication
   */
  async completeAuthentication(
    userId: string,
    assertionResponse: any,
    expectedChallenge: string
  ): Promise<WebAuthnAuthenticationCompleteResult> {
    try {
      // Get user's credential
      const credentialIdBase64 = assertionResponse.id;
      const credential = await storage.getWebAuthnCredentialByCredentialId(credentialIdBase64);

      if (!credential || credential.userId !== userId) {
        return { success: false, error: "Invalid credential" };
      }

      const publicKeyData = JSON.parse(credential.publicKey);

      const opts: VerifyAuthenticationResponseOpts = {
        response: assertionResponse,
        expectedChallenge: expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: Buffer.from(credentialIdBase64, "base64url"),
          credentialPublicKey: Buffer.from(publicKeyData.publicKey, "base64url"),
          counter: credential.counter,
        },
        requireUserVerification: true,
      };

      const verification = await verifyAuthenticationResponse(opts);

      if (!verification.verified) {
        return { success: false, error: "Authentication verification failed" };
      }

      // Update counter and last used timestamp
      await storage.updateWebAuthnCredential(credential.id, {
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      });

      logInfo("WebAuthn authentication completed", { userId, credentialId: credentialIdBase64 });

      return {
        success: true,
        userId,
      };
    } catch (error: any) {
      logError("WebAuthn authentication completion error", error);
      return { success: false, error: error.message || "Authentication failed" };
    }
  }

  /**
   * Check if user has WebAuthn credentials
   */
  async hasCredentials(userId: string): Promise<boolean> {
    try {
      const credentials = await storage.getWebAuthnCredentials(userId);
      return credentials.length > 0;
    } catch (error) {
      logError("Error checking WebAuthn credentials", error);
      return false;
    }
  }

  /**
   * Get user's WebAuthn credentials
   */
  async getCredentials(userId: string) {
    return storage.getWebAuthnCredentials(userId);
  }

  /**
   * Delete WebAuthn credential
   */
  async deleteCredential(credentialId: string, userId: string): Promise<boolean> {
    try {
      const credential = await storage.getWebAuthnCredentialByCredentialId(credentialId);
      if (!credential || credential.userId !== userId) {
        return false;
      }

      await storage.deleteWebAuthnCredential(credentialId);
      logInfo("WebAuthn credential deleted", { userId, credentialId });
      return true;
    } catch (error) {
      logError("Error deleting WebAuthn credential", error);
      return false;
    }
  }
}

export const webauthnService = new WebAuthnService();

