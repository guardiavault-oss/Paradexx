// Biometric Security & Auto-Lock System

export interface BiometricCapabilities {
  available: boolean;
  types: ('fingerprint' | 'face' | 'iris')[];
  platform: 'ios' | 'android' | 'web' | 'unsupported';
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  autoLockEnabled: boolean;
  autoLockTimeout: number; // in minutes
  requireBiometricForTransactions: boolean;
  requireBiometricForSend: boolean;
  screenshotProtection: boolean; // Mobile only
}

// Check biometric availability
export async function checkBiometricCapabilities(): Promise<BiometricCapabilities> {
  // Web Authentication API (WebAuthn) for biometrics
  const isWebAuthnAvailable = window.PublicKeyCredential !== undefined;
  
  if (!isWebAuthnAvailable) {
    return {
      available: false,
      types: [],
      platform: 'unsupported'
    };
  }

  // Check platform
  const userAgent = navigator.userAgent.toLowerCase();
  let platform: BiometricCapabilities['platform'] = 'web';
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    platform = 'ios';
  } else if (/android/.test(userAgent)) {
    platform = 'android';
  }

  // Check for platform authenticator (Face ID, Touch ID, Windows Hello)
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    if (available) {
      // Determine types based on platform
      const types: BiometricCapabilities['types'] = [];
      
      if (platform === 'ios') {
        types.push('face', 'fingerprint'); // Face ID or Touch ID
      } else if (platform === 'android') {
        types.push('fingerprint', 'face'); // Fingerprint or Face Unlock
      } else {
        types.push('fingerprint'); // Windows Hello, etc.
      }
      
      return {
        available: true,
        types,
        platform
      };
    }
  } catch (err) {
    logger.error('Biometric check failed:', err);
  }

  return {
    available: false,
    types: [],
    platform
  };
}

// Register biometric credential
export async function registerBiometric(userId: string): Promise<boolean> {
  try {
    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32), // Should be random from server
        rp: {
          name: "Paradox Wallet",
          id: window.location.hostname
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: "Paradox User"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Use built-in biometric
          userVerification: "required"
        },
        timeout: 60000,
        attestation: "none"
      }
    });

    if (credential) {
      // Store credential ID for future use
      localStorage.setItem('paradox_biometric_credential', JSON.stringify({
        id: credential.id,
        type: credential.type
      }));
      
      return true;
    }
    
    return false;
  } catch (err: any) {
    logger.error('Biometric registration failed:', err);
    
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric registration was cancelled');
    }
    
    throw new Error('Failed to register biometric authentication');
  }
}

// Authenticate with biometric
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const storedCredential = localStorage.getItem('paradox_biometric_credential');
    if (!storedCredential) {
      throw new Error('No biometric credential found. Please set up biometric authentication first.');
    }

    const { id } = JSON.parse(storedCredential);

    // Get authentication
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32), // Should be random from server
        allowCredentials: [{
          id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
          type: "public-key"
        }],
        userVerification: "required",
        timeout: 60000
      }
    });

    return assertion !== null;
  } catch (err: any) {
    logger.error('Biometric authentication failed:', err);
    
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric authentication was cancelled');
    }
    
    throw new Error('Failed to authenticate with biometric');
  }
}

// Auto-lock system
class AutoLockManager {
  private timeout: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private lockCallback: (() => void) | null = null;
  private isLocked: boolean = false;
  private timeoutMinutes: number = 5;

  // Start auto-lock timer
  start(timeoutMinutes: number, onLock: () => void) {
    this.timeoutMinutes = timeoutMinutes;
    this.lockCallback = onLock;
    this.isLocked = false;
    this.resetTimer();
    
    // Listen for user activity
    this.addActivityListeners();
  }

  // Stop auto-lock
  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.removeActivityListeners();
  }

  // Reset timer on activity
  private resetTimer() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.lastActivity = Date.now();
    
    this.timeout = setTimeout(() => {
      this.lock();
    }, this.timeoutMinutes * 60 * 1000);
  }

  // Lock the app
  private lock() {
    if (this.isLocked) return;
    
    this.isLocked = true;
    
    if (this.lockCallback) {
      this.lockCallback();
    }
    
    logger.info('App locked due to inactivity');
  }

  // Unlock the app
  unlock() {
    this.isLocked = false;
    this.resetTimer();
  }

  // Activity event handler
  private handleActivity = () => {
    if (!this.isLocked) {
      this.resetTimer();
    }
  };

  // Add activity listeners
  private addActivityListeners() {
    window.addEventListener('mousedown', this.handleActivity);
    window.addEventListener('keydown', this.handleActivity);
    window.addEventListener('touchstart', this.handleActivity);
    window.addEventListener('scroll', this.handleActivity);
  }

  // Remove activity listeners
  private removeActivityListeners() {
    window.removeEventListener('mousedown', this.handleActivity);
    window.removeEventListener('keydown', this.handleActivity);
    window.removeEventListener('touchstart', this.handleActivity);
    window.removeEventListener('scroll', this.handleActivity);
  }

  // Get time until lock
  getTimeUntilLock(): number {
    const elapsed = Date.now() - this.lastActivity;
    const remaining = (this.timeoutMinutes * 60 * 1000) - elapsed;
    return Math.max(0, remaining);
  }

  // Check if locked
  getLockStatus(): boolean {
    return this.isLocked;
  }
}

