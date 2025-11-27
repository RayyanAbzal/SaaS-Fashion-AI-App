import { VercelRequest, VercelResponse } from '@vercel/node';
import { AppError } from '../utils/errorHandler';

// Rate limiting middleware - gracefully handles missing Redis
let Ratelimit: any = null;
let Redis: any = null;
let ratelimit: any = null;

try {
  const upstashRatelimit = require('@upstash/ratelimit');
  const upstashRedis = require('@upstash/redis');
  Ratelimit = upstashRatelimit.Ratelimit;
  Redis = upstashRedis.Redis;
  
  const redis = Redis.fromEnv();
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
  });
} catch (error) {
  console.warn('Rate limiting not configured. Rate limiting will be disabled.');
  console.warn('To enable rate limiting, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.');
}

export const rateLimitMiddleware = async (
  req: VercelRequest,
  res: VercelResponse
): Promise<boolean> => {
  if (!ratelimit) {
    return true; // Continue without rate limiting
  }

  try {
    // Use user ID if authenticated, otherwise use IP
    const identifier = (req as any).user?.id || req.headers['x-forwarded-for'] || req.ip || 'anonymous';
    
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier as string);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString());

    if (!success) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000)
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request to continue
    return true;
  }
};

// Different rate limits for different endpoints
export const createRateLimiter = (requests: number, window: string) => {
  if (!Ratelimit || !Redis) return null;
  try {
    const redis = Redis.fromEnv();
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: true,
    });
  } catch {
    return null;
  }
};

// Stricter rate limit for expensive operations
export const strictRateLimit = createRateLimiter(5, '1 m'); // 5 requests per minute

