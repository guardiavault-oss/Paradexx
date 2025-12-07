/**
 * Push Notification Service
 * Handles notifications for check-ins, vault alerts, and recovery
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Check if device is physical (for push notifications)
const isPhysicalDevice = Platform.OS !== "web" && !__DEV__;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: "checkin_reminder" | "vault_warning" | "vault_triggered" | "recovery_available";
  vaultId?: string;
  message: string;
  [key: string]: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!isPhysicalDevice) {
        console.warn("Push notifications work best on physical devices");
        // Continue anyway for development
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Failed to get push notification permissions");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  /**
   * Get Expo push token
   */
  async getPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      if (this.expoPushToken) {
        return this.expoPushToken;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.expoPushToken = tokenData.data;
      return this.expoPushToken;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: trigger || null, // null = immediate
      });

      return identifier;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Schedule check-in reminder
   */
  async scheduleCheckInReminder(
    vaultId: string,
    daysUntilDeadline: number
  ): Promise<string> {
    const hoursUntilDeadline = daysUntilDeadline * 24;
    const trigger = hoursUntilDeadline > 0 
      ? { seconds: hoursUntilDeadline * 3600 }
      : null;

    return this.scheduleLocalNotification(
      "Check-In Reminder",
      `Your vault requires a check-in. Please verify your vault is active.`,
      {
        type: "checkin_reminder",
        vaultId,
      },
      trigger
    );
  }

  /**
   * Send vault warning notification
   */
  async sendVaultWarning(
    vaultId: string,
    message: string
  ): Promise<string> {
    return this.scheduleLocalNotification(
      "Vault Warning",
      message,
      {
        type: "vault_warning",
        vaultId,
      }
    );
  }

  /**
   * Send vault triggered notification
   */
  async sendVaultTriggered(
    vaultId: string,
    message: string
  ): Promise<string> {
    return this.scheduleLocalNotification(
      "Vault Activated",
      message,
      {
        type: "vault_triggered",
        vaultId,
      }
    );
  }

  /**
   * Listen for notification events
   */
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Listen for notification interactions (taps)
   */
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = new NotificationService();

