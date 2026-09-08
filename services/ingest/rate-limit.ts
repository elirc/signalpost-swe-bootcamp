import { Redis } from "ioredis";
export interface RateLimiter {
  allow(key: string): Promise<boolean>;
}
export function redisLimiter(
  url: string,
  perMinute: number,
): { limiter: RateLimiter; close: () => void } {
  if (!Number.isInteger(perMinute) || perMinute < 1)
    throw new Error("Rate limit must be a positive integer");
  const redis = new Redis(url, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    commandTimeout: 2000,
  });
  // Fail closed during Redis startup/outage. Atomic increment + TTL avoids immortal counters.
  redis.on("error", () => {});
  const script =
    "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],120) end; return n";
  return {
    limiter: {
      async allow(key) {
        const n = await redis.eval(
          script,
          1,
          `signalpost:rate:${key}:${Math.floor(Date.now() / 60000)}`,
        );
        return Number(n) <= perMinute;
      },
    },
    close: () => redis.disconnect(),
  };
}
