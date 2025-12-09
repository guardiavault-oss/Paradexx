/**
 * Notification Service Tests
 * Unit tests for push notification service
 */

import { notificationService } from "../../services/notificationService";
import * as Notifications from "expo-notifications";

// Mock expo-notifications
jest.mock("expo-notifications");

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notificationService as any).expoPushToken = null;
  });

  describe("requestPermissions", () => {
    it("should request and grant permissions", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "undetermined",
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      const result = await notificationService.requestPermissions();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it("should return true if permissions already granted", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      const result = await notificationService.requestPermissions();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("should return false if permissions denied", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "undetermined",
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      const result = await notificationService.requestPermissions();

      expect(result).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error("Permission error")
      );

      const result = await notificationService.requestPermissions();

      expect(result).toBe(false);
    });
  });

  describe("getPushToken", () => {
    it("should get push token successfully", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: "ExponentPushToken[test-token]",
      });

      const token = await notificationService.getPushToken();

      expect(token).toBe("ExponentPushToken[test-token]");
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
    });

    it("should return null if permissions not granted", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      const token = await notificationService.getPushToken();

      expect(token).toBeNull();
    });

    it("should cache push token", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: "cached-token",
      });

      const token1 = await notificationService.getPushToken();
      const token2 = await notificationService.getPushToken();

      expect(token1).toBe("cached-token");
      expect(token2).toBe("cached-token");
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe("scheduleLocalNotification", () => {
    it("should schedule notification successfully", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notification-id");

      const id = await notificationService.scheduleLocalNotification(
        "Test Title",
        "Test Body",
        { type: "test" }
      );

      expect(id).toBe("notification-id");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: "Test Title",
          body: "Test Body",
          data: { type: "test" },
          sound: true,
        },
        trigger: null,
      });
    });

    it("should schedule notification with trigger", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notification-id");

      const trigger = { seconds: 3600 };
      const id = await notificationService.scheduleLocalNotification(
        "Test Title",
        "Test Body",
        undefined,
        trigger
      );

      expect(id).toBe("notification-id");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: "Test Title",
          body: "Test Body",
          data: {},
          sound: true,
        },
        trigger,
      });
    });

    it("should handle scheduling errors", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error("Scheduling error")
      );

      await expect(
        notificationService.scheduleLocalNotification("Title", "Body")
      ).rejects.toThrow("Scheduling error");
    });
  });

  describe("scheduleCheckInReminder", () => {
    it("should schedule check-in reminder", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("reminder-id");

      const id = await notificationService.scheduleCheckInReminder("vault-123", 2);

      expect(id).toBe("reminder-id");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "Check-In Reminder",
            data: {
              type: "checkin_reminder",
              vaultId: "vault-123",
            },
          }),
          trigger: { seconds: 48 * 3600 }, // 2 days in seconds
        })
      );
    });

    it("should schedule immediate reminder if days is 0", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("reminder-id");

      await notificationService.scheduleCheckInReminder("vault-123", 0);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: null, // Immediate
        })
      );
    });
  });

  describe("sendVaultWarning", () => {
    it("should send vault warning notification", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("warning-id");

      const id = await notificationService.sendVaultWarning("vault-123", "Warning message");

      expect(id).toBe("warning-id");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "Vault Warning",
            body: "Warning message",
            data: {
              type: "vault_warning",
              vaultId: "vault-123",
            },
          }),
        })
      );
    });
  });

  describe("sendVaultTriggered", () => {
    it("should send vault triggered notification", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("triggered-id");

      const id = await notificationService.sendVaultTriggered("vault-123", "Vault activated");

      expect(id).toBe("triggered-id");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "Vault Activated",
            body: "Vault activated",
            data: {
              type: "vault_triggered",
              vaultId: "vault-123",
            },
          }),
        })
      );
    });
  });

  describe("cancelNotification", () => {
    it("should cancel scheduled notification", async () => {
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);

      await notificationService.cancelNotification("notification-id");

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("notification-id");
    });
  });

  describe("cancelAllNotifications", () => {
    it("should cancel all scheduled notifications", async () => {
      (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);

      await notificationService.cancelAllNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe("event listeners", () => {
    it("should add notification received listener", () => {
      const mockRemove = jest.fn();
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });

      const subscription = notificationService.addNotificationReceivedListener(() => {});

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(subscription.remove).toBe(mockRemove);
    });

    it("should add notification response listener", () => {
      const mockRemove = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });

      const subscription = notificationService.addNotificationResponseListener(() => {});

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      expect(subscription.remove).toBe(mockRemove);
    });
  });
});







