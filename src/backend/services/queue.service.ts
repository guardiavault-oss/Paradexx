// Job Queue Service - Background jobs with BullMQ

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { logger } from '../services/logger.service';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

// Flag to track if we've already logged the Redis unavailable message
let redisQueueErrorLogged = false;
let connection: Redis | null = null;
let isRedisAvailable = false;

// Only initialize Redis if REDIS_URL is configured
if (REDIS_URL) {
  connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null, // Don't retry if connection fails
  });

  // Handle Redis connection errors gracefully
  connection.on('error', () => {
    isRedisAvailable = false;
    if (!redisQueueErrorLogged) {
      logger.warn('⚠️  Redis not available - queues disabled (optional)');
      redisQueueErrorLogged = true;
    }
  });

  connection.on('connect', () => {
    isRedisAvailable = true;
    logger.info('✅ Redis queue connected');
  });

  // Try to connect, but don't fail if unavailable
  connection.connect().catch(() => {
    if (!redisQueueErrorLogged) {
      logger.warn('⚠️  Redis not available - queues disabled (optional)');
      redisQueueErrorLogged = true;
    }
  });
} else {
  if (!redisQueueErrorLogged) {
    logger.info('ℹ️  Redis not configured - queues disabled (optional)');
    redisQueueErrorLogged = true;
  }
}

// Job types
export enum JobType {
  // Transaction processing
  PROCESS_TRANSACTION = 'process_transaction',
  INDEX_TRANSACTION = 'index_transaction',

  // Price updates
  UPDATE_TOKEN_PRICES = 'update_token_prices',
  UPDATE_GAS_PRICES = 'update_gas_prices',

  // Notifications
  SEND_EMAIL = 'send_email',
  SEND_PUSH = 'send_push',
  SEND_SMS = 'send_sms',

  // Analytics
  CALCULATE_PORTFOLIO = 'calculate_portfolio',
  UPDATE_PNL = 'update_pnl',

  // Security
  RUG_CHECK = 'rug_check',
  PHISHING_CHECK = 'phishing_check',

  // Monitoring
  MONITOR_WHALE = 'monitor_whale',
  SCAN_NEW_TOKENS = 'scan_new_tokens',

  // Backup
  BACKUP_WALLET = 'backup_wallet',
  SYNC_CLOUD_BACKUP = 'sync_cloud_backup',
}

export interface JobData {
  type: JobType;
  payload: any;
  userId?: string;
}

export class QueueService {
  private queues: Map<string, Queue>;
  private workers: Map<string, Worker>;
  private queueEvents: Map<string, QueueEvents>;

  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.queueEvents = new Map();
  }

  // Initialize queue
  initializeQueue(name: string): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    // Check if Redis is available
    if (!connection || connection.status !== 'ready') {
      throw new Error('Redis not available');
    }

    const queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs
        },
      },
    });

    this.queues.set(name, queue);

    // Setup queue events
    const events = new QueueEvents(name, { connection });
    this.queueEvents.set(name, events);

    events.on('completed', ({ jobId }) => {
      logger.info(`Job ${jobId} completed in queue ${name}`);
    });

    events.on('failed', ({ jobId, failedReason }) => {
      logger.error(`Job ${jobId} failed in queue ${name}: ${failedReason}`);
    });

    logger.info(`Queue initialized: ${name}`);
    return queue;
  }

  // Initialize worker
  initializeWorker(
    name: string,
    processor: (job: Job) => Promise<any>
  ): Worker {
    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }

    const worker = new Worker(name, processor, {
      connection,
      concurrency: 10, // Process 10 jobs concurrently
    });

    worker.on('completed', (job) => {
      logger.info(`Worker completed job ${job.id} in queue ${name}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Worker failed job ${job?.id} in queue ${name}:`, err);
    });

    this.workers.set(name, worker);

    logger.info(`Worker started for queue: ${name}`);
    return worker;
  }

  // Add job to queue
  async addJob(
    queueName: string,
    data: JobData,
    options?: {
      delay?: number;
      priority?: number;
      repeat?: {
        pattern: string; // Cron pattern
      };
    }
  ): Promise<Job> {
    const queue = this.queues.get(queueName) || this.initializeQueue(queueName);

    const job = await queue.add(data.type, data, {
      delay: options?.delay,
      priority: options?.priority,
      repeat: options?.repeat,
    });

    return job;
  }

  // Add bulk jobs
  async addBulkJobs(
    queueName: string,
    jobs: Array<{ name: string; data: JobData }>
  ): Promise<Job[]> {
    const queue = this.queues.get(queueName) || this.initializeQueue(queueName);

    return await queue.addBulk(jobs);
  }

  // Get job
  async getJob(queueName: string, jobId: string): Promise<Job | undefined> {
    const queue = this.queues.get(queueName);
    if (!queue) return undefined;

    return await queue.getJob(jobId);
  }

  // Get job counts
  async getJobCounts(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }

    const counts = await queue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  }

  // Clean queue
  async cleanQueue(
    queueName: string,
    grace: number = 0,
    status?: 'completed' | 'failed'
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    if (status === 'completed') {
      await queue.clean(grace, 100, 'completed');
    } else if (status === 'failed') {
      await queue.clean(grace, 100, 'failed');
    } else {
      await queue.clean(grace, 100, 'completed');
      await queue.clean(grace, 100, 'failed');
    }
  }

  // Pause queue
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.pause();
    }
  }

  // Resume queue
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.resume();
    }
  }

  // Shutdown
  async shutdown(): Promise<void> {
    // Close all workers
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    // Close all queues
    for (const queue of this.queues.values()) {
      await queue.close();
    }

    // Close all queue events
    for (const events of this.queueEvents.values()) {
      await events.close();
    }

    // Close connection
    await connection.quit();

    logger.info('Queue service shut down');
  }
}

