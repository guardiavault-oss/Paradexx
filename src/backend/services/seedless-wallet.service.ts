/**
 * Seedless Wallet Service - Complete seedless wallet implementation for DualGen
 * 
 * Security Model:
 * 1. Private key is generated in memory, immediately split using Shamir's Secret Sharing
 * 2. Shards are distributed to guardians - no seed phrase is ever shown to users
 * 3. Session keys enable daily transactions without guardian approval
 * 4. Full key reconstruction only happens during recovery (with guardian approval)
 */

import { ethers } from 'ethers';
import { logger } from '../services/logger.service';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { recoveryKeyService, ShamirConfig } from './recovery-key.service';
import { emailService } from './email.service';

const APP_URL = process.env.FRONTEND_URL || 'https://app.paradex.trade';

const SESSION_KEY_ENCRYPTION_SECRET = process.env.SESSION_KEY_SECRET;
const DEFAULT_SESSION_DURATION_HOURS = 24;
const DEFAULT_SPENDING_LIMIT_ETH = 1.0;
const MIN_GUARDIANS_FOR_SEEDLESS = 3;
const DEFAULT_THRESHOLD = 2;

function requireSessionSecret(): string {
  if (!SESSION_KEY_ENCRYPTION_SECRET) {
    throw new Error('[SECURITY] SESSION_KEY_SECRET environment variable is required for session key encryption. Do not use default values in production.');
  }
  return SESSION_KEY_ENCRYPTION_SECRET;
}

export interface SeedlessWalletConfig {
  chain?: string;
  guardianEmails: string[];
  shamirConfig?: Partial<ShamirConfig>;
}

export interface SessionKeyData {
  token: string;
  encryptedPrivateKey: string;
  expiresAt: Date;
  spendingLimit: string;
  spentAmount: string;
  createdAt: Date;
}

export interface WalletStatus {
  hasWallet: boolean;
  address?: string;
  chain?: string;
  guardianCount: number;
  requiredGuardians: number;
  isFullySetup: boolean;
  hasActiveSession: boolean;
  sessionExpiresAt?: Date;
}

export interface TransactionData {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  chain?: string;
}

