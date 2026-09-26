import { EventEmitter } from "events";

export interface MailboxEvent {
  type: "new_email" | "thread_updated" | "unread_count_updated" | "delivery_status";
  userId?: string;
  mailboxId: string;
  threadId?: string;
  messageId?: string;
  data?: any;
  timestamp: string;
}

class RealtimeEventBus {
  private emitter: EventEmitter;
  private redisSub: any = null;
  private redisPub: any = null;
  private isRedisInitialized = false;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(200);
    this.initRedis();
  }

  private async initRedis() {
    if (this.isRedisInitialized) return;
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return;

    try {
      // Dynamic import ioredis if available
      const { default: Redis } = await import("ioredis");
      this.redisPub = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null });
      this.redisSub = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null });

      this.redisPub.on("error", () => {});
      this.redisSub.on("error", () => {});

      await this.redisPub.connect().catch(() => {});
      await this.redisSub.connect().catch(() => {});

      await this.redisSub.subscribe("vxmail:events", (err: any) => {
        if (!err) {
          this.isRedisInitialized = true;
          console.log("[VxMail Realtime] Redis Pub/Sub connected for cluster events.");
        }
      });

      this.redisSub.on("message", (_channel: string, message: string) => {
        try {
          const event: MailboxEvent = JSON.parse(message);
          this.emitter.emit("event", event);
          if (event.userId) {
            this.emitter.emit(`user:${event.userId}`, event);
          }
          if (event.mailboxId) {
            this.emitter.emit(`mailbox:${event.mailboxId}`, event);
          }
        } catch {
          // invalid json
        }
      });
    } catch {
      console.log("[VxMail Realtime] Running in in-memory event bus mode.");
    }
  }

  public publish(event: Omit<MailboxEvent, "timestamp">) {
    const fullEvent: MailboxEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Emit locally in current process
    this.emitter.emit("event", fullEvent);
    if (fullEvent.userId) {
      this.emitter.emit(`user:${fullEvent.userId}`, fullEvent);
    }
    if (fullEvent.mailboxId) {
      this.emitter.emit(`mailbox:${fullEvent.mailboxId}`, fullEvent);
    }

    // Publish to Redis if connected
    if (this.redisPub && this.isRedisInitialized) {
      try {
        this.redisPub.publish("vxmail:events", JSON.stringify(fullEvent)).catch(() => {});
      } catch {
        // fail silently for offline redis
      }
    }
  }

  public subscribe(
    filter: { userId?: string; mailboxId?: string },
    listener: (event: MailboxEvent) => void
  ): () => void {
    const channel = filter.userId
      ? `user:${filter.userId}`
      : filter.mailboxId
      ? `mailbox:${filter.mailboxId}`
      : "event";

    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }
}

// Global singleton for Next.js hot-reloading & serverless lifecycle
const globalForEvents = globalThis as unknown as { realtimeEventBus?: RealtimeEventBus };
export const realtimeEventBus = globalForEvents.realtimeEventBus || new RealtimeEventBus();
if (process.env.NODE_ENV !== "production") {
  globalForEvents.realtimeEventBus = realtimeEventBus;
}
