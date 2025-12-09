import { logger } from '../services/logger.service';
import { split, combine } from 'shamir-secret-sharing';

/**
 * Guardian verification and multi-sig recovery system
 * 
 * This module uses Shamir's Secret Sharing (shamir-secret-sharing npm package)
 * for cryptographically secure key splitting:
 * - K-of-N threshold scheme (e.g., 2-of-3 or 3-of-5)
 * - Zero-dependency, independently audited implementation
 * 
 * Backend endpoints:
 * - POST /api/guardian - Add guardian
 * - GET /api/guardian/vault/:vaultId - Get guardians for vault
 * - POST /api/guardian/verify - Verify guardian action
 * - POST /api/guardian/notify - Send guardian notification
 */

const API_URL = import.meta.env?.VITE_API_URL || 'https://paradexx-production.up.railway.app';

// Utility functions for Uint8Array conversion
const toUint8Array = (data: string): Uint8Array => new TextEncoder().encode(data);
const fromUint8Array = (data: Uint8Array): string => new TextDecoder().decode(data);
const toBase64 = (data: Uint8Array): string => btoa(String.fromCharCode(...data));
const fromBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export interface Guardian {
  id: string;
  email: string;
  address?: string;
  name?: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  addedAt: number;
  acceptedAt?: number;
  keyShard?: string; // Encrypted key shard
  lastVerified?: number;
}

export interface RecoveryRequest {
  id: string;
  initiatorEmail: string;
  initiatedAt: number;
  expiresAt: number;
  status: 'pending' | 'approved' | 'disputed' | 'completed' | 'cancelled';
  approvals: {
    guardianId: string;
    approvedAt: number;
    signature: string;
  }[];
  requiredApprovals: number;
  disputedBy?: string;
  disputeReason?: string;
}

