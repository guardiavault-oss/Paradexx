// Recovery Key Service - Proper Shamir's Secret Sharing for Guardian Recovery
// Uses audited shamir-secret-sharing library by Privy (Cure53 & Zellic audited)

import crypto from 'crypto';
import { split, combine } from 'shamir-secret-sharing';
import { prisma } from '../config/database';

export interface KeyShard {
  shardIndex: number;
  encryptedShard: string;
  shardHash: string;
}

export interface ShamirConfig {
  totalShards: number;
  threshold: number;
}

export class RecoveryKeyService {
  private readonly DEFAULT_SHARD_COUNT = 3;
  private readonly DEFAULT_THRESHOLD = 2;

  async generateKeyShards(
    walletPrivateKey: string,
    userId: string,
    config?: Partial<ShamirConfig>
  ): Promise<KeyShard[]> {
    const totalShards = config?.totalShards || this.DEFAULT_SHARD_COUNT;
    const threshold = config?.threshold || this.DEFAULT_THRESHOLD;

    if (threshold > totalShards) {
      throw new Error('Threshold cannot exceed total number of shards');
    }
    if (threshold < 2) {
      throw new Error('Threshold must be at least 2 for security');
    }

    const secretBytes = new TextEncoder().encode(walletPrivateKey);
    const rawShards = await split(secretBytes, totalShards, threshold);

    const shards: KeyShard[] = [];

    for (let i = 0; i < rawShards.length; i++) {
      const shardKey = this.getShardEncryptionKey(userId, i);
      const shardData = Buffer.from(rawShards[i]).toString('base64');
      const encryptedShard = this.encrypt(shardData, shardKey);
      const shardHash = crypto.createHash('sha256').update(encryptedShard).digest('hex');

      shards.push({
        shardIndex: i,
        encryptedShard,
        shardHash,
      });
    }

    return shards;
  }

  async assignShardToGuardian(
    guardianId: string,
    shard: KeyShard,
    userId: string
  ): Promise<void> {
    await prisma.guardian.update({
      where: { id: guardianId },
      data: {
        recoveryKeyShard: shard.encryptedShard,
        shardHash: shard.shardHash,
        shardIndex: shard.shardIndex,
      },
    });
  }

  async recoverKeyFromShards(shards: KeyShard[], userId: string): Promise<string> {
    if (shards.length < this.DEFAULT_THRESHOLD) {
      throw new Error(`Need at least ${this.DEFAULT_THRESHOLD} shards to recover key`);
    }

    const rawShards: Uint8Array[] = [];

    for (const shard of shards) {
      const computedHash = crypto.createHash('sha256').update(shard.encryptedShard).digest('hex');
      if (computedHash !== shard.shardHash) {
        throw new Error(`Shard ${shard.shardIndex} verification failed - integrity compromised`);
      }

      const shardKey = this.getShardEncryptionKey(userId, shard.shardIndex);
      const decryptedShardData = this.decrypt(shard.encryptedShard, shardKey);
      const shardBytes = new Uint8Array(Buffer.from(decryptedShardData, 'base64'));
      rawShards.push(shardBytes);
    }

    const recoveredBytes = await combine(rawShards);
    const privateKey = new TextDecoder().decode(recoveredBytes);

    return privateKey;
  }

  async getGuardianShards(userId: string, guardianIds: string[]): Promise<KeyShard[]> {
    const guardians = await prisma.guardian.findMany({
      where: {
        id: { in: guardianIds },
        userId,
        status: 'accepted',
        recoveryKeyShard: { not: null },
      },
      select: {
        id: true,
        shardIndex: true,
        recoveryKeyShard: true,
        shardHash: true,
      },
    });

    return guardians
      .filter(g => g.recoveryKeyShard && g.shardHash && g.shardIndex !== null)
      .map(g => ({
        shardIndex: g.shardIndex!,
        encryptedShard: g.recoveryKeyShard!,
        shardHash: g.shardHash!,
      }));
  }

  async verifyShard(guardianId: string): Promise<boolean> {
    const guardian = await prisma.guardian.findUnique({
      where: { id: guardianId },
      select: {
        recoveryKeyShard: true,
        shardHash: true,
      },
    });

    if (!guardian || !guardian.recoveryKeyShard || !guardian.shardHash) {
      return false;
    }

    const computedHash = crypto
      .createHash('sha256')
      .update(guardian.recoveryKeyShard)
      .digest('hex');

    return computedHash === guardian.shardHash;
  }

  async rotateShards(
    walletPrivateKey: string,
    userId: string,
    guardianIds: string[]
  ): Promise<void> {
    const shards = await this.generateKeyShards(walletPrivateKey, userId, {
      totalShards: guardianIds.length,
      threshold: Math.min(2, guardianIds.length),
    });

    for (let i = 0; i < guardianIds.length; i++) {
      await this.assignShardToGuardian(guardianIds[i], shards[i], userId);
    }
  }

  private encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedData: string, key: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private getShardEncryptionKey(userId: string, shardIndex: number): string {
    const secret = process.env.SHARD_ENCRYPTION_SECRET || 'default-shard-secret-change-in-production';
    return crypto.createHash('sha256').update(`${secret}:${userId}:${shardIndex}`).digest('hex').substring(0, 64);
  }
}

export const recoveryKeyService = new RecoveryKeyService();
