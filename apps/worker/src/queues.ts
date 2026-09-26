import { Queue } from "bullmq";
import Redis from "ioredis";

export const QUEUE_NAMES = {
  EMAIL_SEND: "email-send",
  EMAIL_RECEIVE: "email-receive",
  ATTACHMENT_PROCESSING: "attachment-processing",
  NOTIFICATION: "notification",
  SEARCH_INDEX: "search-index",
  CLEANUP: "cleanup",
  SECURITY: "security",
} as const;

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient: Redis | null = null;
let redisAvailable = false;

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) return null; // do not endlessly retry if Redis server is down
      return Math.min(times * 100, 1000);
    },
  });
} catch (e) {
  console.warn("[VxMail Queues] Redis initialization warning:", e);
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export interface EmailSendJobData {
  messageId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; contentType: string; size: number }>;
}

export interface EmailReceiveJobData {
  rawMime?: string;
  from: string;
  to: string[];
  subject: string;
  mailboxId: string;
}

// Queue registry
export const emailSendQueue = new Queue(QUEUE_NAMES.EMAIL_SEND, {
  connection: redisClient || undefined,
});

export const emailReceiveQueue = new Queue(QUEUE_NAMES.EMAIL_RECEIVE, {
  connection: redisClient || undefined,
});

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  connection: redisClient || undefined,
});

export const securityQueue = new Queue(QUEUE_NAMES.SECURITY, {
  connection: redisClient || undefined,
});

/**
 * Dispatch job to queue or process inline if Redis is unavailable
 */
export async function dispatchSendJob(data: EmailSendJobData) {
  try {
    await emailSendQueue.add("send", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
    return { queued: true, queue: QUEUE_NAMES.EMAIL_SEND };
  } catch (err: any) {
    console.warn("[VxMail Worker] Redis queue dispatch failed, handling in-process:", err.message);
    return { queued: false, inline: true };
  }
}
