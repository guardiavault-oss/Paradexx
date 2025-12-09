/**
 * Tribe Reassessment Scheduled Job
 * Runs daily to check for users due for behavioral reassessment (30 days)
 */

import { tribeAssessmentService } from '../services/tribe-assessment.service';
import { logger } from '../services/logger.service';

// Job configuration
const JOB_NAME = 'tribe-reassessment';
const RUN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_SIZE = 50; // Process users in batches

interface ReassessmentResult {
    userId: string;
    success: boolean;
    previousTribe?: string;
    newTribe?: string;
    error?: string;
}

/**
 * Main job function - processes all users due for reassessment
 */
export async function runTribeReassessmentJob(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: ReassessmentResult[];
}> {
    logger.info(`[${JOB_NAME}] Starting tribe reassessment job...`);
    const startTime = Date.now();

    const results: ReassessmentResult[] = [];
    let processed = 0;
    let successful = 0;
    let failed = 0;

    try {
        // Get all users due for reassessment
        const userIds = await tribeAssessmentService.getUsersDueForReassessment(100);
        logger.info(`[${JOB_NAME}] Found ${userIds.length} users due for reassessment`);

        // Process in batches
        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batch = userIds.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.allSettled(
                batch.map(async (userId) => {
                    try {
                        // Get current profile
                        const currentProfile = await tribeAssessmentService.getTribeProfile(userId);
                        const previousTribe = currentProfile?.tribe;

                        // Perform behavioral reassessment
                        const result = await tribeAssessmentService.performBehavioralReassessment(userId);

                        return {
                            userId,
                            success: true,
                            previousTribe,
                            newTribe: result?.tribe || previousTribe,
                            tribeChanged: previousTribe !== result?.tribe,
                        };
                    } catch (error) {
                        logger.error(`[${JOB_NAME}] Error reassessing user ${userId}:`, error);
                        return {
                            userId,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        };
                    }
                })
            );

            // Collect results
            for (const result of batchResults) {
                processed++;
                if (result.status === 'fulfilled') {
                    const value = result.value;
                    results.push(value);
                    if (value.success) {
                        successful++;
                        if (value.tribeChanged) {
                            logger.info(`[${JOB_NAME}] User ${value.userId} tribe changed: ${value.previousTribe} -> ${value.newTribe}`);
                        }
                    } else {
                        failed++;
                    }
                } else {
                    failed++;
                    results.push({
                        userId: 'unknown',
                        success: false,
                        error: result.reason?.message || 'Promise rejected',
                    });
                }
            }

            // Log batch progress
            logger.info(`[${JOB_NAME}] Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(userIds.length / BATCH_SIZE)}`);
        }

    } catch (error) {
        logger.error(`[${JOB_NAME}] Job failed:`, error);
    }

    const duration = Date.now() - startTime;
    logger.info(`[${JOB_NAME}] Job completed in ${duration}ms. Processed: ${processed}, Successful: ${successful}, Failed: ${failed}`);

    return { processed, successful, failed, results };
}

/**
 * Check if a specific user needs reassessment and perform it
 */
export async function checkAndReassessUser(userId: string): Promise<{
    needsReassessment: boolean;
    reassessed: boolean;
    result?: ReassessmentResult;
}> {
    const needsReassessment = await tribeAssessmentService.needsReassessment(userId);

    if (!needsReassessment) {
        return { needsReassessment: false, reassessed: false };
    }

    try {
        const currentProfile = await tribeAssessmentService.getTribeProfile(userId);
        const previousTribe = currentProfile?.tribe;

        const result = await tribeAssessmentService.performBehavioralReassessment(userId);

        return {
            needsReassessment: true,
            reassessed: true,
            result: {
                userId,
                success: true,
                previousTribe,
                newTribe: result?.tribe || previousTribe,
            },
        };
    } catch (error) {
        return {
            needsReassessment: true,
            reassessed: false,
            result: {
                userId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

/**
 * Start the scheduled job (runs every 24 hours)
 */
let jobInterval: NodeJS.Timeout | null = null;

export function startReassessmentScheduler(): void {
    if (jobInterval) {
        logger.info(`[${JOB_NAME}] Scheduler already running`);
        return;
    }

    logger.info(`[${JOB_NAME}] Starting scheduler (interval: ${RUN_INTERVAL_MS / 1000 / 60 / 60} hours)`);

    // Run immediately on start
    runTribeReassessmentJob().catch(console.error);

    // Schedule recurring runs
    jobInterval = setInterval(() => {
        runTribeReassessmentJob().catch(console.error);
    }, RUN_INTERVAL_MS);
}

export function stopReassessmentScheduler(): void {
    if (jobInterval) {
        clearInterval(jobInterval);
        jobInterval = null;
        logger.info(`[${JOB_NAME}] Scheduler stopped`);
    }
}

/**
 * Send notification when tribe changes
 */
export async function notifyTribeChange(
    userId: string,
    previousTribe: string,
    newTribe: string
): Promise<void> {
    // In production, this would send push notification or email
    logger.info(`[${JOB_NAME}] Notifying user ${userId} of tribe change: ${previousTribe} -> ${newTribe}`);

    // Example notification content
    const notification = {
        title: 'Your Tribe Has Evolved! 🔄',
        body: newTribe === 'degen'
            ? '🔥 Based on your trading activity, you\'ve joined the Degen tribe! Your dashboard is now optimized for the hunt.'
            : '💎 Based on your trading activity, you\'ve joined the Regen tribe! Your dashboard is now optimized for sustainable growth.',
        data: {
            type: 'tribe_change',
            previousTribe,
            newTribe,
        },
    };

    // TODO: Integrate with notification service
    // await notificationService.send(userId, notification);
}

export default {
    runTribeReassessmentJob,
    checkAndReassessUser,
    startReassessmentScheduler,
    stopReassessmentScheduler,
    notifyTribeChange,
};
