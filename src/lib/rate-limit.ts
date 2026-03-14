import Redis from "ioredis";

import { HttpError } from "@/lib/api-error";
import {
  ACTIVE_CONVERSION_TTL_MS,
  PDF_RATE_LIMIT,
  PDF_RATE_WINDOW_MS,
} from "@/lib/pdf-contract";

export interface WindowRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
  headers: Record<string, string>;
}

export interface ActiveLockResult {
  acquired: boolean;
  retryAfter: number;
  release?: () => Promise<void>;
}

interface RateLimitStore {
  consumeWindow(ip: string): Promise<WindowRateLimitResult>;
  acquireActive(ip: string, requestId: string): Promise<ActiveLockResult>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();
  private readonly locks = new Map<string, { requestId: string; expiresAt: number }>();

  async consumeWindow(ip: string): Promise<WindowRateLimitResult> {
    const now = Date.now();
    const bucketStart = Math.floor(now / PDF_RATE_WINDOW_MS) * PDF_RATE_WINDOW_MS;
    const resetAt = bucketStart + PDF_RATE_WINDOW_MS;
    const key = `${ip}:${bucketStart}`;
    const current = this.windows.get(key);
    const count = (current?.count ?? 0) + 1;

    this.windows.set(key, { count, resetAt });
    this.cleanup(now);

    return buildWindowResult(count, resetAt);
  }

  async acquireActive(ip: string, requestId: string): Promise<ActiveLockResult> {
    const now = Date.now();
    const current = this.locks.get(ip);

    if (current && current.expiresAt > now) {
      return {
        acquired: false,
        retryAfter: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
      };
    }

    const expiresAt = now + ACTIVE_CONVERSION_TTL_MS;
    this.locks.set(ip, { requestId, expiresAt });

    return {
      acquired: true,
      retryAfter: 0,
      release: async () => {
        const active = this.locks.get(ip);

        if (active?.requestId === requestId) {
          this.locks.delete(ip);
        }
      },
    };
  }

  reset() {
    this.windows.clear();
    this.locks.clear();
  }

  private cleanup(now: number) {
    for (const [key, value] of this.windows.entries()) {
      if (value.resetAt <= now) {
        this.windows.delete(key);
      }
    }

    for (const [key, value] of this.locks.entries()) {
      if (value.expiresAt <= now) {
        this.locks.delete(key);
      }
    }
  }
}

class RedisRateLimitStore implements RateLimitStore {
  private readonly redis: Redis;

  constructor(url: string) {
    this.redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
  }

  async consumeWindow(ip: string): Promise<WindowRateLimitResult> {
    try {
      const redis = await this.getRedis();
      const now = Date.now();
      const bucketStart = Math.floor(now / PDF_RATE_WINDOW_MS) * PDF_RATE_WINDOW_MS;
      const resetAt = bucketStart + PDF_RATE_WINDOW_MS;
      const key = `rate:pdf:${ip}:${bucketStart}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.pexpire(key, PDF_RATE_WINDOW_MS);
      }

      return buildWindowResult(count, resetAt);
    } catch {
      throw new HttpError(
        503,
        "rate_limit_unavailable",
        "Rate limit servisine su an ulasilamiyor.",
      );
    }
  }

  async acquireActive(ip: string, requestId: string): Promise<ActiveLockResult> {
    try {
      const redis = await this.getRedis();
      const key = `rate:pdf:active:${ip}`;
      const acquired = await redis.set(
        key,
        requestId,
        "PX",
        ACTIVE_CONVERSION_TTL_MS,
        "NX",
      );

      if (!acquired) {
        const ttl = await redis.pttl(key);

        return {
          acquired: false,
          retryAfter: Math.max(1, Math.ceil(ttl / 1000)),
        };
      }

      return {
        acquired: true,
        retryAfter: 0,
        release: async () => {
          const current = await redis.get(key);

          if (current === requestId) {
            await redis.del(key);
          }
        },
      };
    } catch {
      throw new HttpError(
        503,
        "rate_limit_unavailable",
        "Rate limit servisine su an ulasilamiyor.",
      );
    }
  }

  private async getRedis() {
    if (this.redis.status === "wait") {
      await this.redis.connect();
    }

    return this.redis;
  }
}

let store: RateLimitStore | null = null;

export function getRateLimitStore(): RateLimitStore {
  if (store) {
    return store;
  }

  store = process.env.REDIS_URL
    ? new RedisRateLimitStore(process.env.REDIS_URL)
    : new MemoryRateLimitStore();

  return store;
}

export function resetRateLimitStoreForTests() {
  if (store instanceof MemoryRateLimitStore) {
    store.reset();
  }

  store = new MemoryRateLimitStore();
}

function buildWindowResult(
  count: number,
  resetAt: number,
): WindowRateLimitResult {
  const now = Date.now();
  const allowed = count <= PDF_RATE_LIMIT;
  const remaining = Math.max(0, PDF_RATE_LIMIT - count);
  const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));

  return {
    allowed,
    limit: PDF_RATE_LIMIT,
    remaining,
    resetAt,
    retryAfter,
    headers: {
      "X-RateLimit-Limit": String(PDF_RATE_LIMIT),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
    },
  };
}
