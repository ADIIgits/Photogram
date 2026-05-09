import Redis from "ioredis";
import { logger } from "./logger";

let client: Redis | null = null;
let connected = false;

const url = process.env.REDIS_URL;

if (url) {
  try {
    client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    client.on("connect", () => {
      connected = true;
      logger.info("Redis connected");
    });

    client.on("error", (err) => {
      connected = false;
      logger.warn({ err: err.message }, "Redis error - falling back to DB");
    });

    client.on("end", () => {
      connected = false;
    });

    client.connect().catch((err) => {
      logger.warn({ err: err.message }, "Redis initial connect failed - falling back to DB");
      client = null;
    });
  } catch (err) {
    logger.warn({ err }, "Redis initialization failed - using DB only");
    client = null;
  }
} else {
  logger.info("REDIS_URL not set - search caching disabled, using DB directly");
}

export const redis = {
  isAvailable(): boolean {
    return !!client && connected;
  },

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      return await client!.get(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await client!.set(key, value, "EX", ttlSeconds);
    } catch {
      /* ignore — fallback to DB */
    }
  },

  async del(key: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await client!.del(key);
    } catch {
      /* ignore */
    }
  },

  async incr(key: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await client!.incr(key);
    } catch {
      /* ignore */
    }
  },
};
