import { notificationService } from "../services/notifications";

let processorInterval: NodeJS.Timeout | null = null;
const PROCESS_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function startNotificationProcessor() {
  if (processorInterval) {
    console.log("⚠️  Notification processor already running");
    return;
  }

  console.log("🚀 Starting notification processor (interval: 5 minutes)");

  async function processNotifications() {
    try {
      const stats = await notificationService.processPendingNotifications();
      
      if (stats.processed > 0) {
        console.log(
          `📊 Notification processing complete: ${stats.sent} sent, ${stats.failed} failed, ${stats.processed} total`
        );
      }
    } catch (error: any) {
      console.error("❌ Error in notification processor:", error.message);
    }
  }

  processNotifications();

  processorInterval = setInterval(processNotifications, PROCESS_INTERVAL_MS);

  console.log("✅ Notification processor started successfully");
}

export function stopNotificationProcessor() {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log("🛑 Notification processor stopped");
  }
}