export interface GuardianSetup {
  threshold: number; // M in M-of-N
  totalGuardians: number; // N in M-of-N
  guardians: Guardian[];
  recoveryDelay: number; // Delay in hours before recovery can complete
  lastCheckIn: number;
  inactivityPeriod: number; // Days before guardians can initiate recovery
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Add guardian
export function addGuardian(
  email: string,
  name?: string
): Guardian {
  const guardian: Guardian = {
    id: generateId(),
    email: email.toLowerCase().trim(),
    name,
    status: 'pending',
    addedAt: Date.now()
  };

  // TODO: Send invitation email
  sendGuardianInvitation(guardian);

  return guardian;
}

// Send guardian invitation via backend API
async function sendGuardianInvitation(guardian: Guardian): Promise<void> {
  logger.info(`Sending invitation to ${guardian.email}`);
  
  try {
    // Send invitation via backend API
    const response = await fetch(`${API_URL}/api/guardian/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guardianEmail: guardian.email,
        guardianName: guardian.name,
        type: 'invitation',
        vaultId: localStorage.getItem('paradex_vault_id') || 'default',
      }),
    });

    if (!response.ok) {
      logger.warn('Failed to send guardian invitation via API, using fallback');
    }
  } catch (error) {
    logger.warn('Backend unavailable for guardian invitation:', error);
  }
  
  // Generate local invite link as backup
  const inviteLink = `${globalThis.location?.origin || ''}/guardian/accept/${guardian.id}`;
  logger.info(`Invitation link: ${inviteLink}`);
}

// Guardian accepts invitation
export function acceptGuardianInvitation(
  guardianId: string,
  guardianAddress: string
): Guardian | null {
  // TODO: Verify guardian identity
  // - Email verification
  // - KYC for Elite tier
  // - Wallet signature verification
  
  const guardian: Guardian = {
    id: guardianId,
    email: 'verified@example.com', // Would come from verification
    address: guardianAddress,
    status: 'accepted',
    addedAt: Date.now(),
    acceptedAt: Date.now()
  };

  // Generate and encrypt key shard
  guardian.keyShard = generateKeyShard(guardianId);

  return guardian;
}

/**
 * Split a secret (e.g., private key) into multiple shares using Shamir's Secret Sharing
 * @param secret - The secret to split (hex string or raw bytes)
 * @param totalShares - Total number of shares to create (N)
 * @param threshold - Minimum shares needed to reconstruct (K)
 * @returns Array of base64-encoded shares
 */
export async function splitSecret(
  secret: string,
  totalShares: number,
  threshold: number
): Promise<string[]> {
  if (threshold < 2) {
    throw new Error('Threshold must be at least 2');
  }
  if (totalShares < threshold) {
    throw new Error('Total shares must be >= threshold');
  }
  if (totalShares > 255) {
    throw new Error('Maximum 255 shares supported');
  }

  // Convert secret to Uint8Array
  const secretBytes = toUint8Array(secret);
  
  // Split using Shamir's Secret Sharing
  const shares = await split(secretBytes, totalShares, threshold);
  
  // Convert each share to base64 for storage
  return shares.map(share => toBase64(share));
}

/**
 * Reconstruct a secret from shares using Shamir's Secret Sharing
 * @param shares - Array of base64-encoded shares (minimum threshold required)
 * @returns The reconstructed secret as a string
 */
export async function combineShares(shares: string[]): Promise<string> {
  if (shares.length < 2) {
    throw new Error('At least 2 shares required to reconstruct secret');
  }

  // Convert base64 shares back to Uint8Array
  const shareBytes = shares.map(share => fromBase64(share));
  
  // Combine shares to reconstruct secret
  const reconstructed = await combine(shareBytes);
  
  // Convert back to string
  return fromUint8Array(reconstructed);
}

/**
 * Generate a key shard for a specific guardian
 * This is called when setting up guardians to distribute shares
 */
function generateKeyShard(guardianId: string): string {
  // This function generates a placeholder shard ID
  // The actual shard data is stored after calling splitSecret()
  // and distributed to each guardian securely
  
  const shardId = `shard_${guardianId}_${Date.now().toString(36)}`;
  return toBase64(toUint8Array(shardId));
}

/**
 * Set up guardian recovery with real Shamir's Secret Sharing
 * @param privateKey - The private key to protect
 * @param guardians - List of guardians
 * @param threshold - Minimum guardians needed for recovery
 */
export async function setupGuardianRecovery(
  privateKey: string,
  guardians: Guardian[],
  threshold: number
): Promise<{ success: boolean; shardsDistributed: number }> {
  if (guardians.length < threshold) {
    throw new Error(`Need at least ${threshold} guardians for ${threshold}-of-N recovery`);
  }

  try {
    // Split the private key into shares
    const shares = await splitSecret(privateKey, guardians.length, threshold);
    
    // Assign each share to a guardian
    for (let i = 0; i < guardians.length; i++) {
      guardians[i].keyShard = shares[i];
      
      // In production: encrypt shard with guardian's public key before storing
      // and send encrypted shard to guardian via secure channel
      logger.info(`Shard ${i + 1}/${guardians.length} assigned to guardian ${guardians[i].id}`);
    }

    // Store guardian setup (without revealing shards in logs)
    logger.info('Guardian recovery setup complete', {
      totalGuardians: guardians.length,
      threshold,
      shardsDistributed: shares.length
    });

    return {
      success: true,
      shardsDistributed: shares.length
    };
  } catch (error) {
    logger.error('Failed to setup guardian recovery:', error);
    throw error;
  }
}

// Check-in (prove owner is alive)
export function recordCheckIn(): number {
  const timestamp = Date.now();
  
  // Store in localStorage (in prod: sync to backend)
  localStorage.setItem('paradox_last_checkin', timestamp.toString());
  
  return timestamp;
}

// Get last check-in time
export function getLastCheckIn(): number {
  const stored = localStorage.getItem('paradox_last_checkin');
  return stored ? parseInt(stored) : Date.now();
}

// Calculate days since last check-in
export function getDaysSinceCheckIn(): number {
  const lastCheckIn = getLastCheckIn();
  const now = Date.now();
  const diffMs = now - lastCheckIn;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Check if guardians can initiate recovery
export function canGuardiansInitiateRecovery(
  inactivityPeriodDays: number = 90
): boolean {
  const daysSinceCheckIn = getDaysSinceCheckIn();
  return daysSinceCheckIn >= inactivityPeriodDays;
}

// Initiate recovery request (by guardian)
export function initiateRecoveryRequest(
  guardianEmail: string,
  setup: GuardianSetup
): RecoveryRequest {
  if (!canGuardiansInitiateRecovery(setup.inactivityPeriod)) {
    throw new Error('Owner has checked in recently. Cannot initiate recovery yet.');
  }

  const recoveryRequest: RecoveryRequest = {
    id: generateId(),
    initiatorEmail: guardianEmail,
    initiatedAt: Date.now(),
    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'pending',
    approvals: [],
    requiredApprovals: setup.threshold
  };

  // Notify owner
  notifyOwnerOfRecoveryRequest(recoveryRequest);

  // Notify other guardians
  notifyGuardiansOfRecoveryRequest(recoveryRequest, setup.guardians);

  return recoveryRequest;
}

// Notify owner of recovery request (gives them chance to dispute)
function notifyOwnerOfRecoveryRequest(request: RecoveryRequest): void {
  logger.info('ALERT: Recovery request initiated!', request);
  
  // In production:
  // - Send urgent email
  // - Send push notification
  // - SMS alert
  // - Show in-app alert
}

// Notify other guardians
function notifyGuardiansOfRecoveryRequest(
  request: RecoveryRequest,
  guardians: Guardian[]
): void {
  guardians.forEach(guardian => {
    if (guardian.status === 'accepted' && guardian.email !== request.initiatorEmail) {
      logger.info(`Notifying guardian: ${guardian.email}`);
      // Send email requesting approval
    }
  });
}

// Guardian approves recovery
export function approveRecovery(
  requestId: string,
  guardianId: string,
  signature: string
): void {
  // Verify guardian signature
  if (!verifyGuardianSignature(guardianId, signature)) {
    throw new Error('Invalid guardian signature');
  }

  // Add approval
  const approval = {
    guardianId,
    approvedAt: Date.now(),
    signature
  };

  // Store approval (in prod: to backend)
  logger.info('Recovery approved by guardian:', guardianId);
}

// Verify guardian signature
// STUB: Requires wallet signature verification library
function verifyGuardianSignature(guardianId: string, signature: string): boolean {
  // Production implementation would:
  // - Verify wallet signature using ethers.js verifyMessage
  // - Check 2FA code (TOTP)
  // - Verify email confirmation token
  
  // Placeholder validation - always returns true for non-empty signature
  return signature.length > 0;
}

// Owner disputes recovery (proves they're alive)
export function disputeRecovery(
  requestId: string,
  ownerSignature: string,
  reason: string
): void {
  // Verify owner signature
  if (!verifyOwnerSignature(ownerSignature)) {
    throw new Error('Invalid owner signature');
  }

  // Cancel recovery request
  logger.info('Recovery disputed by owner:', reason);
  
  // Notify all guardians
  // In production: Send emails explaining dispute
}

// Verify owner signature
// STUB: Requires wallet signature verification
function verifyOwnerSignature(signature: string): boolean {
  // Production implementation would:
  // - Verify wallet signature using ethers.js verifyMessage
  // - Require biometric confirmation on device
  // - Send/verify email confirmation
  
  // Placeholder validation - always returns true for non-empty signature
  return signature.length > 0;
}

// Complete recovery (after threshold approvals + delay)
export async function completeRecovery(
  request: RecoveryRequest,
  guardians: Guardian[]
): Promise<{ success: boolean; recoveryData?: string; error?: string }> {
  // Check if enough approvals
  if (request.approvals.length < request.requiredApprovals) {
    return {
      success: false,
      error: `Need ${request.requiredApprovals} approvals, only have ${request.approvals.length}`
    };
  }

  // Check if recovery delay has passed
  const delayMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  if (Date.now() < request.initiatedAt + delayMs) {
    return {
      success: false,
      error: 'Recovery delay period not complete. This prevents rushed fraud.'
    };
  }

  // Check if disputed
  if (request.status === 'disputed') {
    return {
      success: false,
      error: 'Recovery was disputed by owner'
    };
  }

  try {
    // Reconstruct key from shards using real Shamir's Secret Sharing
    const recoveryData = await reconstructKeyFromShards(request.approvals, guardians);

    return {
      success: true,
      recoveryData
    };
  } catch (error) {
    logger.error('Recovery failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reconstruct key'
    };
  }
}

/**
 * Reconstruct private key from guardian shards using Shamir's Secret Sharing
 * Requires minimum threshold number of valid shards
 */
async function reconstructKeyFromShards(
  approvals: RecoveryRequest['approvals'],
  guardians: Guardian[]
): Promise<string> {
  // Collect key shards from approved guardians
  const shards: string[] = [];
  
  for (const approval of approvals) {
    const guardian = guardians.find(g => g.id === approval.guardianId);
    if (guardian?.keyShard) {
      shards.push(guardian.keyShard);
    }
  }

  if (shards.length < 2) {
    throw new Error('Insufficient valid shards for reconstruction');
  }

  logger.info('Reconstructing key from shards:', { shardCount: shards.length });
  
  // Use Shamir's Secret Sharing to combine the shards
  const reconstructedKey = await combineShares(shards);
  
  return reconstructedKey;
}

// Remove guardian
export function removeGuardian(guardianId: string): void {
  // Revoke guardian access
  // Delete their key shard
  // Redistribute shards among remaining guardians
  
  logger.info('Guardian removed:', guardianId);
}

// Validate guardian setup
export interface GuardianSetupValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateGuardianSetup(
  setup: Partial<GuardianSetup>
): GuardianSetupValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check threshold
  if (!setup.threshold || setup.threshold < 1) {
    errors.push('Threshold must be at least 1');
  }

  // Check total guardians
  if (!setup.totalGuardians || setup.totalGuardians < setup.threshold!) {
    errors.push('Total guardians must be >= threshold');
  }

  // Check accepted guardians
  const acceptedGuardians = setup.guardians?.filter(g => g.status === 'accepted').length || 0;
  if (acceptedGuardians < setup.threshold!) {
    errors.push(`Need ${setup.threshold} accepted guardians, only have ${acceptedGuardians}`);
  }

  // Warnings
  if (setup.threshold === 1) {
    warnings.push('Single guardian setup is less secure. Consider 2-of-3 or 3-of-5.');
  }

  if (setup.totalGuardians && setup.totalGuardians > 10) {
    warnings.push('Too many guardians can make recovery difficult. 3-5 is recommended.');
  }

  if (setup.inactivityPeriod && setup.inactivityPeriod < 30) {
    warnings.push('Short inactivity period. 90+ days recommended to prevent false alarms.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Get guardian setup recommendations
export function getGuardianRecommendations(tier: 'pro' | 'elite'): GuardianSetup {
  if (tier === 'elite') {
    return {
      threshold: 3,
      totalGuardians: 5,
      guardians: [],
      recoveryDelay: 7 * 24, // 7 days in hours
      lastCheckIn: Date.now(),
      inactivityPeriod: 90 // 90 days
    };
  } else {
    return {
      threshold: 2,
      totalGuardians: 3,
      guardians: [],
      recoveryDelay: 7 * 24, // 7 days in hours
      lastCheckIn: Date.now(),
      inactivityPeriod: 90 // 90 days
    };
  }
}
