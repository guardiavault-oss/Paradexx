import { and, desc, eq, sql, inArray } from "./utils/drizzle-exports";
import type { DbType } from "./db";
import {
  users, vaults, parties, fragments, checkIns, notifications,
  vaultTriggerClaims, claimFiles, claimAttestations, recoveries, recoveryKeys,
  type InsertUser, type User, type InsertVault, type Vault,
  type InsertParty, type Party, type InsertFragment, type Fragment,
  type InsertCheckIn, type CheckIn, type InsertNotification, type Notification,
  type InsertVaultTriggerClaim, type VaultTriggerClaim, type InsertClaimFile, type ClaimFile,
  type InsertClaimAttestation, type ClaimAttestation,
  type Recovery, type InsertRecovery, type RecoveryKey, type InsertRecoveryKey,
  daoVerifiers,
  type DaoVerifier, type InsertDaoVerifier,
  subscriptions,
  type Subscription, type InsertSubscription,
  webauthnCredentials,
  type WebAuthnCredential, type InsertWebAuthnCredential,
  totpSecrets,
  type TotpSecret, type InsertTotpSecret,
} from "@shared/schema";

export class PostgresStorage {
  constructor(private db: DbType) {}

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      // Select only columns that definitely exist to avoid errors
      const [row] = await this.db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          walletAddress: users.walletAddress,
          walletConnectedAt: users.walletConnectedAt,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          // Include optional fields that might not exist (will be undefined if column doesn't exist)
          ssnHash: users.ssnHash,
          fullName: users.fullName,
          dateOfBirth: users.dateOfBirth,
          lastKnownLocation: users.lastKnownLocation,
          deathMonitoringEnabled: users.deathMonitoringEnabled,
          verificationTier: users.verificationTier,
          lastSsdiiCheck: users.lastSsdiiCheck,
          ssdiConsentGiven: users.ssdiConsentGiven,
          ssdiConsentDate: users.ssdiConsentDate,
          ssdiConsentIpAddress: users.ssdiConsentIpAddress,
          deathVerifiedAt: users.deathVerifiedAt,
          deathConfidenceScore: users.deathConfidenceScore,
          status: users.status,
          // TOTP fields - these might not exist, so we'll select them separately
          // totpSecret: users.totpSecret, // Don't select - might not exist
          // totpEnabled: users.totpEnabled, // Don't select - might not exist
          // backupCodes: users.backupCodes, // Don't select - might not exist
        })
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${normalizedEmail})`);
      
      // If row exists, try to get TOTP data separately (safely)
      if (row) {
        try {
          const totpData = await this.getTotpSecret(row.id);
          if (totpData) {
            // Add TOTP data to user object if totp_secrets table exists
            (row as any).totpEnabled = totpData.enabled;
            (row as any).totpSecret = totpData.secret;
          }
        } catch (error) {
          // totp_secrets table doesn't exist or other error - ignore
          // Try to get from users table if columns exist
          try {
            const [fullRow] = await this.db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${normalizedEmail})`);
            if (fullRow) {
              const fullRowAny = fullRow as any;
              if (fullRowAny.totpEnabled !== undefined) {
                (row as any).totpEnabled = fullRowAny.totpEnabled;
                (row as any).totpSecret = fullRowAny.totpSecret;
                (row as any).backupCodes = fullRowAny.backupCodes;
              }
            }
          } catch (selectError) {
            // Columns don't exist - that's fine, TOTP isn't enabled
          }
        }
      }
      
      return row;
    } catch (error: any) {
      // If there's an error selecting (e.g., column doesn't exist), try a simpler select
      if (error?.code === '42703' || error?.message?.includes('does not exist')) {
        // Fallback: select all columns and let Drizzle handle it
        const [row] = await this.db.select().from(users).where(eq(users.email, email));
        return row;
      }
      throw error;
    }
  }
  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return row;
  }
  async createUser(u: InsertUser): Promise<User> {
    try {
      // Only include fields that are actually in InsertUser schema
      // Explicitly exclude TOTP fields to avoid database errors if columns don't exist yet
      const userData: any = {
        email: u.email,
        password: u.password,
      };
      
      // Add optional fields if they exist (but NOT TOTP fields - they don't exist in DB yet)
      if (u.walletAddress) userData.walletAddress = u.walletAddress;
      if (u.fullName) userData.fullName = u.fullName;
      if (u.dateOfBirth) userData.dateOfBirth = u.dateOfBirth;
      if (u.ssnHash) userData.ssnHash = u.ssnHash;
      if (u.lastKnownLocation) userData.lastKnownLocation = u.lastKnownLocation;
      if (u.deathMonitoringEnabled !== undefined) userData.deathMonitoringEnabled = u.deathMonitoringEnabled;
      
      // DO NOT include TOTP fields (totpSecret, totpEnabled, backupCodes)
      // These columns may not exist in the database yet until migration runs
      // They will be added when user enables 2FA via the separate totp_secrets table
      
      const [row] = await this.db.insert(users).values(userData).returning();
      if (!row) {
        throw new Error("Failed to create user - no row returned");
      }
      return row;
    } catch (error: any) {
      console.error("PostgresStorage.createUser error:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        constraint: error?.constraint,
        table: error?.table,
        schema: error?.schema,
        stack: error?.stack,
      });
      console.error("User data:", { email: u.email, hasPassword: !!u.password });
      
      // Ensure error has a message
      if (!error.message) {
        error.message = `Database error: ${error.code || error.detail || 'Unknown error occurred'}`;
      }
      throw error;
    }
  }
  async linkWalletToUser(userId: string, walletAddress: string): Promise<User | undefined> {
    const [row] = await this.db.update(users).set({ walletAddress, walletConnectedAt: new Date() } as any).where(eq(users.id, userId)).returning();
    return row;
  }
  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    // Filter out TOTP fields that might not exist in users table
    const safeUpdates: any = { ...updates };
    // Only include TOTP fields if they exist in the schema
    // For now, we'll try to update but catch errors if columns don't exist
    const [row] = await this.db.update(users).set(safeUpdates).where(eq(users.id, userId)).returning();
    return row;
  }
  
  // TOTP operations - use totp_secrets table
  async getTotpSecret(userId: string): Promise<TotpSecret | undefined> {
    try {
      const [row] = await this.db.select().from(totpSecrets).where(eq(totpSecrets.userId, userId));
      return row;
    } catch (error: any) {
      // If totp_secrets table doesn't exist, return undefined
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        return undefined;
      }
      throw error;
    }
  }

  async createTotpSecret(secret: InsertTotpSecret): Promise<TotpSecret> {
    try {
      const [row] = await this.db.insert(totpSecrets).values(secret).returning();
      if (!row) {
        throw new Error("Failed to create TOTP secret");
      }
      return row;
    } catch (error: any) {
      // If totp_secrets table doesn't exist, throw a helpful error
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        throw new Error("TOTP secrets table does not exist. Please run migration 009_add_totp_columns.sql");
      }
      throw error;
    }
  }

  async updateTotpSecret(userId: string, updates: Partial<TotpSecret>): Promise<TotpSecret | undefined> {
    try {
      const [row] = await this.db.update(totpSecrets).set(updates).where(eq(totpSecrets.userId, userId)).returning();
      return row;
    } catch (error: any) {
      // If totp_secrets table doesn't exist, return undefined
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        return undefined;
      }
      throw error;
    }
  }

  async deleteTotpSecret(userId: string): Promise<boolean> {
    try {
      await this.db.delete(totpSecrets).where(eq(totpSecrets.userId, userId));
      return true;
    } catch (error: any) {
      // If totp_secrets table doesn't exist, return false
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        return false;
      }
      throw error;
    }
  }

  // WebAuthn operations
  async getWebAuthnCredentials(userId: string): Promise<WebAuthnCredential[]> {
    try {
      return await this.db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, userId));
    } catch (error: any) {
      // If webauthn_credentials table doesn't exist, return empty array
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  async getWebAuthnCredentialByCredentialId(credentialId: string): Promise<WebAuthnCredential | undefined> {
    try {
      const [row] = await this.db.select().from(webauthnCredentials).where(eq(webauthnCredentials.credentialId, credentialId));
      return row;
    } catch (error: any) {
      // If webauthn_credentials table doesn't exist, return undefined
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        return undefined;
      }
      throw error;
    }
  }

  async createWebAuthnCredential(credential: InsertWebAuthnCredential): Promise<WebAuthnCredential> {
    try {
      const [row] = await this.db.insert(webauthnCredentials).values(credential).returning();
      if (!row) {
        throw new Error("Failed to create WebAuthn credential");
      }
      return row;
    } catch (error: any) {
      // If webauthn_credentials table doesn't exist, throw a helpful error
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        throw new Error("WebAuthn credentials table does not exist. Please run the appropriate migration.");
      }
      throw error;
    }
  }

  async updateWebAuthnCredential(id: string, updates: Partial<WebAuthnCredential>): Promise<WebAuthnCredential | undefined> {
    try {
      const [row] = await this.db.update(webauthnCredentials).set(updates).where(eq(webauthnCredentials.id, id)).returning();
      return row;
    } catch (error: any) {
      // If webauthn_credentials table doesn't exist, return undefined
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        return undefined;
      }
      throw error;
    }
  }

  async deleteWebAuthnCredential(credentialId: string): Promise<boolean> {
    try {
      await this.db.delete(webauthnCredentials).where(eq(webauthnCredentials.credentialId, credentialId));
      return true;
    } catch (error: any) {
      // If webauthn_credentials table doesn't exist, return false
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        return false;
      }
      throw error;
    }
  }

  // Vaults
  async getVault(id: string): Promise<Vault | undefined> {
    const [row] = await this.db.select().from(vaults).where(eq(vaults.id, id));
    return row;
  }
  async getVaultsByOwner(ownerId: string): Promise<Vault[]> {
    return await this.db.select().from(vaults).where(eq(vaults.ownerId, ownerId));
  }
  
  /**
   * Get vaults with guardians in a single query (optimized - no N+1)
   * Returns vaults with their guardians as a nested array
   */
  async getVaultsWithGuardians(ownerId: string): Promise<Array<Vault & { guardians: Party[] }>> {
    const startTime = Date.now();
    
    // Use LEFT JOIN to get vaults with their guardians in one query
    const results = await this.db
      .select({
        vault: vaults,
        party: parties,
      })
      .from(vaults)
      .leftJoin(parties, and(
        eq(parties.vaultId, vaults.id),
        eq(parties.role, "guardian" as any)
      ))
      .where(eq(vaults.ownerId, ownerId));
    
    const queryTime = Date.now() - startTime;
    console.log(`📊 [Query] getVaultsWithGuardians: ${queryTime}ms, ${results.length} rows`);
    
    // Group parties by vault
    const vaultMap = new Map<string, Vault & { guardians: Party[] }>();
    
    for (const row of results) {
      const vaultId = row.vault.id;
      
      if (!vaultMap.has(vaultId)) {
        vaultMap.set(vaultId, {
          ...row.vault,
          guardians: [],
        });
      }
      
      if (row.party) {
        vaultMap.get(vaultId)!.guardians.push(row.party);
      }
    }
    
    return Array.from(vaultMap.values());
  }
  
  /**
   * Get guardians with their vault details in a single query (optimized - no N+1)
   * Returns guardians with their vault information
   */
  async getGuardiansWithVaults(userId?: string): Promise<Array<Party & { vault: Vault }>> {
    const startTime = Date.now();
    
    // Use LEFT JOIN to get guardians with their vaults in one query
    let query = this.db
      .select({
        party: parties,
        vault: vaults,
      })
      .from(parties)
      .leftJoin(vaults, eq(vaults.id, parties.vaultId));
    
    // Build where conditions
    const conditions = [eq(parties.role, "guardian" as any)];
    if (userId) {
      conditions.push(eq(vaults.ownerId, userId));
    }
    
    query = query.where(and(...conditions)) as any;
    
    const results = await query;
    const queryTime = Date.now() - startTime;
    console.log(`📊 [Query] getGuardiansWithVaults: ${queryTime}ms, ${results.length} rows`);
    
    // Filter out rows where vault is null (shouldn't happen due to foreign key, but be safe)
    return results
      .filter((row: { party: Party; vault: Vault | null }): row is { party: Party; vault: Vault } => row.vault !== null)
      .map((row: { party: Party; vault: Vault }) => ({
        ...row.party,
        vault: row.vault,
      }));
  }
  async createVault(v: InsertVault): Promise<Vault> {
    const [row] = await this.db.insert(vaults).values(v as any).returning();
    return row!;
  }
  async updateVault(id: string, updates: Partial<Vault>): Promise<Vault | undefined> {
    const [row] = await this.db.update(vaults).set(updates as any).where(eq(vaults.id, id)).returning();
    return row;
  }
  async deleteVault(id: string): Promise<boolean> {
    await this.db.delete(vaults).where(eq(vaults.id, id));
    return true;
  }

  // Parties
  async getParty(id: string): Promise<Party | undefined> {
    const [row] = await this.db.select().from(parties).where(eq(parties.id, id));
    return row;
  }
  async getPartiesByVault(vaultId: string): Promise<Party[]> {
    const startTime = Date.now();
    const result = await this.db.select().from(parties).where(eq(parties.vaultId, vaultId));
    const queryTime = Date.now() - startTime;
    if (queryTime > 100) {
      console.log(`⚠️  [Slow Query] getPartiesByVault: ${queryTime}ms for vault ${vaultId}`);
    }
    return result;
  }
  async getPartiesByRole(vaultId: string, role: string): Promise<Party[]> {
    const startTime = Date.now();
    const result = await this.db.select().from(parties).where(and(eq(parties.vaultId, vaultId), eq(parties.role, role as any)));
    const queryTime = Date.now() - startTime;
    if (queryTime > 100) {
      console.log(`⚠️  [Slow Query] getPartiesByRole: ${queryTime}ms for vault ${vaultId}, role ${role}`);
    }
    return result;
  }
  
  /**
   * Get parties for multiple vaults in a single query (optimized - no N+1)
   * Returns a map of vaultId -> parties[]
   */
  async getPartiesByVaults(vaultIds: string[]): Promise<Map<string, Party[]>> {
    if (vaultIds.length === 0) {
      return new Map();
    }
    
    const startTime = Date.now();
    // Use inArray for efficient batch querying
    const results = await this.db
      .select()
      .from(parties)
      .where(inArray(parties.vaultId, vaultIds));
    
    const queryTime = Date.now() - startTime;
    console.log(`📊 [Query] getPartiesByVaults: ${queryTime}ms for ${vaultIds.length} vaults, ${results.length} parties`);
    
    // Group by vaultId
    const partiesMap = new Map<string, Party[]>();
    for (const party of results) {
      if (!partiesMap.has(party.vaultId)) {
        partiesMap.set(party.vaultId, []);
      }
      partiesMap.get(party.vaultId)!.push(party);
    }
    
    return partiesMap;
  }
  
  /**
   * Get claim attestations for multiple claims in a single query (optimized - no N+1)
   */
  async getAttestationsByClaims(claimIds: string[]): Promise<Map<string, ClaimAttestation[]>> {
    if (claimIds.length === 0) {
      return new Map();
    }
    
    const startTime = Date.now();
    // Use inArray for efficient batch querying
    const results = await this.db
      .select()
      .from(claimAttestations)
      .where(inArray(claimAttestations.claimId, claimIds));
    
    const queryTime = Date.now() - startTime;
    console.log(`📊 [Query] getAttestationsByClaims: ${queryTime}ms for ${claimIds.length} claims, ${results.length} attestations`);
    
    // Group by claimId
    const attestationsMap = new Map<string, ClaimAttestation[]>();
    for (const att of results) {
      if (!attestationsMap.has(att.claimId)) {
        attestationsMap.set(att.claimId, []);
      }
      attestationsMap.get(att.claimId)!.push(att);
    }
    
    return attestationsMap;
  }
  async createParty(p: InsertParty): Promise<Party> {
    const [row] = await this.db.insert(parties).values(p as any).returning();
    return row!;
  }
  async updateParty(id: string, updates: Partial<Party>): Promise<Party | undefined> {
    const [row] = await this.db.update(parties).set(updates as any).where(eq(parties.id, id)).returning();
    return row;
  }
  async deleteParty(id: string): Promise<boolean> {
    await this.db.delete(parties).where(eq(parties.id, id));
    return true;
  }

  // Fragments
  async getFragment(id: string): Promise<Fragment | undefined> {
    const [row] = await this.db.select().from(fragments).where(eq(fragments.id, id));
    return row;
  }
  async getFragmentsByVault(vaultId: string): Promise<Fragment[]> {
    return await this.db.select().from(fragments).where(eq(fragments.vaultId, vaultId));
  }
  async getFragmentByGuardian(guardianId: string): Promise<Fragment | undefined> {
    const [row] = await this.db.select().from(fragments).where(eq(fragments.guardianId, guardianId));
    return row;
  }
  async createFragment(f: InsertFragment): Promise<Fragment> {
    const [row] = await this.db.insert(fragments).values(f as any).returning();
    return row!;
  }
  async deleteFragmentsByVault(vaultId: string): Promise<boolean> {
    await this.db.delete(fragments).where(eq(fragments.vaultId, vaultId));
    return true;
  }

  // Check-ins
  async getCheckIn(id: string): Promise<CheckIn | undefined> {
    const [row] = await this.db.select().from(checkIns).where(eq(checkIns.id, id));
    return row;
  }
  async getCheckInsByVault(vaultId: string): Promise<CheckIn[]> {
    return await this.db.select().from(checkIns).where(eq(checkIns.vaultId, vaultId)).orderBy(desc(checkIns.checkedInAt));
  }
  async getLatestCheckIn(vaultId: string): Promise<CheckIn | undefined> {
    const [row] = await this.db.select().from(checkIns).where(eq(checkIns.vaultId, vaultId)).orderBy(desc(checkIns.checkedInAt)).limit(1);
    return row;
  }
  async createCheckIn(c: InsertCheckIn): Promise<CheckIn> {
    const [row] = await this.db.insert(checkIns).values(c as any).returning();
    return row!;
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    const [row] = await this.db.select().from(notifications).where(eq(notifications.id, id));
    return row;
  }
  async getPendingNotifications(): Promise<Notification[]> {
    return await this.db.select().from(notifications).where(eq(notifications.status, "pending" as any));
  }
  async createNotification(n: InsertNotification): Promise<Notification> {
    const [row] = await this.db.insert(notifications).values(n as any).returning();
    return row!;
  }
  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification | undefined> {
    const [row] = await this.db.update(notifications).set(updates as any).where(eq(notifications.id, id)).returning();
    return row;
  }

  // Vault trigger claims (inactivity attestation)
  async createVaultTriggerClaim(c: InsertVaultTriggerClaim): Promise<VaultTriggerClaim> {
    const [row] = await this.db.insert(vaultTriggerClaims).values(c as any).returning();
    return row!;
  }
  async getVaultTriggerClaim(id: string): Promise<VaultTriggerClaim | undefined> {
    const [row] = await this.db.select().from(vaultTriggerClaims).where(eq(vaultTriggerClaims.id, id));
    return row;
  }
  async listVaultTriggerClaimsByVault(vaultId: string): Promise<VaultTriggerClaim[]> {
    return await this.db.select().from(vaultTriggerClaims).where(eq(vaultTriggerClaims.vaultId, vaultId));
  }
  async updateVaultTriggerClaim(id: string, updates: Partial<VaultTriggerClaim>): Promise<VaultTriggerClaim | undefined> {
    const [row] = await this.db.update(vaultTriggerClaims).set(updates as any).where(eq(vaultTriggerClaims.id, id)).returning();
    return row;
  }
  async addClaimFile(f: InsertClaimFile): Promise<ClaimFile> {
    const [row] = await this.db.insert(claimFiles).values(f as any).returning();
    return row!;
  }
  async listClaimFiles(claimId: string): Promise<ClaimFile[]> {
    return await this.db.select().from(claimFiles).where(eq(claimFiles.claimId, claimId));
  }
  async upsertClaimAttestation(a: InsertClaimAttestation & { decision?: "approve" | "reject" | "pending" }): Promise<ClaimAttestation> {
    const existing = await this.db.select().from(claimAttestations).where(and(eq(claimAttestations.claimId, a.claimId), eq(claimAttestations.partyId, a.partyId)));
    if (existing[0]) {
      const [row] = await this.db.update(claimAttestations).set({ decision: (a as any).decision ?? existing[0].decision, updatedAt: new Date() } as any).where(eq(claimAttestations.id, existing[0].id)).returning();
      return row!;
    }
    const [row] = await this.db.insert(claimAttestations).values({ ...a, decision: (a as any).decision ?? "pending" } as any).returning();
    return row!;
  }
  async listClaimAttestations(claimId: string): Promise<ClaimAttestation[]> {
    return await this.db.select().from(claimAttestations).where(eq(claimAttestations.claimId, claimId));
  }

  // Recovery operations
  async createRecovery(r: InsertRecovery): Promise<Recovery> {
    const [row] = await this.db.insert(recoveries).values(r as any).returning();
    return row!;
  }
  async getRecovery(id: string): Promise<Recovery | undefined> {
    const [row] = await this.db.select().from(recoveries).where(eq(recoveries.id, id));
    return row;
  }
  async getRecoveriesByUser(userId: string): Promise<Recovery[]> {
    return await this.db.select().from(recoveries).where(eq(recoveries.userId, userId));
  }
  async updateRecovery(id: string, updates: Partial<Recovery>): Promise<Recovery | undefined> {
    const [row] = await this.db.update(recoveries).set({ ...updates, updatedAt: new Date() } as any).where(eq(recoveries.id, id)).returning();
    return row;
  }

  // Recovery key operations
  async createRecoveryKey(k: InsertRecoveryKey): Promise<RecoveryKey> {
    const [row] = await this.db.insert(recoveryKeys).values(k as any).returning();
    return row!;
  }
  async getRecoveryKey(id: string): Promise<RecoveryKey | undefined> {
    const [row] = await this.db.select().from(recoveryKeys).where(eq(recoveryKeys.id, id));
    return row;
  }
  async getRecoveryKeyByToken(token: string): Promise<RecoveryKey | undefined> {
    const [row] = await this.db.select().from(recoveryKeys).where(eq(recoveryKeys.inviteToken, token));
    return row;
  }

  async getRecoveryByToken(token: string): Promise<Recovery | undefined> {
    const key = await this.getRecoveryKeyByToken(token);
    if (!key) return undefined;
    return this.getRecovery(key.recoveryId);
  }
  async getRecoveryKeysByRecovery(recoveryId: string): Promise<RecoveryKey[]> {
    return await this.db.select().from(recoveryKeys).where(eq(recoveryKeys.recoveryId, recoveryId));
  }
  async updateRecoveryKey(id: string, updates: Partial<RecoveryKey>): Promise<RecoveryKey | undefined> {
    const [row] = await this.db.update(recoveryKeys).set(updates as any).where(eq(recoveryKeys.id, id)).returning();
    return row;
  }

  // DAO Verifier operations
  async createDaoVerifier(v: InsertDaoVerifier): Promise<DaoVerifier> {
    const [row] = await this.db.insert(daoVerifiers).values({ ...v, registeredAt: new Date() } as any).returning();
    return row!;
  }
  async getDaoVerifierByAddress(address: string): Promise<DaoVerifier | undefined> {
    const [row] = await this.db.select().from(daoVerifiers).where(eq(daoVerifiers.verifierAddress, address));
    return row;
  }
  async getDaoVerifierByUser(userId: string): Promise<DaoVerifier | undefined> {
    const [row] = await this.db.select().from(daoVerifiers).where(and(eq(daoVerifiers.userId, userId), eq(daoVerifiers.status, "active")));
    return row;
  }
  async updateDaoVerifier(id: string, updates: Partial<DaoVerifier>): Promise<DaoVerifier | undefined> {
    const [row] = await this.db.update(daoVerifiers).set({ ...updates, updatedAt: new Date() } as any).where(eq(daoVerifiers.id, id)).returning();
    return row;
  }

  // Subscription operations
  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const [row] = await this.db.select().from(subscriptions).where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    );
    return row;
  }

  async createSubscription(s: InsertSubscription): Promise<Subscription> {
    const [row] = await this.db.insert(subscriptions).values(s as any).returning();
    return row!;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [row] = await this.db.update(subscriptions).set({ ...updates, updatedAt: new Date() } as any).where(eq(subscriptions.id, id)).returning();
    return row;
  }
}


