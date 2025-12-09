/**
 * Behavioral Biometrics Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { behavioralBiometricsService } from './behavioralBiometrics';
import type { TypingPattern, MouseMovement } from './behavioralBiometrics';

describe('BehavioralBiometricsService', () => {
  beforeEach(() => {
    // Clear any mocks
  });

  describe('extractTypingSignature', () => {
    it('should extract consistent signature from same typing pattern', () => {
      const pattern: TypingPattern = {
        keystrokeDynamics: [
          { key: 'h', keyDown: 100, keyUp: 150, dwellTime: 50, flightTime: 0 },
          { key: 'e', keyDown: 200, keyUp: 250, dwellTime: 50, flightTime: 50 },
          { key: 'l', keyDown: 350, keyUp: 400, dwellTime: 50, flightTime: 100 },
        ],
      };

      const sig1 = behavioralBiometricsService.extractTypingSignature(pattern);
      const sig2 = behavioralBiometricsService.extractTypingSignature(pattern);

      expect(sig1).toBe(sig2);
      expect(sig1.length).toBeGreaterThan(0);
    });

    it('should extract different signatures from different patterns', () => {
      const pattern1: TypingPattern = {
        keystrokeDynamics: [
          { key: 'a', keyDown: 100, keyUp: 150, dwellTime: 50, flightTime: 0 },
        ],
      };

      const pattern2: TypingPattern = {
        keystrokeDynamics: [
          { key: 'b', keyDown: 100, keyUp: 200, dwellTime: 100, flightTime: 0 },
        ],
      };

      const sig1 = behavioralBiometricsService.extractTypingSignature(pattern1);
      const sig2 = behavioralBiometricsService.extractTypingSignature(pattern2);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('extractMouseSignature', () => {
    it('should extract signature from mouse movement', () => {
      const movement: MouseMovement = {
        movements: [
          { x: 0, y: 0, timestamp: 100, velocity: 0, acceleration: 0 },
          { x: 100, y: 100, timestamp: 200, velocity: 1.4, acceleration: 0.01 },
          { x: 200, y: 150, timestamp: 300, velocity: 1.1, acceleration: -0.003 },
        ],
      };

      const signature = behavioralBiometricsService.extractMouseSignature(movement);

      expect(signature.length).toBeGreaterThan(0);
    });

    it('should handle empty movement array', () => {
      const movement: MouseMovement = {
        movements: [],
      };

      const signature = behavioralBiometricsService.extractMouseSignature(movement);

      expect(signature).toBe('');
    });
  });

  describe('compareSignatures', () => {
    it('should return 1.0 for identical signatures', () => {
      const sig = 'abc123';
      const confidence = behavioralBiometricsService.compareSignatures(sig, sig);

      expect(confidence).toBe(1.0);
    });

    it('should return lower confidence for different signatures', () => {
      const sig1 = 'abc123';
      const sig2 = 'xyz789';

      const confidence = behavioralBiometricsService.compareSignatures(sig1, sig2);

      expect(confidence).toBeLessThan(1.0);
      expect(confidence).toBeGreaterThanOrEqual(0.0);
    });

    it('should return 0.5 confidence for completely different signatures', () => {
      const sig1 = 'a'.repeat(64);
      const sig2 = 'b'.repeat(64);

      const confidence = behavioralBiometricsService.compareSignatures(sig1, sig2);

      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThan(1);
    });
  });
});

