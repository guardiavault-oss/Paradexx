/**
 * Hardware Device Monitoring Cron Job
 * Checks for offline devices and sends alerts
 */

import cron from "node-cron";
import { logInfo, logError } from "../services/logger";
import { hardwareDeviceService } from "../services/hardwareDeviceService";

/**
 * Start hardware device monitoring cron job
 * Runs every hour to check for offline devices
 */
export function startHardwareMonitoringCron() {
  // Run immediately on startup
  hardwareDeviceService.checkOfflineDevices();

  // Then run every hour
  cron.schedule("0 * * * *", async () => {
    logInfo("🔍 Starting hardware device monitoring job...");

    try {
      await hardwareDeviceService.checkOfflineDevices();
      logInfo("✅ Hardware device monitoring job completed");
    } catch (error: any) {
      logError(error, { source: "hardware_monitoring_cron_job" });
    }
  });

  logInfo("✅ Hardware device monitoring cron job scheduled (every hour)");
}