// Queue names
export const QueueNames = {
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
  PRICES: 'prices',
  ANALYTICS: 'analytics',
  SECURITY: 'security',
  MONITORING: 'monitoring',
  BACKUP: 'backup',
};

// Job processors
export const JobProcessors = {
  // Transaction processor
  [JobType.PROCESS_TRANSACTION]: async (job: Job) => {
    const { txHash, chainId } = job.data.payload;
    logger.info(`Processing transaction: ${txHash} on chain ${chainId}`);

    // TODO: Implement transaction processing logic
    return { processed: true, txHash };
  },

  // Price update processor
  [JobType.UPDATE_TOKEN_PRICES]: async (job: Job) => {
    const { tokens } = job.data.payload;
    logger.info(`Updating prices for ${tokens.length} tokens`);

    // TODO: Implement price update logic
    return { updated: tokens.length };
  },

  // Gas update processor
  [JobType.UPDATE_GAS_PRICES]: async (job: Job) => {
    const { chainId } = job.data.payload;
    logger.info(`Updating gas prices for chain ${chainId}`);

    // TODO: Implement gas price update logic
    return { updated: true, chainId };
  },

  // Email notification processor
  [JobType.SEND_EMAIL]: async (job: Job) => {
    const { to, subject, body } = job.data.payload;
    logger.info(`Sending email to ${to}: ${subject}`);

    // TODO: Implement email sending logic
    return { sent: true, to };
  },

  // Rug check processor
  [JobType.RUG_CHECK]: async (job: Job) => {
    const { tokenAddress, chainId } = job.data.payload;
    logger.info(`Running rug check for ${tokenAddress} on chain ${chainId}`);

    // TODO: Implement rug check logic
    return { checked: true, tokenAddress };
  },

  // Portfolio calculation processor
  [JobType.CALCULATE_PORTFOLIO]: async (job: Job) => {
    const { userId } = job.data.payload;
    logger.info(`Calculating portfolio for user ${userId}`);

    // TODO: Implement portfolio calculation logic
    return { calculated: true, userId };
  },
};

// Export singleton
export const queueService = new QueueService();

// Initialize default queues and workers
export function initializeQueues(): void {
  // Check if Redis is available
  if (!connection || connection.status !== 'ready') {
    logger.warn('⚠️  Redis not available - queues disabled');
    return;
  }

  try {
    // Initialize all default queues
    Object.values(QueueNames).forEach(name => {
      queueService.initializeQueue(name);
    });
  } catch (error) {
    logger.warn('⚠️  Failed to initialize queues:', error);
    return;
  }

  // Initialize workers
  queueService.initializeWorker(QueueNames.TRANSACTIONS, async (job) => {
    const processor = JobProcessors[job.name as JobType];
    if (processor) {
      return await processor(job);
    }
    throw new Error(`No processor found for job type: ${job.name}`);
  });

  queueService.initializeWorker(QueueNames.PRICES, async (job) => {
    const processor = JobProcessors[job.name as JobType];
    if (processor) {
      return await processor(job);
    }
    throw new Error(`No processor found for job type: ${job.name}`);
  });

  queueService.initializeWorker(QueueNames.NOTIFICATIONS, async (job) => {
    const processor = JobProcessors[job.name as JobType];
    if (processor) {
      return await processor(job);
    }
    throw new Error(`No processor found for job type: ${job.name}`);
  });

  queueService.initializeWorker(QueueNames.SECURITY, async (job) => {
    const processor = JobProcessors[job.name as JobType];
    if (processor) {
      return await processor(job);
    }
    throw new Error(`No processor found for job type: ${job.name}`);
  });

  logger.info('✅ All queues and workers initialized');
}
