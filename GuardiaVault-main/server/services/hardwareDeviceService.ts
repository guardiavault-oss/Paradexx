/**
 * Hardware Device Service
 * Handles hardware device registration, ping verification, and monitoring
 */

import crypto from 'crypto';
import { storage } from '../storage';
import { db } from '../db';
import { hardwareDevices, hardwarePingLogs, type HardwareDevice, type InsertHardwareDevice } from '@shared/schema';
import { eq, and, lt, or, isNull } from '../utils/drizzle-exports';
import { logInfo, logError, logWarn } from './logger';
import { sendEmail } from './email';

export interface HardwarePingRequest {
  deviceId: string;
  timestamp: number;
  signature: string; // Base64 encoded signature
}

export interface HardwarePingResponse {
  success: boolean;
  message: string;
  deviceStatus?: string;
  lastPing?: Date;
  nextPingDue?: Date;
}

export interface DeviceRegistrationRequest {
  deviceId: string;
  deviceName?: string;
  publicKey: string; // PEM format public key
  signature: string; // Signature of deviceId + timestamp
}

/**
 * Hardware Device Service
 */
export class HardwareDeviceService {
  /**
   * Verify signature using RSA public key
   */
  private verifySignature(
    data: string,
    signature: string,
    publicKeyPem: string
  ): boolean {
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(data);
      verify.end();
      
      const signatureBuffer = Buffer.from(signature, 'base64');
      return verify.verify(publicKeyPem, signatureBuffer);
    } catch (error) {
      logError(error as Error, { context: 'hardware_signature_verification' });
      return false;
    }
  }

  /**
   * Create signature data string for hardware ping
   */
  private createPingData(deviceId: string, timestamp: number): string {
    return `GuardiaVault Hardware Ping\nDevice ID: ${deviceId}\nTimestamp: ${timestamp}`;
  }

  /**
   * Register a new hardware device
   */
  async registerDevice(
    userId: string,
    request: DeviceRegistrationRequest
  ): Promise<{ success: boolean; deviceId?: string; error?: string }> {
    try {
      // Verify public key format
      try {
        crypto.createPublicKey(request.publicKey);
      } catch (error) {
        return {
          success: false,
          error: 'Invalid public key format. Expected PEM format.',
          message: 'Invalid public key format. Expected PEM format.',
        };
      }

      // Verify signature for registration
      // Accept timestamps within a 5-minute window to account for clock skew and processing delays
      const currentTimestamp = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      let signatureValid = false;
      
      // Try with current timestamp and nearby timestamps (within tolerance)
      // Check every 10 seconds to cover clock skew efficiently
      for (let offset = -fiveMinutes; offset <= fiveMinutes; offset += 10000) {
        const testTimestamp = currentTimestamp + offset;
        const registrationData = `GuardiaVault Device Registration\nDevice ID: ${request.deviceId}\nTimestamp: ${testTimestamp}`;
        
        if (this.verifySignature(registrationData, request.signature, request.publicKey)) {
          signatureValid = true;
          break;
        }
      }
      
      // Also try exact current timestamp in case it matches
      if (!signatureValid) {
        const registrationData = `GuardiaVault Device Registration\nDevice ID: ${request.deviceId}\nTimestamp: ${currentTimestamp}`;
        signatureValid = this.verifySignature(registrationData, request.signature, request.publicKey);
      }

      if (!signatureValid) {
        return {
          success: false,
          error: 'Invalid signature for device registration',
          message: 'Invalid signature for device registration',
        };
      }

      // Check if device already exists
      const existingDevice = await db
        .select()
        .from(hardwareDevices)
        .where(eq(hardwareDevices.deviceId, request.deviceId))
        .limit(1);

      if (existingDevice.length > 0) {
        // Device exists - check if it belongs to this user
        if (existingDevice[0].userId !== userId) {
          return {
            success: false,
            error: 'Device ID already registered to another user',
            message: 'Device ID already registered to another user',
          };
        }
        // Device already registered to this user
        return {
          success: true,
          deviceId: request.deviceId,
        };
      }

      // Create new device
      const [device] = await db
        .insert(hardwareDevices)
        .values({
          userId,
          deviceId: request.deviceId,
          deviceName: request.deviceName || `Device ${request.deviceId.slice(0, 8)}`,
          publicKey: request.publicKey,
          status: 'active',
          lastPing: new Date(),
          alertThresholdMinutes: 1440, // 24 hours default
        })
        .returning();

      logInfo('Hardware device registered', {
        userId,
        deviceId: request.deviceId,
      });

      return {
        success: true,
        deviceId: device.deviceId,
      };
    } catch (error) {
      logError(error as Error, {
        context: 'hardware_device_registration',
        userId,
      });
      return {
        success: false,
        error: 'Failed to register device',
      };
    }
  }

  /**
   * Process hardware ping
   */
  async processPing(
    request: HardwarePingRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<HardwarePingResponse> {
    const startTime = Date.now();
    
    try {
      // Get device from database
      const [device] = await db
        .select()
        .from(hardwareDevices)
        .where(eq(hardwareDevices.deviceId, request.deviceId))
        .limit(1);

      if (!device) {
        // Log failed ping attempt
        await this.logPing({
          deviceId: request.deviceId,
          userId: 'unknown',
          signatureValid: false,
          responseTimeMs: Date.now() - startTime,
          ipAddress,
          userAgent,
        });

        return {
          success: false,
          message: 'Device not found or not registered',
        };
      }

      // Verify timestamp is recent (within 5 minutes)
      const currentTime = Date.now();
      const timestampAge = Math.abs(currentTime - request.timestamp);
      const fiveMinutes = 5 * 60 * 1000;

      if (timestampAge > fiveMinutes) {
        logWarn('Hardware ping with stale timestamp', {
          deviceId: request.deviceId,
          timestampAge,
        });

        await this.logPing({
          deviceId: request.deviceId,
          userId: device.userId,
          signatureValid: false,
          responseTimeMs: Date.now() - startTime,
          ipAddress,
          userAgent,
        });

        return {
          success: false,
          message: 'Timestamp is too old or in the future',
        };
      }

      // Verify signature
      const pingData = this.createPingData(request.deviceId, request.timestamp);
      const signatureValid = this.verifySignature(
        pingData,
        request.signature,
        device.publicKey
      );

      const responseTime = Date.now() - startTime;

      // Log ping attempt
      await this.logPing({
        deviceId: request.deviceId,
        userId: device.userId,
        signatureValid,
        responseTimeMs: responseTime,
        ipAddress,
        userAgent,
      });

      if (!signatureValid) {
        logWarn('Hardware ping with invalid signature', {
          deviceId: request.deviceId,
          userId: device.userId,
        });

        return {
          success: false,
          message: 'Invalid signature',
          deviceStatus: device.status,
        };
      }

      // Update last ping timestamp
      const now = new Date();
      await db
        .update(hardwareDevices)
        .set({
          lastPing: now,
          updatedAt: now,
          status: device.status === 'offline' ? 'active' : device.status, // Reactivate if offline
        })
        .where(eq(hardwareDevices.deviceId, request.deviceId));

      // Calculate next ping due
      const thresholdMs = (device.alertThresholdMinutes || 1440) * 60 * 1000;
      const nextPingDue = new Date(now.getTime() + thresholdMs);

      logInfo('Hardware ping successful', {
        deviceId: request.deviceId,
        userId: device.userId,
        responseTimeMs: responseTime,
      });

      return {
        success: true,
        message: 'Ping successful',
        deviceStatus: device.status,
        lastPing: now,
        nextPingDue,
      };
    } catch (error) {
      logError(error as Error, {
        context: 'hardware_ping_processing',
        deviceId: request.deviceId,
      });

      // Return error with more context
      // Check if it's a database error or other specific error
      const errorMessage = error instanceof Error ? error.message : 'Failed to process ping';
      
      // If it's a database connection error, return a more specific message
      if (errorMessage.includes('not found') || errorMessage.includes('ENOTFOUND')) {
        return {
          success: false,
          message: 'Device not found',
        };
      }
      
      // Preserve specific error messages
      if (errorMessage.includes('signature')) {
        return {
          success: false,
          message: 'Invalid signature',
        };
      }
      
      if (errorMessage.includes('timestamp')) {
        return {
          success: false,
          message: 'Timestamp is too old or in the future',
        };
      }
      
      return {
        success: false,
        message: 'Failed to process ping',
      };
    }
  }

  /**
   * Log ping attempt
   */
  private async logPing(log: {
    deviceId: string;
    userId: string;
    signatureValid: boolean;
    responseTimeMs: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await db.insert(hardwarePingLogs).values({
        deviceId: log.deviceId,
        userId: log.userId,
        signatureValid: log.signatureValid,
        responseTimeMs: log.responseTimeMs,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      });
    } catch (error) {
      // Don't fail ping if logging fails
      logError(error as Error, { context: 'hardware_ping_logging' });
    }
  }

  /**
   * Get devices for a user
   */
  async getUserDevices(userId: string): Promise<HardwareDevice[]> {
    try {
      return await db
        .select()
        .from(hardwareDevices)
        .where(eq(hardwareDevices.userId, userId))
        .orderBy(hardwareDevices.createdAt);
    } catch (error) {
      logError(error as Error, {
        context: 'get_user_hardware_devices',
        userId,
      });
      return [];
    }
  }

  /**
   * Check for offline devices and send alerts
   */
  async checkOfflineDevices(): Promise<void> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find devices that haven't pinged in their threshold period
      const offlineDevices = await db
        .select({
          device: hardwareDevices,
          user: {
            id: hardwareDevices.userId,
          },
        })
        .from(hardwareDevices)
        .where(
          and(
            eq(hardwareDevices.status, 'active'),
            or(
              isNull(hardwareDevices.lastPing),
              lt(hardwareDevices.lastPing, oneDayAgo)
            )
          )
        );

      for (const { device } of offlineDevices) {
        const thresholdMs = (device.alertThresholdMinutes || 1440) * 60 * 1000;
        const lastPingTime = device.lastPing?.getTime() || device.createdAt.getTime();
        const timeSincePing = now.getTime() - lastPingTime;

        // Only alert if threshold exceeded and we haven't alerted recently (within 24 hours)
        if (timeSincePing > thresholdMs) {
          const lastAlertTime = device.lastAlertSent?.getTime() || 0;
          const timeSinceLastAlert = now.getTime() - lastAlertTime;
          const oneDay = 24 * 60 * 60 * 1000;

          if (timeSinceLastAlert > oneDay) {
            // Mark device as offline
            await db
              .update(hardwareDevices)
              .set({
                status: 'offline',
                lastAlertSent: now,
                updatedAt: now,
              })
              .where(eq(hardwareDevices.id, device.id));

            // Get user to send notification
            const user = await storage.getUser(device.userId);
            if (user) {
              // Send email notification
              await sendEmail({
                to: user.email,
                subject: 'Hardware Device Offline Alert',
                html: `
                  <h2>Hardware Device Offline</h2>
                  <p>Your hardware device "${device.deviceName || device.deviceId}" has not sent a ping in over ${device.alertThresholdMinutes} minutes.</p>
                  <p><strong>Device ID:</strong> ${device.deviceId}</p>
                  <p><strong>Last Ping:</strong> ${device.lastPing ? device.lastPing.toISOString() : 'Never'}</p>
                  <p>If you have lost this device, you may want to trigger a vault recovery process.</p>
                `,
              });

              logInfo('Hardware device offline alert sent', {
                userId: device.userId,
                deviceId: device.deviceId,
              });
            }
          }
        }
      }

      logInfo('Hardware device monitoring check completed', {
        devicesChecked: offlineDevices.length,
      });
    } catch (error) {
      logError(error as Error, { context: 'hardware_device_monitoring' });
    }
  }

  /**
   * Delete a hardware device
   */
  async deleteDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const [device] = await db
        .select()
        .from(hardwareDevices)
        .where(
          and(
            eq(hardwareDevices.deviceId, deviceId),
            eq(hardwareDevices.userId, userId)
          )
        )
        .limit(1);

      if (!device) {
        return false;
      }

      await db
        .delete(hardwareDevices)
        .where(eq(hardwareDevices.id, device.id));

      logInfo('Hardware device deleted', {
        userId,
        deviceId,
      });

      return true;
    } catch (error) {
      logError(error as Error, {
        context: 'hardware_device_deletion',
        userId,
        deviceId,
      });
      return false;
    }
  }
}

export const hardwareDeviceService = new HardwareDeviceService();

