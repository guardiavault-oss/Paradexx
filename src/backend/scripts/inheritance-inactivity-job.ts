import { inheritanceService } from '../services/inheritance.service';
import { logger } from '../services/logger.service';
import { prisma } from '../config/database';

const CRON_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function runInactivityCheck() {
  logger.info('[InheritanceJob] Starting inactivity check...');
  const startTime = Date.now();
  
  try {
    await inheritanceService.processInactivityCheck();
    const duration = Date.now() - startTime;
    logger.info(`[InheritanceJob] Completed in ${duration}ms`);
  } catch (error) {
    logger.error('[InheritanceJob] Error during inactivity check:', error);
  }
}

export function startInheritanceJob() {
  logger.info('[InheritanceJob] Initializing inheritance vault inactivity monitor...');
  
  runInactivityCheck();
  
  setInterval(runInactivityCheck, CRON_INTERVAL_MS);
  
  logger.info(`[InheritanceJob] Job scheduled to run every ${CRON_INTERVAL_MS / 60000} minutes`);
}

if (require.main === module) {
  logger.info('[InheritanceJob] Running standalone inactivity check...');
  
  runInactivityCheck()
    .then(() => {
      logger.info('[InheritanceJob] Standalone check completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[InheritanceJob] Standalone check failed:', error);
      process.exit(1);
    });
}

export { runInactivityCheck };
