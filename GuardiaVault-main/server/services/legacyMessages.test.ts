/**
 * Legacy Messages Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { legacyMessagesService } from './legacyMessages';

// Mock database
vi.mock('../db', () => ({
  db: null, // Will be mocked per test
}));

describe('LegacyMessagesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should validate required fields', async () => {
      await expect(
        legacyMessagesService.createMessage({
          vaultId: '',
          type: 'video' as any,
          title: '',
          encrypted: true,
          status: 'draft' as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('getVideoUploadUrl', () => {
    it('should generate upload URL and file hash', async () => {
      const result = await legacyMessagesService.getVideoUploadUrl(
        'vault-123',
        'test-video.mp4',
        'video/mp4'
      );

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('fileHash');
      expect(result.fileHash.length).toBeGreaterThan(0);
    });
  });
});

