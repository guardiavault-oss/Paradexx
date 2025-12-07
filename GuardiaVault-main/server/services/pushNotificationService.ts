/**
 * Push Notification Service
 * Firebase Cloud Messaging integration for yield updates
 */

import * as admin from "firebase-admin";
import { logInfo, logError } from "./logger";

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase(): void {
  try {
    if (firebaseApp) {
      return; // Already initialized
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      logInfo("Firebase not configured. Push notifications will be disabled.", {});
      return;
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logInfo("Firebase initialized for push notifications", {});
  } catch (error) {
    logError(error as Error, { context: "initializeFirebase" });
  }
}

/**
 * Send push notification to user
 */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    if (!firebaseApp) {
      logError(new Error("Firebase not initialized"), {
        context: "sendPushNotification",
      });
      return false;
    }

    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: fcmToken,
      android: {
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
      },
    };

    const response = await admin.messaging().send(message);
    logInfo("Push notification sent", { messageId: response });

    return true;
  } catch (error) {
    logError(error as Error, {
      context: "sendPushNotification",
      fcmToken: fcmToken.substring(0, 10) + "...",
    });

    // Handle invalid token
    if (error instanceof Error && error.message.includes("registration-token-not-registered")) {
      // Token is invalid, should be removed from database
      logInfo("Invalid FCM token detected, should be removed", {});
    }

    return false;
  }
}

/**
 * Send yield update notification
 */
export async function sendYieldUpdateNotification(
  fcmToken: string,
  yieldEarned: string,
  newBalance: string
): Promise<boolean> {
  return sendPushNotification(
    fcmToken,
    "💰 Yield Update",
    `You've earned $${yieldEarned}. New balance: $${newBalance}`,
    {
      type: "yield_update",
      yieldEarned,
      newBalance,
    }
  );
}

/**
 * Send achievement unlocked notification
 */
export async function sendAchievementNotification(
  fcmToken: string,
  achievementTitle: string,
  rewardAmount?: string
): Promise<boolean> {
  const body = rewardAmount
    ? `🎉 ${achievementTitle}! You've earned $${rewardAmount}`
    : `🎉 ${achievementTitle}!`;

  return sendPushNotification(fcmToken, "Achievement Unlocked", body, {
    type: "achievement",
    title: achievementTitle,
    rewardAmount: rewardAmount || "0",
  });
}

/**
 * Send challenge update notification
 */
export async function sendChallengeNotification(
  fcmToken: string,
  challengeName: string,
  rank: number,
  earnings: string
): Promise<boolean> {
  return sendPushNotification(
    fcmToken,
    "🏆 Challenge Update",
    `You're rank #${rank} in ${challengeName} with $${earnings} earned`,
    {
      type: "challenge",
      challengeName,
      rank: rank.toString(),
      earnings,
    }
  );
}

// Initialize on module load
if (process.env.NODE_ENV !== "test") {
  initializeFirebase();
}

