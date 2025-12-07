import {
  type User,
  type InsertUser,
  type Vault,
  type InsertVault,
  type Party,
  type InsertParty,
  type Fragment,
  type InsertFragment,
  type CheckIn,
  type InsertCheckIn,
  type Notification,
  type InsertNotification,
  type VaultTriggerClaim,
  type InsertVaultTriggerClaim,
  type ClaimFile,
  type InsertClaimFile,
  type ClaimAttestation,
  type InsertClaimAttestation,
  type Recovery,
  type InsertRecovery,
  type RecoveryKey,
  type InsertRecoveryKey,
  type DaoVerifier,
  type InsertDaoVerifier,
  type Subscription,
  type InsertSubscription,
  type WebAuthnCredential,
  type InsertWebAuthnCredential,
  type TotpSecret,
  type InsertTotpSecret,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { logInfo, logError, logWarn } from "./services/logger";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User | undefined>;
  linkWalletToUser(userId: string, walletAddress: string): Promise<User | undefined>;

  // Vault operations
  getVault(id: string): Promise<Vault | undefined>;
  getVaultsByOwner(ownerId: string): Promise<Vault[]>;
  createVault(vault: InsertVault): Promise<Vault>;
  updateVault(id: string, vault: Partial<Vault>): Promise<Vault | undefined>;
  deleteVault(id: string): Promise<boolean>;

  // Party operations (guardians, beneficiaries, attestors)
  getParty(id: string): Promise<Party | undefined>;
  getPartiesByVault(vaultId: string): Promise<Party[]>;
  getPartiesByRole(vaultId: string, role: string): Promise<Party[]>;
  createParty(party: InsertParty): Promise<Party>;
  updateParty(id: string, party: Partial<Party>): Promise<Party | undefined>;
  deleteParty(id: string): Promise<boolean>;

  // Fragment operations
  getFragment(id: string): Promise<Fragment | undefined>;
  getFragmentsByVault(vaultId: string): Promise<Fragment[]>;
  getFragmentByGuardian(guardianId: string): Promise<Fragment | undefined>;
  createFragment(fragment: InsertFragment): Promise<Fragment>;
  deleteFragmentsByVault(vaultId: string): Promise<boolean>;

  // Check-in operations
  getCheckIn(id: string): Promise<CheckIn | undefined>;
  getCheckInsByVault(vaultId: string): Promise<CheckIn[]>;
  getLatestCheckIn(vaultId: string): Promise<CheckIn | undefined>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;

  // Notification operations
  getNotification(id: string): Promise<Notification | undefined>;
  getPendingNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(
    id: string,
    notification: Partial<Notification>
  ): Promise<Notification | undefined>;

  // Vault trigger claim operations (inactivity attestation)
  createVaultTriggerClaim(claim: InsertVaultTriggerClaim): Promise<VaultTriggerClaim>;
  getVaultTriggerClaim(id: string): Promise<VaultTriggerClaim | undefined>;
  listVaultTriggerClaimsByVault(vaultId: string): Promise<VaultTriggerClaim[]>;
  updateVaultTriggerClaim(id: string, updates: Partial<VaultTriggerClaim>): Promise<VaultTriggerClaim | undefined>;
  addClaimFile(file: InsertClaimFile): Promise<ClaimFile>;
  listClaimFiles(claimId: string): Promise<ClaimFile[]>;
  upsertClaimAttestation(att: InsertClaimAttestation & { decision?: "approve" | "reject" | "pending" }): Promise<ClaimAttestation>;
  listClaimAttestations(claimId: string): Promise<ClaimAttestation[]>;

  // Recovery operations
  createRecovery(recovery: InsertRecovery): Promise<Recovery>;
  getRecovery(id: string): Promise<Recovery | undefined>;
  getRecoveriesByUser(userId: string): Promise<Recovery[]>;
  updateRecovery(id: string, updates: Partial<Recovery>): Promise<Recovery | undefined>;
  
  // Recovery key operations
  createRecoveryKey(key: InsertRecoveryKey): Promise<RecoveryKey>;
  getRecoveryKey(id: string): Promise<RecoveryKey | undefined>;
  getRecoveryKeyByToken(token: string): Promise<RecoveryKey | undefined>;
  getRecoveryKeysByRecovery(recoveryId: string): Promise<RecoveryKey[]>;
  updateRecoveryKey(id: string, updates: Partial<RecoveryKey>): Promise<RecoveryKey | undefined>;

  // DAO Verifier operations
  createDaoVerifier(verifier: InsertDaoVerifier): Promise<DaoVerifier>;
  getDaoVerifierByAddress(address: string): Promise<DaoVerifier | undefined>;
  getDaoVerifierByUser(userId: string): Promise<DaoVerifier | undefined>;
  updateDaoVerifier(id: string, updates: Partial<DaoVerifier>): Promise<DaoVerifier | undefined>;

  // Subscription operations
  getActiveSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // WebAuthn operations
  getWebAuthnCredentials(userId: string): Promise<WebAuthnCredential[]>;
  getWebAuthnCredentialsByUserId(userId: string): Promise<WebAuthnCredential[]>;
  getWebAuthnCredentialByCredentialId(credentialId: string): Promise<WebAuthnCredential | undefined>;
  createWebAuthnCredential(credential: InsertWebAuthnCredential): Promise<WebAuthnCredential>;
  updateWebAuthnCredential(id: string, updates: Partial<WebAuthnCredential>): Promise<WebAuthnCredential | undefined>;
  deleteWebAuthnCredential(credentialId: string): Promise<boolean>;

  // TOTP operations
  getTotpSecret(userId: string): Promise<TotpSecret | undefined>;
  createTotpSecret(secret: InsertTotpSecret): Promise<TotpSecret>;
  updateTotpSecret(userId: string, updates: Partial<TotpSecret>): Promise<TotpSecret | undefined>;
  deleteTotpSecret(userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vaults: Map<string, Vault>;
  private parties: Map<string, Party>;
  private fragments: Map<string, Fragment>;
  private checkIns: Map<string, CheckIn>;
  private notifications: Map<string, Notification>;
  private vaultTriggerClaims: Map<string, VaultTriggerClaim>;
  private claimFiles: Map<string, ClaimFile>;
  private claimAttestations: Map<string, ClaimAttestation>;
  private recoveries: Map<string, Recovery>;
  private recoveryKeys: Map<string, RecoveryKey>;
  private daoVerifiers: Map<string, DaoVerifier>;
  private subscriptions: Map<string, Subscription>;
  private webauthnCredentials: Map<string, WebAuthnCredential>;
  private totpSecrets: Map<string, TotpSecret>;

  constructor() {
    this.users = new Map();
    this.vaults = new Map();
    this.parties = new Map();
    this.fragments = new Map();
    this.checkIns = new Map();
    this.notifications = new Map();
    this.vaultTriggerClaims = new Map();
    this.claimFiles = new Map();
    this.claimAttestations = new Map();
    this.recoveries = new Map();
    this.recoveryKeys = new Map();
    this.daoVerifiers = new Map();
    this.subscriptions = new Map();
    this.webauthnCredentials = new Map();
    this.totpSecrets = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress?.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      walletAddress: insertUser.walletAddress ?? null,
      walletConnectedAt: null,
      createdAt: new Date(),
      lastLoginAt: null,
      ssnHash: insertUser.ssnHash ?? null,
      fullName: insertUser.fullName ?? null,
      dateOfBirth: insertUser.dateOfBirth ?? null,
      lastKnownLocation: insertUser.lastKnownLocation ?? null,
      deathMonitoringEnabled: insertUser.deathMonitoringEnabled ?? false,
      verificationTier: insertUser.verificationTier ?? 1,
      lastSsdiiCheck: insertUser.lastSsdiiCheck ?? null,
      ssdiConsentGiven: insertUser.ssdiConsentGiven ?? false,
      ssdiConsentDate: insertUser.ssdiConsentDate ?? null,
      ssdiConsentIpAddress: insertUser.ssdiConsentIpAddress ?? null,
      deathVerifiedAt: insertUser.deathVerifiedAt ?? null,
      deathConfidenceScore: insertUser.deathConfidenceScore ?? null,
      status: insertUser.status ?? "active",
      totpSecret: null,
      totpEnabled: false,
      backupCodes: null,
    };
    this.users.set(id, user);
    return user;
  }

  async linkWalletToUser(userId: string, walletAddress: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      walletAddress,
      walletConnectedAt: new Date(),
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Vault operations
  async getVault(id: string): Promise<Vault | undefined> {
    return this.vaults.get(id);
  }

  async getVaultsByOwner(ownerId: string): Promise<Vault[]> {
    return Array.from(this.vaults.values()).filter(
      (vault) => vault.ownerId === ownerId
    );
  }

  async createVault(insertVault: InsertVault): Promise<Vault> {
    const id = randomUUID();
    const now = new Date();
    const checkInIntervalDays = insertVault.checkInIntervalDays ?? 90;
    const gracePeriodDays = insertVault.gracePeriodDays ?? 14;
    const nextCheckInDue = new Date(
      now.getTime() + checkInIntervalDays * 24 * 60 * 60 * 1000
    );

    const vault: Vault = {
      ...insertVault,
      id,
      checkInIntervalDays,
      gracePeriodDays,
      fragmentScheme: insertVault.fragmentScheme ?? "2-of-3",
      status: "active",
      lastCheckInAt: now,
      nextCheckInDue,
      createdAt: now,
      updatedAt: now,
    };
    this.vaults.set(id, vault);
    return vault;
  }

  async updateVault(
    id: string,
    updates: Partial<Vault>
  ): Promise<Vault | undefined> {
    const vault = this.vaults.get(id);
    if (!vault) return undefined;

    const updated = {
      ...vault,
      ...updates,
      updatedAt: new Date(),
    };
    this.vaults.set(id, updated);
    return updated;
  }

  async deleteVault(id: string): Promise<boolean> {
    // Cascade delete: remove all dependent records
    const parties = await this.getPartiesByVault(id);
    const fragments = await this.getFragmentsByVault(id);
    const checkIns = await this.getCheckInsByVault(id);
    const notifications = Array.from(this.notifications.values()).filter(
      (n) => n.vaultId === id
    );

    // Delete all dependent records
    parties.forEach((party) => this.parties.delete(party.id));
    fragments.forEach((fragment) => this.fragments.delete(fragment.id));
    checkIns.forEach((checkIn) => this.checkIns.delete(checkIn.id));
    notifications.forEach((notification) =>
      this.notifications.delete(notification.id)
    );

    // Delete the vault itself
    return this.vaults.delete(id);
  }

  // Party operations
  async getParty(id: string): Promise<Party | undefined> {
    return this.parties.get(id);
  }

  async getPartiesByVault(vaultId: string): Promise<Party[]> {
    return Array.from(this.parties.values()).filter(
      (party) => party.vaultId === vaultId
    );
  }

  async getPartiesByRole(vaultId: string, role: string): Promise<Party[]> {
    return Array.from(this.parties.values()).filter(
      (party) => party.vaultId === vaultId && party.role === role
    );
  }

  async createParty(insertParty: InsertParty): Promise<Party> {
    const id = randomUUID();
    const party: Party = {
      ...insertParty,
      id,
      phone: insertParty.phone ?? null,
      inviteToken: insertParty.inviteToken ?? null,
      inviteExpiresAt: insertParty.inviteExpiresAt ?? null,
      status: "pending",
      invitedAt: new Date(),
      acceptedAt: null,
      createdAt: new Date(),
    };
    this.parties.set(id, party);
    return party;
  }

  async updateParty(
    id: string,
    updates: Partial<Party>
  ): Promise<Party | undefined> {
    const party = this.parties.get(id);
    if (!party) return undefined;

    const updated = { ...party, ...updates };
    this.parties.set(id, updated);
    return updated;
  }

  async deleteParty(id: string): Promise<boolean> {
    return this.parties.delete(id);
  }

  // Fragment operations
  async getFragment(id: string): Promise<Fragment | undefined> {
    return this.fragments.get(id);
  }

  async getFragmentsByVault(vaultId: string): Promise<Fragment[]> {
    return Array.from(this.fragments.values()).filter(
      (fragment) => fragment.vaultId === vaultId
    );
  }

  async getFragmentByGuardian(
    guardianId: string
  ): Promise<Fragment | undefined> {
    return Array.from(this.fragments.values()).find(
      (fragment) => fragment.guardianId === guardianId
    );
  }

  async createFragment(insertFragment: InsertFragment): Promise<Fragment> {
    const id = randomUUID();
    const fragment: Fragment = {
      ...insertFragment,
      id,
      derivationSalt: insertFragment.derivationSalt ?? null,
      createdAt: new Date(),
    };
    this.fragments.set(id, fragment);
    return fragment;
  }

  async deleteFragmentsByVault(vaultId: string): Promise<boolean> {
    const fragments = await this.getFragmentsByVault(vaultId);
    fragments.forEach((fragment) => this.fragments.delete(fragment.id));
    return true;
  }

  // Check-in operations
  async getCheckIn(id: string): Promise<CheckIn | undefined> {
    return this.checkIns.get(id);
  }

  async getCheckInsByVault(vaultId: string): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .filter((checkIn) => checkIn.vaultId === vaultId)
      .sort((a, b) => b.checkedInAt.getTime() - a.checkedInAt.getTime());
  }

  async getLatestCheckIn(vaultId: string): Promise<CheckIn | undefined> {
    const checkIns = await this.getCheckInsByVault(vaultId);
    return checkIns[0];
  }

  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const id = randomUUID();
    const checkIn: CheckIn = {
      ...insertCheckIn,
      id,
      ipAddress: insertCheckIn.ipAddress ?? null,
      checkedInAt: new Date(),
    };
    this.checkIns.set(id, checkIn);
    return checkIn;
  }

  // Notification operations
  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getPendingNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.status === "pending"
    );
  }

  async createNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      status: "pending",
      sentAt: null,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async updateNotification(
    id: string,
    updates: Partial<Notification>
  ): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updated = { ...notification, ...updates };
    this.notifications.set(id, updated);
    return updated;
  }

  // Vault trigger claims (inactivity attestation)
  async createVaultTriggerClaim(insert: InsertVaultTriggerClaim): Promise<VaultTriggerClaim> {
    const id = randomUUID();
    const claim: VaultTriggerClaim = {
      ...insert,
      id,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.vaultTriggerClaims.set(id, claim);
    return claim;
  }

  async getVaultTriggerClaim(id: string): Promise<VaultTriggerClaim | undefined> {
    return this.vaultTriggerClaims.get(id);
  }

  async listVaultTriggerClaimsByVault(vaultId: string): Promise<VaultTriggerClaim[]> {
    return Array.from(this.vaultTriggerClaims.values()).filter((c) => c.vaultId === vaultId);
  }

  async updateVaultTriggerClaim(id: string, updates: Partial<VaultTriggerClaim>): Promise<VaultTriggerClaim | undefined> {
    const c = this.vaultTriggerClaims.get(id);
    if (!c) return undefined;
    const updated = { ...c, ...updates, updatedAt: new Date() } as VaultTriggerClaim;
    this.vaultTriggerClaims.set(id, updated);
    return updated;
  }

  async addClaimFile(file: InsertClaimFile): Promise<ClaimFile> {
    const id = randomUUID();
    const rec: ClaimFile = { ...file, id, uploadedAt: new Date() } as any;
    this.claimFiles.set(id, rec);
    return rec;
  }

  async listClaimFiles(claimId: string): Promise<ClaimFile[]> {
    return Array.from(this.claimFiles.values()).filter((f) => f.claimId === claimId);
  }

  async upsertClaimAttestation(att: InsertClaimAttestation & { decision?: "approve" | "reject" | "pending" }): Promise<ClaimAttestation> {
    // Ensure uniqueness by (claimId, partyId)
    let existing = Array.from(this.claimAttestations.values()).find((a) => a.claimId === att.claimId && a.partyId === att.partyId);
    if (existing) {
      const updated = { ...existing, decision: (att as any).decision ?? existing.decision, updatedAt: new Date() } as ClaimAttestation;
      this.claimAttestations.set(existing.id, updated);
      return updated;
    }
    const id = randomUUID();
    const rec: ClaimAttestation = {
      ...att,
      id,
      decision: (att as any).decision ?? "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.claimAttestations.set(id, rec);
    return rec;
  }

  async listClaimAttestations(claimId: string): Promise<ClaimAttestation[]> {
    return Array.from(this.claimAttestations.values()).filter((a) => a.claimId === claimId);
  }

  // Recovery operations
  async createRecovery(recovery: InsertRecovery): Promise<Recovery> {
    const id = randomUUID();
    const rec: Recovery = {
      ...recovery,
      id,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      triggeredAt: null,
      completedAt: null,
      contractRecoveryId: null,
    } as any;
    this.recoveries.set(id, rec);
    return rec;
  }

  async getRecovery(id: string): Promise<Recovery | undefined> {
    return this.recoveries.get(id);
  }

  async getRecoveriesByUser(userId: string): Promise<Recovery[]> {
    return Array.from(this.recoveries.values()).filter((r) => r.userId === userId);
  }

  async updateRecovery(id: string, updates: Partial<Recovery>): Promise<Recovery | undefined> {
    const rec = this.recoveries.get(id);
    if (!rec) return undefined;
    const updated = { ...rec, ...updates, updatedAt: new Date() } as Recovery;
    this.recoveries.set(id, updated);
    return updated;
  }

  async getRecoveryByToken(token: string): Promise<Recovery | undefined> {
    const key = Array.from(this.recoveryKeys.values()).find((k) => k.inviteToken === token);
    if (!key) return undefined;
    return this.recoveries.get(key.recoveryId);
  }

  // Recovery key operations
  async createRecoveryKey(key: InsertRecoveryKey): Promise<RecoveryKey> {
    const id = randomUUID();
    const rec: RecoveryKey = {
      ...key,
      id,
      hasAttested: false,
      attestedAt: null,
      createdAt: new Date(),
    } as any;
    this.recoveryKeys.set(id, rec);
    return rec;
  }

  async getRecoveryKey(id: string): Promise<RecoveryKey | undefined> {
    return this.recoveryKeys.get(id);
  }

  async getRecoveryKeyByToken(token: string): Promise<RecoveryKey | undefined> {
    return Array.from(this.recoveryKeys.values()).find((k) => k.inviteToken === token);
  }

  async getRecoveryKeysByRecovery(recoveryId: string): Promise<RecoveryKey[]> {
    return Array.from(this.recoveryKeys.values()).filter((k) => k.recoveryId === recoveryId);
  }

  async updateRecoveryKey(id: string, updates: Partial<RecoveryKey>): Promise<RecoveryKey | undefined> {
    const key = this.recoveryKeys.get(id);
    if (!key) return undefined;
    const updated = { ...key, ...updates } as RecoveryKey;
    this.recoveryKeys.set(id, updated);
    return updated;
  }

  // WebAuthn operations
  async getWebAuthnCredentials(userId: string): Promise<WebAuthnCredential[]> {
    return Array.from(this.webauthnCredentials.values()).filter((c) => c.userId === userId);
  }

  async getWebAuthnCredentialsByUserId(userId: string): Promise<WebAuthnCredential[]> {
    return this.getWebAuthnCredentials(userId);
  }

  async getWebAuthnCredentialByCredentialId(credentialId: string): Promise<WebAuthnCredential | undefined> {
    return Array.from(this.webauthnCredentials.values()).find((c) => c.credentialId === credentialId);
  }

  async createWebAuthnCredential(credential: InsertWebAuthnCredential): Promise<WebAuthnCredential> {
    const id = randomUUID();
    const now = new Date();
    const rec: WebAuthnCredential = {
      ...credential,
      id,
      counter: 0,
      deviceType: credential.deviceType ?? null,
      deviceName: credential.deviceName ?? null,
      lastUsedAt: null,
      createdAt: now,
    };
    this.webauthnCredentials.set(id, rec);
    return rec;
  }

  async updateWebAuthnCredential(id: string, updates: Partial<WebAuthnCredential>): Promise<WebAuthnCredential | undefined> {
    const cred = Array.from(this.webauthnCredentials.values()).find((c) => c.id === id);
    if (!cred) return undefined;
    const updated = { ...cred, ...updates } as WebAuthnCredential;
    this.webauthnCredentials.set(cred.id, updated);
    return updated;
  }

  async deleteWebAuthnCredential(credentialId: string): Promise<boolean> {
    const cred = Array.from(this.webauthnCredentials.values()).find((c) => c.credentialId === credentialId);
    if (!cred) return false;
    return this.webauthnCredentials.delete(cred.id);
  }

  // TOTP operations
  async getTotpSecret(userId: string): Promise<TotpSecret | undefined> {
    return Array.from(this.totpSecrets.values()).find((s) => s.userId === userId);
  }

  async createTotpSecret(secret: InsertTotpSecret): Promise<TotpSecret> {
    const id = randomUUID();
    const now = new Date();
    const rec: TotpSecret = {
      ...secret,
      id,
      enabled: false,
      lastUsedAt: null,
      createdAt: now,
    } as any;
    this.totpSecrets.set(id, rec);
    return rec;
  }

  async updateTotpSecret(userId: string, updates: Partial<TotpSecret>): Promise<TotpSecret | undefined> {
    const secret = Array.from(this.totpSecrets.values()).find((s) => s.userId === userId);
    if (!secret) return undefined;
    const updated = { ...secret, ...updates } as TotpSecret;
    this.totpSecrets.set(secret.id, updated);
    return updated;
  }

  async deleteTotpSecret(userId: string): Promise<boolean> {
    const secret = Array.from(this.totpSecrets.values()).find((s) => s.userId === userId);
    if (!secret) return false;
    return this.totpSecrets.delete(secret.id);
  }

  // Subscription operations
  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (sub) => sub.userId === userId && sub.status === "active"
    );
  }

  async createSubscription(insert: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = {
      ...insert,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    const updated = { ...subscription, ...updates, updatedAt: new Date() } as Subscription;
    this.subscriptions.set(id, updated);
    return updated;
  }

  // DAO Verifier operations
  async createDaoVerifier(insert: InsertDaoVerifier): Promise<DaoVerifier> {
    const id = randomUUID();
    const verifier: DaoVerifier = {
      ...insert,
      id,
      status: "active",
      registeredAt: new Date(),
      deregisteredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.daoVerifiers.set(id, verifier);
    return verifier;
  }

  async getDaoVerifierByAddress(address: string): Promise<DaoVerifier | undefined> {
    return Array.from(this.daoVerifiers.values()).find(
      (v) => v.verifierAddress.toLowerCase() === address.toLowerCase()
    );
  }

  async getDaoVerifierByUser(userId: string): Promise<DaoVerifier | undefined> {
    return Array.from(this.daoVerifiers.values()).find(
      (v) => v.userId === userId && v.status === "active"
    );
  }

  async updateDaoVerifier(id: string, updates: Partial<DaoVerifier>): Promise<DaoVerifier | undefined> {
    const verifier = this.daoVerifiers.get(id);
    if (!verifier) return undefined;
    const updated = { ...verifier, ...updates, updatedAt: new Date() } as DaoVerifier;
    this.daoVerifiers.set(id, updated);
    return updated;
  }
}

import { db, waitForDatabase } from "./db";
import { PostgresStorage } from "./storage.postgres";

// Check if database is available and initialize storage accordingly
// We'll initialize storage properly when the server starts (via waitForStorageReady)
let storage: IStorage;

// Initialize storage (called from server startup)
export async function initializeStorage(): Promise<IStorage> {
  // Wait up to 5 seconds for database to initialize
  const dbReady = await waitForDatabase(5000);
  
  try {
    // Re-import db to get the latest value
    const { db: currentDb } = await import("./db");
    
    if (dbReady && currentDb) {
      logInfo("Using PostgreSQL storage", { context: "initializeStorage" });
      return new PostgresStorage(currentDb) as any;
    } else {
      logWarn("Using in-memory storage (no database connection)", { context: "initializeStorage" });
      return new MemStorage();
    }
  } catch (error: any) {
    logError(error, { context: "initializeStorage", message: "Error initializing storage" });
    logWarn("Falling back to in-memory storage", { context: "initializeStorage" });
    return new MemStorage();
  }
}

// Export function to wait for storage to be ready
export async function waitForStorageReady(timeoutMs = 5000): Promise<IStorage> {
  if (storage && storage.constructor.name === 'PostgresStorage') {
    return storage; // Already using PostgreSQL
  }
  // Re-initialize storage to check if database is now ready
  const newStorage = await initializeStorage();
  storage = newStorage;
  return storage;
}

// Initialize immediately with in-memory as fallback
storage = new MemStorage();

// Export storage (will be updated when database is ready)
export { storage };