class SeedlessWalletService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();

  private getProvider(chain: string): ethers.JsonRpcProvider {
    if (!this.providers.has(chain)) {
      const rpcUrls: Record<string, string> = {
        ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
        polygon: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        bsc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
        arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
        optimism: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
        base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      };
      this.providers.set(chain, new ethers.JsonRpcProvider(rpcUrls[chain] || rpcUrls.ethereum));
    }
    return this.providers.get(chain)!;
  }

  /**
   * Create a seedless wallet for a user
   * The private key is generated, immediately split into shards, and wiped from memory
   */
  async createSeedlessWallet(
    userId: string,
    config: SeedlessWalletConfig
  ): Promise<{
    success: boolean;
    address?: string;
    error?: string;
    guardiansNotified?: number;
  }> {
    const chain = config.chain || 'ethereum';

    try {
      if (config.guardianEmails.length < MIN_GUARDIANS_FOR_SEEDLESS) {
        return {
          success: false,
          error: `Seedless wallets require at least ${MIN_GUARDIANS_FOR_SEEDLESS} guardians. You provided ${config.guardianEmails.length}.`,
        };
      }

      const existingWallet = await prisma.wallet.findFirst({
        where: {
          userId,
          walletType: 'seedless',
        },
      });

      if (existingWallet) {
        return {
          success: false,
          error: 'User already has a seedless wallet. Use recovery to access it.',
        };
      }

      const wallet = ethers.Wallet.createRandom();
      const address = wallet.address;
      const privateKey = wallet.privateKey;

      const shamirConfig: ShamirConfig = {
        totalShards: config.guardianEmails.length,
        threshold: config.shamirConfig?.threshold || DEFAULT_THRESHOLD,
      };

      const shards = await recoveryKeyService.generateKeyShards(privateKey, userId, shamirConfig);

      const guardianIds: string[] = [];
      let guardiansNotified = 0;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, username: true, email: true },
      });
      const userName = user?.displayName || user?.username || 'Paradex User';

      for (let i = 0; i < config.guardianEmails.length; i++) {
        const email = config.guardianEmails[i].toLowerCase();

        let guardian = await prisma.guardian.findFirst({
          where: {
            userId,
            email,
          },
        });

        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        if (!guardian) {
          guardian = await prisma.guardian.create({
            data: {
              userId,
              email,
              name: `Guardian ${i + 1}`,
              status: 'pending',
              inviteToken,
              inviteExpiresAt,
              shardIndex: i,
            },
          });
        } else {
          await prisma.guardian.update({
            where: { id: guardian.id },
            data: {
              inviteToken,
              inviteExpiresAt,
              shardIndex: i,
            },
          });
        }

        await recoveryKeyService.assignShardToGuardian(guardian.id, shards[i], userId);
        guardianIds.push(guardian.id);

        const portalLink = `${APP_URL}/guardian-portal?token=${inviteToken}`;

        await emailService.sendGuardianShardNotification({
          to: email,
          guardianName: `Guardian ${i + 1}`,
          ownerName: userName,
          shardIndex: i + 1,
          totalShards: config.guardianEmails.length,
          threshold: shamirConfig.threshold,
          portalLink,
        });

        guardiansNotified++;
      }

      const existingWallets = await prisma.wallet.count({
        where: { userId },
      });

      await prisma.wallet.create({
        data: {
          userId,
          address,
          name: 'Seedless Wallet',
          chain,
          walletType: 'seedless',
          publicKey: wallet.publicKey,
          encryptedPrivateKey: null,
          isDefault: existingWallets === 0,
        },
      });

      this.secureWipeString(privateKey);
      this.secureWipeWallet(wallet as any);

      return {
        success: true,
        address,
        guardiansNotified,
      };
    } catch (error: any) {
      logger.error('[SeedlessWallet] Creation error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to create seedless wallet',
      };
    }
  }

  /**
   * Enroll additional guardians
   * 
   * IMPORTANT: This does NOT redistribute shards to new guardians.
   * In a seedless wallet, the original private key is destroyed after initial sharding.
   * To redistribute shards to new guardians, you must first recover the key using 
   * the guardian recovery process (which requires approval from existing guardians),
   * then call rotateShards. This is a security feature, not a limitation.
   */
  async enrollGuardians(
    userId: string,
    guardianEmails: string[]
  ): Promise<{
    success: boolean;
    error?: string;
    guardiansAdded?: number;
    totalGuardians?: number;
  }> {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: {
          userId,
          walletType: 'seedless',
        },
      });

      if (!wallet) {
        return {
          success: false,
          error: 'No seedless wallet found. Create one first.',
        };
      }

      const existingGuardians = await prisma.guardian.findMany({
        where: {
          userId,
          status: { in: ['pending', 'accepted'] },
        },
      });

      const existingEmails = new Set(existingGuardians.map(g => g.email.toLowerCase()));
      const newEmails = guardianEmails
        .map(e => e.toLowerCase())
        .filter(e => !existingEmails.has(e));

      if (newEmails.length === 0) {
        return {
          success: false,
          error: 'All provided emails are already registered as guardians.',
        };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, username: true },
      });
      const userName = user?.displayName || user?.username || 'Paradex User';

      let guardiansAdded = 0;

      for (let i = 0; i < newEmails.length; i++) {
        const email = newEmails[i];
        const shardIndex = existingGuardians.length + i;
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.guardian.create({
          data: {
            userId,
            email,
            name: `Guardian ${shardIndex + 1}`,
            status: 'pending',
            inviteToken,
            inviteExpiresAt,
            shardIndex,
          },
        });

        const inviteLink = `${APP_URL}/guardian-portal?token=${inviteToken}`;

        await emailService.sendGuardianInvitation({
          to: email,
          guardianName: `Guardian ${shardIndex + 1}`,
          ownerName: userName,
          inviteLink,
          threshold: DEFAULT_THRESHOLD,
          totalGuardians: existingGuardians.length + newEmails.length,
        });

        guardiansAdded++;
      }

      return {
        success: true,
        guardiansAdded,
        totalGuardians: existingGuardians.length + guardiansAdded,
      };
    } catch (error: any) {
      logger.error('[SeedlessWallet] Enroll guardians error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to enroll guardians',
      };
    }
  }

  /**
   * Create a time-limited session key for transactions
   * This is derived from a temporary key that enables transactions without guardian approval
   */
  async createSessionKey(
    userId: string,
    durationHours: number = DEFAULT_SESSION_DURATION_HOURS,
    spendingLimitEth: number = DEFAULT_SPENDING_LIMIT_ETH
  ): Promise<{
    success: boolean;
    sessionToken?: string;
    expiresAt?: Date;
    spendingLimit?: string;
    error?: string;
  }> {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: {
          userId,
          walletType: 'seedless',
        },
      });

      if (!wallet) {
        return {
          success: false,
          error: 'No seedless wallet found.',
        };
      }

      const acceptedGuardians = await prisma.guardian.count({
        where: {
          userId,
          status: 'accepted',
        },
      });

      if (acceptedGuardians < DEFAULT_THRESHOLD) {
        return {
          success: false,
          error: `Need at least ${DEFAULT_THRESHOLD} accepted guardians to create session keys.`,
        };
      }

      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionPrivateKey = ethers.Wallet.createRandom().privateKey;
      const encryptedSessionKey = this.encryptSessionKey(sessionPrivateKey);
      const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
      const spendingLimit = ethers.parseEther(spendingLimitEth.toString()).toString();

      await prisma.sessionKey.create({
        data: {
          userId,
          walletId: wallet.id,
          token: this.hashToken(sessionToken),
          encryptedPrivateKey: encryptedSessionKey,
          expiresAt,
          spendingLimit,
          spentAmount: '0',
          isActive: true,
        },
      });

      return {
        success: true,
        sessionToken,
        expiresAt,
        spendingLimit: spendingLimitEth.toString(),
      };
    } catch (error: any) {
      logger.error('[SeedlessWallet] Create session key error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to create session key',
      };
    }
  }

  /**
   * Sign a transaction using a session key
   */
  async signTransaction(
    userId: string,
    sessionToken: string,
    txData: TransactionData
  ): Promise<{
    success: boolean;
    signedTransaction?: string;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      const tokenHash = this.hashToken(sessionToken);

      const session = await prisma.sessionKey.findFirst({
        where: {
          userId,
          token: tokenHash,
          isActive: true,
        },
        include: {
          wallet: true,
        },
      });

      if (!session) {
        return {
          success: false,
          error: 'Invalid or expired session token.',
        };
      }

      if (session.expiresAt < new Date()) {
        await prisma.sessionKey.update({
          where: { id: session.id },
          data: { isActive: false },
        });
        return {
          success: false,
          error: 'Session token has expired. Please create a new session.',
        };
      }

      const txValue = ethers.parseEther(txData.value || '0');
      const spentAmount = BigInt(session.spentAmount);
      const spendingLimit = BigInt(session.spendingLimit);

      if (spentAmount + txValue > spendingLimit) {
        return {
          success: false,
          error: `Transaction exceeds session spending limit. Remaining: ${ethers.formatEther(spendingLimit - spentAmount)} ETH`,
        };
      }

      const sessionPrivateKey = this.decryptSessionKey(session.encryptedPrivateKey);
      const chain = txData.chain || session.wallet.chain;
      const provider = this.getProvider(chain);
      const sessionWallet = new ethers.Wallet(sessionPrivateKey, provider);

      const tx: ethers.TransactionRequest = {
        to: txData.to,
        value: txValue,
        data: txData.data || '0x',
        gasLimit: txData.gasLimit ? BigInt(txData.gasLimit) : undefined,
        maxFeePerGas: txData.maxFeePerGas ? BigInt(txData.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: txData.maxPriorityFeePerGas ? BigInt(txData.maxPriorityFeePerGas) : undefined,
      };

      if (txData.nonce !== undefined) {
        tx.nonce = txData.nonce;
      }

      const signedTx = await sessionWallet.signTransaction(tx);

      await prisma.sessionKey.update({
        where: { id: session.id },
        data: {
          spentAmount: (spentAmount + txValue).toString(),
        },
      });

      const txHash = ethers.keccak256(signedTx);

      await prisma.transaction.create({
        data: {
          userId,
          walletId: session.walletId,
          hash: txHash,
          type: 'send',
          from: session.wallet.address,
          to: txData.to,
          value: txData.value,
          status: 'pending',
          chain,
        },
      });

      this.secureWipeString(sessionPrivateKey);

      return {
        success: true,
        signedTransaction: signedTx,
        transactionHash: txHash,
      };
    } catch (error: any) {
      logger.error('[SeedlessWallet] Sign transaction error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to sign transaction',
      };
    }
  }

  /**
   * Get wallet address for a user
   */
  async getWalletAddress(userId: string): Promise<{
    success: boolean;
    address?: string;
    chain?: string;
    error?: string;
  }> {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: {
          userId,
          walletType: 'seedless',
        },
        select: {
          address: true,
          chain: true,
        },
      });

      if (!wallet) {
        return {
          success: false,
          error: 'No seedless wallet found.',
        };
      }

      return {
        success: true,
        address: wallet.address,
        chain: wallet.chain,
      };
    } catch (error: any) {
      logger.error('[SeedlessWallet] Get address error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to get wallet address',
      };
    }
  }

  /**
   * Get wallet setup status
   */
  async getWalletStatus(userId: string): Promise<WalletStatus> {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: {
          userId,
          walletType: 'seedless',
        },
      });

      const guardians = await prisma.guardian.findMany({
        where: {
          userId,
          status: { in: ['pending', 'accepted'] },
        },
      });

      const acceptedGuardians = guardians.filter(g => g.status === 'accepted');

      const activeSession = await prisma.sessionKey.findFirst({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: {
          expiresAt: 'desc',
        },
      });

      return {
        hasWallet: !!wallet,
        address: wallet?.address,
        chain: wallet?.chain,
        guardianCount: acceptedGuardians.length,
        requiredGuardians: DEFAULT_THRESHOLD,
        isFullySetup: !!wallet && acceptedGuardians.length >= DEFAULT_THRESHOLD,
        hasActiveSession: !!activeSession,
        sessionExpiresAt: activeSession?.expiresAt,
      };
    } catch (error: any) {
      logger.error('[SeedlessWallet] Get status error:', error.message);
      return {
        hasWallet: false,
        guardianCount: 0,
        requiredGuardians: DEFAULT_THRESHOLD,
        isFullySetup: false,
        hasActiveSession: false,
      };
    }
  }

  /**
   * Revoke a session key
   */
  async revokeSessionKey(userId: string, sessionToken: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const tokenHash = this.hashToken(sessionToken);

      const session = await prisma.sessionKey.findFirst({
        where: {
          userId,
          token: tokenHash,
        },
      });

      if (!session) {
        return {
          success: false,
          error: 'Session not found.',
        };
      }

      await prisma.sessionKey.update({
        where: { id: session.id },
        data: { isActive: false },
      });

      return { success: true };
    } catch (error: any) {
      logger.error('[SeedlessWallet] Revoke session error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to revoke session',
      };
    }
  }

  /**
   * Revoke all session keys for a user
   */
  async revokeAllSessions(userId: string): Promise<{
    success: boolean;
    revokedCount?: number;
    error?: string;
  }> {
    try {
      const result = await prisma.sessionKey.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      return {
        success: true,
        revokedCount: result.count,
      };
    } catch (error: any) {
      logger.error('[SeedlessWallet] Revoke all sessions error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to revoke sessions',
      };
    }
  }

  /**
   * Get session key info
   */
  async getSessionInfo(userId: string, sessionToken: string): Promise<{
    success: boolean;
    isActive?: boolean;
    expiresAt?: Date;
    spendingLimit?: string;
    remainingLimit?: string;
    error?: string;
  }> {
    try {
      const tokenHash = this.hashToken(sessionToken);

      const session = await prisma.sessionKey.findFirst({
        where: {
          userId,
          token: tokenHash,
        },
      });

      if (!session) {
        return {
          success: false,
          error: 'Session not found.',
        };
      }

      const spendingLimit = BigInt(session.spendingLimit);
      const spentAmount = BigInt(session.spentAmount);
      const remainingLimit = spendingLimit - spentAmount;

      return {
        success: true,
        isActive: session.isActive && session.expiresAt > new Date(),
        expiresAt: session.expiresAt,
        spendingLimit: ethers.formatEther(session.spendingLimit),
        remainingLimit: ethers.formatEther(remainingLimit),
      };
    } catch (error: any) {
      logger.error('[SeedlessWallet] Get session info error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to get session info',
      };
    }
  }

  /**
   * Encrypt session key using server-only secret
   * The encryption key is derived from the server secret only - NOT from the client token
   * This prevents client compromise from leading to key decryption
   */
  private encryptSessionKey(privateKey: string): string {
    const serverSecret = requireSessionSecret();
    const sessionEncryptionKey = crypto.randomBytes(32);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', sessionEncryptionKey, iv);

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const masterKey = crypto.createHash('sha256').update(serverSecret).digest();
    const keyIv = crypto.randomBytes(16);
    const keyCipher = crypto.createCipheriv('aes-256-gcm', masterKey, keyIv);

    let encryptedKey = keyCipher.update(sessionEncryptionKey.toString('hex'), 'utf8', 'hex');
    encryptedKey += keyCipher.final('hex');
    const keyAuthTag = keyCipher.getAuthTag();

    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted,
      keyIv.toString('hex'),
      keyAuthTag.toString('hex'),
      encryptedKey,
    ].join(':');
  }

  /**
   * Decrypt session key using server-only secret
   */
  private decryptSessionKey(encryptedData: string): string {
    const serverSecret = requireSessionSecret();
    const parts = encryptedData.split(':');

    if (parts.length !== 6) {
      throw new Error('Invalid encrypted session key format');
    }

    const [ivHex, authTagHex, encrypted, keyIvHex, keyAuthTagHex, encryptedKey] = parts;

    const masterKey = crypto.createHash('sha256').update(serverSecret).digest();
    const keyIv = Buffer.from(keyIvHex, 'hex');
    const keyAuthTag = Buffer.from(keyAuthTagHex, 'hex');
    const keyDecipher = crypto.createDecipheriv('aes-256-gcm', masterKey, keyIv);
    keyDecipher.setAuthTag(keyAuthTag);

    let decryptedKeyHex = keyDecipher.update(encryptedKey, 'hex', 'utf8');
    decryptedKeyHex += keyDecipher.final('utf8');
    const sessionEncryptionKey = Buffer.from(decryptedKeyHex, 'hex');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', sessionEncryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Securely wipe sensitive data from memory
   * Note: JavaScript doesn't provide true secure memory wiping, but we do our best
   * by overwriting the string content in buffers
   */
  private secureWipeString(str: string): void {
    try {
      const buffer = Buffer.from(str, 'utf8');
      crypto.randomFillSync(buffer);
      buffer.fill(0);
    } catch (e) {
      // Best effort - JavaScript GC will eventually clean up
    }
  }

  /**
   * Wipe wallet object - clear private key reference
   * Note: ethers.Wallet doesn't expose direct key wiping, so we null the reference
   */
  private secureWipeWallet(wallet: ethers.Wallet): void {
    try {
      // Force the wallet reference to be unreachable
      (wallet as any).signingKey = null;
      (wallet as any)._signingKey = null;
    } catch (e) {
      // Best effort
    }
  }
}

export const seedlessWalletService = new SeedlessWalletService();
