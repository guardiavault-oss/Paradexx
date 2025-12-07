import { logger } from '../services/logger.service';
// Guardian verification and multi-sig recovery system

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

// Send guardian invitation (mock - would integrate with email service)
async function sendGuardianInvitation(guardian: Guardian): Promise<void> {
  logger.info(`Sending invitation to ${guardian.email}`);
  
  // In production:
  // - Generate secure invitation link
  // - Send email via SendGrid/AWS SES
  // - Link contains guardian.id for verification
  
  // Mock implementation
  const inviteLink = `${window.location.origin}/guardian/accept/${guardian.id}`;
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

// Generate encrypted key shard for guardian
function generateKeyShard(guardianId: string): string {
  // In production, this would:
  // 1. Split private key using Shamir's Secret Sharing
  // 2. Encrypt shard with guardian's public key
  // 3. Store encrypted shard
  
  // Mock implementation
  const shard = `SHARD_${guardianId}_${Math.random().toString(36)}`;
  return btoa(shard); // Base64 encode (in prod: proper encryption)
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
function verifyGuardianSignature(guardianId: string, signature: string): boolean {
  // In production:
  // - Verify wallet signature
  // - Check 2FA code
  // - Verify email confirmation
  
  // Mock implementation
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
function verifyOwnerSignature(signature: string): boolean {
  // In production:
  // - Verify wallet signature
  // - Require biometric confirmation
  // - Send email confirmation
  
  // Mock implementation
  return signature.length > 0;
}

// Complete recovery (after threshold approvals + delay)
export function completeRecovery(
  request: RecoveryRequest,
  guardians: Guardian[]
): { success: boolean; recoveryData?: string; error?: string } {
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

  // Reconstruct key from shards
  const recoveryData = reconstructKeyFromShards(request.approvals, guardians);

  return {
    success: true,
    recoveryData
  };
}

// Reconstruct private key from guardian shards
function reconstructKeyFromShards(
  approvals: RecoveryRequest['approvals'],
  guardians: Guardian[]
): string {
  // In production, this would:
  // 1. Collect key shards from approved guardians
  // 2. Decrypt each shard with guardian's approval
  // 3. Use Shamir's Secret Sharing to reconstruct key
  // 4. Return decrypted private key
  
  // Mock implementation
  const shards = approvals.map(approval => {
    const guardian = guardians.find(g => g.id === approval.guardianId);
    return guardian?.keyShard || '';
  });

  logger.info('Reconstructing key from shards:', shards.length);
  return 'RECOVERED_KEY'; // Mock
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
