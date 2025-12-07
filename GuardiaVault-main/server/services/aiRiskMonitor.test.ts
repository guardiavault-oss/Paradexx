/**
 * AI Risk Monitor Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiRiskMonitor } from './aiRiskMonitor';
import type { LoginPattern } from './aiRiskMonitor';

describe('AIRiskMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeLoginPattern', () => {
    it('should detect new IP address', () => {
      const currentLogin: LoginPattern = {
        ipAddress: '192.168.1.100',
        timestamp: new Date(),
        success: false,
      };

      const recentLogins: LoginPattern[] = [
        { ipAddress: '192.168.1.50', timestamp: new Date(Date.now() - 86400000), success: true },
      ];

      const result = aiRiskMonitor.analyzeLoginPattern('user1', currentLogin, recentLogins);

      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons).toContain('Login from new IP address');
      expect(result.severity).toMatch(/low|medium|high|critical/);
    });

    it('should detect new user agent', () => {
      const currentLogin: LoginPattern = {
        userAgent: 'Mozilla/5.0 (New Browser)',
        timestamp: new Date(),
        success: false,
      };

      const recentLogins: LoginPattern[] = [
        { userAgent: 'Mozilla/5.0 (Old Browser)', timestamp: new Date(Date.now() - 86400000), success: true },
      ];

      const result = aiRiskMonitor.analyzeLoginPattern('user1', currentLogin, recentLogins);

      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons.some(r => r.includes('new device') || r.includes('browser'))).toBe(true);
    });

    it('should detect multiple failed authentication attempts', () => {
      const currentLogin: LoginPattern = {
        timestamp: new Date(),
        success: false,
      };

      const recentLogins: LoginPattern[] = [
        { timestamp: new Date(Date.now() - 60000), success: false },
        { timestamp: new Date(Date.now() - 120000), success: false },
        { timestamp: new Date(Date.now() - 180000), success: false },
      ];

      const result = aiRiskMonitor.analyzeLoginPattern('user1', currentLogin, recentLogins);

      expect(result.score).toBeGreaterThanOrEqual(0.4);
      expect(result.severity).toMatch(/high|critical/);
      expect(result.reasons.some(r => r.includes('failed authentication'))).toBe(true);
    });

    it('should detect rapid successive logins', () => {
      const now = Date.now();
      const currentLogin: LoginPattern = {
        timestamp: new Date(now),
        success: true,
      };

      const recentLogins: LoginPattern[] = [
        { timestamp: new Date(now - 60000), success: true },
        { timestamp: new Date(now - 120000), success: true },
        { timestamp: new Date(now - 180000), success: true },
      ];

      const result = aiRiskMonitor.analyzeLoginPattern('user1', currentLogin, recentLogins);

      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons.some(r => r.includes('rapid'))).toBe(true);
    });

    it('should return low risk for normal login pattern', () => {
      const now = Date.now();
      const currentLogin: LoginPattern = {
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(now),
        success: true,
      };

      const recentLogins: LoginPattern[] = [
        { ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0', timestamp: new Date(now - 86400000), success: true },
      ];

      const result = aiRiskMonitor.analyzeLoginPattern('user1', currentLogin, recentLogins);

      expect(result.score).toBeLessThan(0.5);
      expect(result.severity).toMatch(/low|medium/);
    });
  });

  describe('detectUnusualActivity', () => {
    it('should detect unusual action frequency', () => {
      const currentActivity = {
        action: 'transfer',
        timestamp: new Date(),
      };

      const recentActivities = Array(20).fill(null).map(() => ({
        action: 'view',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
      }));

      const result = aiRiskMonitor.detectUnusualActivity('user1', currentActivity, recentActivities);

      expect(result.score).toBeGreaterThan(0);
      expect(result.severity).toMatch(/low|medium|high|critical/);
    });

    it('should return low risk for normal activity', () => {
      const currentActivity = {
        action: 'view',
        timestamp: new Date(),
      };

      const recentActivities = Array(10).fill(null).map(() => ({
        action: 'view',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
      }));

      const result = aiRiskMonitor.detectUnusualActivity('user1', currentActivity, recentActivities);

      expect(result.score).toBeLessThan(0.5);
    });
  });
});

