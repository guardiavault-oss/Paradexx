import { Device } from '@capacitor/device';
import { logger } from '../services/logger.service';

const serverUrl = import.meta.env.VITE_API_URL || '/api';

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType: 'face' | 'fingerprint' | 'none';
  hasCredentials: boolean;
}

/**
 * Check if we're running in a native environment
 */
function isNativeEnvironment(): boolean {
  // Check if Capacitor is available and we're on a native platform
  if (typeof window === 'undefined') return false;
  
  const capacitor = (window as any).Capacitor;
  if (!capacitor) return false;
  
  // Check if isNativePlatform exists and returns true
  if (typeof capacitor.isNativePlatform === 'function') {
    return capacitor.isNativePlatform();
  }
  
  // Fallback: check if we're not on web
  return capacitor.getPlatform && capacitor.getPlatform() !== 'web';
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricAvailability(): Promise<BiometricCapabilities> {
  // Early return for non-native environments
  if (!isNativeEnvironment()) {
    return {
      isAvailable: false,
      biometryType: 'none',
      hasCredentials: false,
    };
  }

  try {
    // Dynamic import only works in native environment
    const module = await import('capacitor-native-biometric');
    const NativeBiometric = module.NativeBiometric;
    const result = await NativeBiometric.isAvailable();
    
    return {
      isAvailable: result.isAvailable,
      biometryType: result.biometryType === 1 ? 'fingerprint' : 
                   result.biometryType === 2 ? 'face' : 'none',
      hasCredentials: false, // Will check separately
    };
  } catch (error) {
    // Silently fail in browser environment
    return {
      isAvailable: false,
      biometryType: 'none',
      hasCredentials: false,
    };
  }
}

/**
 * Get a unique device identifier
 */
export async function getDeviceId(): Promise<string> {
  try {
    if (!isNativeEnvironment()) {
      // Browser fallback - use a persistent identifier
      let deviceId = localStorage.getItem('paradox_device_id');
      if (!deviceId) {
        deviceId = `browser_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('paradox_device_id', deviceId);
      }
      return deviceId;
    }

    const info = await Device.getId();
    return info.identifier || `device_${Date.now()}`;
  } catch (error) {
    logger.error('Error getting device ID:', error);
    return `device_${Date.now()}`;
  }
}

/**
 * Enable biometric authentication for the current user
 */
export async function enableBiometric(accessToken: string): Promise<{ success: boolean; error?: string }> {
  if (!isNativeEnvironment()) {
    return { success: false, error: 'Biometric authentication not available on this device' };
  }

  try {
    const module = await import('capacitor-native-biometric');
    const NativeBiometric = module.NativeBiometric;
    const capabilities = await checkBiometricAvailability();
    
    if (!capabilities.isAvailable) {
      return { success: false, error: 'Biometric authentication not available on this device' };
    }

    const deviceId = await getDeviceId();
    
    // Set credentials in native storage
    await NativeBiometric.setCredentials({
      username: 'paradox_user',
      password: deviceId,
      server: 'paradox.io',
    });

    // Register with backend
    const response = await fetch(`${serverUrl}/biometric/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        deviceId,
        biometricType: capabilities.biometryType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to enable biometric' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to enable biometric authentication' };
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometric(): Promise<{ success: boolean; userId?: string; profile?: any; error?: string }> {
  if (!isNativeEnvironment()) {
    return { success: false, error: 'Biometric authentication not available' };
  }

  try {
    const module = await import('capacitor-native-biometric');
    const NativeBiometric = module.NativeBiometric;
    const capabilities = await checkBiometricAvailability();
    
    if (!capabilities.isAvailable) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    // Verify biometric
    const verification = await NativeBiometric.verifyIdentity({
      reason: 'Authenticate to access your RegenX wallet',
      title: 'RegenX Authentication',
      subtitle: 'Use your biometric to sign in',
      description: 'Place your finger on the sensor or look at the camera',
    });

    if (!verification.verified) {
      return { success: false, error: 'Biometric verification failed' };
    }

    // Get stored credentials
    const credentials = await NativeBiometric.getCredentials({
      server: 'paradox.io',
    });

    const deviceId = credentials.password;

    // Verify with backend
    const response = await fetch(`${serverUrl}/biometric/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ deviceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Biometric verification failed' };
    }

    return {
      success: true,
      userId: data.user_id,
      profile: data.profile,
    };
  } catch (error) {
    return { success: false, error: 'Biometric authentication failed' };
  }
}

/**
 * Disable biometric authentication
 */
export async function disableBiometric(accessToken: string): Promise<{ success: boolean; error?: string }> {
  if (!isNativeEnvironment()) {
    return { success: false, error: 'Not in native environment' };
  }

  try {
    const module = await import('capacitor-native-biometric');
    const NativeBiometric = module.NativeBiometric;
    
    // Delete credentials from native storage
    await NativeBiometric.deleteCredentials({
      server: 'paradox.io',
    });

    // Disable on backend
    const response = await fetch(`${serverUrl}/biometric/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to disable biometric' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to disable biometric authentication' };
  }
}

/**
 * Check if user has biometric credentials stored
 */
export async function hasBiometricCredentials(): Promise<boolean> {
  if (!isNativeEnvironment()) {
    return false;
  }

  try {
    const { NativeBiometric } = await import('capacitor-native-biometric');
    const credentials = await NativeBiometric.getCredentials({
      server: 'paradox.io',
    });
    return !!credentials && !!credentials.password;
  } catch (error) {
    return false;
  }
}
