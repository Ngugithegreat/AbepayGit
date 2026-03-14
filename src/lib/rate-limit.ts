import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis;

// Check if running in a Node.js environment before initializing Redis
if (typeof process !== 'undefined' && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  // Mock Redis for client-side or environments where it's not configured
  console.warn("Redis not configured. Rate limiting will not be effective.");
  redis = {
    get: async () => null,
    set: async () => {},
    sadd: async () => 0,
    smembers: async () => [],
    // Add other methods as needed, returning dummy values
  } as any;
}


// 3 deposits per hour per user
export const depositRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:deposit',
});

// 5 chat messages per minute
export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:chat',
});