// Singleton instance
export const autoLockManager = new AutoLockManager();

// Screenshot protection (mobile)
export function enableScreenshotProtection(): void {
  // This is a hint to the system, not guaranteed to work everywhere
  if ('setAppBadge' in navigator) {
    // PWA screenshot protection
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Blur sensitive content when app goes to background
        document.body.style.filter = 'blur(20px)';
      } else {
        document.body.style.filter = 'none';
      }
    });
  }
}

export function disableScreenshotProtection(): void {
  document.body.style.filter = 'none';
}

// PIN code system
export function hashPIN(pin: string): string {
  // In production: Use proper hashing (bcrypt, scrypt)
  // This is a simple example
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function verifyPIN(pin: string, hashedPIN: string): boolean {
  return hashPIN(pin) === hashedPIN;
}

export function setPIN(pin: string): void {
  const hashed = hashPIN(pin);
  localStorage.setItem('paradox_pin', hashed);
}

export function checkPIN(): boolean {
  return localStorage.getItem('paradox_pin') !== null;
}

export function clearPIN(): void {
  localStorage.removeItem('paradox_pin');
}

// Lock attempt tracking
class LockAttemptTracker {
  private attempts: number = 0;
  private maxAttempts: number = 5;
  private lockoutDuration: number = 5 * 60 * 1000; // 5 minutes
  private lockoutUntil: number = 0;

  recordFailedAttempt(): void {
    this.attempts++;
    
    if (this.attempts >= this.maxAttempts) {
      this.lockoutUntil = Date.now() + this.lockoutDuration;
      this.attempts = 0;
    }
  }

  resetAttempts(): void {
    this.attempts = 0;
    this.lockoutUntil = 0;
  }

  isLockedOut(): boolean {
    if (this.lockoutUntil > Date.now()) {
      return true;
    }
    
    if (this.lockoutUntil !== 0 && this.lockoutUntil <= Date.now()) {
      this.resetAttempts();
    }
    
    return false;
  }

  getRemainingAttempts(): number {
    return Math.max(0, this.maxAttempts - this.attempts);
  }

  getLockoutTimeRemaining(): number {
    if (!this.isLockedOut()) return 0;
    return Math.max(0, this.lockoutUntil - Date.now());
  }
}

export const lockAttemptTracker = new LockAttemptTracker();

// React hooks
import { useState, useEffect } from 'react';
import { logger } from '../services/logger.service';

export function useBiometric() {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    available: false,
    types: [],
    platform: 'unsupported'
  });
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkBiometricCapabilities().then(setCapabilities);
    
    // Check if biometric is enabled
    const credential = localStorage.getItem('paradox_biometric_credential');
    setIsEnabled(!!credential);
  }, []);

  const enable = async () => {
    try {
      const success = await registerBiometric('user-' + Date.now());
      setIsEnabled(success);
      return success;
    } catch (err) {
      throw err;
    }
  };

  const authenticate = async () => {
    return await authenticateWithBiometric();
  };

  const disable = () => {
    localStorage.removeItem('paradox_biometric_credential');
    setIsEnabled(false);
  };

  return {
    capabilities,
    isEnabled,
    enable,
    authenticate,
    disable
  };
}

export function useAutoLock(settings: SecuritySettings) {
  const [isLocked, setIsLocked] = useState(false);
  const [timeUntilLock, setTimeUntilLock] = useState(0);

  useEffect(() => {
    if (settings.autoLockEnabled) {
      autoLockManager.start(settings.autoLockTimeout, () => {
        setIsLocked(true);
      });

      // Update time until lock every second
      const interval = setInterval(() => {
        setTimeUntilLock(autoLockManager.getTimeUntilLock());
      }, 1000);

      return () => {
        autoLockManager.stop();
        clearInterval(interval);
      };
    }
  }, [settings.autoLockEnabled, settings.autoLockTimeout]);

  const unlock = async () => {
    if (settings.biometricEnabled) {
      const authenticated = await authenticateWithBiometric();
      if (authenticated) {
        setIsLocked(false);
        autoLockManager.unlock();
        return true;
      }
      return false;
    } else {
      // PIN unlock would go here
      setIsLocked(false);
      autoLockManager.unlock();
      return true;
    }
  };

  return {
    isLocked,
    timeUntilLock,
    unlock
  };
}
